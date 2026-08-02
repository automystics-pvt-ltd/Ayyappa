import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/hooks/useLanguage";
import { MapPin, Image, CheckCircle2, XCircle, AlertCircle, Phone, Hash, MessageSquare, CalendarDays, MoreHorizontal, FileText, Printer, BarChart2, Download, X, Pencil, Check, Plus, UserPlus } from "lucide-react";
import html2canvas from "html2canvas";

type Donation = {
  id: number; receiptToken?: string; donorName: string; mobile: string; place?: string; amount: string;
  transactionId: string; screenshotUrl?: string; anonymous: boolean;
  message?: string; status: string; rejectionReason?: string;
  createdAt: string; reviewedAt?: string;
};

const TABS = ["all", "pending", "approved", "rejected"] as const;
const TAB_META = {
  all:      { labelTa: "அனைத்தும்",            labelEn: "All",       color: "from-orange-500 to-amber-400" },
  pending:  { labelTa: "⏳ நிலுவையில்",         labelEn: "⏳ Pending", color: "from-amber-500 to-yellow-400" },
  approved: { labelTa: "✓ அங்கீகரிக்கப்பட்டவை", labelEn: "✓ Approved",color: "from-emerald-500 to-teal-400" },
  rejected: { labelTa: "✕ நிராகரிக்கப்பட்டவை",  labelEn: "✕ Rejected",color: "from-rose-500 to-orange-400" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useLanguage();
  const map: Record<string, { cls: string; icon: React.ReactNode; text: string }> = {
    approved: { cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 className="w-3 h-3"/>, text: t("அங்கீகரிக்கப்பட்டது","Approved") },
    rejected:  { cls: "bg-rose-100 text-rose-700 border border-rose-200",         icon: <XCircle className="w-3 h-3"/>,      text: t("நிராகரிக்கப்பட்டது","Rejected") },
    pending:   { cls: "bg-amber-100 text-amber-700 border border-amber-200",       icon: <AlertCircle className="w-3 h-3"/>,  text: t("நிலுவையில்","Pending") },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${s.cls}`}>
      {s.icon}{s.text}
    </span>
  );
};

/* ════════════ Consolidated Report Component ════════════ */
function DonationsReport({
  donations,
  onClose,
}: {
  donations: Donation[];
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const approved = donations.filter(d => d.status === "approved");
  const pending  = donations.filter(d => d.status === "pending");
  const rejected = donations.filter(d => d.status === "rejected");
  const totalApproved = approved.reduce((s, d) => s + Number(d.amount), 0);
  const fmt = (a: number) => `₹${a.toLocaleString("en-IN")}`;
  const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });

  const downloadImage = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff9f0",
        logging: false,
      });
      const a = document.createElement("a");
      a.download = `donations-report-${new Date().toISOString().slice(0,10)}.png`;
      a.href = canvas.toDataURL("image/png");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Controls above report */}
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={downloadImage}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}
            >
              <Download className="w-4 h-4" />
              {downloading ? t("இறக்குகிறது...","Downloading...") : t("படமாக இறக்கு","Download as Image")}
            </button>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" /> {t("மூடு","Close")}
          </button>
        </div>

        {/* ══ Printable / Capturable Report ══ */}
        <div
          ref={reportRef}
          style={{ background: "#fff9f0", fontFamily: "system-ui, sans-serif" }}
          className="rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div
            style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}
            className="px-8 py-6 text-white"
          >
            <div className="flex items-center gap-4 mb-1">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                <img src="/iyyappan-logo.png" alt="Temple" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold leading-tight">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</h1>
                <p className="text-orange-100 text-sm">Vadamadurai, Dindigul · Donations Report</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                Generated: {today}
              </span>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                Total records: {donations.length}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-orange-100 bg-white border-b border-orange-100">
            {[
              { label: "Total Donations", value: donations.length.toString(), sub: "All statuses",       color: "#ea580c" },
              { label: "Approved",        value: approved.length.toString(),  sub: "Confirmed",          color: "#10b981" },
              { label: "Pending",         value: pending.length.toString(),   sub: "Awaiting review",    color: "#d97706" },
              { label: "Amount Raised",   value: fmt(totalApproved),          sub: "Approved total",     color: "#ea580c" },
            ].map(s => (
              <div key={s.label} className="px-5 py-4 text-center">
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{s.label}</p>
                <p className="text-[10px] text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Section: Approved donations */}
          <div className="px-6 py-4">
            <h2 className="text-sm font-extrabold text-orange-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Approved Donations ({approved.length})
            </h2>

            {approved.length === 0 ? (
              <p className="text-xs text-orange-300 py-4 text-center">No approved donations</p>
            ) : (
              <div className="rounded-xl overflow-hidden border border-orange-100">
                {/* Table header */}
                <div className="grid grid-cols-[32px_1fr_auto_auto_auto] gap-2 px-4 py-2.5 text-[10px] font-bold text-orange-400 uppercase tracking-wider"
                  style={{ background: "#fff3e0" }}>
                  <span>#</span>
                  <span>Donor</span>
                  <span className="text-right">Amount</span>
                  <span>Date</span>
                  <span>Trans. ID</span>
                </div>
                {/* Rows */}
                {approved.map((d, idx) => (
                  <div
                    key={d.id}
                    className="grid grid-cols-[32px_1fr_auto_auto_auto] gap-2 px-4 py-2.5 items-center border-t border-orange-50 text-xs"
                    style={{ background: idx % 2 === 0 ? "#ffffff" : "#fffbf5" }}
                  >
                    <span className="text-orange-300 font-bold">{idx + 1}</span>
                    <div>
                      <p className="font-bold text-orange-900">
                        {d.anonymous ? "Anonymous" : d.donorName}
                      </p>
                      {d.place && <p className="text-orange-400 text-[10px]">{d.place}</p>}
                    </div>
                    <span className="font-extrabold text-right" style={{ color: "#ea580c" }}>
                      {`₹${Number(d.amount).toLocaleString("en-IN")}`}
                    </span>
                    <span className="text-orange-400 whitespace-nowrap">
                      {new Date(d.reviewedAt || d.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                    </span>
                    <span className="text-orange-300 font-mono text-[10px] truncate max-w-[100px]">{d.transactionId}</span>
                  </div>
                ))}
                {/* Footer total */}
                <div className="grid grid-cols-[32px_1fr_auto_auto_auto] gap-2 px-4 py-2.5 items-center border-t border-orange-200"
                  style={{ background: "#fff3e0" }}>
                  <span />
                  <span className="text-xs font-bold text-orange-700">Total Approved</span>
                  <span className="text-sm font-extrabold text-right" style={{ color: "#ea580c" }}>
                    {fmt(totalApproved)}
                  </span>
                  <span /><span />
                </div>
              </div>
            )}
          </div>

          {/* Section: Pending */}
          {pending.length > 0 && (
            <div className="px-6 pb-4">
              <h2 className="text-sm font-extrabold text-orange-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Pending Donations ({pending.length})
              </h2>
              <div className="rounded-xl overflow-hidden border border-orange-100">
                <div className="grid grid-cols-[32px_1fr_auto_auto] gap-2 px-4 py-2.5 text-[10px] font-bold text-orange-400 uppercase tracking-wider"
                  style={{ background: "#fff3e0" }}>
                  <span>#</span><span>Donor</span><span className="text-right">Amount</span><span>Submitted</span>
                </div>
                {pending.map((d, idx) => (
                  <div key={d.id}
                    className="grid grid-cols-[32px_1fr_auto_auto] gap-2 px-4 py-2.5 items-center border-t border-orange-50 text-xs"
                    style={{ background: idx % 2 === 0 ? "#ffffff" : "#fffbf5" }}>
                    <span className="text-orange-300 font-bold">{idx + 1}</span>
                    <div>
                      <p className="font-bold text-orange-900">{d.anonymous ? "Anonymous" : d.donorName}</p>
                      {d.place && <p className="text-orange-400 text-[10px]">{d.place}</p>}
                    </div>
                    <span className="font-extrabold text-right" style={{ color: "#d97706" }}>
                      {`₹${Number(d.amount).toLocaleString("en-IN")}`}
                    </span>
                    <span className="text-orange-400 whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-orange-100 flex items-center justify-between">
            <p className="text-[10px] text-orange-300">
              அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில் · Vadamadurai
            </p>
            <p className="text-[10px] text-orange-300 font-mono">
              Powered by Automystics Technologies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════ Main Donations Page ════════════ */
export default function Donations() {
  const { admin } = useAdmin();
  const { t } = useLanguage();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<typeof TABS[number]>("all");
  const [rejectId, setRejectId]   = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [justApproved, setJustApproved] = useState<{ id: number; name: string; amount: string; token: string; mobile: string; anonymous: boolean } | null>(null);
  const [siteBaseUrl, setSiteBaseUrl] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [editNameId, setEditNameId]     = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editNameBusy, setEditNameBusy]   = useState(false);

  // ── Add Donor (admin-create) ──
  const DONOR_BLANK = { donorName: "", mobile: "", place: "", amount: "", transactionId: "", message: "", anonymous: false, status: "approved", donationDate: "" };
  const [showAddDonor, setShowAddDonor]   = useState(false);
  const [addDonorForm, setAddDonorForm]   = useState(DONOR_BLANK);
  const [addDonorSaving, setAddDonorSaving] = useState(false);
  const [addDonorError, setAddDonorError]   = useState("");

  const handleAddDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDonorForm.donorName.trim() || !addDonorForm.mobile.trim() || !addDonorForm.amount) {
      setAddDonorError(t("பெயர், மொபைல், தொகை அவசியம்", "Name, mobile and amount are required"));
      return;
    }
    setAddDonorSaving(true); setAddDonorError("");
    try {
      await api.adminCreateDonation({
        donorName:    addDonorForm.donorName.trim(),
        mobile:       addDonorForm.mobile.trim(),
        place:        addDonorForm.place.trim() || undefined,
        amount:       Number(addDonorForm.amount),
        transactionId: addDonorForm.transactionId.trim() || undefined,
        message:      addDonorForm.message.trim() || undefined,
        anonymous:    addDonorForm.anonymous,
        status:       addDonorForm.status,
        donationDate: addDonorForm.donationDate || undefined,
      });
      setShowAddDonor(false);
      setAddDonorForm(DONOR_BLANK);
      await fetchDonations();
    } catch (err: any) {
      setAddDonorError(err.message || t("சேர்க்க முடியவில்லை", "Could not add donor"));
    } finally {
      setAddDonorSaving(false);
    }
  };

  const isSuperAdmin = admin?.role === "super_admin";

  const saveEditName = async () => {
    if (!editNameId || !editNameValue.trim()) return;
    setEditNameBusy(true);
    try {
      await api.updateDonorName(editNameId, editNameValue.trim());
      setDonations(prev => prev.map(d => d.id === editNameId ? { ...d, donorName: editNameValue.trim() } : d));
      setEditNameId(null);
    } catch (e: any) {
      alert(e.message || t("பெயர் திருத்த முடியவில்லை", "Failed to update name"));
    } finally {
      setEditNameBusy(false);
    }
  };

  useEffect(() => {
    api.getSiteConfig().then(cfg => {
      if (cfg.siteBaseUrl) setSiteBaseUrl(cfg.siteBaseUrl);
    }).catch(() => {});
  }, []);

  const openScreenshot = async (objectPath: string) => {
    setPreviewLoading(true);
    try {
      const apiUrl = api.screenshotUrl(objectPath);
      const res = await fetch(apiUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load screenshot");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch {
      alert(t("Screenshot ஏற்றமுடியவில்லை","Could not load screenshot"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const fetchDonations = async () => {
    setLoading(true);
    try { setDonations(await api.getAllDonations(tab === "all" ? undefined : tab) as Donation[]); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDonations(); }, [tab]);

  const canApprove = admin?.role === "super_admin" || admin?.role === "editor";

  const approve = async (id: number, donorName: string, amount: string, mobile: string, anonymous: boolean) => {
    setActionLoading(id);
    try {
      await api.approveDonation(id);
      await fetchDonations();
      const updated = await api.getAllDonations(undefined) as Donation[];
      const approved = updated.find(d => d.id === id);
      if (approved?.receiptToken) {
        setJustApproved({ id, name: donorName, amount, token: approved.receiptToken, mobile, anonymous });
      }
    }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const reject = async () => {
    if (!rejectId) return;
    setActionLoading(rejectId);
    try { await api.rejectDonation(rejectId, rejectReason); setRejectId(null); setRejectReason(""); await fetchDonations(); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const fmt = (a: string) => `₹${Number(a).toLocaleString("en-IN")}`;

  const toE164 = (raw: string): string | null => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    if (digits.length === 13 && digits.startsWith("091")) return `+91${digits.slice(3)}`;
    return null;
  };

  const shareWhatsApp = (donorName: string, amount: string, token: string, anonymous: boolean, mobile: string) => {
    const name = anonymous ? "அடையாளம் தெரியாதவர்" : donorName;
    const amountFmt = fmt(amount);
    const origin = siteBaseUrl || window.location.origin;
    const receiptUrl = `${origin}${import.meta.env.BASE_URL}receipt/${token}`;
    const text = encodeURIComponent(
      `ஸ்வாமியே சரணம் ஐயப்பா 🙏\n\nநன்கொடையாளர்: ${name}\nதொகை: ${amountFmt}\n\nரசீது இணைப்பு:\n${receiptUrl}`
    );
    const e164 = toE164(mobile);
    const waPhone = e164 ? e164.replace(/^\+/, "") : null;
    const url = waPhone ? `https://wa.me/${waPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="bg-white border-b border-orange-100 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-orange-900">
              {t("நன்கொடை மேலாண்மை", "Donation Management")}
            </h1>
            <p className="text-xs text-orange-500">
              {t("Donation Management", "நன்கொடை மேலாண்மை")} · {donations.length} {t("பதிவுகள்", "records")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canApprove && (
              <button
                onClick={() => { setAddDonorForm(DONOR_BLANK); setAddDonorError(""); setShowAddDonor(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}
              >
                <UserPlus className="w-4 h-4" />
                {t("நன்கொடையாளர் சேர்", "Add Donor")}
              </button>
            )}
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
            >
              <BarChart2 className="w-4 h-4" />
              {t("அறிக்கை", "Report")}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-5">

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(tabKey => {
            const active = tab === tabKey;
            const meta = TAB_META[tabKey];
            return (
              <button key={tabKey} onClick={() => setTab(tabKey)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "text-white shadow-md shadow-orange-200"
                    : "bg-white border border-orange-100 text-orange-700 hover:bg-orange-50"
                }`}
                style={active ? { background: "linear-gradient(135deg,#ea580c,#d97706)" } : {}}>
                {t(meta.labelTa, meta.labelEn)}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-3 border-orange-300 border-t-orange-600 animate-spin" />
          </div>
        ) : !donations.length ? (
          <div className="bg-white rounded-2xl border border-orange-100 py-16 text-center">
            <div className="text-4xl mb-3">🙏</div>
            <p className="text-orange-400 font-medium">{t("இந்த வகையில் நன்கொடைகள் இல்லை", "No donations in this category")}</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-0 md:bg-white md:rounded-2xl md:border md:border-orange-100 md:shadow-sm md:overflow-hidden">

            {/* Desktop table header — hidden on mobile */}
            <div style={{ background: "#fff9f0" }} className="hidden md:grid border-b border-orange-50 grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3">
              {[
                t("நன்கொடையாளர் விவரம்", "Donor Info"),
                t("தொகை", "Amount"),
                t("நிலை", "Status"),
                t("தேதி", "Date"),
                t("செயல்கள்", "Actions"),
              ].map(h => (
                <div key={h} className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">{h}</div>
              ))}
            </div>

            <div className="md:divide-y md:divide-orange-50 space-y-3 md:space-y-0">
              {donations.map(d => {
                const actions = (
                  <div className="flex flex-wrap gap-2">
                    {canApprove && d.status === "pending" && (
                      <>
                        <button onClick={() => approve(d.id, d.donorName, d.amount, d.mobile, d.anonymous)} disabled={actionLoading === d.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                          {actionLoading === d.id ? "..." : `✓ ${t("அங்கீகரி", "Approve")}`}
                        </button>
                        <button onClick={() => { setRejectId(d.id); setRejectReason(""); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors">
                          {`✕ ${t("நிராகரி", "Reject")}`}
                        </button>
                      </>
                    )}
                    {d.status === "approved" && d.receiptToken && (
                      <div className="flex gap-2 flex-wrap">
                        <a href={`${import.meta.env.BASE_URL}receipt/${d.receiptToken}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors">
                          <FileText className="w-3.5 h-3.5" />{t("ரசீது பார்க்க", "View Receipt")}
                        </a>
                        <button
                          onClick={() => window.open(`${import.meta.env.BASE_URL}receipt/${d.receiptToken}`, "_blank")}
                          className="inline-flex items-center gap-1.5 text-xs text-orange-700 hover:text-orange-900 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 transition-colors">
                          <Printer className="w-3.5 h-3.5" />{t("அச்சிடு","Print")}
                        </button>
                        <button
                          onClick={() => shareWhatsApp(d.donorName, d.amount, d.receiptToken!, d.anonymous, d.mobile)}
                          className="inline-flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(135deg,#15803d,#22c55e)" }}>
                          💬 WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                );

                const donorInfo = (
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
                        {(d.anonymous ? "?" : d.donorName)[0]}
                      </div>
                      <div className="min-w-0">
                        {/* Inline name editor — super_admin + non-anonymous only */}
                        {isSuperAdmin && !d.anonymous && editNameId === d.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveEditName(); if (e.key === "Escape") setEditNameId(null); }}
                              className="text-sm font-bold text-orange-900 border border-orange-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-orange-300 w-36 bg-orange-50/60"
                            />
                            <button onClick={saveEditName} disabled={editNameBusy}
                              className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 disabled:opacity-50 transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditNameId(null)}
                              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-orange-900">
                              {d.anonymous ? t("அடையாளம் தெரியாதவர்", "Anonymous") : d.donorName}
                            </p>
                            {isSuperAdmin && !d.anonymous && (
                              <button
                                onClick={() => { setEditNameId(d.id); setEditNameValue(d.donorName); }}
                                title={t("பெயர் திருத்து", "Edit name")}
                                className="p-1 rounded-lg text-orange-300 hover:text-orange-600 hover:bg-orange-100 transition-colors shrink-0"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                        {d.anonymous && (
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t("அடையாளம் தெரியாதவர்","Anonymous")}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-orange-500">
                        <Phone className="w-3 h-3" />{d.mobile}
                      </div>
                      {d.place && (
                        <div className="flex items-center gap-1.5 text-xs text-orange-500">
                          <MapPin className="w-3 h-3" />{d.place}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-orange-400 font-mono">
                        <Hash className="w-3 h-3" />{d.transactionId}
                      </div>
                      {d.message && (
                        <div className="flex items-start gap-1.5 text-xs text-orange-500">
                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{d.message}</span>
                        </div>
                      )}
                      {d.rejectionReason && (
                        <div className="text-xs text-rose-500 bg-rose-50 rounded-lg px-2 py-1 border border-rose-100">
                          {t("காரணம்", "Reason")}: {d.rejectionReason}
                        </div>
                      )}
                      {d.screenshotUrl && (
                        <button onClick={() => openScreenshot(d.screenshotUrl!)}
                          disabled={previewLoading}
                          className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition-colors mt-1 disabled:opacity-50">
                          <Image className="w-3 h-3" />{previewLoading ? t("ஏற்றுகிறது...", "Loading...") : t("ரசீது புகைப்படம்","Screenshot")}
                        </button>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={d.id}>
                    {/* ── Mobile card ── */}
                    <div className="md:hidden bg-white rounded-2xl border border-orange-100 shadow-sm p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        {donorInfo}
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold" style={{ color: "#ea580c" }}>{fmt(d.amount)}</p>
                          <StatusBadge status={d.status} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-orange-400 border-t border-orange-50 pt-2">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(d.createdAt).toLocaleDateString("ta-IN")}
                      </div>
                      {actions}
                    </div>

                    {/* ── Desktop row ── */}
                    <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-start hover:bg-orange-50/40 transition-colors">
                      {donorInfo}
                      <div className="pt-1 text-right">
                        <p className="text-lg font-bold" style={{ color: "#ea580c" }}>{fmt(d.amount)}</p>
                      </div>
                      <div className="pt-1.5"><StatusBadge status={d.status} /></div>
                      <div className="pt-1.5 text-xs text-orange-400 flex items-center gap-1 whitespace-nowrap">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(d.createdAt).toLocaleDateString("ta-IN")}
                      </div>
                      <div className="pt-1 flex flex-col gap-1.5">
                        {actions}
                        {d.status !== "pending" && !d.receiptToken && (
                          <span className="text-orange-200"><MoreHorizontal className="w-4 h-4" /></span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Donor modal ── */}
      {showAddDonor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">{t("நன்கொடையாளர் சேர்க்க", "Add Donor")}</h2>
                  <p className="text-orange-100 text-xs">{t("நேரடியாக நன்கொடை பதிவு செய்க", "Record a donation directly")}</p>
                </div>
              </div>
              <button onClick={() => setShowAddDonor(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDonor} className="p-6 space-y-4">
              {/* Row 1: Name + Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-orange-900 mb-1.5">
                    {t("நன்கொடையாளர் பெயர்", "Donor Name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900"
                    placeholder={t("முழு பெயர்", "Full name")}
                    value={addDonorForm.donorName}
                    onChange={e => setAddDonorForm(f => ({ ...f, donorName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-900 mb-1.5">
                    {t("மொபைல்", "Mobile")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900"
                    placeholder="9876543210"
                    value={addDonorForm.mobile}
                    onChange={e => setAddDonorForm(f => ({ ...f, mobile: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 2: Amount + Place */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-orange-900 mb-1.5">
                    {t("தொகை (₹)", "Amount (₹)")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900"
                    placeholder="1000"
                    value={addDonorForm.amount}
                    onChange={e => setAddDonorForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-900 mb-1.5">{t("ஊர் / இடம்", "Place")}</label>
                  <input
                    className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900"
                    placeholder={t("வடமதுரை", "City / Town")}
                    value={addDonorForm.place}
                    onChange={e => setAddDonorForm(f => ({ ...f, place: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 3: Transaction ID + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-orange-900 mb-1.5">
                    {t("Transaction ID / Reference", "Transaction ID / Reference")}
                    <span className="text-orange-400 font-normal ml-1">{t("(விருப்பம்)", "(optional)")}</span>
                  </label>
                  <input
                    className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900 font-mono"
                    placeholder={t("UPI/Cash — காலி விட்டால் தானாக உருவாகும்", "Auto-generated if blank")}
                    value={addDonorForm.transactionId}
                    onChange={e => setAddDonorForm(f => ({ ...f, transactionId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-900 mb-1.5">{t("நன்கொடை தேதி", "Donation Date")}</label>
                  <input
                    type="date"
                    className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-orange-900"
                    value={addDonorForm.donationDate}
                    onChange={e => setAddDonorForm(f => ({ ...f, donationDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-orange-900 mb-1.5">
                  {t("செய்தி", "Message")}
                  <span className="text-orange-400 font-normal ml-1">{t("(விருப்பம்)", "(optional)")}</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900 resize-none"
                  placeholder={t("நன்கொடையாளர் கூறிய செய்தி…", "Donor's message...")}
                  value={addDonorForm.message}
                  onChange={e => setAddDonorForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              {/* Status + Anonymous */}
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <label className="block text-xs font-semibold text-orange-900 mb-1.5">{t("நிலை", "Status")}</label>
                  <select
                    className="border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-orange-900"
                    value={addDonorForm.status}
                    onChange={e => setAddDonorForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="approved">{t("✓ அங்கீகரிக்கப்பட்டது", "✓ Approved")}</option>
                    <option value="pending">{t("⏳ நிலுவையில்", "⏳ Pending")}</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none mt-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-orange-500"
                    checked={addDonorForm.anonymous}
                    onChange={e => setAddDonorForm(f => ({ ...f, anonymous: e.target.checked }))}
                  />
                  <span className="text-sm text-orange-900">{t("அடையாளம் மறை (Anonymous)", "Anonymous donor")}</span>
                </label>
              </div>

              {addDonorError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{addDonorError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={addDonorSaving}
                  className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60 transition-all hover:opacity-90 active:scale-95 shadow-md shadow-orange-200"
                  style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}
                >
                  {addDonorSaving ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("சேமிக்கிறது…", "Saving...")}</span>
                  ) : (
                    <><Plus className="w-4 h-4" />{t("நன்கொடை பதிவு செய்க", "Add Donation")}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDonor(false)}
                  className="px-5 py-3 border border-orange-200 rounded-xl text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors"
                >
                  {t("ரத்து", "Cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Report modal ── */}
      {showReport && (
        <DonationsReport
          donations={donations}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* ── Just-approved print prompt ── */}
      {justApproved && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-orange-100">
            <div className="bg-gradient-to-br from-orange-600 to-amber-500 px-6 py-6 text-white text-center relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-lg font-bold">{t("நன்கொடை அங்கீகரிக்கப்பட்டது!", "Donation Approved!")}</h3>
                <p className="text-orange-100 text-xs mt-1">{t("நன்கொடை வெற்றிகரமாக அங்கீகரிக்கப்பட்டது","Donation Approved Successfully")}</p>
              </div>
            </div>
            <div className="px-6 py-5 text-center space-y-3">
              <p className="text-sm text-orange-900 font-semibold">{justApproved.name}</p>
              <p className="text-3xl font-extrabold text-orange-600">₹{Number(justApproved.amount).toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-500">{t("ரசீது தயார் — இப்போது print செய்யலாம்", "Receipt ready — print now")}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <p className="text-amber-800 text-xs font-medium">ஸ்வாமியே சரணம் ஐயப்பா 🙏</p>
                <p className="text-amber-600 text-[10px] mt-0.5">உங்களுக்கும் உங்கள் குடும்பத்திற்கும் ஐயப்பன் அருள் கிடைக்கும்</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => { window.open(`${import.meta.env.BASE_URL}receipt/${justApproved.token}`, "_blank"); }}
                  className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}
                >
                  <Printer className="w-4 h-4" />
                  {t("ரசீது Print", "Print Receipt")}
                </button>
                <button
                  onClick={() => setJustApproved(null)}
                  className="flex-1 border border-orange-200 py-3 rounded-xl font-medium text-orange-700 hover:bg-orange-50 text-sm transition-colors"
                >
                  {t("பிறகு பார்க்கலாம்", "Later")}
                </button>
              </div>
              <button
                onClick={() => { shareWhatsApp(justApproved.name, justApproved.amount, justApproved.token, justApproved.anonymous, justApproved.mobile); }}
                className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#15803d,#22c55e)" }}
              >
                💬 {t("WhatsApp-ல் ரசீது அனுப்பு", "Send Receipt via WhatsApp")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closePreview}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={closePreview}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-medium flex items-center gap-1">
              ✕ {t("மூடு", "Close")}
            </button>
            <img src={previewUrl} alt="Payment Screenshot" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-orange-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-orange-900">{t("நிராகரிக்க காரணம்", "Rejection Reason")}</h3>
                <p className="text-xs text-orange-400">{t("நிராகரிக்க காரணம் (விருப்பமான)","Rejection reason (optional)")}</p>
              </div>
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-orange-200 rounded-xl p-3 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 bg-orange-50/50"
              placeholder={t("காரணம் உள்ளிடவும்...", "Enter reason...")}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={reject} disabled={!!actionLoading}
                className="flex-1 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                {actionLoading ? "..." : `✕ ${t("நிராகரி", "Reject")}`}
              </button>
              <button onClick={() => setRejectId(null)}
                className="flex-1 border border-orange-200 py-2.5 rounded-xl font-medium text-orange-700 hover:bg-orange-50 text-sm transition-colors">
                {t("ரத்து செய்", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
