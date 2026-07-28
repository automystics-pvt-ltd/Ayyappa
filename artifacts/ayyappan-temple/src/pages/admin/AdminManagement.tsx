import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api, AdminUser } from "@/lib/api";
import { useAdmin } from "@/hooks/useAdmin";
import {
  ShieldCheck, UserPlus, CheckCircle2, XCircle,
  Eye, EyeOff, Lock, Trash2, Pencil, X, Check,
  RefreshCw, Crown, Edit3, UserCheck,
} from "lucide-react";

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLES = [
  {
    value: "super_admin",
    label: "Super Admin",
    labelTa: "முதன்மை நிர்வாகி",
    desc: "அனைத்து அதிகாரங்களும் — approve, content, settings, admin mgmt",
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
    color: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Icon: UserCheck,
  },
];

const roleInfo = (value: string) =>
  ROLES.find((r) => r.value === value) ?? ROLES[1];

const inputCls =
  "w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900";

const emptyForm = { username: "", password: "", role: "editor", displayName: "" };

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ta-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Row: inline role edit ────────────────────────────────────────────────────
function AdminRow({
  user,
  currentAdminId,
  onUpdated,
  onDeleted,
}: {
  user: AdminUser;
  currentAdminId: number;
  onUpdated: (u: AdminUser) => void;
  onDeleted: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [newRole, setNewRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isSelf = user.id === currentAdminId;
  const ri = roleInfo(user.role);

  const saveRole = async () => {
    if (newRole === user.role) { setEditing(false); return; }
    setSaving(true);
    try {
      const updated = await api.updateAdmin(user.id, { role: newRole }) as AdminUser;
      onUpdated({ ...user, ...updated });
      setEditing(false);
    } catch { /* keep editing open */ }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteAdmin(user.id);
      onDeleted(user.id);
    } catch { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <tr className="border-b border-orange-50 last:border-0 hover:bg-orange-50/30 transition-colors">
      {/* User info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${ri.color} flex items-center justify-center flex-shrink-0`}
          >
            <ri.Icon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-orange-900 truncate">
              {user.displayName || user.username}
              {isSelf && (
                <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-500 border border-orange-200 rounded-full px-1.5 py-0.5 font-normal align-middle">
                  நீங்கள்
                </span>
              )}
            </p>
            <p className="text-xs text-orange-400 truncate">@{user.username}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        {editing ? (
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="text-xs border border-orange-300 rounded-lg px-2 py-1.5 bg-white text-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        ) : (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${ri.badge}`}
          >
            <ri.Icon className="w-3 h-3" />
            {ri.label}
          </span>
        )}
      </td>

      {/* Last login */}
      <td className="px-4 py-3 text-xs text-orange-400 hidden sm:table-cell">
        {formatDate(user.lastLogin)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        {isSelf ? (
          <span className="text-xs text-orange-300 italic">—</span>
        ) : editing ? (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={saveRole}
              disabled={saving}
              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 disabled:opacity-50"
              title="Save"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { setEditing(false); setNewRole(user.role); }}
              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : confirmDelete ? (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xs text-rose-500 mr-1">நீக்கவா?</span>
            <button
              onClick={doDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 disabled:opacity-50"
            >
              {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg bg-violet-50 text-violet-500 hover:bg-violet-100"
              title="Edit role"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminManagement() {
  const { admin } = useAdmin();
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
          <p className="text-orange-400 font-medium">அணுகல் இல்லை — Super Admin மட்டும்</p>
        </div>
      </AdminLayout>
    );
  }

  const handleUpdated = (updated: AdminUser) =>
    setAdmins((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));

  const handleDeleted = (id: number) =>
    setAdmins((prev) => prev.filter((a) => a.id !== id));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setMessage({ type: "error", text: "பயனர் பெயர் மற்றும் கடவுச்சொல் தேவை" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const created = await api.createAdmin(form) as AdminUser;
      setAdmins((prev) => [...prev, created]);
      setMessage({ type: "success", text: `'${form.username}' வெற்றிகரமாக உருவாக்கப்பட்டது!` });
      setForm(emptyForm);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally { setSaving(false); }
  };

  // Role capability summary
  const byRole = ROLES.map((r) => ({
    ...r,
    count: admins.filter((a) => a.role === r.value).length,
  }));

  return (
    <AdminLayout>
      {/* Header */}
      <div className="bg-white border-b border-orange-100 px-6 py-4">
        <h1 className="text-lg font-bold text-orange-900">நிர்வாகிகள் மேலாண்மை</h1>
        <p className="text-xs text-orange-500">Admin Management · பட்டியல் மற்றும் புதிய நிர்வாகி சேர்க்க</p>
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
                  <p className="text-xs font-bold text-orange-900">{r.label}</p>
                  <p className="text-[9px] text-orange-600/70 leading-snug mt-0.5 hidden sm:block">{r.desc}</p>
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
              நிர்வாகிகள் பட்டியல்
              <span className="ml-2 text-xs font-normal text-orange-400">({admins.length} பேர்)</span>
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-orange-300">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">ஏற்றுகிறது...</span>
            </div>
          ) : admins.length === 0 ? (
            <p className="text-center py-10 text-sm text-orange-300">நிர்வாகிகள் இல்லை</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-orange-400 border-b border-orange-50">
                    <th className="px-4 py-2.5 font-semibold">பயனர்</th>
                    <th className="px-4 py-2.5 font-semibold">பொறுப்பு</th>
                    <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">கடைசி உள்நுழைவு</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((u) => (
                    <AdminRow
                      key={u.id}
                      user={u}
                      currentAdminId={admin.adminId}
                      onUpdated={handleUpdated}
                      onDeleted={handleDeleted}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create form */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
          <div
            className="flex items-center gap-3 px-5 py-4 border-b border-orange-50"
            style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}
          >
            <UserPlus className="w-5 h-5 text-white" />
            <div>
              <p className="text-sm font-bold text-white">புதிய நிர்வாகி</p>
              <p className="text-[10px] text-white/60">New Admin Account</p>
            </div>
          </div>

          <form onSubmit={create} className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-orange-700 mb-1.5">பயனர் பெயர் *</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="username"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-700 mb-1.5">பெயர்</label>
                <input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="திரு. ராமசாமி"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">கடவுச்சொல் *</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={`${inputCls} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1.5">பொறுப்பு (Role)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      form.role === r.value ? r.bg : "bg-gray-50 border-gray-200 hover:bg-orange-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={() => setForm({ ...form, role: r.value })}
                      className="accent-orange-500 flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-orange-900">{r.label}</p>
                      <p className="text-[9px] text-orange-500 leading-snug">{r.labelTa}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {message && (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-md shadow-orange-200 disabled:opacity-50 transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}
            >
              {saving ? "உருவாக்குகிறது..." : "நிர்வாகி உருவாக்கு"}
            </button>
          </form>
        </div>

      </div>
    </AdminLayout>
  );
}
