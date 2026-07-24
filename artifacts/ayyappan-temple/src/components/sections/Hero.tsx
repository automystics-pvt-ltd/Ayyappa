import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import templeHero from '@assets/temple_hero_hd_2.png';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { NewsTicker } from './NewsTicker';

export function Hero() {
  const s = useSiteSettings();
  const title   = s.hero_title   || 'ஸ்வாமியே சரணம் ஐயப்பா';
  const subtitle = s.hero_subtitle || 'அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்';
  const location = s.hero_location || 'வடமதுரை, திண்டுக்கல் மாவட்டம்';
  const tagline  = s.hero_tagline  || 'திருப்பணி மற்றும் மகா கும்பாபிஷேக நிதி திரட்டும் இணையதளம்';
  const quote    = s.hero_quote    || '"ஒரு செங்கல் நீங்கள்... ஒரு கோவில் நமக்கு..."';

  return (
    <section id="home" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }} animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${templeHero})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-black/15" />
      </motion.div>

      <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/40 via-transparent to-transparent pointer-events-none mix-blend-overlay" />

      <div className="relative z-10 text-center px-4 md:px-6 max-w-5xl mx-auto">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible"
          className="flex flex-col items-center">
          <motion.div variants={fadeUpVariant} className="mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              <span className="bg-gradient-to-b from-secondary via-secondary to-yellow-600 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="space-y-4 mb-8">
            <h2 className="text-2xl md:text-4xl font-serif font-bold text-white tracking-wide shadow-black/50 drop-shadow-md">
              {subtitle}
            </h2>
            <p className="text-lg md:text-2xl text-white/90 font-medium tracking-wider">{location}</p>
          </motion.div>

          <motion.div variants={fadeUpVariant}
            className="bg-black/40 backdrop-blur-sm border border-secondary/30 rounded-2xl py-4 px-6 md:px-10 max-w-3xl mb-4">
            <p className="text-lg md:text-xl text-secondary font-medium mb-2">{tagline}</p>
            <p className="text-base md:text-lg text-white/80 italic">{quote}</p>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="mb-8 w-full flex justify-center">
            <NewsTicker />
          </motion.div>

          <motion.button variants={fadeUpVariant} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => document.querySelector('#donate')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-primary to-orange-600 text-white px-8 md:px-12 py-3 md:py-4 rounded-full text-lg md:text-xl font-bold shadow-[0_0_20px_rgba(196,92,0,0.4)] border border-white/10">
            நன்கொடை வழங்க
          </motion.button>
        </motion.div>
      </div>

      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
        <button onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-white/70 hover:text-white transition-colors" aria-label="Scroll down">
          <ChevronDown className="h-10 w-10" />
        </button>
      </motion.div>
    </section>
  );
}
