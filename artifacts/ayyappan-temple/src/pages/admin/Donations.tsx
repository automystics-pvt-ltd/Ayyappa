import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useAdmin } from "@/hooks/useAdmin";

type Donation = {
  id: number; donorName: string; mobile: string; amount: string;
  transactionId: string; screenshotUrl?: string; anonymous: boolean;
  message?: string; status: string; rejectionReason?: string;
  createdAt: string; reviewedAt?: string;
};

const TABS = ["all", "pending", "approved", "rejected"] as const;

export default function Donations() {
  const { admin } = useAdmin();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>("all");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const data = await api.getAllDonations(tab === "all" ? undefined : tab);
      setDonations(data as Donation[]);
    } catch (e) { console.error(e); }
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

  const fmt = (amount: string) => `₹${Number(amount).toLocaleString("en-IN")}`;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">நன்கொடை மேலாண்மை</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? "bg-orange-500 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
              {t === "all" ? "அனைத்தும்" : t === "pending" ? "⏳ Pending" : t === "approved" ? "✅ Approved" : "❌ Rejected"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">ஏற்றுகிறது...</div>
        ) : !donations.length ? (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border">நன்கொடைகள் இல்லை</div>
        ) : (
          <div className="space-y-4">
            {donations.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex flex-wrap gap-4 justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">{d.anonymous ? "அடையாளம் தெரியாதவர்" : d.donorName}</span>
                      {d.anonymous && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">Anonymous</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        d.status === "approved" ? "bg-green-100 text-green-700" :
                        d.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"}`}>{d.status}</span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      <div>📱 {d.mobile}</div>
                      <div>🔖 Transaction ID: <span className="font-mono text-gray-700">{d.transactionId}</span></div>
                      {d.message && <div>💬 {d.message}</div>}
                      {d.rejectionReason && <div className="text-red-500">❌ Reason: {d.rejectionReason}</div>}
                      <div>📅 {new Date(d.createdAt).toLocaleDateString("ta-IN")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600 mb-2">{fmt(d.amount)}</div>
                    {d.screenshotUrl && (
                      <a href={d.screenshotUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 underline block mb-2">Screenshot பார்க்க</a>
                    )}
                    {canApprove && d.status === "pending" && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => approve(d.id)} disabled={actionLoading === d.id}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                          {actionLoading === d.id ? "..." : "✅ Approve"}
                        </button>
                        <button onClick={() => { setRejectId(d.id); setRejectReason(""); }}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {rejectId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="font-bold text-lg mb-3">நன்கொடை நிராகரிக்க காரணம்</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="காரணம் (விருப்பம்)"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={reject} disabled={!!actionLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-medium disabled:opacity-50">
                  {actionLoading ? "..." : "நிராகரி (Reject)"}
                </button>
                <button onClick={() => setRejectId(null)}
                  className="flex-1 border py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-50">
                  ரத்து செய்
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
