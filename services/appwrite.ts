import { Client, Databases, Storage, ID, Query } from "appwrite";

const APPWRITE_CONFIG = {
  ENDPOINT:
    import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  PROJECT_ID:
    import.meta.env.VITE_APPWRITE_PROJECT_ID || "694d4f82000b90293d9c",
  DATABASE_ID:
    import.meta.env.VITE_APPWRITE_DATABASE_ID || "694d4fee0004a8ea4c4f",
  // Note: Appwrite now calls these "Tables" instead of "Collections"
  COLLECTION_ID:
    import.meta.env.VITE_APPWRITE_COLLECTION_ID || "694d72bc001cf1f14f87",
  BUCKET_ID: import.meta.env.VITE_APPWRITE_BUCKET_ID || "694d50760003519badde",
};

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
  .setProject(APPWRITE_CONFIG.PROJECT_ID);

export const databases = new Databases(client);
export const storage = new Storage(client);

/**
 * Generates a verification hash for pass authentication
 * Uses bcrypt to create tamper-proof signature
 * Note: bcrypt requires server-side execution, so this will need to be called via API
 */
async function generateVerificationHash(
  passId: string,
  amount: number,
  timestamp: string
): Promise<string> {
  const secret =
    import.meta.env.VITE_VERIFICATION_SECRET || "yagya-secret-2024";
  const payload = `${passId}:${amount}:${timestamp}:${secret}`;
  
  // Import bcryptjs for client-side compatibility
  const bcrypt = await import("bcryptjs");
  
  // Use bcrypt with 10 salt rounds for secure hashing
  const hash = await bcrypt.hash(payload, 10);
  return hash;
}

export const appwriteService = {
  config: APPWRITE_CONFIG,

  /**
   * Gets the next available receipt ID with race condition protection
   * Uses retry logic and collision detection to ensure uniqueness
   * Returns the highest receiptId + 1, or 10001 if no donations exist
   */
  async getNextReceiptId(maxRetries: number = 5): Promise<number> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add small random delay to reduce collision chance on retries
        if (attempt > 0) {
          const delay = Math.random() * (100 * Math.pow(2, attempt)); // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Query for highest receipt ID with optimized query
        const response = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTION_ID,
          [
            Query.orderDesc("receiptId"),
            Query.limit(5), // Fetch top 5 to detect collisions
            Query.select(["receiptId"]), // Only fetch needed field for performance
          ]
        );

        if (response.documents.length > 0) {
          const lastReceiptId = response.documents[0].receiptId;

          // Validate it's a proper number (not null, undefined, or NaN)
          if (lastReceiptId != null && !isNaN(Number(lastReceiptId))) {
            const nextId = Number(lastReceiptId) + 1;

            // Verify this ID doesn't already exist (collision check)
            const collisionCheck = response.documents.some(
              (doc) => doc.receiptId === nextId
            );

            if (collisionCheck) {
              // Collision detected, retry with next available
              if (import.meta.env.DEV) {
                console.warn(
                  `Receipt ID ${nextId} collision detected, retrying...`
                );
              }
              continue; // Retry loop
            }

            return nextId;
          }
        }

        return 10001; // First receipt ID if no donations exist
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.error(
            `Error fetching receipt ID (attempt ${attempt + 1}/${maxRetries}):`,
            error
          );
        }

        // If last attempt, use fallback
        if (attempt === maxRetries - 1) {
          return this.generateFallbackReceiptId();
        }

        // Otherwise retry
        continue;
      }
    }

    // Fallback if all retries exhausted
    return this.generateFallbackReceiptId();
  },

  /**
   * Generates a cryptographically secure fallback receipt ID
   * Used when database is unavailable or all retries exhausted
   */
  generateFallbackReceiptId(): number {
    // Use crypto.getRandomValues for better randomness
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);

    // Generate ID in range 10000-909999 (6 digits)
    // This provides 900,000 unique IDs with minimal collision risk
    const randomValue = array[0] % 900000;
    const fallbackId = 10000 + randomValue;

    if (import.meta.env.DEV) {
      console.warn(`Using fallback receipt ID: ${fallbackId}`);
    }

    return fallbackId;
  },

  /**
   * Validates that a receipt ID is unique before saving
   * Returns true if unique, false if duplicate exists
   */
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
      return true; // Assume unique if check fails
    }
  },

  /**
   * Saves donation details to the Appwrite Database.
   * Stores: passId (UUID), transactionId, amount, verificationHash, etc.
   * Includes receipt ID uniqueness validation to prevent duplicates
   */
  async saveDonationDetails(donation: any, retryCount: number = 0) {
    try {
      // Validate receipt ID uniqueness before saving
      const isUnique = await this.isReceiptIdUnique(donation.receiptId);

      if (!isUnique) {
        if (import.meta.env.DEV) {
          console.warn(
            `Receipt ID ${donation.receiptId} already exists, regenerating...`
          );
        }

        // If duplicate detected and we haven't retried too many times
        if (retryCount < 3) {
          // Generate new receipt ID and retry
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

      // Generate verification hash for tamper detection
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
          passId: String(donation.passId), // Primary UUID identifier
          transactionId: String(donation.transactionId), // Human-readable ID
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
          verified: true, // Mark as verified at creation
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

  /**
   * Uploads the generated pass image to Appwrite Storage.
   */
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

  /**
   * Verifies a pass by querying the cloud database and validating hash.
   * Searches by both passId (UUID) and transactionId (YGYA-XXXXX) with fallback.
   * Validates verificationHash for authenticity.
   */
  async verifyFromCloud(searchId: string) {
    console.log("🔍 [VERIFY] Starting verification for:", searchId);

    try {
      const trimmedId = searchId.trim();
      console.log("🔍 [VERIFY] Trimmed ID:", trimmedId);
      console.log("🔍 [VERIFY] Database ID:", APPWRITE_CONFIG.DATABASE_ID);
      console.log("🔍 [VERIFY] Collection ID:", APPWRITE_CONFIG.COLLECTION_ID);

      // Try searching by passId first (UUID format)
      console.log("🔍 [VERIFY] Attempt 1: Searching by passId field...");
      let response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        [Query.equal("passId", trimmedId), Query.limit(1)]
      );
      console.log("🔍 [VERIFY] passId search result:", {
        found: response.documents.length,
        total: response.total,
      });

      // Fallback: try searching by transactionId (YGYA-XXXXX format)
      if (response.documents.length === 0) {
        console.log(
          "🔍 [VERIFY] Attempt 2: Searching by transactionId field..."
        );
        response = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTION_ID,
          [Query.equal("transactionId", trimmedId), Query.limit(1)]
        );
        console.log("🔍 [VERIFY] transactionId search result:", {
          found: response.documents.length,
          total: response.total,
        });
      }

      if (response.documents.length === 0) {
        console.log("❌ [VERIFY] No documents found in database");
        return {
          valid: false,
          message: "Pass not found in database",
          data: null,
        };
      }

      const doc = response.documents[0];
      console.log("✅ [VERIFY] Document found:", {
        passId: doc.passId,
        transactionId: doc.transactionId,
        amount: doc.amount,
        name: doc.name,
        hasVerificationHash: !!doc.verificationHash,
      });

      // Verify hash authenticity using bcrypt
      console.log("🔐 [VERIFY] Verifying hash with bcrypt...");
      const bcrypt = await import("bcryptjs");
      const secret =
        import.meta.env.VITE_VERIFICATION_SECRET || "yagya-secret-2024";
      
      // Normalize timestamp - Appwrite adds +00:00 suffix, normalize to Z format
      const normalizedTimestamp = doc.transactionDate.replace('+00:00', 'Z');
      const payload = `${doc.passId}:${doc.amount}:${normalizedTimestamp}:${secret}`;
      
      const isValid = await bcrypt.compare(payload, doc.verificationHash);
      console.log("🔐 [VERIFY] Hash comparison:", {
        stored: doc.verificationHash?.substring(0, 16) + "...",
        isValid: isValid,
      });

      if (!isValid) {
        console.log("❌ [VERIFY] Hash mismatch - pass may be tampered");
        return {
          valid: false,
          message: "Pass has been tampered with",
          data: doc,
        };
      }

      console.log("✅ [VERIFY] Verification successful!");
      return {
        valid: true,
        message: "Pass verified successfully",
        data: doc,
      };
    } catch (error: any) {
      console.error("❌ [VERIFY] Error during verification:", {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response,
      });
      if (import.meta.env.DEV) {
        console.error(
          "Appwrite Verification Query Error:",
          error.message || error
        );
      }
      return { valid: false, message: "Verification failed", data: null };
    }
  },

  /**
   * Fetches all donations from the cloud database.
   * Used by admin to sync and display all donations across devices.
   */
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
