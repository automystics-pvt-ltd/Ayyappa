import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useAdmin } from "@/hooks/useAdmin";
import { ShieldCheck, UserPlus, CheckCircle2, XCircle, Eye, EyeOff, Lock } from "lucide-react";

const emptyForm = { username: "", password: "", role: "editor", displayName: "" };

const ROLES = [
  {
    value: "super_admin",
    label: "Super Admin",
    desc: "அனைத்து அதிகாரங்களும் — approve, content, settings, admin mgmt",
    color: "from-orange-500 to-amber-400",
    bg: "bg-orange-50 border-orange-200",
  },
  {
    value: "editor",
    label: "Editor",
    desc: "செய்திகள், நிகழ்வுகள், உள்ளடக்கம், நன்கொடை approve",
    color: "from-violet-500 to-indigo-400",
    bg: "bg-violet-50 border-violet-200",
  },
  {
    value: "volunteer",
    label: "Volunteer",
    desc: "நன்கொடை பார்க்கலாம் — approve செய்ய முடியாது",
    color: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50 border-emerald-200",
  },
];

const inputCls = "w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900";

export default function AdminManagement() {
  const { admin }  = useAdmin();
  const [form, setForm]     = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (admin?.role !== "super_admin") {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Lock className="w-12 h-12 text-orange-200" />
          <p className="text-orange-400 font-medium">அணுகல் இல்லை — Super Admin மட்டும்</p>
        </div>
      </AdminLayout>
    );
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setMessage({ type: "error", text: "பயனர் பெயர் மற்றும் கடவுச்சொல் தேவை" });
      return;
    }
    setSaving(true);
    try {
      await api.createAdmin(form);
      setMessage({ type: "success", text: "நிர்வாகி வெற்றிகரமாக உருவாக்கப்பட்டது!" });
      setForm(emptyForm);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="bg-white border-b border-orange-100 px-6 py-4">
        <h1 className="text-lg font-bold text-orange-900">நிர்வாகிகள் மேலாண்மை</h1>
        <p className="text-xs text-orange-500">Admin Management · புதிய நிர்வாகி சேர்க்க</p>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-5">

        {/* Role info cards */}
        <div className="grid grid-cols-3 gap-3">
          {ROLES.map(r => (
            <div key={r.value} className={`rounded-2xl border p-3 ${r.bg}`}>
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center mb-2`}>
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-bold text-orange-900 mb-0.5">{r.label}</p>
              <p className="text-[9px] text-orange-600/70 leading-snug">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Create form */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-orange-50"
            style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
            <UserPlus className="w-5 h-5 text-white" />
            <div>
              <p className="text-sm font-bold text-white">புதிய நிர்வாகி</p>
              <p className="text-[10px] text-white/60">New Admin Account</p>
            </div>
          </div>

          <form onSubmit={create} className="px-5 py-5 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">பயனர் பெயர் *</label>
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="username"
                className={inputCls}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">கடவுச்சொல் *</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={`${inputCls} pr-10`}
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Display name */}
            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">பெயர்</label>
              <input
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder="திரு. ராமசாமி"
                className={inputCls}
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">பொறுப்பு (Role)</label>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <label key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      form.role === r.value ? r.bg : "bg-gray-50 border-gray-200 hover:bg-orange-50"
                    }`}>
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={() => setForm({ ...form, role: r.value })}
                      className="accent-orange-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-orange-900">{r.label}</p>
                      <p className="text-[10px] text-orange-500">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {message.type === "success"
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <XCircle className="w-4 h-4 shrink-0" />}
                {message.text}
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-md shadow-orange-200 disabled:opacity-50 transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
              {saving ? "உருவாக்குகிறது..." : "நிர்வாகி உருவாக்கு"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
