import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { Plus, Trash2, Pencil, ChevronLeft, Image, UploadCloud, X, Check, Eye, EyeOff, GripVertical, Save } from "lucide-react";

type GalleryPhoto = {
  id: number; albumId: number; url: string; caption: string | null; sortOrder: number; createdAt: string;
};
type GalleryAlbum = {
  id: number; title: string; description: string | null; coverUrl: string | null;
  sortOrder: number; published: boolean; createdAt: string; photos: GalleryPhoto[];
};

export default function GalleryAdmin() {
  const { t } = useLanguage();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);

  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [editAlbumId, setEditAlbumId] = useState<number | null>(null);
  const [editAlbumTitle, setEditAlbumTitle] = useState("");
  const [editAlbumDesc, setEditAlbumDesc] = useState("");
  const [savingAlbum, setSavingAlbum] = useState(false);

  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editCaptionId, setEditCaptionId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [orderedPhotos, setOrderedPhotos] = useState<GalleryPhoto[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const touchDragIndexRef = useRef<number | null>(null);
  const touchDragOverIndexRef = useRef<number | null>(null);
  const [draggingPhotoIndex, setDraggingPhotoIndex] = useState<number | null>(null);
  const [dragOverPhotoIndex, setDragOverPhotoIndex] = useState<number | null>(null);
  const photoGridRef = useRef<HTMLDivElement>(null);
  const touchDragOccurredRef = useRef(false);

  const [orderedAlbums, setOrderedAlbums] = useState<GalleryAlbum[]>([]);
  const [isAlbumsDirty, setIsAlbumsDirty] = useState(false);
  const [savingAlbumOrder, setSavingAlbumOrder] = useState(false);
  const albumDragIndexRef = useRef<number | null>(null);
  const albumDragOverIndexRef = useRef<number | null>(null);

  const albumTouchDragIndexRef = useRef<number | null>(null);
  const albumTouchDragOverIndexRef = useRef<number | null>(null);
  const [draggingAlbumIndex, setDraggingAlbumIndex] = useState<number | null>(null);
  const [dragOverAlbumIndex, setDragOverAlbumIndex] = useState<number | null>(null);
  const albumListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const album = albums.find((a) => a.id === selectedAlbum?.id) ?? selectedAlbum;
    if (album) { setOrderedPhotos([...album.photos].sort((a, b) => a.sortOrder - b.sortOrder)); setIsDirty(false); }
  }, [selectedAlbum?.id, albums]);

  useEffect(() => {
    if (!isAlbumsDirty) setOrderedAlbums([...albums].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [albums]);

  // ─── Album drag (mouse) ───────────────────────────────────────────────────
  const handleAlbumDragStart = (index: number) => { albumDragIndexRef.current = index; };
  const handleAlbumDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); albumDragOverIndexRef.current = index; };
  const handleAlbumDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = albumDragIndexRef.current; const to = albumDragOverIndexRef.current;
    if (from === null || to === null || from === to) return;
    const reordered = [...orderedAlbums]; const [moved] = reordered.splice(from, 1); reordered.splice(to, 0, moved);
    setOrderedAlbums(reordered); setIsAlbumsDirty(true);
    albumDragIndexRef.current = null; albumDragOverIndexRef.current = null;
  };

  // ─── Album drag (touch) ───────────────────────────────────────────────────
  const handleAlbumTouchStart = (index: number) => { albumTouchDragIndexRef.current = index; setDraggingAlbumIndex(index); };
  const resetAlbumDragState = () => { albumTouchDragIndexRef.current = null; albumTouchDragOverIndexRef.current = null; setDraggingAlbumIndex(null); setDragOverAlbumIndex(null); };
  const handleAlbumTouchEnd = () => {
    const from = albumTouchDragIndexRef.current; const to = albumTouchDragOverIndexRef.current;
    resetAlbumDragState();
    if (from !== null && to !== null && from !== to) {
      const reordered = [...orderedAlbums]; const [moved] = reordered.splice(from, 1); reordered.splice(to, 0, moved);
      setOrderedAlbums(reordered); setIsAlbumsDirty(true);
    }
  };

  useEffect(() => {
    const list = albumListRef.current; if (!list) return;
    const onTouchMove = (e: TouchEvent) => {
      if (albumTouchDragIndexRef.current === null) return;
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
      if (!el) return;
      const item = el.closest("[data-album-index]") as HTMLElement | null;
      if (item) { const idx = parseInt(item.dataset.albumIndex ?? "-1", 10); if (idx >= 0 && idx !== albumTouchDragOverIndexRef.current) { albumTouchDragOverIndexRef.current = idx; setDragOverAlbumIndex(idx); } }
    };
    list.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => list.removeEventListener("touchmove", onTouchMove);
  }, [orderedAlbums]);

  const saveAlbumOrder = async () => {
    setSavingAlbumOrder(true);
    try { await Promise.all(orderedAlbums.map((album, idx) => api.updateAlbum(album.id, { sortOrder: idx }))); setIsAlbumsDirty(false); await fetchAlbums(); }
    catch (e: any) { alert(e.message); } finally { setSavingAlbumOrder(false); }
  };

  // ─── Photo drag (mouse) ───────────────────────────────────────────────────
  const handleDragStart = (index: number) => { dragIndexRef.current = index; };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); dragOverIndexRef.current = index; };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndexRef.current; const to = dragOverIndexRef.current;
    if (from === null || to === null || from === to) return;
    const reordered = [...orderedPhotos]; const [moved] = reordered.splice(from, 1); reordered.splice(to, 0, moved);
    setOrderedPhotos(reordered); setIsDirty(true); dragIndexRef.current = null; dragOverIndexRef.current = null;
  };

  // ─── Photo drag (touch) ───────────────────────────────────────────────────
  const handlePhotoTouchStart = (index: number) => { touchDragIndexRef.current = index; setDraggingPhotoIndex(index); };
  const handlePhotoTouchEnd = (photoUrl: string) => {
    const from = touchDragIndexRef.current; const to = touchDragOverIndexRef.current;
    touchDragIndexRef.current = null; touchDragOverIndexRef.current = null;
    setDraggingPhotoIndex(null); setDragOverPhotoIndex(null);
    if (from !== null && to !== null && from !== to) {
      touchDragOccurredRef.current = true;
      const reordered = [...orderedPhotos]; const [moved] = reordered.splice(from, 1); reordered.splice(to, 0, moved);
      setOrderedPhotos(reordered); setIsDirty(true);
    } else { touchDragOccurredRef.current = false; setLightboxUrl(photoSrc(photoUrl)); }
  };

  useEffect(() => {
    const grid = photoGridRef.current; if (!grid) return;
    const onTouchMove = (e: TouchEvent) => {
      if (touchDragIndexRef.current === null) return;
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
      if (!el) return;
      const item = el.closest("[data-photo-index]") as HTMLElement | null;
      if (item) { const idx = parseInt(item.dataset.photoIndex ?? "-1", 10); if (idx >= 0 && idx !== touchDragOverIndexRef.current) { touchDragOverIndexRef.current = idx; setDragOverPhotoIndex(idx); } }
    };
    grid.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => grid.removeEventListener("touchmove", onTouchMove);
  }, [orderedPhotos]);

  const savePhotoOrder = async () => {
    setSavingOrder(true);
    try { await Promise.all(orderedPhotos.map((photo, idx) => api.updatePhoto(photo.id, { sortOrder: idx }))); setIsDirty(false); await fetchAlbums(); }
    catch (e: any) { alert(e.message); } finally { setSavingOrder(false); }
  };

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminAlbums(); setAlbums(data as GalleryAlbum[]);
      if (selectedAlbum) { const updated = (data as GalleryAlbum[]).find((a) => a.id === selectedAlbum.id); setSelectedAlbum(updated ?? null); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchAlbums(); }, []);

  const createAlbum = async () => {
    if (!newAlbumTitle.trim()) return; setCreating(true);
    try { await api.createAlbum({ title: newAlbumTitle.trim(), description: newAlbumDesc.trim() || undefined }); setNewAlbumTitle(""); setNewAlbumDesc(""); setShowCreateAlbum(false); await fetchAlbums(); }
    catch (e: any) { alert(e.message); } finally { setCreating(false); }
  };

  const saveAlbumEdit = async () => {
    if (!editAlbumId || !editAlbumTitle.trim()) return; setSavingAlbum(true);
    try { await api.updateAlbum(editAlbumId, { title: editAlbumTitle.trim(), description: editAlbumDesc.trim() || undefined }); setEditAlbumId(null); await fetchAlbums(); }
    catch (e: any) { alert(e.message); } finally { setSavingAlbum(false); }
  };

  const togglePublished = async (album: GalleryAlbum) => {
    try { await api.updateAlbum(album.id, { published: !album.published }); await fetchAlbums(); }
    catch (e: any) { alert(e.message); }
  };

  const deleteAlbum = async (album: GalleryAlbum) => {
    if (!confirm(`"${album.title}" ${t("அல்பமை நீக்கவா? இதிலுள்ள","— delete this album? All")} ${album.photos.length} ${t("புகைப்படங்களும் நீக்கப்படும்.","photos will also be deleted.")}`)) return;
    try { await api.deleteAlbum(album.id); if (selectedAlbum?.id === album.id) setSelectedAlbum(null); await fetchAlbums(); }
    catch (e: any) { alert(e.message); }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedAlbum) return;
    const fileArr = Array.from(files); setUploadingPhotos(true);
    try {
      for (let i = 0; i < fileArr.length; i++) {
        const file = fileArr[i];
        setUploadProgress(`${t("படம்","Photo")} ${i + 1} / ${fileArr.length} ${t("பதிவேற்றுகிறது...","uploading...")}`);
        const { uploadURL, objectPath } = await api.getGalleryUploadUrl(file.type, file.size) as { uploadURL: string; objectPath: string };
        const res = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!res.ok) throw new Error("Upload failed for " + file.name);
        await api.addPhoto({ albumId: selectedAlbum.id, url: objectPath, sortOrder: (selectedAlbum.photos.length + i) });
      }
      await fetchAlbums();
    } catch (e: any) { alert(e.message); }
    finally { setUploadingPhotos(false); setUploadProgress(""); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const saveCaption = async () => {
    if (!editCaptionId) return; setSavingCaption(true);
    try { await api.updatePhoto(editCaptionId, { caption: editCaption }); setEditCaptionId(null); await fetchAlbums(); }
    catch (e: any) { alert(e.message); } finally { setSavingCaption(false); }
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    if (!confirm(t("இந்த புகைப்படத்தை நீக்கவா?","Delete this photo?"))) return;
    try { await api.deletePhoto(photo.id); await fetchAlbums(); }
    catch (e: any) { alert(e.message); }
  };

  const photoSrc = (objectPath: string) => api.storageUrl(objectPath);

  if (loading) return (
    <AdminLayout><div className="text-center py-20 text-gray-400">{t("ஏற்றுகிறது...","Loading...")}</div></AdminLayout>
  );

  // ─── Album detail view ────────────────────────────────────────────────────
  if (selectedAlbum) {
    const album = albums.find((a) => a.id === selectedAlbum.id) ?? selectedAlbum;
    return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0">
              <ChevronLeft className="w-4 h-4" /> {t("திரும்பு","Back")}
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{album.title}</h1>
              {album.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{album.description}</p>}
            </div>
            <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${album.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {album.published ? t("வெளியிடப்பட்டது","Published") : "Draft"}
            </span>
          </div>

          {/* Upload zone */}
          <div className="mb-6 border-2 border-dashed border-orange-200 rounded-xl p-4 sm:p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)} />
            {uploadingPhotos ? (
              <div className="text-orange-600 font-medium">{uploadProgress || t("பதிவேற்றுகிறது...","Uploading...")}</div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-orange-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {t("படங்களை இங்கே இழுத்து விடுங்கள் அல்லது","Drag images here or")}{" "}
                  <span className="text-orange-500 font-medium">{t("கோப்புகளை தேர்வு செய்யுங்கள்","choose files")}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF • max 20 MB each</p>
              </>
            )}
          </div>

          {/* Save order bar */}
          {isDirty && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <p className="text-sm text-orange-700">{t("வரிசை மாற்றப்பட்டது. சேமிக்கவும்.","Order changed. Save to apply.")}</p>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { const a = albums.find((a) => a.id === selectedAlbum?.id) ?? selectedAlbum; if (a) setOrderedPhotos([...a.photos].sort((a, b) => a.sortOrder - b.sortOrder)); setIsDirty(false); }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  {t("ரத்து","Cancel")}
                </button>
                <button onClick={savePhotoOrder} disabled={savingOrder}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" />
                  {savingOrder ? t("சேமிக்கிறது...","Saving...") : t("வரிசை சேமி","Save Order")}
                </button>
              </div>
            </div>
          )}

          {/* Photo grid */}
          {orderedPhotos.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
              <Image className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t("இன்னும் படங்கள் இல்லை. மேலே பதிவேற்றுங்கள்.","No photos yet. Upload above.")}</p>
            </div>
          ) : (
            <div ref={photoGridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {orderedPhotos.map((photo, idx) => {
                const isDraggingThis = draggingPhotoIndex === idx;
                const isDropTarget = dragOverPhotoIndex === idx && draggingPhotoIndex !== null && draggingPhotoIndex !== idx;
                return (
                  <div key={photo.id} data-photo-index={idx} draggable
                    onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={handleDrop}
                    onTouchStart={() => handlePhotoTouchStart(idx)} onTouchEnd={() => handlePhotoTouchEnd(photo.url)}
                    onClick={() => { if (touchDragOccurredRef.current) { touchDragOccurredRef.current = false; return; } setLightboxUrl(photoSrc(photo.url)); }}
                    className={["group relative rounded-xl overflow-hidden bg-gray-100 aspect-square shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150 select-none",
                      isDraggingThis ? "opacity-40 scale-95 ring-2 ring-orange-400" : "",
                      isDropTarget ? "ring-2 ring-orange-500 scale-105 shadow-lg" : ""].join(" ")}>
                    <img src={photoSrc(photo.url)} alt={photo.caption ?? ""} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                    <div className="absolute top-2 left-2 bg-black/40 text-white p-1 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    {!isDraggingThis && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end gap-1">
                          <button onTouchEnd={(e) => { e.stopPropagation(); setEditCaptionId(photo.id); setEditCaption(photo.caption ?? ""); }}
                            onClick={(e) => { e.stopPropagation(); setEditCaptionId(photo.id); setEditCaption(photo.caption ?? ""); }}
                            className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg transition-colors" title={t("Caption திருத்து","Edit Caption")}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onTouchEnd={(e) => { e.stopPropagation(); deletePhoto(photo); }}
                            onClick={(e) => { e.stopPropagation(); deletePhoto(photo); }}
                            className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors" title={t("நீக்கு","Delete")}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {photo.caption && <p className="text-white text-xs leading-snug line-clamp-2">{photo.caption}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit caption modal */}
        {editCaptionId !== null && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-gray-800 mb-4">{t("Caption திருத்து","Edit Caption")}</h3>
              <input type="text" value={editCaption} onChange={(e) => setEditCaption(e.target.value)}
                placeholder={t("புகைப்பட விளக்கம்...","Photo description...")}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 mb-4" autoFocus />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditCaptionId(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t("ரத்து","Cancel")}</button>
                <button onClick={saveCaption} disabled={savingCaption}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                  {savingCaption ? "..." : t("சேமி","Save")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
            <button className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-2 rounded-full"><X className="w-5 h-5" /></button>
            <img src={lightboxUrl} alt="" className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </AdminLayout>
    );
  }

  // ─── Album list view ──────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 min-w-0 truncate">{t("படத் தொகுப்பு மேலாண்மை","Gallery Management")}</h1>
          <button onClick={() => setShowCreateAlbum(true)}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">{t("புது அல்பம்","New Album")}</span><span className="sm:hidden">{t("அல்பம்","Album")}</span>
          </button>
        </div>

        {/* Create album form */}
        {showCreateAlbum && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">{t("புது அல்பம் உருவாக்கு","Create New Album")}</h3>
            <div className="space-y-3">
              <input type="text" value={newAlbumTitle} onChange={(e) => setNewAlbumTitle(e.target.value)}
                placeholder={`${t("அல்பம் பெயர்","Album name")} *`}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" autoFocus />
              <input type="text" value={newAlbumDesc} onChange={(e) => setNewAlbumDesc(e.target.value)}
                placeholder={`${t("விளக்கம்","Description")} (optional)`}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateAlbum(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t("ரத்து","Cancel")}</button>
                <button onClick={createAlbum} disabled={creating || !newAlbumTitle.trim()}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                  {creating ? t("உருவாக்குகிறது...","Creating...") : t("உருவாக்கு","Create")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save album order bar */}
        {isAlbumsDirty && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <p className="text-sm text-orange-700">{t("அல்பம் வரிசை மாற்றப்பட்டது. சேமிக்கவும்.","Album order changed. Save to apply.")}</p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { setOrderedAlbums([...albums].sort((a, b) => a.sortOrder - b.sortOrder)); setIsAlbumsDirty(false); }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t("ரத்து","Cancel")}</button>
              <button onClick={saveAlbumOrder} disabled={savingAlbumOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                <Save className="w-3.5 h-3.5" />
                {savingAlbumOrder ? t("சேமிக்கிறது...","Saving...") : t("வரிசை சேமி","Save Order")}
              </button>
            </div>
          </div>
        )}

        {/* Albums grid */}
        {orderedAlbums.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border">
            <Image className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{t("இன்னும் அல்பங்கள் இல்லை.","No albums yet.")} {t("'புது அல்பம்' பொத்தானை கிளிக் செய்யுங்கள்.","Click 'New Album' to get started.")}</p>
          </div>
        ) : (
          <div ref={albumListRef} className="space-y-3">
            {orderedAlbums.map((album, albumIdx) => {
              const isDraggingThis = draggingAlbumIndex === albumIdx;
              const isDropTarget = dragOverAlbumIndex === albumIdx && draggingAlbumIndex !== null && draggingAlbumIndex !== albumIdx;
              return (
                <div key={album.id} data-album-index={albumIdx} draggable={editAlbumId !== album.id}
                  onDragStart={() => handleAlbumDragStart(albumIdx)} onDragOver={(e) => handleAlbumDragOver(e, albumIdx)} onDrop={handleAlbumDrop}
                  onTouchEnd={editAlbumId !== album.id ? handleAlbumTouchEnd : undefined}
                  onTouchCancel={editAlbumId !== album.id ? resetAlbumDragState : undefined}
                  className={["bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-150 select-none",
                    isDraggingThis ? "opacity-40 scale-[0.98] ring-2 ring-orange-400" : "",
                    isDropTarget ? "ring-2 ring-orange-500 shadow-lg" : ""].join(" ")}>
                  {editAlbumId === album.id ? (
                    <div className="p-4 space-y-3">
                      <input type="text" value={editAlbumTitle} onChange={(e) => setEditAlbumTitle(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" autoFocus />
                      <input type="text" value={editAlbumDesc} onChange={(e) => setEditAlbumDesc(e.target.value)}
                        placeholder={t("விளக்கம்","Description")}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditAlbumId(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t("ரத்து","Cancel")}</button>
                        <button onClick={saveAlbumEdit} disabled={savingAlbum} className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {savingAlbum ? "..." : t("சேமி","Save")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
                      <div className="text-gray-300 hover:text-gray-500 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
                        title={t("இழுத்து வரிசை மாற்றுங்கள்","Drag to reorder")}
                        onTouchStart={() => handleAlbumTouchStart(albumIdx)}>
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0 cursor-pointer" onClick={() => setSelectedAlbum(album)}>
                        {album.photos.length > 0 ? (
                          <img src={photoSrc(album.photos[0].url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Image className="w-6 h-6 text-orange-200" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedAlbum(album)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800 truncate">{album.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${album.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {album.published ? t("வெளியிடப்பட்டது","Published") : "Draft"}
                          </span>
                        </div>
                        {album.description && <p className="text-xs text-gray-400 truncate">{album.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{album.photos.length} {t("படங்கள்","photos")}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onTouchEnd={(e) => { e.preventDefault(); togglePublished(album); }} onClick={() => togglePublished(album)}
                          title={album.published ? t("Draft-ஆக மாற்று","Set to Draft") : t("Publish செய்","Publish")}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          {album.published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button onTouchEnd={(e) => { e.preventDefault(); setEditAlbumId(album.id); setEditAlbumTitle(album.title); setEditAlbumDesc(album.description ?? ""); }}
                          onClick={() => { setEditAlbumId(album.id); setEditAlbumTitle(album.title); setEditAlbumDesc(album.description ?? ""); }}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onTouchEnd={(e) => { e.preventDefault(); deleteAlbum(album); }} onClick={() => deleteAlbum(album)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
