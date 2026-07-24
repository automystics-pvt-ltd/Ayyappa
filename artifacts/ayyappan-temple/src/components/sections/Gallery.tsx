import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import img1 from '@assets/image_1784877197239.png';
import img2 from '@assets/image_1784877330565.png';
import img3 from '@assets/image_1784877335449.png';
import img4 from '@assets/image_1784877437971.png';
import img5 from '@assets/image_1784877450501.png';
import img6 from '@assets/image_1784877459509.png';

const photos = [
  { src: img1, caption: 'அருள்மிகு ஸ்ரீ ஐயப்பன் — மலர் அலங்காரம்' },
  { src: img2, caption: 'திருக்கோவில் கர்ப்பகிருஹம்' },
  { src: img3, caption: 'பக்தர்கள் திருப்பணி சேவை' },
  { src: img4, caption: 'வேத சடங்குகள் — ஹோமம்' },
  { src: img5, caption: 'திருவிழா உலா — வீதி புறப்பாடு' },
  { src: img6, caption: 'திருக்கோவில் திருப்பணி நிகழ்வுகள்' },
];

export function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i! - 1 + photos.length) % photos.length);
  const next = () => setLightboxIndex((i) => (i! + 1) % photos.length);

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

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {photos.map((photo, i) => (
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
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-10"
              onClick={closeLightbox}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev */}
            <button
              className="absolute left-3 md:left-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="max-w-3xl w-full flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[lightboxIndex].src}
                alt={photos[lightboxIndex].caption}
                className="max-h-[75vh] w-auto rounded-xl shadow-2xl object-contain"
              />
              <p className="text-white/90 text-center text-base font-medium px-4">
                {photos[lightboxIndex].caption}
              </p>
              <p className="text-white/40 text-sm">
                {lightboxIndex + 1} / {photos.length}
              </p>
            </motion.div>

            {/* Next */}
            <button
              className="absolute right-3 md:right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
