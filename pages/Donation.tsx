import React, { useState } from "react";
import { Donation } from "../types";
import {
  Heart,
  CreditCard,
  CheckCircle2,
  Download,
  ShieldCheck,
  Share2,
  Loader2,
  CloudUpload,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";
import { appwriteService } from "../services/appwrite";

declare var html2canvas: any;

export const DonationPage: React.FC<{
  onDonate: (donation: Donation) => void;
}> = ({ onDonate }) => {
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    purpose: "",
  });
  const [receipt, setReceipt] = useState<Donation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "synced" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate donation amount
    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      setErrorMessage("Please enter a valid donation amount greater than ₹0");
      return;
    }

    if (amount > 1000000) {
      setErrorMessage("Donation amount cannot exceed ₹10,00,000");
      return;
    }

    // Sanitize inputs to prevent XSS and limit length
    const sanitizedName = (formData.name || "").trim().slice(0, 100);
    const sanitizedPurpose = (formData.purpose || "").trim().slice(0, 500);

    setStep("processing");

    try {
      // Generate cryptographically secure pass ID
      const passId = crypto.randomUUID();

      // Get next sequential receipt ID from database (globally unique)
      const receiptId = await appwriteService.getNextReceiptId();

      const newDonation: Donation = {
        id: crypto.randomUUID(),
        donorName: sanitizedName || "Anonymous Donor",
        amount: amount,
        purpose: sanitizedPurpose,
        timestamp: new Date().toISOString(),
        transactionId: `ACF-${receiptId}`, // Human-readable display ID
        passId: passId, // Secure UUID for verification
        receiptId: receiptId,
        paymentMethod: "mobile_payment",
        status: "Success",
      };

      setReceipt(newDonation);
      onDonate(newDonation);

      setTimeout(() => {
        setStep("success");
        // Wait for UI to render and external images (QR) to potentially load
        setTimeout(() => syncToCloud(newDonation), 1000);
      }, 1200);
    } catch (error: any) {
      const errorMsg =
        error.message === "Failed to fetch"
          ? "Unable to connect to server. Please check your internet connection and try again."
          : "Failed to generate receipt. Please try again.";
      setErrorMessage(errorMsg);
      setStep("form");
      if (import.meta.env.DEV)
        console.error("Receipt generation error:", error);
    }
  };

  const syncToCloud = async (donation: Donation) => {
    setSyncStatus("syncing");
    setErrorMessage(null);
    try {
      // 1. Save metadata to Appwrite Database
      await appwriteService.saveDonationDetails(donation);

      // 2. Generate and upload image
      const element = document.getElementById("devotee-pass");
      if (element) {
        // Wait for all images in the pass to load before capturing
        const images = element.getElementsByTagName("img");
        await Promise.all(
          Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })
        );

        // High-quality rendering for cloud storage
        const canvas = await html2canvas(element, {
          scale: window.devicePixelRatio * 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
          foreignObjectRendering: true,
          imageTimeout: 15000,
          removeContainer: true,
          scrollY: -window.scrollY,
          scrollX: -window.scrollX,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        });

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/png", 1.0);
        });

        if (blob) {
          await appwriteService.uploadPassImage(
            blob,
            `Pass_${donation.transactionId}.png`
          );
        }
      }

      setSyncStatus("synced");
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("Cloud sync error:", err);
      setSyncStatus("error");
      if (err.message === "Failed to fetch") {
        setErrorMessage(
          "Network Error: Please ensure your domain is registered in the Appwrite Console 'Platforms' settings."
        );
      } else {
        setErrorMessage(err.message || "Failed to sync with cloud storage.");
      }
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById("devotee-pass");
    if (!element) return;

    setIsSaving(true);
    try {
      // Wait for all images (especially QR code) to fully load
      const images = element.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => resolve(), 5000); // 5s timeout
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              resolve(); // Continue even if image fails
            };
          });
        })
      );

      // Small delay to ensure rendering is complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // High-quality rendering settings - relaxed CORS for external images
      const canvas = await html2canvas(element, {
        scale: 2, // Balanced quality and performance
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: true, // Allow external images (QR code)
        foreignObjectRendering: false,
        imageTimeout: 0,
        width: element.offsetWidth,
        height: element.offsetHeight,
        x: 0,
        y: 0,
        onclone: (clonedDoc) => {
          // Ensure cloned element is visible
          const clonedElement = clonedDoc.getElementById("devotee-pass");
          if (clonedElement) {
            clonedElement.style.display = "block";
            clonedElement.style.visibility = "visible";
          }
        },
      });

      // Verify canvas has content
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas rendering failed - no dimensions");
      }

      // Convert to high-quality PNG
      const image = canvas.toDataURL("image/png", 1.0);

      // Verify image has content (not just header)
      if (image.length < 1000) {
        throw new Error("Generated image is too small - likely empty");
      }

      // Download the image
      const link = document.createElement("a");
      link.download = `Contribution_Pass_${receipt?.transactionId}.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Image save error:", error);
      // Provide more helpful error message
      const errorMsg = error.message || "Unknown error occurred";
      alert(`Failed to save image: ${errorMsg}\n\nPlease try:\n1. Taking a screenshot instead\n2. Ensuring your browser allows downloads\n3. Checking your internet connection`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && receipt) {
      try {
        await navigator.share({
          title: "Community Festival Contribution Pass",
          text: `I just contributed to the Annual Community Festival. My Pass ID is ${receipt.passId}`,
          url: window.location.href.split("#")[0],
        });
      } catch (err) {
        if (import.meta.env.DEV) console.log("Sharing failed", err);
      }
    }
  };

  if (step === "success" && receipt) {
    // Use passId for QR code verification (secure UUID)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${receipt.passId}`;

    return (
      <div className="max-w-md mx-auto py-4 space-y-6 animate-scale-in no-print">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-2 animate-bounce">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Blessings Received
          </h2>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all">
              {syncStatus === "syncing" && (
                <span className="text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full">
                  <Loader2 size={12} className="animate-spin" /> Syncing to
                  Cloud...
                </span>
              )}
              {syncStatus === "synced" && (
                <span className="text-green-600 flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full">
                  <CloudUpload size={12} /> Stored in Cloud
                </span>
              )}
              {syncStatus === "error" && (
                <span className="text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full">
                  <AlertCircle size={12} /> Sync Failed
                </span>
              )}
            </div>
            {errorMessage && (
              <div className="max-w-[300px] text-[10px] text-red-500 bg-red-50/50 p-3 rounded-lg border border-red-100 flex flex-col items-center gap-2 shadow-sm">
                <p className="text-center font-medium leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  onClick={() => syncToCloud(receipt)}
                  className="flex items-center gap-1.5 font-black uppercase hover:underline text-red-700 bg-white px-3 py-1 rounded-full border border-red-100 active-pop"
                >
                  <RefreshCcw size={10} /> Retry Sync
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          id="devotee-pass"
          className="relative mx-auto w-full max-w-[320px] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-4 animate-glow transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(234,88,12,0.6),0_0_80px_rgba(234,88,12,0.4)] hover:-translate-y-2 cursor-pointer"
          style={{ borderColor: "#edb20033" }}
        >
          <div
            className="p-6 text-center text-white relative"
            style={{
              backgroundImage:
                "linear-gradient(to bottom right, #991b1b, #ea580c)",
              backgroundColor: "#991b1b",
            }}
          >
            <div className="absolute top-2 right-2 opacity-20">
              <ShieldCheck size={60} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              COMMUNITY FESTIVAL
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              Springfield • Feb 2026
            </p>
          </div>

          <div className="p-8 space-y-6 text-center">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Contributor Name
              </p>
              <h4 className="text-2xl font-bold text-gray-900">
                {receipt.donorName}
              </h4>
            </div>

            <div className="flex justify-around items-center py-4 border-y border-dashed border-gray-100">
              <div className="text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase">
                  Amount
                </p>
                <p className="text-lg font-black text-red-700">
                  ₹{receipt.amount}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase">
                  Status
                </p>
                <p className="text-lg font-black text-green-600 uppercase">
                  Verified
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-3xl inline-block shadow-inner border border-gray-100">
                <img
                  crossOrigin="anonymous"
                  src={qrUrl}
                  alt="QR Verification"
                  className="w-32 h-32 mix-blend-multiply"
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">
                  Transaction ID
                </p>
                <p className="font-mono text-sm font-bold text-gray-700">
                  {receipt.transactionId}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">
                  Secure Pass ID
                </p>
                <p className="font-mono text-[10px] text-gray-500 break-all">
                  {receipt.passId}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-[9px] font-serif italic text-gray-400">
              "Thank you for your generous contribution"
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 animate-slide-up delay-400">
          <button
            disabled={isSaving}
            onClick={handleDownloadImage}
            className="w-full flex items-center justify-center gap-2 bg-red-800 text-white py-4 rounded-2xl font-bold hover:bg-red-900 shadow-xl active-pop transition-all disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Preparing...
              </>
            ) : (
              <>
                <Download size={20} /> Save Contribution Pass (Image)
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 border-2 border-gray-100 py-3 rounded-2xl font-bold hover:bg-gray-50 active-pop transition-all"
            >
              <Share2 size={18} /> Share
            </button>
            <button
              onClick={() => setStep("form")}
              className="flex items-center justify-center gap-2 bg-white text-red-800 border-2 border-red-50 py-3 rounded-2xl font-bold hover:bg-red-50 active-pop transition-all"
            >
              New Donation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6 animate-fade-in">
        <div className="w-16 h-16 border-4 border-red-800 border-t-transparent rounded-full animate-spin shadow-lg" />
        <p className="text-xl font-medium text-gray-700 animate-pulse">
          Processing contribution...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in no-print">
      <div className="text-center space-y-2 animate-slide-up">
        <Heart className="mx-auto text-red-600 w-12 h-12 mb-2 animate-bounce-short" />
        <h2 className="text-3xl font-bold text-red-900">
          Devotional Contribution
        </h2>
        <p className="text-gray-600">
          Your contribution supports community programs and charitable
          activities at Springfield.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-red-50 space-y-6 animate-scale-in"
      >
        <div className="space-y-2 group">
          <label className="text-sm font-semibold text-gray-700 ml-1 group-focus-within:text-red-700 transition-colors">
            Donor Name (Displayed on Pass)
          </label>
          <input
            type="text"
            placeholder="E.g. Rajesh Kumar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all focus:shadow-md bg-gray-50/50"
          />
        </div>

        <div className="space-y-2 group">
          <label className="text-sm font-semibold text-gray-700 ml-1 group-focus-within:text-red-700 transition-colors">
            Amount (INR)
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400 group-focus-within:text-red-500 transition-colors text-xl">
              ₹
            </span>
            <input
              required
              type="number"
              placeholder="501"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full pl-12 pr-5 py-5 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-2xl font-black focus:shadow-md bg-gray-50/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[101, 501, 1100].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setFormData({ ...formData, amount: String(amt) })}
              className={`py-4 rounded-2xl font-black transition-all border-2 active-pop ${
                formData.amount === String(amt)
                  ? "bg-red-900 text-white border-red-900 shadow-lg"
                  : "bg-white text-red-800 border-red-50 hover:border-red-200 shadow-sm"
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        <div className="space-y-2 group">
          <label className="text-sm font-semibold text-gray-700 ml-1 group-focus-within:text-red-700 transition-colors">
            Remarks (Optional)
          </label>
          <input
            type="text"
            placeholder="Ritual purpose..."
            value={formData.purpose}
            onChange={(e) =>
              setFormData({ ...formData, purpose: e.target.value })
            }
            className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all focus:shadow-md bg-gray-50/50"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 active-pop transition-all flex items-center justify-center gap-2 group"
          >
            <CreditCard
              size={22}
              className="group-hover:rotate-12 transition-transform"
            />
            Confirm & Generate Pass
          </button>
        </div>
      </form>
    </div>
  );
};
