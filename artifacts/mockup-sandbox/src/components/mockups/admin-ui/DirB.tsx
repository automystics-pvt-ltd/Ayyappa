// Direction B — Warm Saffron / Ivory (On-brand Temple SaaS)
import {
  LayoutDashboard, IndianRupee, Users, Clock, TrendingUp, Bell,
  Search, ArrowUpRight, CheckCircle2, XCircle, AlertCircle,
  Settings, LogOut, FileText, CalendarDays, Images, ShieldCheck,
  Sparkles, MoreHorizontal, ChevronRight
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",       sub: "கண்ணோட்டம்",  active: true },
  { icon: IndianRupee,     label: "நன்கொடைகள்",     sub: "Donations" },
  { icon: FileText,        label: "உள்ளடக்கம்",     sub: "Content" },
  { icon: FileText,        label: "செய்திகள்",       sub: "News" },
  { icon: CalendarDays,    label: "நிகழ்வுகள்",      sub: "Events" },
  { icon: Images,          label: "படத் தொகுப்பு",   sub: "Gallery" },
  { icon: Settings,        label: "அமைப்புகள்",      sub: "Settings" },
  { icon: ShieldCheck,     label: "நிர்வாகிகள்",     sub: "Admins" },
];

const STATS = [
  { label: "மொத்த நன்கொடை",    value: "₹8,42,500", delta: "+12.4%", icon: IndianRupee,   color: "from-orange-500 to-amber-400" },
  { label: "நன்கொடையாளர்கள்",  value: "1,284",     delta: "+8.1%",  icon: Users,         color: "from-amber-500 to-yellow-400" },
  { label: "நிலுவையில்",         value: "38",        delta: "ஆய்வு",  icon: Clock,         color: "from-rose-500 to-orange-400" },
  { label: "இலக்கு நிலை",        value: "84.3%",     delta: "₹10L",   icon: TrendingUp,    color: "from-emerald-500 to-teal-400" },
];

const DONATIONS = [
  { name: "ரமேஷ் குமார்",    place: "Chennai",    amount: "₹25,000", status: "approved", date: "24 Jul" },
  { name: "சுரேஷ் வர்மா",    place: "Coimbatore", amount: "₹10,000", status: "pending",  date: "24 Jul" },
  { name: "அனிதா ரவி",       place: "Madurai",    amount: "₹5,001",  status: "approved", date: "23 Jul" },
  { name: "கார்த்திக் ராஜ்",  place: "Salem",      amount: "₹2,500",  status: "rejected", date: "23 Jul" },
  { name: "பிரியா நடராஜன்",   place: "Dindigul",   amount: "₹15,000", status: "pending",  date: "22 Jul" },
];

const MONTHS = ["A","S","O","N","D","J","F","M","A","M","J","J"];
const BAR    = [38, 55, 48, 72, 60, 85, 70, 78, 65, 88, 82, 100];

const RECENT_ACTIVITY = [
  { msg: "ரமேஷ் குமார் நன்கொடை அங்கீகரிக்கப்பட்டது", time: "2m ago",  dot: "bg-emerald-400" },
  { msg: "புதிய நன்கொடை ₹10,000 — சுரேஷ் வர்மா",     time: "15m ago", dot: "bg-amber-400" },
  { msg: "கார்த்திக் நன்கொடை நிராகரிக்கப்பட்டது",     time: "1h ago",  dot: "bg-rose-400" },
  { msg: "5 புதிய நன்கொடைகள் நேற்று வந்தன",           time: "1d ago",  dot: "bg-indigo-400" },
];

const StatusBadge = ({ s }: { s: string }) =>
  s === "approved" ? <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">✓ அங்கீகரிக்கப்பட்டது</span>
  : s === "rejected" ? <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">✕ நிராகரிக்கப்பட்டது</span>
  : <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">⏳ நிலுவையில்</span>;

export function DirB() {
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#fdf6ee", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="w-[230px] shrink-0 flex flex-col h-full border-r border-orange-100" style={{ background: "#fff9f0" }}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-orange-100">
          <div className="flex items-center gap-3 mb-0.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md" style={{ background: "linear-gradient(135deg, #ea580c, #d97706)" }}>🕉</div>
            <div>
              <p className="text-sm font-bold text-orange-900 leading-tight">ஐயப்பன் கோவில்</p>
              <p className="text-[10px] text-orange-500">Admin Portal v2.0</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest px-3 mb-3">கட்டுப்பாட்டு வாரியம்</p>
          {NAV.map(({ icon: Icon, label, sub, active }) => (
            <button key={label} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
              active
                ? "shadow-sm text-white"
                : "text-orange-800/70 hover:bg-orange-50 hover:text-orange-900"
            }`}
            style={active ? { background: "linear-gradient(135deg, #ea580c, #d97706)" } : {}}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-white/20" : "bg-orange-100/60 group-hover:bg-orange-100"}`}>
                <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-orange-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${active ? "text-white" : ""}`}>{label}</p>
                <p className={`text-[9px] truncate ${active ? "text-white/70" : "text-orange-400"}`}>{sub}</p>
              </div>
              {active && <ChevronRight className="w-3 h-3 text-white/60 shrink-0" />}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-orange-100">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-orange-50 cursor-pointer">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: "linear-gradient(135deg, #ea580c, #d97706)" }}>A</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-orange-900 truncate">Super Admin</p>
              <p className="text-[10px] text-orange-500">admin@temple.org</p>
            </div>
            <LogOut className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Header */}
        <header className="px-6 py-3.5 bg-white border-b border-orange-100 flex items-center gap-4 shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h1 className="text-base font-bold text-orange-900">கண்ணோட்ட Dashboard</h1>
            </div>
            <p className="text-[11px] text-orange-500 ml-6">வணக்கம்! இன்று July 24, 2026 — 38 நன்கொடைகள் காத்திருக்கின்றன</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-300" />
              <input placeholder="தேடுங்கள்..." className="pl-9 pr-3 py-1.5 text-xs bg-orange-50 border border-orange-200 rounded-xl w-44 focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder-orange-300 text-orange-800" />
            </div>
            <button className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-orange-50 text-orange-500 hover:bg-orange-100">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {STATS.map(({ label, value, delta, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100/60 overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-6 translate-x-6 bg-gradient-to-br ${color}`} />
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-orange-700/70 mb-1">{label}</p>
                <p className="text-2xl font-bold text-orange-900 tracking-tight">{value}</p>
                <p className="text-[10px] text-orange-400 mt-0.5">{delta}</p>
              </div>
            ))}
          </div>

          {/* Chart + Activity */}
          <div className="grid grid-cols-3 gap-4">
            {/* Bar chart */}
            <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-orange-100/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-orange-900">மாதாந்திர நன்கொடைகள்</p>
                  <p className="text-xs text-orange-400">கடந்த 12 மாதங்கள் · ₹ ஆயிரங்களில்</p>
                </div>
                <div className="flex gap-1">
                  {["6M","1Y","ALL"].map((t,i) => (
                    <button key={t} className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${i===1?"text-white shadow-sm":"text-orange-500 hover:bg-orange-50"}`}
                      style={i===1?{background:"linear-gradient(135deg,#ea580c,#d97706)"}:{}}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {BAR.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md transition-all"
                      style={{ height:`${v}%`, background: i === BAR.length-1 ? "linear-gradient(to top, #ea580c, #fbbf24)" : i > 8 ? "#fed7aa" : "#ffedd5" }} />
                    <span className="text-[8px] text-orange-300">{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100/60">
              <p className="text-sm font-bold text-orange-900 mb-3">சமீபத்திய செயல்பாடு</p>
              <div className="space-y-3">
                {RECENT_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${a.dot}`} />
                    <div>
                      <p className="text-[11px] text-orange-800 leading-snug">{a.msg}</p>
                      <p className="text-[9px] text-orange-400 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-xs font-semibold text-orange-600 flex items-center justify-center gap-1 hover:text-orange-700">
                அனைத்தும் காண்க <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Progress + Table */}
          <div className="grid grid-cols-3 gap-4">
            {/* Goal progress */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100/60">
              <p className="text-sm font-bold text-orange-900 mb-1">திருப்பணி இலக்கு</p>
              <p className="text-xs text-orange-400 mb-4">₹10,00,000 இலக்கு</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-700 font-medium">₹8,42,500</span>
                <span className="text-xs font-bold text-orange-600">84.3%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-orange-100 overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width:"84.3%", background:"linear-gradient(90deg,#ea580c,#fbbf24)" }} />
              </div>
              <p className="text-[10px] text-orange-400 text-right">மீதம்: ₹1,57,500</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[["இந்த மாதம்","₹58,200"],["இந்த வாரம்","₹12,400"]].map(([l,v])=>(
                  <div key={l} className="bg-orange-50 rounded-xl p-3">
                    <p className="text-[10px] text-orange-500">{l}</p>
                    <p className="text-sm font-bold text-orange-800">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-orange-100/60 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-orange-50 flex items-center justify-between">
                <p className="text-sm font-bold text-orange-900">சமீபத்திய நன்கொடைகள்</p>
                <button className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                  அனைத்தும் <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background:"#fff9f0" }} className="border-b border-orange-50">
                    {["நன்கொடையாளர்","இடம்","தொகை","நிலை","தேதி"].map(h=>(
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-orange-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {DONATIONS.map(d => (
                    <tr key={d.name} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                            style={{background:"linear-gradient(135deg,#ea580c,#d97706)"}}>
                            {d.name[0]}
                          </div>
                          <span className="font-semibold text-orange-900 text-[11px]">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-orange-500 text-[11px]">{d.place}</td>
                      <td className="px-4 py-3 font-bold text-orange-800 text-[11px]">{d.amount}</td>
                      <td className="px-4 py-3"><StatusBadge s={d.status} /></td>
                      <td className="px-4 py-3 text-orange-400 text-[11px]">{d.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
