import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { CheckCircle2, Droplets, Flame, Hammer, Lightbulb, MapPin, Shield, Star, Tent, Trees } from 'lucide-react';

const renovationWorks = [
  { title: 'கருவறை திருப்பணி', icon: Flame },
  { title: 'ராஜகோபுரம் அமைத்தல்', icon: Star },
  { title: 'முன்மண்டபம் புதுப்பித்தல்', icon: Tent },
  { title: 'சுற்றுச்சுவர் கட்டுமானம்', icon: Shield },
  { title: 'கோவில் தரை அமைத்தல்', icon: MapPin },
  { title: 'மின்வசதி மேம்பாடு', icon: Lightbulb },
  { title: 'குடிநீர் வசதி', icon: Droplets },
  { title: 'அன்னதான மண்டபம்', icon: Hammer },
  { title: 'பக்தர்கள் அமரும் இட வசதி', icon: Trees },
];

const progressStats = [
  { title: 'கருவறை', value: 100 },
  { title: 'மண்டபம்', value: 70 },
  { title: 'ராஜகோபுரம்', value: 40 },
  { title: 'சுற்றுச்சுவர்', value: 60 },
  { title: 'மின்வசதி', value: 35 },
];

export function Renovation() {
  return (
    <section id="renovation" className="py-20 md:py-32 bg-[#F9F7F1] relative">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            திருப்பணி விவரங்கள்
          </h2>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-6" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            பக்தர்களின் பேராதரவுடன் நடைபெறும் திருப்பணிகளின் விவரங்கள்
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* List of works */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <h3 className="text-2xl font-serif font-semibold mb-8 text-foreground">நடைபெறும் பணிகள்</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {renovationWorks.map((work, idx) => {
                const Icon = work.icon;
                const isLastOdd = idx === renovationWorks.length - 1 && renovationWorks.length % 2 !== 0;
                return (
                  <motion.div 
                    key={idx}
                    variants={fadeUpVariant}
                    className={`flex items-center gap-3 bg-white p-4 rounded-xl border border-border shadow-sm hover:border-primary/30 transition-colors group${isLastOdd ? ' sm:col-span-2 sm:max-w-sm sm:mx-auto sm:w-full' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{work.title}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Progress bars */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="bg-white p-8 rounded-2xl border border-border shadow-xl"
          >
            <h3 className="text-2xl font-serif font-semibold mb-8 text-foreground">பணிகளின் நிலை</h3>
            <div className="space-y-8">
              {progressStats.map((stat, idx) => (
                <motion.div key={idx} variants={fadeUpVariant}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-semibold text-foreground text-lg">{stat.title}</span>
                    <span className="text-sm font-bold text-primary">{stat.value}%</span>
                  </div>
                  <div className="h-3 w-full bg-secondary/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${stat.value}%` }}
                      transition={{ duration: 1.5, delay: 0.2 + (idx * 0.1), ease: "easeOut" }}
                      viewport={{ once: true }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
