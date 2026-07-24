import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

type NewsPost = {
  id: number; title: string; content: string;
  imageUrl?: string; videoUrl?: string; published: boolean;
  createdAt: string; updatedAt: string;
};

const emptyForm = { title: "", content: "", imageUrl: "", videoUrl: "", published: true };

export default function NewsAdmin() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { setPosts(await api.getAllNews() as NewsPost[]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (p: NewsPost) => {
    setForm({ title: p.title, content: p.content, imageUrl: p.imageUrl || "", videoUrl: p.videoUrl || "", published: p.published });
    setEditId(p.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.content) return alert("தலைப்பு மற்றும் உள்ளடக்கம் தேவை");
    setSaving(true);
    try {
      if (editId) await api.updateNews(editId, form);
      else await api.createNews(form);
      setShowForm(false);
      await fetch();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("நிச்சயமாக நீக்கவுமா?")) return;
    try { await api.deleteNews(id); await fetch(); } catch (e: any) { alert(e.message); }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">செய்திகள் & அறிவிப்புகள்</h1>
          <button onClick={openCreate} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-600">
            + புதிய செய்தி
          </button>
        </div>

        {loading ? <div className="text-center py-20 text-gray-400">ஏற்றுகிறது...</div> : (
          <div className="space-y-4">
            {!posts.length && <div className="text-center py-20 text-gray-400 bg-white rounded-xl border">செய்திகள் இல்லை</div>}
            {posts.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border p-5 flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{p.title}</h3>
                    {!p.published && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">Draft</span>}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{p.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString("ta-IN")}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100">திருத்து</button>
                  <button onClick={() => del(p.id)} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100">நீக்கு</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-lg mb-4">{editId ? "செய்தி திருத்து" : "புதிய செய்தி"}</h3>
              <div className="space-y-4">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="தலைப்பு *" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="உள்ளடக்கம் *" rows={5}
                  className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="புகைப்பட URL (விருப்பம்)" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="வீடியோ URL (விருப்பம்)" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
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
                <button onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-xl text-gray-600 hover:bg-gray-50">
                  ரத்து செய்
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
