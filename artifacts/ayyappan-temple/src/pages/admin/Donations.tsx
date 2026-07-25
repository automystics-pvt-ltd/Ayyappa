import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useAdmin } from "@/hooks/useAdmin";
import { MapPin, Image, CheckCircle2, XCircle, AlertCircle, Phone, Hash, MessageSquare, CalendarDays, MoreHorizontal, FileText } from "lucide-react";

type Donation = {
  id: number; receiptToken?: string; donorName: string; mobile: string; place?: string; amount: string;
  transactionId: string; screenshotUrl?: string; anonymous: boolean;
  message?: string; status: string; rejectionReason?: string;
  createdAt: string; reviewedAt?: string;
};

const TABS = ["all", "pending", "approved", "rejected"] as const;
const TAB_META = {
  all:      { label: "அனைத்தும்",            color: "from-orange-500 to-amber-400" },
  pending:  { label: "⏳ நிலுவையில்",         color: "from-amber-500 to-yellow-400" },
  approved: { label: "✓ அங்கீகரிக்கப்பட்டவை", color: "from-emerald-500 to-teal-400" },
  rejected: { label: "✕ நிராகரிக்கப்பட்டவை",  color: "from-rose-500 to-orange-400" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; icon: React.ReactNode; text: string }> = {
    approved: { cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 className="w-3 h-3"/>, text: "அங்கீகரிக்கப்பட்டது" },
    rejected:  { cls: "bg-rose-100 text-rose-700 border border-rose-200",         icon: <XCircle className="w-3 h-3"/>,      text: "நிராகரிக்கப்பட்டது" },
    pending:   { cls: "bg-amber-100 text-amber-700 border border-amber-200",       icon: <AlertCircle className="w-3 h-3"/>,  text: "நிலுவையில்" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${s.cls}`}>
      {s.icon}{s.text}
    </span>
  );
};

export default function Donations() {
  const { admin } = useAdmin();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<typeof TABS[number]>("all");
  const [rejectId, setRejectId]   = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchDonations = async () => {
    setLoading(true);
    try { setDonations(await api.getAllDonations(tab === "all" ? undefined : tab) as Donation[]); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDonations(); }, [tab]);

  const canApprove = admin?.role === "super_admin" || admin?.role === "editor";

  const approve = async (id: number) => {
    setActionLoading(id);
    try { await api.approveDonation(id); await fetchDonations(); }
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

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="bg-white border-b border-orange-100 px-6 py-4">
        <h1 className="text-lg font-bold text-orange-900">நன்கொடை மேலாண்மை</h1>
        <p className="text-xs text-orange-500">Donation Management · {donations.length} பதிவுகள்</p>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-5">

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => {
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "text-white shadow-md shadow-orange-200"
                    : "bg-white border border-orange-100 text-orange-700 hover:bg-orange-50"
                }`}
                style={active ? { background: "linear-gradient(135deg,#ea580c,#d97706)" } : {}}>
                {TAB_META[t].label}
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
            <p className="text-orange-400 font-medium">இந்த வகையில் நன்கொடைகள் இல்லை</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-0 md:bg-white md:rounded-2xl md:border md:border-orange-100 md:shadow-sm md:overflow-hidden">

            {/* Desktop table header — hidden on mobile */}
            <div style={{ background: "#fff9f0" }} className="hidden md:grid border-b border-orange-50 grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3">
              {["நன்கொடையாளர் விவரம்","தொகை","நிலை","தேதி","செயல்கள்"].map(h => (
                <div key={h} className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">{h}</div>
              ))}
            </div>

            <div className="md:divide-y md:divide-orange-50 space-y-3 md:space-y-0">
              {donations.map(d => {
                const actions = (
                  <div className="flex flex-wrap gap-2">
                    {canApprove && d.status === "pending" && (
                      <>
                        <button onClick={() => approve(d.id)} disabled={actionLoading === d.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                          {actionLoading === d.id ? "..." : "✓ அங்கீகரி"}
                        </button>
                        <button onClick={() => { setRejectId(d.id); setRejectReason(""); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors">
                          ✕ நிராகரி
                        </button>
                      </>
                    )}
                    {d.status === "approved" && d.receiptToken && (
                      <a href={`${import.meta.env.BASE_URL}receipt/${d.receiptToken}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors">
                        <FileText className="w-3.5 h-3.5" />ரசீது பார்க்க
                      </a>
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
                      <div>
                        <p className="text-sm font-bold text-orange-900">
                          {d.anonymous ? "அடையாளம் தெரியாதவர்" : d.donorName}
                        </p>
                        {d.anonymous && (
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Anonymous</span>
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
                          காரணம்: {d.rejectionReason}
                        </div>
                      )}
                      {d.screenshotUrl && (
                        <button onClick={() => setPreviewUrl(api.screenshotUrl(d.screenshotUrl!))}
                          className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition-colors mt-1">
                          <Image className="w-3 h-3" />Screenshot பார்க்க
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

      {/* Screenshot modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-medium flex items-center gap-1">
              ✕ மூடு
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
                <h3 className="font-bold text-orange-900">நிராகரிக்க காரணம்</h3>
                <p className="text-xs text-orange-400">Rejection reason (விருப்பமான)</p>
              </div>
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-orange-200 rounded-xl p-3 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 bg-orange-50/50"
              placeholder="காரணம் உள்ளிடவும்..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={reject} disabled={!!actionLoading}
                className="flex-1 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                {actionLoading ? "..." : "✕ நிராகரி"}
              </button>
              <button onClick={() => setRejectId(null)}
                className="flex-1 border border-orange-200 py-2.5 rounded-xl font-medium text-orange-700 hover:bg-orange-50 text-sm transition-colors">
                ரத்து செய்
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
