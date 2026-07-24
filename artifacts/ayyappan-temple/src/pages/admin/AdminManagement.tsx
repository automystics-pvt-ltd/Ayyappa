import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useAdmin } from "@/hooks/useAdmin";

const emptyForm = { username: "", password: "", role: "editor", displayName: "" };

export default function AdminManagement() {
  const { admin } = useAdmin();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (admin?.role !== "super_admin") {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-400">அணுகல் இல்லை</div>
      </AdminLayout>
    );
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { setMessage({ type: "error", text: "பயனர் பெயர் மற்றும் கடவுச்சொல் தேவை" }); return; }
    setSaving(true);
    try {
      await api.createAdmin(form);
      setMessage({ type: "success", text: "நிர்வாகி உருவாக்கப்பட்டது!" });
      setForm(emptyForm);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">புதிய நிர்வாகி சேர்க்க</h1>

        <div className="bg-white rounded-xl border p-6">
          <form onSubmit={create} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">பயனர் பெயர்</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="username" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">கடவுச்சொல்</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="••••••••" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">பெயர்</label>
              <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="திரு. ராமசாமி" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">பொறுப்பு (Role)</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="super_admin">Super Admin — அனைத்து அதிகாரங்கள்</option>
                <option value="editor">Editor — செய்திகள், புகைப்படங்கள், உள்ளடக்கம்</option>
                <option value="volunteer">Volunteer — நன்கொடை பதிவு மட்டும்</option>
              </select>
            </div>

            {message && (
              <div className={`px-4 py-3 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-medium disabled:opacity-50">
              {saving ? "உருவாக்குகிறது..." : "நிர்வாகி உருவாக்கு"}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>பொறுப்புகள்:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong>Super Admin:</strong> அனைத்து அதிகாரங்களும்</li>
            <li><strong>Editor:</strong> செய்திகள், நிகழ்வுகள், அமைப்புகள், நன்கொடை Approve</li>
            <li><strong>Volunteer:</strong> நன்கொடை பதிவு மட்டும் — Approve செய்ய முடியாது</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
