import { Client, Databases, Storage, ID, Query } from "appwrite";

const APPWRITE_CONFIG = {
  ENDPOINT:
    import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  PROJECT_ID:
    import.meta.env.VITE_APPWRITE_PROJECT_ID || "YOUR_PROJECT_ID_HERE",
  DATABASE_ID:
    import.meta.env.VITE_APPWRITE_DATABASE_ID || "YOUR_DATABASE_ID_HERE",
  COLLECTION_ID:
    import.meta.env.VITE_APPWRITE_COLLECTION_ID || "YOUR_COLLECTION_ID_HERE",
  BUCKET_ID: import.meta.env.VITE_APPWRITE_BUCKET_ID || "YOUR_BUCKET_ID_HERE",
};

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
  .setProject(APPWRITE_CONFIG.PROJECT_ID);

export const databases = new Databases(client);
export const storage = new Storage(client);

async function generateVerificationHash(
  passId: string,
  amount: number,
  timestamp: string
): Promise<string> {
  const secret =
    import.meta.env.VITE_VERIFICATION_SECRET || "CHANGE_THIS_SECRET";
  const payload = `${passId}:${amount}:${timestamp}:${secret}`;

  const bcrypt = await import("bcryptjs");

  const hash = await bcrypt.hash(payload, 10);
  return hash;
}

export const appwriteService = {
  config: APPWRITE_CONFIG,

  async getNextReceiptId(maxRetries: number = 5): Promise<number> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.random() * (100 * Math.pow(2, attempt)); // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        const response = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTION_ID,
          [
            Query.orderDesc("receiptId"),
            Query.limit(5),
            Query.select(["receiptId"]),
          ]
        );

        if (response.documents.length > 0) {
          const lastReceiptId = response.documents[0].receiptId;

          if (lastReceiptId != null && !isNaN(Number(lastReceiptId))) {
            const nextId = Number(lastReceiptId) + 1;

            const collisionCheck = response.documents.some(
              (doc) => doc.receiptId === nextId
            );

            if (collisionCheck) {
              if (import.meta.env.DEV) {
                console.warn(
                  `Receipt ID ${nextId} collision detected, retrying...`
                );
              }
              continue;
            }

            return nextId;
          }
        }

        return 10001;
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.error(
            `Error fetching receipt ID (attempt ${attempt + 1}/${maxRetries}):`,
            error
          );
        }
        if (attempt === maxRetries - 1) {
          return this.generateFallbackReceiptId();
        }

        continue;
      }
    }

    return this.generateFallbackReceiptId();
  },

  generateFallbackReceiptId(): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);

    const randomValue = array[0] % 900000;
    const fallbackId = 10000 + randomValue;

    if (import.meta.env.DEV) {
      console.warn(`Using fallback receipt ID: ${fallbackId}`);
    }

    return fallbackId;
  },

  async isReceiptIdUnique(receiptId: number): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        [Query.equal("receiptId", receiptId), Query.limit(1)]
      );

      return response.documents.length === 0;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error checking receipt ID uniqueness:", error);
      }
      return true;
    }
  },

  async saveDonationDetails(donation: any, retryCount: number = 0) {
    try {
      const isUnique = await this.isReceiptIdUnique(donation.receiptId);

      if (!isUnique) {
        if (import.meta.env.DEV) {
          console.warn(
            `Receipt ID ${donation.receiptId} already exists, regenerating...`
          );
        }
        if (retryCount < 3) {
          const newReceiptId = await this.getNextReceiptId();
          donation.receiptId = newReceiptId;
          donation.transactionId = `YGYA-${newReceiptId}`;
          return this.saveDonationDetails(donation, retryCount + 1);
        } else {
          throw new Error(
            "Failed to generate unique receipt ID after multiple attempts"
          );
        }
      }

      const verificationHash = await generateVerificationHash(
        donation.passId,
        donation.amount,
        donation.timestamp
      );

      return await databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        ID.unique(),
        {
          passId: String(donation.passId),
          transactionId: String(donation.transactionId),
          name: String(donation.donorName || donation.name),
          amount: Number(donation.amount),
          receiptId: Number(donation.receiptId || 0),
          paymentMethod: String(donation.paymentMethod || "mobile_payment"),
          description: String(donation.purpose || donation.description || ""),
          transactionDate: String(
            donation.timestamp ||
              donation.transactionDate ||
              new Date().toISOString()
          ),
          verificationHash: verificationHash,
          verified: true,
        }
      );
    } catch (error: any) {
      if (error.message === "Failed to fetch") {
        console.error(
          "CRITICAL: Appwrite request blocked. Hostname: " +
            window.location.hostname +
            ' needs to be added to Appwrite "Platforms".'
        );
      }
      if (import.meta.env.DEV) {
        console.error("Appwrite Database Sync Error:", error.message || error);
      }
      throw error;
    }
  },

  async uploadPassImage(blob: Blob, filename: string) {
    try {
      return await storage.createFile(
        APPWRITE_CONFIG.BUCKET_ID,
        ID.unique(),
        new File([blob], filename, { type: "image/png" })
      );
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Appwrite Storage Upload Error:", error.message || error);
      }
      throw error;
    }
  },

  async verifyFromCloud(searchId: string) {
    try {
      const trimmedId = searchId.trim();

      let response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        [Query.equal("passId", trimmedId), Query.limit(1)]
      );

      if (response.documents.length === 0) {
        response = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTION_ID,
          [Query.equal("transactionId", trimmedId), Query.limit(1)]
        );
      }

      if (response.documents.length === 0) {
        return {
          valid: false,
          message: "Pass not found in database",
          data: null,
        };
      }

      const doc = response.documents[0];

      // Verify hash authenticity using bcrypt
      const bcrypt = await import("bcryptjs");
      const secret =
        import.meta.env.VITE_VERIFICATION_SECRET || "CHANGE_THIS_SECRET";

      const normalizedTimestamp = doc.transactionDate.replace("+00:00", "Z");
      const payload = `${doc.passId}:${doc.amount}:${normalizedTimestamp}:${secret}`;

      const isValid = await bcrypt.compare(payload, doc.verificationHash);

      if (!isValid) {
        return {
          valid: false,
          message: "Pass has been tampered with",
          data: doc,
        };
      }

      return {
        valid: true,
        message: "Pass verified successfully",
        data: doc,
      };
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(
          "Appwrite Verification Query Error:",
          error.message || error
        );
      }
      return { valid: false, message: "Verification failed", data: null };
    }
  },

  async fetchAllDonations() {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        [] // No filters - fetch all
      );

      // Transform Appwrite documents to Donation objects
      return response.documents.map((doc: any) => ({
        id: doc.$id,
        donorName: doc.name,
        amount: doc.amount,
        purpose: doc.description || "",
        timestamp: doc.transactionDate,
        transactionId: doc.transactionId || `YGYA-${doc.receiptId}`,
        passId: doc.passId,
        receiptId: doc.receiptId,
        paymentMethod: doc.paymentMethod || "mobile_payment",
        status: "Success" as const,
      }));
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(
          "Failed to fetch donations from cloud:",
          error.message || error
        );
      }
      return [];
    }
  },
};
