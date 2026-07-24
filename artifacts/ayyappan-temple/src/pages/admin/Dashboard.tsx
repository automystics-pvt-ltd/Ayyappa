import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

interface DashboardStats {
  totalRaised: number;
  donorCount: number;
  pendingCount: number;
  rejectedCount: number;
  goal: number;
  progressPercent: number;
  newsCount: number;
  eventsCount: number;
  recentDonations: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then((data) => setStats(data as DashboardStats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

        {loading ? (
          <div className="text-gray-400 text-center py-20">ஏற்றுகிறது...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "மொத்த நன்கொடை", value: fmt(stats?.totalRaised ?? 0), icon: "💰", color: "bg-green-50 border-green-200 text-green-700" },
                { label: "நன்கொடையாளர்கள்", value: stats?.donorCount ?? 0, icon: "🙏", color: "bg-blue-50 border-blue-200 text-blue-700" },
                { label: "Pending", value: stats?.pendingCount ?? 0, icon: "⏳", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
                { label: "Progress", value: `${stats?.progressPercent ?? 0}%`, icon: "📈", color: "bg-orange-50 border-orange-200 text-orange-700" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs mt-0.5 opacity-70">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl border p-5 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Crowdfunding முன்னேற்றம்</span>
                <span className="text-orange-600 font-bold">{stats?.progressPercent ?? 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-orange-400 to-yellow-400 h-4 rounded-full transition-all"
                  style={{ width: `${stats?.progressPercent ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{fmt(stats?.totalRaised ?? 0)} திரட்டப்பட்டது</span>
                <span>இலக்கு: {fmt(stats?.goal ?? 5000000)}</span>
              </div>
            </div>

            {/* Recent Donations */}
            <div className="bg-white rounded-xl border p-5">
              <h2 className="font-bold text-gray-800 mb-4">சமீபத்திய நன்கொடைகள்</h2>
              {!stats?.recentDonations?.length ? (
                <p className="text-gray-400 text-sm">நன்கொடைகள் இல்லை</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentDonations.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium text-sm text-gray-800">{d.donorName}</div>
                        <div className="text-xs text-gray-400">{d.transactionId}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-gray-800">₹{Number(d.amount).toLocaleString("en-IN")}</div>
                        <div className={`text-xs px-2 py-0.5 rounded-full ${
                          d.status === "approved" ? "bg-green-100 text-green-600" :
                          d.status === "rejected" ? "bg-red-100 text-red-600" :
                          "bg-yellow-100 text-yellow-600"
                        }`}>{d.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
