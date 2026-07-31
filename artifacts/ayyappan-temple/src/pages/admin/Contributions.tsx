import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { Gift, Plus, Pencil, Trash2, CheckCircle2, XCircle, AlertCircle, Receipt, Copy, Check } from "lucide-react";

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
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return ""; }
}

export default function ContributionsAdmin() {
  const { t } = useLanguage();
  const [items, setItems]       = useState<Contribution[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Contribution | null>(null);
  const [form, setForm]         = useState(BLANK);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [copied, setCopied]     = useState<number | null>(null);

  const receiptUrl = (token: string) =>
    `${window.location.origin}${import.meta.env.BASE_URL}contribution-receipt/${token}`;

  const handleCopy = async (c: Contribution) => {
    if (!c.receiptToken) return;
    const url = receiptUrl(c.receiptToken);
    const markCopied = () => { setCopied(c.id); setTimeout(() => setCopied(null), 2000); };
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(url); markCopied(); return; } catch {}
    }
    const el = document.createElement("textarea");
    el.value = url;
    el.setAttribute("readonly", "");
    el.style.position = "fixed"; el.style.top = "0"; el.style.left = "0";
    el.style.opacity = "0"; el.style.pointerEvents = "none";
    document.body.appendChild(el);
    el.focus(); el.setSelectionRange(0, el.value.length);
    try { document.execCommand("copy"); markCopied(); }
    finally { document.body.removeChild(el); }
  };

  const load = () => {
    setLoading(true);
    api.getAllContributions()
      .then(d => setItems(d as Contribution[]))
      .catch(() => setError(t("ஏற்ற முடியவில்லை","Could not load")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(BLANK); setError(""); setShowForm(true); };
  const openEdit = (c: Contribution) => {
    setEditing(c);
    setForm({ donorName: c.donorName, place: c.place ?? "", description: c.description, contributedAt: c.contributedAt.slice(0, 10) });
    setError(""); setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.donorName.trim() || !form.description.trim()) {
      setError(t("பெயர் மற்றும் விவரம் அவசியம்","Name and description are required")); return;
    }
    setSaving(true); setError("");
    try {
      const payload = { donorName: form.donorName.trim(), place: form.place.trim() || null, description: form.description.trim(), contributedAt: form.contributedAt || undefined };
      if (editing) await api.updateContribution(editing.id, payload);
      else await api.createContribution(payload);
      setShowForm(false); load();
    } catch (e: any) { setError(e.message || t("சேமிக்க முடியவில்லை","Could not save")); }
    finally { setSaving(false); }
  };

  const handleToggle = async (c: Contribution) => {
    try { await api.updateContribution(c.id, { isActive: !c.isActive }); load(); }
    catch { setError(t("மாற்ற முடியவில்லை","Could not update")); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("இந்த பதிவை நிரந்தரமாக நீக்கவா?","Permanently delete this record?"))) return;
    setDeleting(id);
    try { await api.deleteContribution(id); load(); }
    catch { setError(t("நீக்க முடியவில்லை","Could not delete")); }
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
              <h1 className="text-xl font-bold text-foreground">{t("பொருள் நன்கொடைகள்","In-kind Contributions")}</h1>
              <p className="text-xs text-muted-foreground">In-kind contributions</p>
            </div>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> {t("புதிதாக சேர்க்க","Add New")}
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
                  {editing ? t("பதிவு திருத்து","Edit Record") : t("புதிய நன்கொடை சேர்","Add Contribution")}
                </h2>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">
                    {t("நன்கொடையாளர் பெயர்","Donor Name")} <span className="text-red-500">*</span>
                  </label>
                  <input className={inputCls} placeholder={t("சரவணன்","Name")}
                    value={form.donorName} onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">{t("ஊர் / இடம்","Place")}</label>
                  <input className={inputCls} placeholder={t("வடமதுரை","Place")}
                    value={form.place} onChange={e => setForm(f => ({ ...f, place: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">
                    {t("விவரம்","Description")} <span className="text-red-500">*</span>
                  </label>
                  <textarea className={inputCls} rows={3}
                    placeholder={t("சிமெண்ட் 25 மூட்டை வழங்கியவர்","e.g. 25 bags of cement")}
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">{t("தேதி","Date")}</label>
                  <input type="date" className={inputCls}
                    value={form.contributedAt} onChange={e => setForm(f => ({ ...f, contributedAt: e.target.value }))} />
                </div>
                {error && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{error}
                  </p>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    {saving ? t("சேமிக்கிறது…","Saving...") : t("சேமி","Save")}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
                    {t("ரத்து","Cancel")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("ஏற்றுகிறது…","Loading...")}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
            <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("இன்னும் பதிவு சேர்க்கப்படவில்லை","No records yet")}</p>
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
                      <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {t("மறைக்கப்பட்டது","Hidden")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{fmt(c.contributedAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.receiptToken && (
                    <>
                      <a href={`${import.meta.env.BASE_URL}contribution-receipt/${c.receiptToken}`}
                        target="_blank" rel="noopener noreferrer"
                        title={t("ரசீது பார்க்க","View Receipt")}
                        className="min-w-[44px] min-h-[44px] w-8 h-8 rounded-lg border border-orange-200 flex items-center justify-center hover:bg-orange-50 transition-colors">
                        <Receipt className="w-4 h-4 text-orange-500" />
                      </a>
                      <button onClick={() => handleCopy(c)}
                        title={copied === c.id ? t("நகலெடுக்கப்பட்டது!","Copied!") : t("இணைப்பை நகலெடு","Copy link")}
                        className="min-w-[44px] min-h-[44px] rounded-lg border border-orange-200 flex items-center justify-center gap-1 px-2 hover:bg-orange-50 transition-colors">
                        {copied === c.id ? (
                          <><Check className="w-4 h-4 text-green-500 shrink-0" /><span className="text-[11px] font-medium text-green-600 sm:hidden">{t("நகல்","OK")}</span></>
                        ) : (
                          <Copy className="w-4 h-4 text-orange-500" />
                        )}
                      </button>
                      <a href={`https://wa.me/?text=${encodeURIComponent(receiptUrl(c.receiptToken))}`}
                        target="_blank" rel="noopener noreferrer"
                        title={t("WhatsApp-ல் பகிர்","Share on WhatsApp")}
                        className="min-w-[44px] min-h-[44px] w-8 h-8 rounded-lg border border-green-200 flex items-center justify-center hover:bg-green-50 transition-colors">
                        <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    </>
                  )}
                  <button onClick={() => handleToggle(c)} title={c.isActive ? t("மறை","Hide") : t("காட்டு","Show")}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    {c.isActive ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
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
