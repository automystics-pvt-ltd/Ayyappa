import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { Sparkles } from 'lucide-react';
import { useSiteSettings, parseJsonSetting } from '@/hooks/useSiteSettings';

const DEFAULT_EVENTS = [
  'கணபதி ஹோமம்',
  'யாகசாலை பூஜைகள்',
  'வேத பாராயணம்',
  'மகா அபிஷேகம்',
  'கும்பாபிஷேகம்',
  'அன்னதானம்',
  'பக்தர்களுக்கு பிரசாதம்',
];

export function Kumbhabhishekam() {
  const s = useSiteSettings();
  const badge   = s.kumbhabhishekam_badge || 'புனித குடமுழுக்கு விழா';
  const title   = s.kumbhabhishekam_title || 'மகா கும்பாபிஷேகம்';
  const desc    = s.kumbhabhishekam_desc  || 'இறைவனின் அருளால் நடைபெறவுள்ள மகா கும்பாபிஷேக விழாவிற்கு அனைத்து பக்தர்களையும் அன்புடன் வரவேற்கிறோம்.';
  const events  = parseJsonSetting<string[]>(s.kumbhabhishekam_events, DEFAULT_EVENTS);

  return (
    <section id="kumbhabhishekam" className="py-24 relative overflow-hidden bg-foreground">
      {/* Golden rich background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
        >
          <div className="inline-flex items-center justify-center gap-2 text-secondary mb-4">
            <Sparkles className="w-6 h-6" />
            <span className="uppercase tracking-widest text-sm font-bold">{badge}</span>
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-secondary mb-4 sm:mb-6 drop-shadow-md leading-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 max-w-3xl mx-auto font-medium leading-relaxed">
            {desc}
          </p>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {events.map((event, idx) => (
              <motion.div
                key={idx}
                variants={fadeUpVariant}
                className="bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/30 rounded-xl p-5 sm:p-6 text-center backdrop-blur-sm hover:bg-secondary/20 hover:border-secondary/50 transition-all duration-300"
              >
                <h4 className="text-base sm:text-lg md:text-xl font-bold text-secondary drop-shadow-sm">{event}</h4>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
