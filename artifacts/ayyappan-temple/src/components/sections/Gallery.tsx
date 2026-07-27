import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import img1 from '@assets/image_1784877197239.png';
import img2 from '@assets/image_1784877330565.png';
import img3 from '@assets/image_1784877335449.png';
import img4 from '@assets/image_1784877437971.png';
import img5 from '@assets/image_1784877450501.png';
import img6 from '@assets/image_1784877459509.png';

const staticPhotos = [
  { src: img1, caption: 'அருள்மிகு ஸ்ரீ ஐயப்பன் — மலர் அலங்காரம்' },
  { src: img2, caption: 'திருக்கோவில் கர்ப்பகிருஹம்' },
  { src: img3, caption: 'பக்தர்கள் திருப்பணி சேவை' },
  { src: img4, caption: 'வேத சடங்குகள் — ஹோமம்' },
  { src: img5, caption: 'திருவிழா உலா — வீதி புறப்பாடு' },
  { src: img6, caption: 'திருக்கோவில் திருப்பணி நிகழ்வுகள்' },
];

type LivePhoto = { src: string; caption: string };
type AlbumRaw = { id: number; title: string; published: boolean };
type PhotoRaw = { id: number; url: string; caption: string | null };
type Album = { id: number; title: string; photos: LivePhoto[] };

export function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const albumsRaw = (await api.getPublicAlbums()) as AlbumRaw[];
        if (!albumsRaw.length) { setLoaded(true); return; }

        const photoArrays = await Promise.all(
          albumsRaw.map((album) => api.getAlbumPhotos(album.id) as Promise<PhotoRaw[]>)
        );

        const loadedAlbums: Album[] = albumsRaw
          .map((album, idx) => ({
            id: album.id,
            title: album.title,
            photos: photoArrays[idx].map((p) => ({
              src: api.storageUrl(p.url),
              caption: p.caption ?? '',
            })),
          }))
          .filter((a) => a.photos.length > 0);

        if (!cancelled && loadedAlbums.length > 0) {
          setAlbums(loadedAlbums);
          setActiveAlbumId(loadedAlbums[0].id);
        }
      } catch {
        // Silently fall back to static photos
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const useLive = loaded && albums.length > 0;
  const showTabs = useLive && albums.length > 1;

  const activePhotos: LivePhoto[] = useLive
    ? (albums.find((a) => a.id === activeAlbumId)?.photos ?? albums[0].photos)
    : staticPhotos;

  const switchAlbum = (id: number) => {
    setLightboxIndex(null);
    setActiveAlbumId(id);
  };

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = useCallback(() => setLightboxIndex((i) => (i! - 1 + activePhotos.length) % activePhotos.length), [activePhotos.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i! + 1) % activePhotos.length), [activePhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, prev, next]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIndex]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe is dominant and ≥ 50 px
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <section id="gallery" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(46_65%_52%_/_0.06)_0%,_transparent_60%)] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Heading */}
        <motion.div
          className="text-center mb-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.p variants={fadeUpVariant} className="text-secondary font-semibold tracking-widest uppercase text-sm mb-3">
            படங்கள்
          </motion.p>
          <motion.h2 variants={fadeUpVariant} className="font-serif text-3xl md:text-5xl font-bold text-primary mb-4">
            புகைப்பட தொகுப்பு
          </motion.h2>
          <motion.div variants={fadeUpVariant} className="w-20 h-1 bg-secondary mx-auto rounded-full" />
        </motion.div>

        {/* Album tabs — only when multiple albums exist */}
        {showTabs && (
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {albums.map((album) => {
              const isActive = album.id === activeAlbumId;
              return (
                <button
                  key={album.id}
                  onClick={() => switchAlbum(album.id)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 border ${
                    isActive
                      ? 'bg-secondary text-white border-secondary shadow-md scale-105'
                      : 'bg-background text-primary border-primary/20 hover:border-secondary/60 hover:text-secondary'
                  }`}
                >
                  {album.title}
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAlbumId ?? 'static'}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            viewport={{ once: true, margin: '-60px' }}
          >
            {activePhotos.map((photo, i) => (
              <motion.div
                key={i}
                variants={fadeUpVariant}
                className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer aspect-[4/3]"
                onClick={() => openLightbox(i)}
              >
                <img
                  src={photo.src}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm font-medium leading-snug translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {photo.caption}
                  </p>
                </div>
                {/* Corner badge */}
                <div className="absolute top-3 right-3 bg-secondary/90 text-white text-xs font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  பெரிதாக்க
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/92 backdrop-blur-sm flex items-center justify-center"
            onClick={closeLightbox}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close — larger touch target on mobile */}
            <button
              className="absolute top-3 right-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev — full-height left zone on mobile, visible button on desktop */}
            {activePhotos.length > 1 && (
              <button
                className="absolute left-0 md:left-4 top-0 bottom-0 md:top-auto md:bottom-auto md:translate-y-0 w-14 md:w-auto flex items-center justify-start md:justify-center pl-2 md:pl-0 text-white/80 hover:text-white md:bg-white/10 md:hover:bg-white/20 md:rounded-full md:p-3 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-8 h-8 drop-shadow-lg" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col items-center justify-center gap-3 px-14 md:px-20 py-16"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activePhotos[lightboxIndex].src}
                alt={activePhotos[lightboxIndex].caption}
                className="max-h-[78vh] max-w-full w-auto rounded-xl shadow-2xl object-contain select-none"
                draggable={false}
              />
              <p className="text-white/90 text-center text-sm md:text-base font-medium px-4 max-w-xl leading-snug">
                {activePhotos[lightboxIndex].caption}
              </p>
              <p className="text-white/40 text-xs md:text-sm">
                {lightboxIndex + 1} / {activePhotos.length}
              </p>
            </motion.div>

            {/* Next — full-height right zone on mobile, visible button on desktop */}
            {activePhotos.length > 1 && (
              <button
                className="absolute right-0 md:right-4 top-0 bottom-0 md:top-auto md:bottom-auto w-14 md:w-auto flex items-center justify-end md:justify-center pr-2 md:pr-0 text-white/80 hover:text-white md:bg-white/10 md:hover:bg-white/20 md:rounded-full md:p-3 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next photo"
              >
                <ChevronRight className="w-8 h-8 drop-shadow-lg" />
              </button>
            )}

            {/* Swipe hint — shows briefly on touch devices */}
            <p className="absolute bottom-4 left-0 right-0 text-center text-white/25 text-xs pointer-events-none md:hidden">
              ← swipe →
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
