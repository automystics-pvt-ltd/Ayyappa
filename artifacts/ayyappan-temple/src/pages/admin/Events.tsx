import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

type Event = {
  id: number; title: string; eventType?: string; description?: string;
  eventDate: string; location?: string; posterUrl?: string; published: boolean;
  createdAt: string;
};

const emptyForm = { title: "", eventType: "", description: "", eventDate: "", location: "", posterUrl: "", published: true };
const EVENT_TYPES = ["பூஜை", "திருவிழா", "அன்னதானம்", "கும்பாபிஷேகம்", "மண்டல பூஜை", "Other"];

export default function EventsAdmin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { setEvents(await api.getAllEvents() as Event[]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (e: Event) => {
    setForm({
      title: e.title, eventType: e.eventType || "", description: e.description || "",
      eventDate: e.eventDate ? new Date(e.eventDate).toISOString().slice(0, 16) : "",
      location: e.location || "", posterUrl: e.posterUrl || "", published: e.published
    });
    setEditId(e.id); setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.eventDate) return alert("தலைப்பு மற்றும் தேதி தேவை");
    setSaving(true);
    try {
      if (editId) await api.updateEvent(editId, form);
      else await api.createEvent(form);
      setShowForm(false); await fetch();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("நிச்சயமாக நீக்கவுமா?")) return;
    try { await api.deleteEvent(id); await fetch(); } catch (e: any) { alert(e.message); }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">நிகழ்வுகள்</h1>
          <button onClick={openCreate} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-600">
            + புதிய நிகழ்வு
          </button>
        </div>

        {loading ? <div className="text-center py-20 text-gray-400">ஏற்றுகிறது...</div> : (
          <div className="space-y-4">
            {!events.length && <div className="text-center py-20 text-gray-400 bg-white rounded-xl border">நிகழ்வுகள் இல்லை</div>}
            {events.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border p-5 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{e.title}</h3>
                    {e.eventType && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{e.eventType}</span>}
                    {!e.published && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Draft</span>}
                  </div>
                  {e.description && <p className="text-sm text-gray-500 line-clamp-1">{e.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    📅 {new Date(e.eventDate).toLocaleDateString("ta-IN", { dateStyle: "full" })}
                    {e.location && ` • 📍 ${e.location}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(e)} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100">திருத்து</button>
                  <button onClick={() => del(e.id)} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100">நீக்கு</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-lg mb-4">{editId ? "நிகழ்வு திருத்து" : "புதிய நிகழ்வு"}</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="தலைப்பு *" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">நிகழ்வு வகை தேர்ந்தெடுக்க</option>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="விளக்கம்" rows={3}
                  className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input type="datetime-local" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="இடம்" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
                  placeholder="Poster URL (விருப்பம்)" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                  வெளியிடப்பட்டது (Published)
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={save} disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl font-medium disabled:opacity-50">
                  {saving ? "சேமிக்கிறது..." : "சேமி"}
                </button>
                <button onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-xl text-gray-600 hover:bg-gray-50">ரத்து செய்</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
