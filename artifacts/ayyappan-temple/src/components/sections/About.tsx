import { motion } from 'framer-motion';
import templeView from '@assets/image_1784865355458.png';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { Calendar, Clock, Users } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function About() {
  const s = useSiteSettings();
  const history  = s.about_history  || 'வடமதுரை பகுதியில் அமைந்துள்ள அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில், ஆயிரக்கணக்கான பக்தர்களின் ஆன்மீக வழிபாட்டு தலமாக திகழ்கிறது. இத்திருக்கோவிலில் தினசரி பூஜைகள், சிறப்பு வழிபாடுகள், மண்டல பூஜை, மகரஜோதி பூஜை மற்றும் ஐயப்ப பக்தர்களுக்கான ஆன்மீக நிகழ்ச்சிகள் சிறப்பாக நடைபெற்று வருகின்றன.';
  const years    = s.about_years    || 'பல ஆண்டுகள்';
  const pujas    = s.about_daily_pujas || '3 வேளை';
  const devotees = s.about_devotees || 'ஆயிரக்கணக்கானோர்';

  return (
    <section id="about" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
          variants={staggerContainer} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}>

          <motion.div variants={fadeUpVariant} className="w-full lg:w-1/2 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />
              <img src={templeView} alt="அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்"
                className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-primary/50 rounded-tl-xl" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-primary/50 rounded-br-xl" />
          </motion.div>

          <motion.div variants={fadeUpVariant} className="w-full lg:w-1/2">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6 inline-flex flex-col">
              ஆலய வரலாறு
              <span className="h-1 w-24 bg-primary mt-3 rounded-full" />
            </h2>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-10 font-medium whitespace-pre-line">
              {history}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { Icon: Calendar, label: 'வருட வரலாறு', value: years },
                { Icon: Clock,    label: 'தினசரி பூஜைகள்', value: pujas },
                { Icon: Users,    label: 'பக்தர்கள்',       value: devotees },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="bg-card border border-card-border rounded-xl p-4 shadow-sm flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide leading-tight">{label}</div>
                  <div className="text-base font-bold text-foreground leading-snug">{value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
