// Direction C — Dark Carbon / Teal  (Power Platform dark-mode admin)
import {
  LayoutDashboard, IndianRupee, Users, Clock, TrendingUp, Bell,
  Search, ArrowUpRight, CheckCircle2, XCircle, AlertCircle,
  Settings, LogOut, FileText, CalendarDays, Images, ShieldCheck,
  MoreHorizontal, Zap, Activity
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",      active: true },
  { icon: IndianRupee,     label: "நன்கொடைகள்" },
  { icon: FileText,        label: "உள்ளடக்கம்" },
  { icon: FileText,        label: "செய்திகள்" },
  { icon: CalendarDays,    label: "நிகழ்வுகள்" },
  { icon: Images,          label: "படத் தொகுப்பு" },
  { icon: Settings,        label: "அமைப்புகள்" },
  { icon: ShieldCheck,     label: "நிர்வாகிகள்" },
];

const STATS = [
  { label: "மொத்த நன்கொடை",    value: "₹8,42,500", delta: "+12.4%", glow: "#14b8a6", icon: IndianRupee },
  { label: "நன்கொடையாளர்கள்",  value: "1,284",     delta: "+8.1%",  glow: "#818cf8", icon: Users },
  { label: "நிலுவையில்",         value: "38",        delta: "Review", glow: "#f59e0b", icon: Clock },
  { label: "இலக்கு நிலை",        value: "84.3%",     delta: "of ₹10L", glow: "#10b981", icon: TrendingUp },
];

const DONATIONS = [
  { name: "ரமேஷ் குமார்",   place: "Chennai",    amount: "₹25,000", status: "approved", date: "24 Jul" },
  { name: "சுரேஷ் வர்மா",   place: "Coimbatore", amount: "₹10,000", status: "pending",  date: "24 Jul" },
  { name: "அனிதா ரவி",      place: "Madurai",    amount: "₹5,001",  status: "approved", date: "23 Jul" },
  { name: "கார்த்திக் ராஜ்", place: "Salem",      amount: "₹2,500",  status: "rejected", date: "23 Jul" },
  { name: "பிரியா நடராஜன்",  place: "Dindigul",   amount: "₹15,000", status: "pending",  date: "22 Jul" },
];

const LINE = [32,45,41,60,55,78,68,75,70,88,82,100];
const MONTHS = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];

// Build SVG polyline path
const W = 340, H = 80;
const pts = LINE.map((v, i) => `${(i / (LINE.length - 1)) * W},${H - (v / 100) * H}`);
const path = `M ${pts.join(" L ")}`;
const areaPath = `M ${pts.join(" L ")} L ${W},${H} L 0,${H} Z`;

const StatusTag = ({ s }: { s: string }) =>
  s === "approved"
    ? <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background:"#052e16", color:"#4ade80", border:"1px solid #166534" }}><CheckCircle2 className="inline w-2.5 h-2.5 mr-0.5"/>Approved</span>
    : s === "rejected"
    ? <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background:"#2d0a0a", color:"#f87171", border:"1px solid #7f1d1d" }}><XCircle className="inline w-2.5 h-2.5 mr-0.5"/>Rejected</span>
    : <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background:"#2d1b00", color:"#fbbf24", border:"1px solid #78350f" }}><AlertCircle className="inline w-2.5 h-2.5 mr-0.5"/>Pending</span>;

export function DirC() {
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#0d1117", fontFamily: "'Inter', system-ui, sans-serif", color: "#e5e7eb" }}>

      {/* ── Sidebar ── */}
      <aside className="w-[200px] shrink-0 flex flex-col h-full border-r" style={{ background:"#161b22", borderColor:"#21262d" }}>
        {/* Logo */}
        <div className="px-4 py-4" style={{ borderBottom:"1px solid #21262d" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", color:"white" }}>🕉</div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">ஐயப்பன் கோவில்</p>
              <p className="text-[9px]" style={{ color:"#14b8a6" }}>Admin Console</p>
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div className="mx-3 mt-3 mb-1 px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background:"#0d2b27", border:"1px solid #134e48" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[10px] font-medium" style={{ color:"#5eead4" }}>System Online</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ icon: Icon, label, active }) => (
            <button key={label} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all"
              style={active
                ? { background:"linear-gradient(90deg,rgba(20,184,166,0.15),transparent)", borderLeft:"2px solid #14b8a6", color:"#5eead4" }
                : { color:"#8b949e" }}
              onMouseEnter={e => !active && ((e.currentTarget as HTMLElement).style.background = "#21262d")}
              onMouseLeave={e => !active && ((e.currentTarget as HTMLElement).style.background = "transparent")}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-medium truncate">{label}</span>
              {active && <Zap className="ml-auto w-3 h-3 opacity-60 shrink-0" />}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-2 py-3" style={{ borderTop:"1px solid #21262d" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)" }}>A</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white truncate">Super Admin</p>
              <p className="text-[9px]" style={{ color:"#8b949e" }}>admin@temple</p>
            </div>
            <LogOut className="w-3 h-3 shrink-0" style={{ color:"#8b949e" }} />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Header */}
        <header className="px-6 py-3 flex items-center gap-4 shrink-0" style={{ background:"#161b22", borderBottom:"1px solid #21262d" }}>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color:"#14b8a6" }} />
              <h1 className="text-sm font-bold text-white">கட்டுப்பாட்டு மேடை</h1>
            </div>
            <p className="text-[10px] ml-6" style={{ color:"#8b949e" }}>Dashboard · 38 actions pending</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:"#8b949e" }} />
              <input placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg w-40 focus:outline-none" style={{ background:"#0d1117", border:"1px solid #30363d", color:"#c9d1d9" }} />
            </div>
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg" style={{ background:"#21262d", border:"1px solid #30363d" }}>
              <Bell className="w-3.5 h-3.5" style={{ color:"#8b949e" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" style={{ border:"1px solid #0d1117" }} />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            {STATS.map(({ label, value, delta, glow, icon: Icon }) => (
              <div key={label} className="rounded-xl p-4 relative overflow-hidden" style={{ background:"#161b22", border:"1px solid #21262d" }}>
                <div className="absolute inset-0 opacity-[0.04]" style={{ background:`radial-gradient(circle at 80% 20%, ${glow}, transparent 70%)` }} />
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-medium" style={{ color:"#8b949e" }}>{label}</p>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background:`${glow}22`, border:`1px solid ${glow}44` }}>
                    <Icon className="w-3 h-3" style={{ color: glow }} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white tracking-tight mb-1">{value}</p>
                <p className="text-[10px] font-medium" style={{ color: glow }}>{delta}</p>
              </div>
            ))}
          </div>

          {/* Chart + Donut */}
          <div className="grid grid-cols-3 gap-3">
            {/* Line chart */}
            <div className="col-span-2 rounded-xl p-5" style={{ background:"#161b22", border:"1px solid #21262d" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-white">நன்கொடை வரலாற்று வளைவு</p>
                  <p className="text-[10px]" style={{ color:"#8b949e" }}>கடந்த 12 மாதங்கள்</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background:"#14b8a6" }} />
                  <span className="text-[10px]" style={{ color:"#8b949e" }}>நன்கொடைகள்</span>
                </div>
              </div>
              <svg width="100%" viewBox={`0 0 ${W} ${H+10}`} preserveAspectRatio="none" style={{ height: 100 }}>
                <defs>
                  <linearGradient id="teal-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#teal-fill)" />
                <path d={path} fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {LINE.map((v, i) => (
                  <circle key={i} cx={(i / (LINE.length - 1)) * W} cy={H - (v / 100) * H} r={i === LINE.length - 1 ? 4 : 2.5}
                    fill={i === LINE.length - 1 ? "#14b8a6" : "#0d1117"} stroke="#14b8a6" strokeWidth="1.5" />
                ))}
              </svg>
              <div className="flex justify-between mt-1">
                {MONTHS.map(m => <span key={m} className="text-[8px]" style={{ color:"#8b949e" }}>{m}</span>)}
              </div>
            </div>

            {/* Donut */}
            <div className="rounded-xl p-5 flex flex-col" style={{ background:"#161b22", border:"1px solid #21262d" }}>
              <p className="text-sm font-bold text-white mb-1">நிலை பகுப்பு</p>
              <p className="text-[10px] mb-4" style={{ color:"#8b949e" }}>நன்கொடை நிலைகள்</p>
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* bg ring */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#21262d" strokeWidth="14" />
                    {/* approved 68% */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#14b8a6" strokeWidth="14"
                      strokeDasharray={`${2*Math.PI*38*0.68} ${2*Math.PI*38*0.32}`}
                      strokeLinecap="butt" transform="rotate(-90 50 50)" />
                    {/* pending 22% */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="14"
                      strokeDasharray={`${2*Math.PI*38*0.22} ${2*Math.PI*38*0.78}`}
                      strokeLinecap="butt" strokeDashoffset={`${-2*Math.PI*38*0.68}`}
                      transform="rotate(-90 50 50)" />
                    {/* rejected 10% */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f87171" strokeWidth="14"
                      strokeDasharray={`${2*Math.PI*38*0.10} ${2*Math.PI*38*0.90}`}
                      strokeLinecap="butt" strokeDashoffset={`${-2*Math.PI*38*0.90}`}
                      transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white">1,284</span>
                    <span className="text-[8px]" style={{ color:"#8b949e" }}>மொத்தம்</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {[["#14b8a6","அங்கீகரிக்கப்பட்டவை","68%"],["#f59e0b","நிலுவையில்","22%"],["#f87171","நிராகரிக்கப்பட்டவை","10%"]].map(([c,l,v])=>(
                  <div key={l} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background:c }} />
                      <span className="text-[9px]" style={{ color:"#8b949e" }}>{l}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ background:"#161b22", border:"1px solid #21262d" }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom:"1px solid #21262d" }}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">சமீபத்திய நன்கொடைகள்</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background:"rgba(20,184,166,0.1)", color:"#14b8a6", border:"1px solid rgba(20,184,166,0.3)" }}>38 நிலுவை</span>
              </div>
              <button className="text-xs font-medium flex items-center gap-1" style={{ color:"#14b8a6" }}>அனைத்தும் காண்க <ArrowUpRight className="w-3 h-3" /></button>
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ background:"#0d1117", borderBottom:"1px solid #21262d" }}>
                  {["நன்கொடையாளர்","இடம்","தொகை","நிலை","தேதி",""].map(h=>(
                    <th key={h} className="px-4 py-2.5 text-left" style={{ color:"#8b949e", fontSize:"9px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DONATIONS.map((d,i) => (
                  <tr key={d.name} style={{ borderBottom: i < DONATIONS.length-1 ? "1px solid #21262d" : "none" }}
                    className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background:"rgba(20,184,166,0.15)", color:"#14b8a6", border:"1px solid rgba(20,184,166,0.25)" }}>
                          {d.name[0]}
                        </div>
                        <span className="font-semibold text-white">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color:"#8b949e" }}>{d.place}</td>
                    <td className="px-4 py-3 font-bold text-white">{d.amount}</td>
                    <td className="px-4 py-3"><StatusTag s={d.status} /></td>
                    <td className="px-4 py-3" style={{ color:"#8b949e" }}>{d.date}</td>
                    <td className="px-4 py-3">
                      <button style={{ color:"#8b949e" }} className="hover:text-white p-1 rounded hover:bg-white/5">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
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
