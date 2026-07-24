import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Plus, Trash2, Pencil, ChevronLeft, Image, UploadCloud, X, Check, Eye, EyeOff } from "lucide-react";

type GalleryPhoto = {
  id: number;
  albumId: number;
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
};

type GalleryAlbum = {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  photos: GalleryPhoto[];
};

export default function GalleryAdmin() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);

  // Create album state
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit album state
  const [editAlbumId, setEditAlbumId] = useState<number | null>(null);
  const [editAlbumTitle, setEditAlbumTitle] = useState("");
  const [editAlbumDesc, setEditAlbumDesc] = useState("");
  const [savingAlbum, setSavingAlbum] = useState(false);

  // Photo upload state
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit caption state
  const [editCaptionId, setEditCaptionId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminAlbums();
      setAlbums(data as GalleryAlbum[]);
      // Refresh selectedAlbum if one is open
      if (selectedAlbum) {
        const updated = (data as GalleryAlbum[]).find((a) => a.id === selectedAlbum.id);
        setSelectedAlbum(updated ?? null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlbums(); }, []);

  // ─── Album actions ───────────────────────────

  const createAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    setCreating(true);
    try {
      await api.createAlbum({ title: newAlbumTitle.trim(), description: newAlbumDesc.trim() || undefined });
      setNewAlbumTitle("");
      setNewAlbumDesc("");
      setShowCreateAlbum(false);
      await fetchAlbums();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  const saveAlbumEdit = async () => {
    if (!editAlbumId || !editAlbumTitle.trim()) return;
    setSavingAlbum(true);
    try {
      await api.updateAlbum(editAlbumId, { title: editAlbumTitle.trim(), description: editAlbumDesc.trim() || undefined });
      setEditAlbumId(null);
      await fetchAlbums();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingAlbum(false);
    }
  };

  const togglePublished = async (album: GalleryAlbum) => {
    try {
      await api.updateAlbum(album.id, { published: !album.published });
      await fetchAlbums();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const deleteAlbum = async (album: GalleryAlbum) => {
    if (!confirm(`"${album.title}" அல்பமை நீக்கவா? இதிலுள்ள ${album.photos.length} புகைப்படங்களும் நீக்கப்படும்.`)) return;
    try {
      await api.deleteAlbum(album.id);
      if (selectedAlbum?.id === album.id) setSelectedAlbum(null);
      await fetchAlbums();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ─── Photo actions ───────────────────────────

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedAlbum) return;
    const fileArr = Array.from(files);
    setUploadingPhotos(true);
    try {
      for (let i = 0; i < fileArr.length; i++) {
        const file = fileArr[i];
        setUploadProgress(`படம் ${i + 1} / ${fileArr.length} பதிவேற்றுகிறது...`);
        // Get presigned URL
        const { uploadURL, objectPath } = await api.getGalleryUploadUrl(file.type, file.size) as { uploadURL: string; objectPath: string };
        // Upload to GCS
        const res = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!res.ok) throw new Error("Upload failed for " + file.name);
        // Add photo record
        await api.addPhoto({
          albumId: selectedAlbum.id,
          url: objectPath,
          sortOrder: (selectedAlbum.photos.length + i),
        });
      }
      await fetchAlbums();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploadingPhotos(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveCaption = async () => {
    if (!editCaptionId) return;
    setSavingCaption(true);
    try {
      await api.updatePhoto(editCaptionId, { caption: editCaption });
      setEditCaptionId(null);
      await fetchAlbums();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingCaption(false);
    }
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    if (!confirm("இந்த புகைப்படத்தை நீக்கவா?")) return;
    try {
      await api.deletePhoto(photo.id);
      await fetchAlbums();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const photoSrc = (objectPath: string) => api.storageUrl(objectPath);

  // ─── Render ──────────────────────────────────

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-400">ஏற்றுகிறது...</div>
      </AdminLayout>
    );
  }

  // Album detail view
  if (selectedAlbum) {
    const album = albums.find((a) => a.id === selectedAlbum.id) ?? selectedAlbum;
    return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> திரும்பு
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{album.title}</h1>
              {album.description && <p className="text-sm text-gray-500 mt-0.5">{album.description}</p>}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${album.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {album.published ? "Published" : "Draft"}
            </span>
          </div>

          {/* Upload zone */}
          <div
            className="mb-6 border-2 border-dashed border-orange-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            {uploadingPhotos ? (
              <div className="text-orange-600 font-medium">{uploadProgress || "பதிவேற்றுகிறது..."}</div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-orange-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">படங்களை இங்கே இழுத்து விடுங்கள் அல்லது <span className="text-orange-500 font-medium">கோப்புகளை தேர்வு செய்யுங்கள்</span></p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF • max 20 MB each</p>
              </>
            )}
          </div>

          {/* Photo grid */}
          {album.photos.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
              <Image className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>இன்னும் படங்கள் இல்லை. மேலே பதிவேற்றுங்கள்.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {album.photos.map((photo) => (
                <div key={photo.id} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square shadow-sm">
                  <img
                    src={photoSrc(photo.url)}
                    alt={photo.caption ?? ""}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxUrl(photoSrc(photo.url))}
                  />

                  {/* Overlay controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setEditCaptionId(photo.id); setEditCaption(photo.caption ?? ""); }}
                        className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg transition-colors"
                        title="Caption திருத்து"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePhoto(photo)}
                        className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
                        title="நீக்கு"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {photo.caption && (
                      <p className="text-white text-xs leading-snug line-clamp-2">{photo.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit caption modal */}
        {editCaptionId !== null && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-gray-800 mb-4">Caption திருத்து</h3>
              <input
                type="text"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="புகைப்பட விளக்கம்..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 mb-4"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditCaptionId(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ரத்து</button>
                <button
                  onClick={saveCaption}
                  disabled={savingCaption}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {savingCaption ? "..." : "சேமி"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxUrl} alt="" className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </AdminLayout>
    );
  }

  // Album list view
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">படத் தொகுப்பு மேலாண்மை</h1>
          <button
            onClick={() => setShowCreateAlbum(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> புது அல்பம்
          </button>
        </div>

        {/* Create album form */}
        {showCreateAlbum && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">புது அல்பம் உருவாக்கு</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                placeholder="அல்பம் பெயர் *"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                autoFocus
              />
              <input
                type="text"
                value={newAlbumDesc}
                onChange={(e) => setNewAlbumDesc(e.target.value)}
                placeholder="விளக்கம் (optional)"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateAlbum(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ரத்து</button>
                <button
                  onClick={createAlbum}
                  disabled={creating || !newAlbumTitle.trim()}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {creating ? "உருவாக்குகிறது..." : "உருவாக்கு"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Albums grid */}
        {albums.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border">
            <Image className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>இன்னும் அல்பங்கள் இல்லை. "புது அல்பம்" பொத்தானை கிளிக் செய்யுங்கள்.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {albums.map((album) => (
              <div key={album.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {editAlbumId === album.id ? (
                  // Edit form inline
                  <div className="p-4 space-y-3">
                    <input
                      type="text"
                      value={editAlbumTitle}
                      onChange={(e) => setEditAlbumTitle(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editAlbumDesc}
                      onChange={(e) => setEditAlbumDesc(e.target.value)}
                      placeholder="விளக்கம்"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditAlbumId(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ரத்து</button>
                      <button onClick={saveAlbumEdit} disabled={savingAlbum} className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {savingAlbum ? "..." : "சேமி"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    {/* Cover thumbnail */}
                    <div
                      className="w-16 h-16 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0 cursor-pointer"
                      onClick={() => setSelectedAlbum(album)}
                    >
                      {album.photos.length > 0 ? (
                        <img src={photoSrc(album.photos[0].url)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-6 h-6 text-orange-200" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedAlbum(album)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800 truncate">{album.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${album.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {album.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      {album.description && <p className="text-xs text-gray-400 truncate">{album.description}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{album.photos.length} படங்கள்</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => togglePublished(album)}
                        title={album.published ? "Draft-ஆக மாற்று" : "Publish செய்"}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {album.published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditAlbumId(album.id); setEditAlbumTitle(album.title); setEditAlbumDesc(album.description ?? ""); }}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteAlbum(album)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
