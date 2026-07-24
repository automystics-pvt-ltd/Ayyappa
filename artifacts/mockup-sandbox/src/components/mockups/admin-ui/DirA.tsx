// Direction A — Deep Indigo / Slate  (Stripe Dashboard aesthetic)
import {
  LayoutDashboard, IndianRupee, Users, Clock, TrendingUp, Bell,
  Search, ChevronDown, ArrowUpRight, CheckCircle2, XCircle,
  AlertCircle, Settings, LogOut, FileText, CalendarDays,
  Images, ShieldCheck, BookOpen, MoreHorizontal, Filter
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: IndianRupee,     label: "நன்கொடைகள்" },
  { icon: FileText,        label: "உள்ளடக்கம்" },
  { icon: FileText,        label: "செய்திகள்" },
  { icon: CalendarDays,    label: "நிகழ்வுகள்" },
  { icon: Images,          label: "படத் தொகுப்பு" },
  { icon: Settings,        label: "அமைப்புகள்" },
  { icon: ShieldCheck,     label: "நிர்வாகிகள்" },
];

const STATS = [
  { label: "மொத்த நன்கொடை",  value: "₹8,42,500", delta: "+12.4%", up: true, sub: "இந்த மாதம்" },
  { label: "நன்கொடையாளர்கள்", value: "1,284",     delta: "+8.1%",  up: true, sub: "அங்கீகரிக்கப்பட்டவர்கள்" },
  { label: "நிலுவையில்",       value: "38",        delta: "-3",     up: false, sub: "ஆய்வு தேவை" },
  { label: "இலக்கு நிலை",      value: "84.3%",     delta: "+2.1%",  up: true, sub: "₹10,00,000 இலக்கு" },
];

const DONATIONS = [
  { name: "ரமேஷ் குமார்",   place: "Chennai",    amount: "₹25,000", status: "approved", date: "24 Jul" },
  { name: "சுரேஷ் வர்மா",   place: "Coimbatore", amount: "₹10,000", status: "pending",  date: "24 Jul" },
  { name: "அனிதா ரவி",      place: "Madurai",    amount: "₹5,001",  status: "approved", date: "23 Jul" },
  { name: "கார்த்திக் ராஜ்", place: "Salem",      amount: "₹2,500",  status: "rejected", date: "23 Jul" },
  { name: "பிரியா நடராஜன்",  place: "Dindigul",   amount: "₹15,000", status: "pending",  date: "22 Jul" },
];

const BAR_DATA = [42, 67, 55, 80, 63, 91, 78, 84, 70, 95, 88, 100];
const MONTHS   = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];

const StatusPill = ({ s }: { s: string }) =>
  s === "approved"
    ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 className="w-3 h-3"/>Approved</span>
    : s === "rejected"
    ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200"><XCircle className="w-3 h-3"/>Rejected</span>
    : <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200"><AlertCircle className="w-3 h-3"/>Pending</span>;

export function DirA() {
  return (
    <div className="flex h-screen w-full bg-[#f4f5f9] font-sans overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="w-[220px] shrink-0 flex flex-col bg-[#1a1d2e] h-full">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">ஐ</div>
            <div>
              <p className="text-white text-xs font-bold leading-tight">ஐயப்பன் கோவில்</p>
              <p className="text-slate-400 text-[10px]">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Main Menu</p>
          {NAV.map(({ icon: Icon, label, active }) => (
            <button key={label} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
              active
                ? "bg-indigo-600/90 text-white shadow-md shadow-indigo-900/40"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium truncate">{label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">Super Admin</p>
              <p className="text-slate-500 text-[10px]">admin@temple.org</p>
            </div>
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 shrink-0">
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-500">நன்கொடை நிர்வாக தளம் — July 2026</p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 placeholder-slate-400" />
            </div>
            {/* Bell */}
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">A</div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-slate-500 mb-2">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{s.value}</p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${s.up ? "text-emerald-600" : "text-rose-500"}`}>
                    <TrendingUp className={`w-3 h-3 ${!s.up && "rotate-180"}`} />{s.delta}
                  </span>
                  <span className="text-[10px] text-slate-400">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Quick Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Bar Chart */}
            <div className="col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">நன்கொடை வரலாறு</p>
                  <p className="text-xs text-slate-500">கடந்த 12 மாதங்கள்</p>
                </div>
                <button className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-50">
                  <Filter className="w-3 h-3" />Filter
                </button>
              </div>
              {/* Chart */}
              <div className="flex items-end gap-1.5 h-28">
                {BAR_DATA.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-sm transition-all ${i === BAR_DATA.length - 1 ? "bg-indigo-600" : "bg-indigo-100 hover:bg-indigo-200"}`}
                      style={{ height: `${v}%` }}
                    />
                    <span className="text-[8px] text-slate-400">{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
              <p className="text-sm font-semibold text-slate-900 mb-1">திருப்பணி இலக்கு</p>
              <p className="text-xs text-slate-500 mb-4">₹10,00,000 இலக்கு</p>
              <div className="flex-1 flex flex-col justify-center">
                <div className="relative w-32 h-32 mx-auto">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#4f46e5" strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 52 * 0.843} ${2 * Math.PI * 52 * 0.157}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">84%</span>
                    <span className="text-[10px] text-slate-400">நிறைவு</span>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-slate-500">₹8,42,500 <span className="text-slate-300">/</span> ₹10,00,000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Donations Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">சமீபத்திய நன்கொடைகள்</p>
                <p className="text-xs text-slate-500">38 நிலுவை ஆய்வுகள் உள்ளன</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">அனைத்தும் காண்க <ArrowUpRight className="w-3 h-3" /></button>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  {["நன்கொடையாளர்","இடம்","தொகை","நிலை","தேதி","செயல்கள்"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DONATIONS.map((d) => (
                  <tr key={d.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold shrink-0">{d.name[0]}</div>
                        <span className="font-medium text-slate-800">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{d.place}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{d.amount}</td>
                    <td className="px-4 py-3"><StatusPill s={d.status} /></td>
                    <td className="px-4 py-3 text-slate-400">{d.date}</td>
                    <td className="px-4 py-3">
                      <button className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"><MoreHorizontal className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}
