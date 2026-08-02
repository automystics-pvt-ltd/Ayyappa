import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { Plus, Pencil, Trash2, Eye, EyeOff, CalendarDays, MapPin, X } from "lucide-react";

type Event = {
  id: number; title: string; eventType?: string; description?: string;
  eventDate: string; location?: string; posterUrl?: string; published: boolean; createdAt: string;
};

const emptyForm = { title: "", eventType: "", description: "", eventDate: "", location: "", posterUrl: "", published: true };
const EVENT_TYPES = ["பூஜை", "திருவிழா", "அன்னதானம்", "கும்பாபிஷேகம்", "மண்டல பூஜை", "Other"];

const TYPE_COLORS: Record<string, string> = {
  "பூஜை": "bg-violet-100 text-violet-700 border-violet-200",
  "திருவிழா": "bg-amber-100 text-amber-700 border-amber-200",
  "அன்னதானம்": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "கும்பாபிஷேகம்": "bg-orange-100 text-orange-700 border-orange-200",
  "மண்டல பூஜை": "bg-rose-100 text-rose-700 border-rose-200",
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-orange-700 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900";

export default function EventsAdmin() {
  const { t } = useLanguage();
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [editId, setEditId]   = useState<number | null>(null);
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try { setEvents(await api.getAllEvents() as Event[]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit   = (e: Event) => {
    setForm({
      title: e.title, eventType: e.eventType || "", description: e.description || "",
      eventDate: e.eventDate ? new Date(e.eventDate).toISOString().slice(0, 16) : "",
      location: e.location || "", posterUrl: e.posterUrl || "", published: e.published
    });
    setEditId(e.id); setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.eventDate) return alert(t("தலைப்பு மற்றும் தேதி தேவை","Title and date are required"));
    setSaving(true);
    try {
      if (editId) await api.updateEvent(editId, form);
      else await api.createEvent(form);
      setShowForm(false); await load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm(t("நிச்சயமாக நீக்கவுமா?","Are you sure you want to delete?"))) return;
    try { await api.deleteEvent(id); await load(); } catch (e: any) { alert(e.message); }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="bg-white border-b border-orange-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-orange-900">{t("நிகழ்வுகள்","Events")}</h1>
          <p className="text-xs text-orange-500">{t("நிகழ்வு நிர்வாகம்","Events Management")} · {events.length} {t("நிகழ்வுகள்","events")}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md shadow-orange-200 transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
          <Plus className="w-4 h-4" /> {t("புதிய நிகழ்வு","New Event")}
        </button>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-3 border-orange-300 border-t-orange-600 animate-spin" />
          </div>
        ) : !events.length ? (
          <div className="bg-white rounded-2xl border border-orange-100 py-16 text-center">
            <CalendarDays className="w-12 h-12 text-orange-200 mx-auto mb-3" />
            <p className="text-orange-400 font-medium">{t("நிகழ்வுகள் இல்லை","No events yet")}</p>
            <button onClick={openCreate} className="mt-4 text-sm text-orange-600 font-bold hover:text-orange-700">
              + {t("முதல் நிகழ்வை சேர்க்கவும்","Add your first event")}
            </button>
          </div>
        ) : (
          events.map(e => (
            <div key={e.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 p-5">
                <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 text-white"
                  style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
                  <span className="text-lg font-bold leading-tight">{new Date(e.eventDate).getDate()}</span>
                  <span className="text-[9px] font-medium opacity-80">
                    {new Date(e.eventDate).toLocaleDateString("en-IN", { month: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-orange-900">{e.title}</h3>
                    {e.eventType && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[e.eventType] ?? "bg-orange-100 text-orange-700 border-orange-200"}`}>
                        {e.eventType}
                      </span>
                    )}
                    {e.published
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200"><Eye className="w-2.5 h-2.5"/>{t("வெளியீட்டில்","Live")}</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200"><EyeOff className="w-2.5 h-2.5"/>{t("வரைவு","Draft")}</span>
                    }
                  </div>
                  {e.description && <p className="text-sm text-orange-600/70 line-clamp-1 mb-2">{e.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-orange-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(e.eventDate).toLocaleDateString("en-IN", { dateStyle: "full" })}
                    </span>
                    {e.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(e)}
                    className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-center justify-center transition-colors">
                    <Pencil className="w-3.5 h-3.5 text-orange-600" />
                  </button>
                  <button onClick={() => del(e.id)}
                    className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100"
              style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
              <h3 className="font-bold text-white">{editId ? t("நிகழ்வு திருத்து","Edit Event") : t("புதிய நிகழ்வு","New Event")}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field label={`${t("தலைப்பு","Title")} *`}>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder={t("நிகழ்வு தலைப்பு","Event title")} className={inputCls} />
              </Field>
              <Field label={t("நிகழ்வு வகை","Event Type")}>
                <select value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}
                  className={inputCls}>
                  <option value="">{t("தேர்ந்தெடுக்கவும்","Select...")}</option>
                  {EVENT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                </select>
              </Field>
              <Field label={t("விளக்கம்","Description")}>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder={t("நிகழ்வு விவரம்","Event details")} rows={3} className={`${inputCls} resize-none`} />
              </Field>
              <Field label={`${t("தேதி & நேரம்","Date & Time")} *`}>
                <input type="datetime-local" value={form.eventDate}
                  onChange={e => setForm({ ...form, eventDate: e.target.value })} className={inputCls} />
              </Field>
              <Field label={t("இடம்","Location")}>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder={t("நிகழ்வு இடம்","Event location")} className={inputCls} />
              </Field>
              <Field label={`${t("போஸ்டர் URL","Poster URL")} (${t("விருப்பம்","optional")})`}>
                <input value={form.posterUrl} onChange={e => setForm({ ...form, posterUrl: e.target.value })}
                  placeholder="https://..." className={inputCls} />
              </Field>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors">
                <input type="checkbox" checked={form.published}
                  onChange={e => setForm({ ...form, published: e.target.checked })}
                  className="w-4 h-4 accent-orange-500" />
                <div>
                  <p className="text-sm font-semibold text-orange-900">{t("வெளியிடு","Publish")}</p>
                  <p className="text-[10px] text-orange-400">{t("பொது பார்வைக்கு காட்டவும்","Show for public view")}</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
                {saving ? t("சேமிக்கிறது...","Saving...") : t("சேமி","Save")}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-orange-200 py-2.5 rounded-xl font-medium text-orange-700 hover:bg-orange-50 text-sm">
                {t("ரத்து செய்","Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
