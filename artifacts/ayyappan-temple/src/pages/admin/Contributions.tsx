import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Gift, Plus, Pencil, Trash2, CheckCircle2, XCircle, AlertCircle, Receipt } from "lucide-react";

interface Contribution {
  id: number;
  receiptToken?: string | null;
  donorName: string;
  place: string | null;
  description: string;
  contributedAt: string;
  isActive: boolean;
}

const BLANK = { donorName: "", place: "", description: "", contributedAt: "" };

const inputCls = "w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900";

function fmt(iso: string) {
  try { return new Date(iso).toLocaleDateString("ta-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return ""; }
}

export default function ContributionsAdmin() {
  const [items, setItems]       = useState<Contribution[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Contribution | null>(null);
  const [form, setForm]         = useState(BLANK);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    api.getAllContributions()
      .then(d => setItems(d as Contribution[]))
      .catch(() => setError("ஏற்ற முடியவில்லை"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(BLANK);
    setError("");
    setShowForm(true);
  };

  const openEdit = (c: Contribution) => {
    setEditing(c);
    setForm({
      donorName:     c.donorName,
      place:         c.place ?? "",
      description:   c.description,
      contributedAt: c.contributedAt.slice(0, 10),
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.donorName.trim() || !form.description.trim()) {
      setError("பெயர் மற்றும் விவரம் அவசியம்"); return;
    }
    setSaving(true); setError("");
    try {
      const payload = {
        donorName:     form.donorName.trim(),
        place:         form.place.trim() || null,
        description:   form.description.trim(),
        contributedAt: form.contributedAt || undefined,
      };
      if (editing) {
        await api.updateContribution(editing.id, payload);
      } else {
        await api.createContribution(payload);
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e.message || "சேமிக்க முடியவில்லை");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: Contribution) => {
    try { await api.updateContribution(c.id, { isActive: !c.isActive }); load(); }
    catch { setError("மாற்ற முடியவில்லை"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("இந்த பதிவை நிரந்தரமாக நீக்கவா?")) return;
    setDeleting(id);
    try { await api.deleteContribution(id); load(); }
    catch { setError("நீக்க முடியவில்லை"); }
    finally { setDeleting(null); }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">பொருள் நன்கொடைகள்</h1>
              <p className="text-xs text-muted-foreground">In-kind contributions</p>
            </div>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> புதிதாக சேர்க்க
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                <h2 className="text-white font-bold text-lg">
                  {editing ? "பதிவு திருத்து" : "புதிய நன்கொடை சேர்"}
                </h2>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">
                    நன்கொடையாளர் பெயர் <span className="text-red-500">*</span>
                  </label>
                  <input className={inputCls} placeholder="சரவணன்"
                    value={form.donorName}
                    onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">ஊர் / இடம்</label>
                  <input className={inputCls} placeholder="வடமதுரை"
                    value={form.place}
                    onChange={e => setForm(f => ({ ...f, place: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">
                    விவரம் <span className="text-red-500">*</span>
                  </label>
                  <textarea className={inputCls} rows={3}
                    placeholder="சிமெண்ட் 25 மூட்டை வழங்கியவர்"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">தேதி</label>
                  <input type="date" className={inputCls}
                    value={form.contributedAt}
                    onChange={e => setForm(f => ({ ...f, contributedAt: e.target.value }))} />
                </div>
                {error && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{error}
                  </p>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    {saving ? "சேமிக்கிறது…" : "சேமி"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
                    ரத்து
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">ஏற்றுகிறது…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
            <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">இன்னும் பதிவு சேர்க்கப்படவில்லை</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(c => (
              <div key={c.id}
                className={`flex items-start gap-4 bg-card border rounded-2xl px-5 py-4 shadow-sm transition-opacity ${!c.isActive ? 'opacity-50' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{c.donorName}</span>
                    {c.place && <span className="text-xs text-muted-foreground">📍 {c.place}</span>}
                    {!c.isActive && (
                      <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">மறைக்கப்பட்டது</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{fmt(c.contributedAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.receiptToken && (
                    <a
                      href={`${import.meta.env.BASE_URL}contribution-receipt/${c.receiptToken}`}
                      target="_blank" rel="noopener noreferrer"
                      title="ரசீது பார்க்க"
                      className="w-8 h-8 rounded-lg border border-orange-200 flex items-center justify-center hover:bg-orange-50 transition-colors">
                      <Receipt className="w-4 h-4 text-orange-500" />
                    </a>
                  )}
                  <button onClick={() => handleToggle(c)} title={c.isActive ? "மறை" : "காட்டு"}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    {c.isActive
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <XCircle className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => openEdit(c)}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                    className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
