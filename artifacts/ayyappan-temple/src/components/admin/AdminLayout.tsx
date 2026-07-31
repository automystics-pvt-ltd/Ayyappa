import { useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import {
  LayoutDashboard, IndianRupee, FileEdit, Newspaper,
  CalendarDays, Images, Settings, ShieldCheck,
  LogOut, ChevronRight, Zap, Menu, X, Gift, Languages
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/admin/dashboard",     labelTa: "கண்ணோட்டம்",          labelEn: "Dashboard",    icon: LayoutDashboard, roles: ["super_admin","editor","volunteer"] },
  { path: "/admin/donations",     labelTa: "நன்கொடைகள்",          labelEn: "Donations",    icon: IndianRupee,     roles: ["super_admin","editor","volunteer"] },
  { path: "/admin/contributions", labelTa: "பொருள் நன்கொடைகள்",   labelEn: "In-kind",      icon: Gift,            roles: ["super_admin","editor"] },
  { path: "/admin/content",       labelTa: "உள்ளடக்கம்",          labelEn: "Content",      icon: FileEdit,        roles: ["super_admin","editor"] },
  { path: "/admin/news",          labelTa: "செய்திகள்",            labelEn: "News",         icon: Newspaper,       roles: ["super_admin","editor"] },
  { path: "/admin/events",        labelTa: "நிகழ்வுகள்",           labelEn: "Events",       icon: CalendarDays,    roles: ["super_admin","editor"] },
  { path: "/admin/gallery",       labelTa: "படத் தொகுப்பு",        labelEn: "Gallery",      icon: Images,          roles: ["super_admin","editor"] },
  { path: "/admin/settings",      labelTa: "அமைப்புகள்",           labelEn: "Settings",     icon: Settings,        roles: ["super_admin","editor"] },
  { path: "/admin/admins",        labelTa: "நிர்வாகிகள்",          labelEn: "Admins",       icon: ShieldCheck,     roles: ["super_admin"] },
];

const ROLE_DISPLAY: Record<string, string> = {
  super_admin: "Super Admin",
  editor:      "Editor",
  volunteer:   "Volunteer",
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdmin();
  const { lang, toggleLang, t } = useLanguage();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate("/admin"); };
  const visible = NAV_ITEMS.filter(i => admin && i.roles.includes(admin.role));
  const initials = (admin?.displayName || admin?.role || "A").slice(0, 1).toUpperCase();

  const handleNav = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/15">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
            <img src="/iyyappan-logo.png" alt="ஐயப்பன்" className="w-10 h-10 object-contain drop-shadow" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold leading-tight truncate">
              {t('ஐயப்பன் கோவில்', 'Ayyappan Temple')}
            </p>
            <p className="text-white/60 text-[10px]">{t('நிர்வாக மேடை', 'Admin Portal')}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
          <span className="text-[10px] text-white/80 font-medium">{t('கணினி இயங்குகிறது', 'System Online')}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-3 mb-3">
          {t('கட்டுப்பாட்டு மேடை', 'Control Panel')}
        </p>
        {visible.map(({ path, labelTa, labelEn, icon: Icon }) => {
          const active = location === path;
          const primary   = lang === 'ta' ? labelTa : labelEn;
          const secondary = lang === 'ta' ? labelEn  : labelTa;
          return (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                active ? "bg-white/20 shadow-inner" : "hover:bg-white/10"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                active ? "bg-white/25" : "bg-white/10 group-hover:bg-white/20"
              }`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-xs font-semibold truncate leading-tight ${active ? "text-white" : "text-white/80"}`}>
                  {primary}
                </p>
                <p className="text-[9px] text-white/45 truncate leading-tight">{secondary}</p>
              </div>
              {active && <ChevronRight className="w-3.5 h-3.5 text-white/50 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* User card */}
      <div className="px-3 py-4 border-t border-white/15">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white/25 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate leading-tight">
              {admin?.displayName || "Admin"}
            </p>
            <p className="text-white/50 text-[10px] truncate">
              {ROLE_DISPLAY[admin?.role || ""] || admin?.role}
            </p>
          </div>
          <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        </div>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="w-full flex items-center justify-center gap-1.5 py-2 mb-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
        >
          <Languages className="w-3.5 h-3.5" />
          {lang === 'ta' ? 'Switch to English' : 'தமிழில் மாற்று'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t('வெளியேறு', 'Logout')}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#fdf6ee" }}>

      {/* ══ Mobile top bar ══ */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 shadow-md"
        style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
            <img src="/iyyappan-logo.png" alt="ஐயப்பன்" className="w-7 h-7 object-contain" />
          </div>
          <p className="text-white text-sm font-bold">{t('ஐயப்பன் கோவில்', 'Ayyappan Temple')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="text-white/80 hover:text-white text-[11px] font-bold px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            {lang === 'ta' ? 'EN' : 'தமிழ்'}
          </button>
          <button onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white active:bg-white/30 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ══ Mobile sidebar overlay ══ */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] flex flex-col h-full shadow-2xl"
            style={{ background: "linear-gradient(160deg,#ea580c 0%,#d97706 100%)" }}>
            {/* Close button */}
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white z-10">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ══ Desktop sidebar ══ */}
      <aside className="hidden md:flex w-[230px] shrink-0 flex-col h-screen sticky top-0"
        style={{ background: "linear-gradient(160deg,#ea580c 0%,#d97706 100%)" }}>
        <SidebarContent />
      </aside>

      {/* ══ Main content ══ */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
