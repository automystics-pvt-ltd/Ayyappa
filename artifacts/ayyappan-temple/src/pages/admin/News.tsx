import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { Plus, Pencil, Trash2, Eye, EyeOff, Newspaper, X } from "lucide-react";

type NewsPost = {
  id: number; title: string; content: string;
  imageUrl?: string; videoUrl?: string; published: boolean;
  createdAt: string; updatedAt: string;
};

const emptyForm = { title: "", content: "", imageUrl: "", videoUrl: "", published: true };

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-orange-700 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900";

export default function NewsAdmin() {
  const { t } = useLanguage();
  const [posts, setPosts]     = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [editId, setEditId]   = useState<number | null>(null);
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try { setPosts(await api.getAllNews() as NewsPost[]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit   = (p: NewsPost) => {
    setForm({ title: p.title, content: p.content, imageUrl: p.imageUrl || "", videoUrl: p.videoUrl || "", published: p.published });
    setEditId(p.id); setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.content) return alert(t("தலைப்பு மற்றும் உள்ளடக்கம் தேவை","Title and content are required"));
    setSaving(true);
    try {
      if (editId) await api.updateNews(editId, form);
      else await api.createNews(form);
      setShowForm(false); await load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm(t("நிச்சயமாக நீக்கவுமா?","Are you sure you want to delete?"))) return;
    try { await api.deleteNews(id); await load(); } catch (e: any) { alert(e.message); }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="bg-white border-b border-orange-100 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-orange-900 truncate">{t("செய்திகள் & அறிவிப்புகள்","News & Announcements")}</h1>
          <p className="text-xs text-orange-500">News Management · {posts.length} {t("செய்திகள்","posts")}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md shadow-orange-200 transition-all hover:scale-105 shrink-0"
          style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">{t("புதிய செய்தி","New Post")}</span><span className="sm:hidden">{t("புதிய","New")}</span>
        </button>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-3 border-orange-300 border-t-orange-600 animate-spin" />
          </div>
        ) : !posts.length ? (
          <div className="bg-white rounded-2xl border border-orange-100 py-16 text-center">
            <Newspaper className="w-12 h-12 text-orange-200 mx-auto mb-3" />
            <p className="text-orange-400 font-medium">{t("செய்திகள் இல்லை","No posts yet")}</p>
            <button onClick={openCreate} className="mt-4 text-sm text-orange-600 font-bold hover:text-orange-700">
              + {t("முதல் செய்தி சேர்க்கவும்","Add your first post")}
            </button>
          </div>
        ) : (
          posts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <div className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: p.published ? "linear-gradient(to bottom,#ea580c,#d97706)" : "#e5e7eb" }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: p.published ? "linear-gradient(135deg,#ea580c,#d97706)" : "#f3f4f6" }}>
                  <Newspaper className={`w-5 h-5 ${p.published ? "text-white" : "text-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-orange-900 truncate">{p.title}</h3>
                    {p.published
                      ? <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200"><Eye className="w-2.5 h-2.5"/>{t("வெளியிடப்பட்டது","Published")}</span>
                      : <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200"><EyeOff className="w-2.5 h-2.5"/>Draft</span>
                    }
                  </div>
                  <p className="text-sm text-orange-600/70 line-clamp-2 mb-2">{p.content}</p>
                  <p className="text-[10px] text-orange-300">{new Date(p.createdAt).toLocaleDateString("en-IN", { dateStyle: "full" })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(p)}
                    className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-center justify-center transition-colors">
                    <Pencil className="w-3.5 h-3.5 text-orange-600" />
                  </button>
                  <button onClick={() => del(p.id)}
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
              <h3 className="font-bold text-white">{editId ? t("செய்தி திருத்து","Edit Post") : t("புதிய செய்தி","New Post")}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field label={`${t("தலைப்பு","Title")} *`}>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder={t("செய்தி தலைப்பு","News title")} className={inputCls} />
              </Field>
              <Field label={`${t("உள்ளடக்கம்","Content")} *`}>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder={t("செய்தி விவரம்","News details")} rows={5} className={`${inputCls} resize-none`} />
              </Field>
              <Field label={`${t("புகைப்பட URL","Photo URL")} (${t("விருப்பம்","optional")})`}>
                <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..." className={inputCls} />
              </Field>
              <Field label={`${t("வீடியோ URL","Video URL")} (${t("விருப்பம்","optional")})`}>
                <input value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/..." className={inputCls} />
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
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 transition-all"
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
