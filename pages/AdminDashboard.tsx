import React, { useState, useEffect } from "react";
import { AppState, Donation, EventUpdate } from "../types";
import {
  Users,
  Plus,
  Trash2,
  TrendingUp,
  Download,
  Megaphone,
  Settings as SettingsIcon,
  CreditCard,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Calendar,
  Layers,
  Activity,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Search,
  Shield,
  Loader2,
} from "lucide-react";
import { appwriteService } from "../services/appwrite";

export const AdminDashboard: React.FC<{
  state: AppState;
  onAddUpdate: (u: EventUpdate) => void;
  onRemoveUpdate: (id: string) => void;
  onUpdateStatus: (s: string) => void;
}> = ({ state, onAddUpdate, onRemoveUpdate, onUpdateStatus }) => {
  const [tab, setTab] = useState<
    "donations" | "updates" | "settings" | "verify"
  >("donations");
  const [newUpdate, setNewUpdate] = useState({
    title: "",
    description: "",
    imageUrl: "",
  });
  const [verifyPassId, setVerifyPassId] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch donations from database instead of using localStorage
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);

  // Fetch donations from database on component mount
  useEffect(() => {
    const loadDonations = async () => {
      setIsLoadingDonations(true);
      try {
        const dbDonations = await appwriteService.fetchAllDonations();
        setDonations(dbDonations);
      } catch (error) {
        if (import.meta.env.DEV)
          console.error("Failed to load donations:", error);
      } finally {
        setIsLoadingDonations(false);
      }
    };
    loadDonations();
  }, []);

  const totalDonations = donations.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUpdate({
      ...newUpdate,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    });
    setNewUpdate({ title: "", description: "", imageUrl: "" });
  };

  const exportDonations = () => {
    const csvRows = [
      [
        "Transaction ID",
        "Pass ID",
        "Receipt ID",
        "Donor",
        "Amount",
        "Date",
        "Purpose",
      ],
      ...donations.map((d) => [
        d.transactionId,
        d.passId || "",
        d.receiptId || "",
        d.donorName,
        d.amount,
        d.timestamp,
        d.purpose || "",
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `donations_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await appwriteService.verifyFromCloud(verifyPassId.trim());
      setVerificationResult(result);
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        valid: false,
        message: "Verification error occurred",
        data: null,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Top Command Bar */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-full">
              Organizers Portal
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />{" "}
              Live System
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight font-serif">
            Management Console
          </h2>
          <p className="text-gray-500 mt-2 font-medium">
            Overseeing the Annual Community Festival activities.
          </p>
        </div>

        <nav className="inline-flex p-1.5 bg-white shadow-xl rounded-[2rem] border border-gray-100 backdrop-blur-sm">
          {[
            { id: "donations", label: "Financials", icon: CreditCard },
            { id: "verify", label: "Verify Pass", icon: Shield },
            { id: "updates", label: "News Feed", icon: Megaphone },
            { id: "settings", label: "Settings", icon: SettingsIcon },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all active-pop ${
                tab === t.id
                  ? "bg-red-900 text-white shadow-lg"
                  : "text-gray-400 hover:text-red-900 hover:bg-red-50"
              }`}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="transition-all duration-500 ease-in-out">
        {tab === "donations" && (
          <div className="space-y-8 animate-scale-in">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-2 bg-red-950 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group hover-lift border border-red-800">
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-red-300 text-[10px] font-black uppercase tracking-[0.2em]">
                        Total Collection
                      </p>
                      <ArrowUpRight
                        className="text-red-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                        size={24}
                      />
                    </div>
                    <p className="text-6xl font-black font-serif">
                      ₹{totalDonations.toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-4 text-xs font-bold text-red-200">
                    <span className="flex items-center gap-1.5">
                      <Activity size={14} /> Real-time Sync
                    </span>
                    <span className="opacity-40">|</span>
                    <span>Last entry 2 mins ago</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-[4s]">
                  <CreditCard size={280} />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between hover-lift">
                <div>
                  <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <Users size={28} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Contributors
                  </p>
                  <p className="text-4xl font-black text-gray-900">
                    {donations.length}
                  </p>
                </div>
                <p className="text-xs text-green-600 font-bold mt-4">
                  +12.5% from yesterday
                </p>
              </div>

              <button
                onClick={exportDonations}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 group hover:bg-gray-50 hover:border-red-200 transition-all active-pop"
              >
                <div className="w-14 h-14 bg-red-50 text-red-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download size={28} />
                </div>
                <div className="text-center">
                  <p className="font-black text-gray-900 text-sm">
                    Download Report
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                    CSV Format
                  </p>
                </div>
              </button>
            </div>

            {/* Transaction Ledger Card */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 font-serif">
                    Recent Ledger
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Detailed history of all contributions
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-4 py-1.5 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Verified Entries
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-10 py-5">Transaction ID</th>
                      <th className="px-10 py-5">Devotee Name</th>
                      <th className="px-10 py-5 text-right">Amount</th>
                      <th className="px-10 py-5">Purpose</th>
                      <th className="px-10 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoadingDonations ? (
                      <tr>
                        <td colSpan={5} className="px-10 py-32 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2
                              size={48}
                              className="animate-spin text-red-600"
                            />
                            <p className="font-bold text-xl uppercase tracking-widest text-gray-400">
                              Loading Donations...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : donations.length > 0 ? (
                      <>
                        {donations.map((d) => (
                          <tr
                            key={d.id}
                            className="hover:bg-red-50/30 transition-colors group"
                          >
                            <td className="px-10 py-6 font-mono text-xs text-gray-400 group-hover:text-red-900 transition-colors">
                              {d.transactionId}
                            </td>
                            <td className="px-10 py-6 font-bold text-gray-800">
                              {d.donorName}
                            </td>
                            <td className="px-10 py-6 font-black text-red-700 text-lg text-right">
                              ₹{d.amount.toLocaleString()}
                            </td>
                            <td className="px-10 py-6 text-gray-500 text-sm italic">
                              {d.purpose || "General Seva"}
                            </td>
                            <td className="px-10 py-6 text-center">
                              <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-green-200">
                                Success
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-10 py-32 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <Layers size={48} />
                            <p className="font-bold text-xl uppercase tracking-widest">
                              No Records Found
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "verify" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-scale-in">
            {/* Verification Form Card */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center shadow-lg">
                  <Shield size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold font-serif">
                    Verify Donation Pass
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Validate pass authenticity using secure Pass ID
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyPass} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Enter Pass Verification ID
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="YGYA-10001 or UUID (from QR scan)"
                    value={verifyPassId}
                    onChange={(e) => setVerifyPassId(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 focus:outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 ml-1">
                    Accepts Transaction ID (YGYA-10001) or Pass ID (UUID). Scan
                    QR code for automatic entry.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl active-pop transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search size={22} /> Verify Pass
                    </>
                  )}
                </button>
              </form>

              {/* Verification Result */}
              {verificationResult && (
                <div
                  className={`mt-8 p-8 rounded-3xl border-2 ${
                    verificationResult.valid
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        verificationResult.valid
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {verificationResult.valid ? (
                        <CheckCircle size={28} />
                      ) : (
                        <XCircle size={28} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`text-xl font-bold mb-2 ${
                          verificationResult.valid
                            ? "text-green-900"
                            : "text-red-900"
                        }`}
                      >
                        {verificationResult.valid
                          ? "✓ Pass Verified"
                          : "✗ Verification Failed"}
                      </h4>
                      <p
                        className={`text-sm mb-4 ${
                          verificationResult.valid
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {verificationResult.message}
                      </p>

                      {verificationResult.valid && verificationResult.data && (
                        <div className="bg-white p-6 rounded-2xl space-y-3 border border-gray-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase">
                                Donor Name
                              </p>
                              <p className="font-bold text-gray-900">
                                {verificationResult.data.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase">
                                Amount
                              </p>
                              <p className="font-bold text-green-600 text-lg">
                                ₹{verificationResult.data.amount}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase">
                                Transaction ID
                              </p>
                              <p className="font-mono text-sm text-gray-700">
                                {verificationResult.data.transactionId}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase">
                                Date
                              </p>
                              <p className="text-sm text-gray-700">
                                {new Date(
                                  verificationResult.data.transactionDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {verificationResult.data.description && (
                            <div className="pt-3 border-t border-gray-100">
                              <p className="text-xs font-bold text-gray-400 uppercase">
                                Purpose
                              </p>
                              <p className="text-sm text-gray-700">
                                {verificationResult.data.description}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions Card */}
            <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <AlertCircle size={20} /> How to Verify
              </h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  • Scan the QR code on the donation pass using a QR scanner
                </li>
                <li>
                  • Copy the UUID and paste it in the verification form above
                </li>
                <li>
                  • Or manually type the "Secure Pass ID" shown on the pass
                </li>
                <li>
                  • The system will verify authenticity against cloud database
                </li>
                <li>• Tampering detection ensures pass hasn't been modified</li>
              </ul>
            </div>
          </div>
        )}

        {tab === "updates" && (
          <div className="grid lg:grid-cols-12 gap-8 animate-scale-in">
            {/* Create News Section */}
            <div className="lg:col-span-5">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 sticky top-24 overflow-hidden">
                <div className="absolute top-0 right-0 p-10 text-red-500/5 pointer-events-none">
                  <Megaphone size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-red-900 text-white rounded-3xl flex items-center justify-center shadow-lg">
                      <Plus size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-serif">
                        Compose Update
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">
                        Post live updates to the community feed.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAddUpdate} className="space-y-6">
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-red-900 transition-colors">
                        Headline
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Grand Aarti Ceremony Commenced"
                        value={newUpdate.title}
                        onChange={(e) =>
                          setNewUpdate({ ...newUpdate, title: e.target.value })
                        }
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-red-200 focus:ring-0 transition-all outline-none font-bold text-gray-800"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-red-900 transition-colors">
                        Detailed Description
                      </label>
                      <textarea
                        required
                        placeholder="Describe the moment or ritual in detail..."
                        value={newUpdate.description}
                        onChange={(e) =>
                          setNewUpdate({
                            ...newUpdate,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-red-200 focus:ring-0 h-40 resize-none transition-all outline-none font-medium leading-relaxed"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-red-900 transition-colors">
                        Media Link (Image URL)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={newUpdate.imageUrl}
                          onChange={(e) =>
                            setNewUpdate({
                              ...newUpdate,
                              imageUrl: e.target.value,
                            })
                          }
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-red-200 focus:ring-0 transition-all outline-none font-medium text-xs"
                        />
                        <ImageIcon
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-900 transition-colors"
                          size={20}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-red-900 hover:bg-red-800 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active-pop flex items-center justify-center gap-3"
                    >
                      <Activity size={20} /> Broadcast Live
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Feed History Section */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-xl font-bold text-gray-900 font-serif">
                  Previous Broadcasts
                </h3>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  {state.updates.length} TOTAL POSTS
                </span>
              </div>

              <div className="space-y-4">
                {state.updates.map((update, idx) => (
                  <div
                    key={update.id}
                    className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 hover-lift group animate-slide-up delay-${
                      idx * 100
                    }`}
                  >
                    <div className="w-full sm:w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner">
                      {update.imageUrl ? (
                        <img
                          src={update.imageUrl}
                          alt={update.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <ImageIcon size={36} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-black text-red-600 uppercase tracking-widest">
                        <Clock size={12} />
                        {new Date(update.timestamp).toLocaleString()}
                      </div>
                      <h4 className="font-bold text-gray-900 text-xl leading-tight font-serif">
                        {update.title}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {update.description}
                      </p>
                    </div>
                    <div className="flex sm:flex-col justify-end gap-2">
                      <button
                        onClick={() => onRemoveUpdate(update.id)}
                        className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all active-pop shadow-sm"
                        title="Delete Broadcast"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                {state.updates.length === 0 && (
                  <div className="py-32 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium italic">
                      No updates have been broadcasted yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-3xl mx-auto animate-scale-in">
            <div className="bg-white p-12 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 relative overflow-hidden text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 p-20 text-red-500/5 pointer-events-none">
                <SettingsIcon size={300} />
              </div>

              <div className="relative z-10 space-y-12">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-red-100 text-red-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
                    <Calendar size={40} />
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 font-serif">
                    Event Lifecycle Controls
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Manage the public availability and status of the Maha
                    Community Festival platform.
                  </p>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                    Master Status Toggle
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["Upcoming", "Ongoing", "Completed"].map((s) => (
                      <button
                        key={s}
                        onClick={() => onUpdateStatus(s)}
                        className={`group relative py-8 px-6 rounded-[2rem] font-black transition-all border-2 active-pop overflow-hidden ${
                          state.eventInfo.status === s
                            ? "bg-red-900 text-white border-red-900 shadow-2xl scale-105"
                            : "bg-white text-gray-400 border-gray-100 hover:border-red-200 hover:text-red-900"
                        }`}
                      >
                        <span className="relative z-10 text-lg uppercase tracking-wider">
                          {s}
                        </span>
                        {state.eventInfo.status === s && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        )}
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-1 transition-all ${
                            state.eventInfo.status === s
                              ? "bg-yellow-400"
                              : "bg-transparent group-hover:bg-red-100"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex flex-col md:flex-row items-center gap-6 text-left shadow-inner">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm flex-shrink-0">
                    <AlertCircle size={28} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-amber-900 uppercase text-[10px] tracking-widest">
                      Global Synchronization Warning
                    </p>
                    <p className="text-sm text-amber-800/80 leading-relaxed font-medium">
                      Updating the event status is an irreversible public
                      action. All devotees with notifications enabled will
                      receive an instant push alert across the platform.
                    </p>
                  </div>
                </div>

                <div className="pt-12 border-t border-gray-50">
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">
                        Version Control
                      </p>
                      <p className="text-sm font-bold text-gray-400">
                        Stable Release v2.1.0
                      </p>
                    </div>
                    <div className="w-px h-10 bg-gray-100" />
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">
                        Security Hash
                      </p>
                      <p className="text-sm font-mono text-gray-400 uppercase">
                        AES-256 Valid
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
