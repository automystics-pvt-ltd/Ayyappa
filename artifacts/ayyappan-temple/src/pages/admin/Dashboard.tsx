import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import {
  IndianRupee, Users, Clock, TrendingUp, ArrowUpRight,
  CheckCircle2, XCircle, AlertCircle, Newspaper, CalendarDays, Eye
} from "lucide-react";

interface DashboardStats {
  totalRaised: number; donorCount: number; pendingCount: number;
  rejectedCount: number; goal: number; progressPercent: number;
  newsCount: number; eventsCount: number; recentDonations: any[];
  totalVisitors: number; todayVisitors: number;
}

const BAR_HEIGHTS = [38, 52, 45, 68, 57, 80, 71, 76, 68, 88, 83, 100];
const BAR_MONTHS  = ["A","S","O","N","D","J","F","M","A","M","J","J"];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    approved: { cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", label: "அங்கீகரிக்கப்பட்டது", icon: <CheckCircle2 className="w-3 h-3" /> },
    rejected:  { cls: "bg-rose-100 text-rose-700 border border-rose-200",         label: "நிராகரிக்கப்பட்டது", icon: <XCircle className="w-3 h-3" /> },
    pending:   { cls: "bg-amber-100 text-amber-700 border border-amber-200",       label: "நிலுவையில்",         icon: <AlertCircle className="w-3 h-3" /> },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(d => setStats(d as DashboardStats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const pct = stats?.progressPercent ?? 0;

  return (
    <AdminLayout>
      {/* ── Page header ── */}
      <div className="bg-white border-b border-orange-100 px-6 py-4">
        <h1 className="text-lg font-bold text-orange-900">கண்ணோட்ட Dashboard</h1>
        <p className="text-xs text-orange-500">வணக்கம்! ஆலய நன்கொடை நிர்வாக தளம்</p>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-3 border-orange-300 border-t-orange-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "மொத்த நன்கொடை",    value: fmt(stats?.totalRaised ?? 0),   sub: "இதுவரை",                    icon: IndianRupee,  grad: "from-orange-500 to-amber-400" },
                { label: "நன்கொடையாளர்கள்",  value: String(stats?.donorCount ?? 0),  sub: "அங்கீகரிக்கப்பட்டவர்கள்",   icon: Users,        grad: "from-amber-500 to-yellow-400" },
                { label: "நிலுவையில்",         value: String(stats?.pendingCount ?? 0), sub: "ஆய்வு தேவை",               icon: Clock,        grad: "from-rose-500 to-orange-400" },
                { label: "இலக்கு நிலை",        value: `${pct}%`,                       sub: `${fmt(stats?.goal ?? 5000000)} இலக்கு`, icon: TrendingUp,   grad: "from-emerald-500 to-teal-400" },
              ].map(({ label, value, sub, icon: Icon, grad }) => (
                <div key={label} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-6 translate-x-6 bg-gradient-to-br ${grad}`} />
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3 shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-orange-700/70 mb-1">{label}</p>
                  <p className="text-xl font-bold text-orange-900 tracking-tight leading-tight">{value}</p>
                  <p className="text-[10px] text-orange-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── Secondary stats ── */}
            {(stats?.newsCount !== undefined || stats?.eventsCount !== undefined) && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "செய்திகள்", value: stats?.newsCount ?? 0, icon: Newspaper, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
                  { label: "நிகழ்வுகள்", value: stats?.eventsCount ?? 0, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                  { label: "மொத்த பார்வையாளர்கள்", value: stats?.totalVisitors ?? 0, icon: Eye, color: "text-teal-600", bg: "bg-teal-50 border-teal-100" },
                  { label: "இன்றைய பார்வையாளர்கள்", value: stats?.todayVisitors ?? 0, icon: Eye, color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} border rounded-2xl p-4 flex items-center gap-4`}>
                    <div className={`w-10 h-10 rounded-xl ${bg} border flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{value}</p>
                      <p className={`text-xs font-medium ${color}`}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Chart + Progress ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bar chart */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-orange-900">மாதாந்திர நன்கொடைகள்</p>
                    <p className="text-xs text-orange-400">கடந்த 12 மாதங்கள்</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }} />
                    <span className="text-[10px] text-orange-400">நன்கொடை</span>
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-28">
                  {BAR_HEIGHTS.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-md" style={{
                        height: `${v}%`,
                        background: i === BAR_HEIGHTS.length - 1
                          ? "linear-gradient(to top,#ea580c,#fbbf24)"
                          : i > 8 ? "#fed7aa" : "#ffedd5"
                      }} />
                      <span className="text-[8px] text-orange-300">{BAR_MONTHS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal progress */}
              <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm flex flex-col">
                <p className="text-sm font-bold text-orange-900 mb-1">திருப்பணி இலக்கு</p>
                <p className="text-xs text-orange-400 mb-4">{fmt(stats?.goal ?? 5000000)} இலக்கு</p>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-orange-700 font-medium">{fmt(stats?.totalRaised ?? 0)}</span>
                    <span className="text-xs font-bold" style={{ color: "#ea580c" }}>{pct}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-orange-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%`, background: "linear-gradient(90deg,#ea580c,#fbbf24)" }} />
                  </div>
                  <p className="text-[10px] text-orange-400 text-right mt-1.5">
                    மீதம்: {fmt(Math.max(0, (stats?.goal ?? 5000000) - (stats?.totalRaised ?? 0)))}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Recent donations ── */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-orange-50 flex items-center justify-between">
                <p className="text-sm font-bold text-orange-900">சமீபத்திய நன்கொடைகள்</p>
                {stats?.pendingCount ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    {stats.pendingCount} நிலுவையில்
                  </span>
                ) : null}
              </div>

              {!stats?.recentDonations?.length ? (
                <div className="py-12 text-center text-orange-300 text-sm">நன்கொடைகள் இல்லை</div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[420px]">
                  <thead>
                    <tr style={{ background: "#fff9f0" }} className="border-b border-orange-50">
                      {["நன்கொடையாளர்","தொகை","நிலை","தேதி"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-orange-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {stats.recentDonations.map((d: any) => (
                      <tr key={d.id} className="hover:bg-orange-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                              style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
                              {(d.donorName || "A")[0]}
                            </div>
                            <span className="font-semibold text-orange-900">{d.anonymous ? "அடையாளம் தெரியாதவர்" : d.donorName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-orange-800">₹{Number(d.amount).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-orange-400">{new Date(d.createdAt).toLocaleDateString("ta-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
