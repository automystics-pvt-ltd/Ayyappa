import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import templeHero from '@assets/image_1784865302842.png';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';

export function Hero() {
  return (
    <section id="home" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax effect */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${templeHero})` }}
        />
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-black/30" />
      </motion.div>

      {/* Decorative Mandala/Pattern Overlay (Subtle) */}
      <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/40 via-transparent to-transparent pointer-events-none mix-blend-overlay" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 md:px-6 max-w-5xl mx-auto mt-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div variants={fadeUpVariant} className="mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              <span className="bg-gradient-to-b from-secondary via-secondary to-yellow-600 bg-clip-text text-transparent">
                ஸ்வாமியே சரணம் ஐயப்பா
              </span>
            </h1>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="space-y-4 mb-8">
            <h2 className="text-2xl md:text-4xl font-serif font-bold text-white tracking-wide shadow-black/50 drop-shadow-md">
              அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்
            </h2>
            <p className="text-lg md:text-2xl text-white/90 font-medium tracking-wider">
              வடமதுரை, திண்டுக்கல் மாவட்டம்
            </p>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="bg-black/40 backdrop-blur-sm border border-secondary/30 rounded-2xl py-4 px-6 md:px-10 max-w-3xl mb-12">
            <p className="text-lg md:text-xl text-secondary font-medium mb-2">
              திருப்பணி மற்றும் மகா கும்பாபிஷேக நிதி திரட்டும் இணையதளம்
            </p>
            <p className="text-base md:text-lg text-white/80 italic">
              "ஒரு செங்கல் நீங்கள்... ஒரு கோவில் நமக்கு..."
            </p>
          </motion.div>
          
          <motion.button
            variants={fadeUpVariant}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.querySelector('#donate')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-primary to-orange-600 text-white px-8 md:px-12 py-3 md:py-4 rounded-full text-lg md:text-xl font-bold shadow-[0_0_20px_rgba(196,92,0,0.4)] border border-white/10"
          >
            நன்கொடை வழங்க
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <button 
          onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Scroll down"
        >
          <ChevronDown className="h-10 w-10" />
        </button>
      </motion.div>
    </section>
  );
}
