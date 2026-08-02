import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api, AdminUser } from "@/lib/api";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ShieldCheck, UserPlus, CheckCircle2, XCircle,
  Eye, EyeOff, Lock, Trash2, Pencil, X, Check,
  RefreshCw, Crown, Edit3, UserCheck, KeyRound,
} from "lucide-react";

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLES = [
  {
    value: "super_admin",
    label: "Super Admin",
    labelTa: "முதன்மை நிர்வாகி",
    desc: "அனைத்து அதிகாரங்களும் — approve, content, settings, admin mgmt",
    descEn: "Full access — approve, content, settings, admin management",
    color: "from-orange-500 to-amber-400",
    bg: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700 border-orange-300",
    Icon: Crown,
  },
  {
    value: "editor",
    label: "Editor",
    labelTa: "தொகுப்பாளர்",
    desc: "செய்திகள், நிகழ்வுகள், உள்ளடக்கம், நன்கொடை approve",
    descEn: "News, events, content, donation approval",
    color: "from-violet-500 to-indigo-400",
    bg: "bg-violet-50 border-violet-200",
    badge: "bg-violet-100 text-violet-700 border-violet-300",
    Icon: Edit3,
  },
  {
    value: "volunteer",
    label: "Volunteer",
    labelTa: "தன்னார்வலர்",
    desc: "நன்கொடை பார்க்கலாம் — approve செய்ய முடியாது",
    descEn: "View donations only — cannot approve",
    color: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Icon: UserCheck,
  },
];

const roleInfo = (value: string) => ROLES.find((r) => r.value === value) ?? ROLES[1];

const inputCls =
  "w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900";

const emptyForm = { username: "", password: "", role: "editor", displayName: "" };

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) { setError(t("கடவுச்சொல் குறைந்தது 8 எழுத்துகள் வேண்டும்","Password must be at least 8 characters")); return; }
    if (newPassword !== confirmPassword) { setError(t("கடவுச்சொற்கள் பொருந்தவில்லை","Passwords do not match")); return; }
    setSaving(true);
    try {
      await api.resetAdminPassword(user.id, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? t("கடவுச்சொல் மாற்றம் தோல்வி","Password reset failed"));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100"
          style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-white" />
            <div>
              <p className="text-sm font-bold text-white">{t("கடவுச்சொல் மீட்டமை","Reset Password")}</p>
              <p className="text-[10px] text-white/70">Reset Password · @{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {success ? (
          <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-700">{t("கடவுச்சொல் மாற்றப்பட்டது!","Password changed!")}</p>
            <p className="text-xs text-orange-500">@{user.username} {t("இன் session நீக்கப்பட்டது. அவர் மீண்டும் உள்நுழைய வேண்டும்.","session cleared — they must log in again.")}</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
              {t("மூடு","Close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">{t("புதிய கடவுச்சொல்","New Password")} *</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" className={`${inputCls} pr-10`} autoFocus required />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">{t("உறுதிப்படுத்து","Confirm")} *</label>
              <input type={showPw ? "text" : "password"} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" className={inputCls} required />
            </div>
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs border bg-rose-50 text-rose-700 border-rose-200">
                <XCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-orange-200 text-orange-600 hover:bg-orange-50">
                {t("ரத்து","Cancel")}
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : t("மீட்டமை","Reset")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Row: inline role edit ────────────────────────────────────────────────────
function AdminRow({ user, currentAdminId, onUpdated, onDeleted }: {
  user: AdminUser; currentAdminId: number; onUpdated: (u: AdminUser) => void; onDeleted: (id: number) => void;
}) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [newRole, setNewRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const isSelf = user.id === currentAdminId;
  const ri = roleInfo(user.role);

  const saveRole = async () => {
    if (newRole === user.role) { setEditing(false); return; }
    setSaving(true);
    try {
      const updated = await api.updateAdmin(user.id, { role: newRole }) as AdminUser;
      onUpdated({ ...user, ...updated }); setEditing(false);
    } catch {} finally { setSaving(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try { await api.deleteAdmin(user.id); onDeleted(user.id); }
    catch { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <>
      {showResetModal && <ResetPasswordModal user={user} onClose={() => setShowResetModal(false)} />}
      <tr className="border-b border-orange-50 last:border-0 hover:bg-orange-50/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${ri.color} flex items-center justify-center flex-shrink-0`}>
              <ri.Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-orange-900 truncate">
                {user.displayName || user.username}
                {isSelf && (
                  <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-500 border border-orange-200 rounded-full px-1.5 py-0.5 font-normal align-middle">
                    {t("நீங்கள்","You")}
                  </span>
                )}
              </p>
              <p className="text-xs text-orange-400 truncate">@{user.username}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          {editing ? (
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
              className="text-xs border border-orange-300 rounded-lg px-2 py-1.5 bg-white text-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-300">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{t(r.labelTa, r.label)}</option>)}
            </select>
          ) : (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${ri.badge}`}>
              <ri.Icon className="w-3 h-3" />{t(ri.labelTa, ri.label)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-orange-400 hidden sm:table-cell">{formatDate(user.lastLogin)}</td>
        <td className="px-4 py-3 text-right">
          {isSelf ? (
            <span className="text-xs text-orange-300 italic">—</span>
          ) : editing ? (
            <div className="flex items-center justify-end gap-1.5">
              <button onClick={saveRole} disabled={saving}
                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 disabled:opacity-50">
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { setEditing(false); setNewRole(user.role); }}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : confirmDelete ? (
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs text-rose-500 mr-1">{t("நீக்கவா?","Delete?")}</span>
              <button onClick={doDelete} disabled={deleting}
                className="p-1.5 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 disabled:opacity-50">
                {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1.5">
              <button onClick={() => setShowResetModal(true)}
                className="p-1.5 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100" title={t("கடவுச்சொல் மீட்டமை","Reset password")}>
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg bg-violet-50 text-violet-500 hover:bg-violet-100" title={t("பொறுப்பு மாற்று","Edit role")}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100" title={t("நீக்கு","Delete")}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </td>
      </tr>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminManagement() {
  const { admin } = useAdmin();
  const { t } = useLanguage();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (admin?.role !== "super_admin") return;
    api.listAdmins().then((list) => { setAdmins(list); setLoading(false); });
  }, [admin]);

  if (admin?.role !== "super_admin") {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Lock className="w-12 h-12 text-orange-200" />
          <p className="text-orange-400 font-medium">{t("அணுகல் இல்லை — Super Admin மட்டும்","Access denied — Super Admin only")}</p>
        </div>
      </AdminLayout>
    );
  }

  const handleUpdated = (updated: AdminUser) =>
    setAdmins((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
  const handleDeleted = (id: number) => setAdmins((prev) => prev.filter((a) => a.id !== id));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setMessage({ type: "error", text: t("பயனர் பெயர் மற்றும் கடவுச்சொல் தேவை","Username and password required") });
      return;
    }
    setSaving(true); setMessage(null);
    try {
      const created = await api.createAdmin(form) as AdminUser;
      setAdmins((prev) => [...prev, created]);
      setMessage({ type: "success", text: `'${form.username}' ${t("வெற்றிகரமாக உருவாக்கப்பட்டது!","created successfully!")}` });
      setForm(emptyForm);
    } catch (e: any) { setMessage({ type: "error", text: e.message }); }
    finally { setSaving(false); }
  };

  const byRole = ROLES.map((r) => ({ ...r, count: admins.filter((a) => a.role === r.value).length }));

  return (
    <AdminLayout>
      <div className="bg-white border-b border-orange-100 px-6 py-4">
        <h1 className="text-lg font-bold text-orange-900">{t("நிர்வாகிகள் மேலாண்மை","Admin Management")}</h1>
        <p className="text-xs text-orange-500">{t("நிர்வாகிகள் நிர்வாகம்","Admin Management")} · {t("பட்டியல் மற்றும் புதிய நிர்வாகி சேர்க்க","List & add admins")}</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">

        {/* Role summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {byRole.map((r) => (
            <div key={r.value} className={`rounded-2xl border p-3 ${r.bg}`}>
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center mb-2`}>
                <r.Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold text-orange-900">{t(r.labelTa, r.label)}</p>
                  <p className="text-[9px] text-orange-600/70 leading-snug mt-0.5 hidden sm:block">{t(r.desc, r.descEn)}</p>
                </div>
                <span className="text-2xl font-black text-orange-900/20 leading-none">{r.count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* User list */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-orange-50 bg-orange-50/60">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-bold text-orange-800">
              {t("நிர்வாகிகள் பட்டியல்","Admin List")}
              <span className="ml-2 text-xs font-normal text-orange-400">({admins.length} {t("பேர்","admins")})</span>
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-orange-300">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">{t("ஏற்றுகிறது...","Loading...")}</span>
            </div>
          ) : admins.length === 0 ? (
            <p className="text-center py-10 text-sm text-orange-300">{t("நிர்வாகிகள் இல்லை","No admins")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-orange-400 border-b border-orange-50">
                    <th className="px-4 py-2.5 font-semibold">{t("பயனர்","User")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("பொறுப்பு","Role")}</th>
                    <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">{t("கடைசி உள்நுழைவு","Last Login")}</th>
                    <th className="px-4 py-2.5 font-semibold text-right">{t("செயல்கள்","Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((u) => (
                    <AdminRow key={u.id} user={u} currentAdminId={admin.adminId} onUpdated={handleUpdated} onDeleted={handleDeleted} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create form */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-orange-50"
            style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
            <UserPlus className="w-5 h-5 text-white" />
            <div>
              <p className="text-sm font-bold text-white">{t("புதிய நிர்வாகி","New Admin")}</p>
              <p className="text-[10px] text-white/60">{t("புதிய நிர்வாகி கணக்கு","New Admin Account")}</p>
            </div>
          </div>

          <form onSubmit={create} className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-orange-700 mb-1.5">{t("பயனர் பெயர்","Username")} *</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="username" className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-700 mb-1.5">{t("பெயர்","Display Name")}</label>
                <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder={t("திரு. ராமசாமி","e.g. Ramasamy")} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">{t("கடவுச்சொல்","Password")} *</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className={`${inputCls} pr-10`} required />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">{t("பொறுப்பு","Role")}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <label key={r.value}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      form.role === r.value ? r.bg : "bg-gray-50 border-gray-200 hover:bg-orange-50"
                    }`}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                      onChange={() => setForm({ ...form, role: r.value })} className="accent-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-orange-900">{t(r.labelTa, r.label)}</p>
                      <p className="text-[9px] text-orange-500 leading-snug">{t(r.label, r.labelTa)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {message && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
                message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                {message.text}
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-md shadow-orange-200 disabled:opacity-50 transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
              {saving ? t("உருவாக்குகிறது...","Creating...") : t("நிர்வாகி உருவாக்கு","Create Admin")}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
