import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import guruKannan from '@assets/image_1784877148291.png';
import guruShanmuga from '@assets/image_1784877158070.png';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const DEFAULT_GURUS = [
  { name: 'திரு. செந்தாமரை கண்ணன் அவர்கள்', image: guruKannan },
  { name: 'திரு. சண்முகவேல் அவர்கள்',         image: guruShanmuga },
];

export function Gurus() {
  const s = useSiteSettings();
  const description = s.guru_description ||
    'இறையருளும், குருவருளும் ஒன்றிணைந்து பக்தர்களுக்கு ஆன்மீக வழிகாட்டுதலாக திகழும் நமது மதிப்பிற்குரிய குருநாதர்கள் அவர்களுக்கு எங்களின் பணிவான வணக்கங்களைத் தெரிவித்துக் கொள்கிறோம். அவர்களின் ஆன்மீக வழிகாட்டுதல், இறைப்பணி மீதான அர்ப்பணிப்பு மற்றும் பக்தர்களை ஒன்றிணைக்கும் சேவை மனப்பான்மையால், வடமதுரை அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவிலின் வளர்ச்சிக்கும், திருப்பணி மற்றும் மகா கும்பாபிஷேகப் பணிகளுக்கும் பெரும் ஊக்கமாக இருந்து வருகிறது.';
  const quote = s.guru_quote || '"குருவருள் இருந்தால் திருவருள் நிச்சயம்."';

  return (
    <section id="gurus" className="py-20 md:py-32 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(28 60% 96%) 50%, hsl(var(--background)) 100%)' }}>
      <div className="absolute top-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl translate-x-1/3 translate-y-1/4 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <motion.div className="text-center mb-14" variants={staggerContainer}
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.p variants={fadeUpVariant} className="text-secondary font-semibold tracking-widest uppercase text-sm mb-3">
            ஆன்மீக வழிகாட்டுதல்
          </motion.p>
          <motion.h2 variants={fadeUpVariant} className="font-serif text-3xl md:text-5xl font-bold text-primary mb-4">
            நமது குருநாதர்கள்
          </motion.h2>
          <motion.div variants={fadeUpVariant} className="w-20 h-1 bg-secondary mx-auto rounded-full" />
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row justify-center gap-10 mb-14"
          variants={staggerContainer} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}>
          {DEFAULT_GURUS.map((guru) => (
            <motion.div key={guru.name} variants={fadeUpVariant}
              className="flex flex-col items-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary via-primary to-secondary opacity-30 blur-sm scale-105" />
                <div className="relative w-44 h-44 xs:w-52 xs:h-52 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-secondary/60 shadow-2xl ring-4 ring-primary/20">
                  <img src={guru.image} alt={guru.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <h3 className="font-serif text-lg xs:text-xl md:text-2xl font-bold text-primary text-center leading-snug mt-3 sm:mt-4 px-2 sm:px-4">
                {guru.name}
              </h3>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }} className="max-w-3xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm border border-secondary/30 rounded-2xl shadow-xl p-8 md:p-10 text-center">
            <p className="text-foreground/80 text-base md:text-lg leading-relaxed mb-6 whitespace-pre-line">
              {description}
            </p>
            <div className="border-t border-secondary/30 pt-6">
              <p className="font-serif text-lg md:text-xl font-bold text-secondary italic">{quote}</p>
              <p className="mt-4 text-primary font-semibold text-lg tracking-wide">🙏 ஸ்வாமியே சரணம் ஐயப்பா 🙏</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
