import { useAdmin } from "@/hooks/useAdmin";
import { useLocation } from "wouter";

const navItems = [
  { path: "/admin/dashboard", label: "📊 Dashboard",          roles: ["super_admin", "editor", "volunteer"] },
  { path: "/admin/donations", label: "💰 நன்கொடைகள்",         roles: ["super_admin", "editor", "volunteer"] },
  { path: "/admin/content",   label: "🖊️ உள்ளடக்கம்",          roles: ["super_admin", "editor"] },
  { path: "/admin/news",      label: "📢 செய்திகள்",           roles: ["super_admin", "editor"] },
  { path: "/admin/events",    label: "🎉 நிகழ்வுகள்",          roles: ["super_admin", "editor"] },
  { path: "/admin/gallery",   label: "🖼️ படத் தொகுப்பு",       roles: ["super_admin", "editor"] },
  { path: "/admin/settings",  label: "⚙️ அமைப்புகள்",          roles: ["super_admin", "editor"] },
  { path: "/admin/admins",    label: "👥 நிர்வாகிகள்",         roles: ["super_admin"] },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdmin();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/admin");
  };

  const visibleNav = navItems.filter((item) => admin && item.roles.includes(admin.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-5 border-b">
          <div className="text-2xl mb-1">🛕</div>
          <h2 className="font-bold text-gray-800 text-sm leading-tight">ஐயப்பன் திருக்கோவில்</h2>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location === item.path
                  ? "bg-orange-50 text-orange-600 border border-orange-200"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="text-xs text-gray-500 mb-1">{admin?.displayName || admin?.role}</div>
          <div className="text-xs text-gray-400 mb-3 capitalize">{admin?.role?.replace("_", " ")}</div>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-red-500 hover:text-red-700 font-medium"
          >
            வெளியேறு (Logout)
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
