import React, { useState, useEffect, useRef } from "react";
import { AppState, Donation } from "../types";
import { askGeminiAboutEvent } from "../services/geminiService";
import { appwriteService } from "../services/appwrite";
import {
  Send,
  MapPin,
  Calendar,
  Info,
  Sparkles,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  QrCode,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Camera,
  CameraOff,
  Loader2,
  Phone,
  User2,
} from "lucide-react";

declare var Html5Qrcode: any;

const ORGANIZERS = [
  {
    name: "John Anderson",
    role: "Event Director",
    phone: "+1 555-0101",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    name: "Sarah Mitchell",
    role: "Coordination Head",
    phone: "+1 555-0102",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    name: "Michael Chen",
    role: "Volunteer Manager",
    phone: "+1 555-0103",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
  },
];

export const Home: React.FC<{ state: AppState }> = ({ state }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verification State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [verifyResult, setVerifyResult] = useState<
    Donation | "not_found" | null
  >(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    const res = await askGeminiAboutEvent(question);
    setAnswer(res);
    setLoading(false);
  };

  const handleVerify = async (e?: React.FormEvent, customTxnId?: string) => {
    e?.preventDefault();
    const idToVerify = customTxnId || txnId;

    if (!idToVerify) {
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const cloudResult = await appwriteService.verifyFromCloud(idToVerify);

      if (cloudResult && cloudResult.valid && cloudResult.data) {
        setVerifyResult({
          id: cloudResult.data.passId,
          donorName: cloudResult.data.name,
          amount: cloudResult.data.amount,
          transactionId: cloudResult.data.transactionId,
          passId: cloudResult.data.passId,
          timestamp: cloudResult.data.transactionDate,
          purpose: cloudResult.data.description,
          status: "Success",
          paymentMethod: cloudResult.data.paymentMethod,
        });
      } else {
        setVerifyResult("not_found");
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Verification error:", error);
      setVerifyResult("not_found");
    } finally {
      setIsVerifying(false);
      if (isScanning) stopScanner();
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    setVerifyResult(null);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            const cleanText = decodedText.trim();
            setTxnId(cleanText);
            handleVerify(undefined, cleanText);
          },
          () => {}
        );
      } catch (err) {
        setIsScanning(false);
        alert("Camera access denied.");
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {}
    }
    setIsScanning(false);
  };

  const closeVerifyModal = () => {
    stopScanner();
    setIsVerifyModalOpen(false);
    setTxnId("");
    setVerifyResult(null);
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Branding */}
      <section className="relative rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in group">
        <div className="absolute inset-0 bg-gradient-to-t from-red-950 via-red-900/40 to-transparent z-10" />
        <img
          src="https://picsum.photos/seed/spirituality/1200/600"
          alt="Community Festival"
          className="w-full h-[300px] md:h-[450px] object-cover group-hover:scale-110 transition-transform duration-[3s] ease-out"
        />
        <div className="absolute inset-x-0 bottom-0 z-20 p-8 md:p-12">
          <div className="flex items-center gap-2 mb-4 animate-slide-up">
            <span
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                state.eventInfo.status === "Ongoing"
                  ? "bg-green-500 text-white"
                  : "bg-yellow-400 text-red-900"
              }`}
            >
              {state.eventInfo.status} Event
            </span>
            <button
              onClick={() => setIsVerifyModalOpen(true)}
              className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md flex items-center gap-2"
            >
              <ShieldCheck size={12} /> Verify Pass
            </button>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight animate-slide-up delay-100">
            {state.eventInfo.title}
          </h2>
          <div className="flex flex-wrap gap-6 text-red-50 font-semibold animate-slide-up delay-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <MapPin size={20} className="text-yellow-400" />
              </div>
              <span>{state.eventInfo.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Calendar size={20} className="text-yellow-400" />
              </div>
              <span>
                {state.eventInfo.startDate} &mdash; {state.eventInfo.endDate}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 stagger-container">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover-lift relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-red-500/5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
              <Info size={120} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Spiritual Significance
            </h3>
            <p className="text-gray-600 leading-relaxed text-xl italic font-serif">
              "{state.eventInfo.significance}"
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-10 rounded-[2.5rem] shadow-sm border border-orange-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-orange-900">
                    Devotional Guide
                  </h3>
                  <p className="text-xs text-orange-700 font-medium">
                    Ask anything about the rituals or event
                  </p>
                </div>
              </div>

              <form onSubmit={handleAsk} className="relative mb-6 group">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Tell me about the importance of Aarti..."
                  className="w-full pl-6 pr-16 py-5 rounded-2xl border-2 border-orange-200 focus:outline-none focus:border-orange-500 transition-all bg-white/80 backdrop-blur-sm text-lg"
                />
                <button
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-700 active-pop shadow-lg disabled:opacity-50 transition-all group"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>

              {answer && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 animate-scale-in">
                  <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest mb-3">
                    <MessageCircle size={14} /> Guide Response
                  </div>
                  <p className="text-gray-800 leading-relaxed">{answer}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-red-900 p-8 rounded-[2.5rem] shadow-2xl text-white hover-lift">
            <p className="text-red-300 text-[10px] font-black uppercase tracking-widest mb-4">
              Event Verification
            </p>
            <div className="space-y-4">
              <p className="text-sm text-red-100 opacity-80">
                Check the authenticity of a Devotee Pass instantly.
              </p>
              <button
                onClick={() => setIsVerifyModalOpen(true)}
                className="flex items-center justify-center gap-3 w-full py-5 bg-white text-red-900 rounded-2xl font-black transition-all hover:bg-yellow-400 active-pop shadow-lg group"
              >
                <QrCode
                  size={22}
                  className="group-hover:rotate-12 transition-transform"
                />{" "}
                Verify Devotee Pass
              </button>
            </div>
          </div>

          {/* Organizing Committee Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                The Guardians
              </h3>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-red-100 to-transparent"></div>
            </div>
            <div className="grid gap-4">
              {ORGANIZERS.map((organizer, idx) => (
                <div
                  key={idx}
                  className={`bg-white p-4 rounded-[1.8rem] border border-gray-100 shadow-sm flex items-center gap-4 hover-lift group animate-scale-in delay-${
                    idx * 100
                  }`}
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-red-50 shadow-inner group-hover:border-red-400 transition-colors">
                      <img
                        src={organizer.image}
                        alt={organizer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight">
                      {organizer.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                      {organizer.role}
                    </p>
                  </div>
                  <a
                    href={`tel:${organizer.phone}`}
                    className="p-3 bg-red-50 text-red-800 rounded-2xl hover:bg-red-800 hover:text-white transition-all active-pop shadow-sm"
                    aria-label={`Call ${organizer.name}`}
                    title={`Call ${organizer.phone}`}
                  >
                    <Phone size={16} />
                  </a>
                </div>
              ))}
            </div>
            <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] pt-2">
              Springfield Event Committee
            </p>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-red-950/80 backdrop-blur-sm animate-fade-in"
            onClick={closeVerifyModal}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-red-800 to-red-700 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Pass Verification</h3>
                <p className="text-xs text-red-200 font-medium">
                  Synced with Cloud Records
                </p>
              </div>
              <button
                onClick={closeVerifyModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors active-pop"
                aria-label="Close verification modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 min-h-[400px]">
              {isVerifying ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 size={48} className="text-red-700 animate-spin" />
                  <p className="text-gray-500 font-bold animate-pulse">
                    Checking Cloud Records...
                  </p>
                </div>
              ) : !verifyResult ? (
                <div className="space-y-6">
                  {isScanning ? (
                    <div className="space-y-4 animate-scale-in">
                      <div
                        id="qr-reader"
                        className="w-full aspect-square bg-gray-900 rounded-3xl overflow-hidden border-4 border-red-100"
                      ></div>
                      <button
                        onClick={stopScanner}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-bold active-pop"
                      >
                        <CameraOff size={20} /> Cancel Scanning
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => handleVerify(e)}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Pass ID or Transaction ID
                          </label>
                          <button
                            type="button"
                            onClick={startScanner}
                            className="flex items-center gap-2 text-red-800 font-black text-[10px] uppercase hover:underline"
                          >
                            <Camera size={14} /> Use Scanner
                          </button>
                        </div>
                        <div className="relative group">
                          <Search
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors"
                            size={20}
                          />
                          <input
                            required
                            autoFocus
                            type="text"
                            placeholder="YGYA-10001 or UUID from QR code"
                            value={txnId}
                            onChange={(e) =>
                              setTxnId(e.target.value.toUpperCase())
                            }
                            className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-red-200 focus:ring-0 transition-all outline-none font-black text-lg tracking-wider"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-red-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:-translate-y-1 transition-all active-pop"
                      >
                        Verify Authenticity
                      </button>
                    </form>
                  )}
                </div>
              ) : verifyResult === "not_found" ? (
                <div className="text-center space-y-6 py-4 animate-scale-in">
                  <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertCircle size={48} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">
                      Pass Not Found
                    </h4>
                    <p className="text-gray-500 mt-2">
                      The ID <strong>{txnId}</strong> was not found in the
                      database.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setVerifyResult(null);
                      setTxnId("");
                    }}
                    className="w-full py-4 rounded-2xl font-bold bg-red-900 text-white transition-all active-pop"
                  >
                    Try Manual Entry
                  </button>
                </div>
              ) : (
                <div className="space-y-8 py-2 animate-scale-in">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 size={48} />
                    </div>
                    <div>
                      <h4 className="text-3xl font-black text-gray-900">
                        Pass Verified
                      </h4>
                      <p className="text-xs font-black text-green-600 uppercase tracking-[0.2em] mt-1">
                        Authentic Record Found
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        Devotee
                      </span>
                      <span className="font-bold text-gray-800">
                        {verifyResult.donorName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        Contribution
                      </span>
                      <span className="font-black text-red-700 text-lg">
                        ₹{verifyResult.amount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        Date
                      </span>
                      <span className="font-medium text-gray-600">
                        {new Date(verifyResult.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={closeVerifyModal}
                    className="w-full bg-red-900 text-white py-5 rounded-2xl font-black text-lg active-pop transition-all"
                  >
                    Close & Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
