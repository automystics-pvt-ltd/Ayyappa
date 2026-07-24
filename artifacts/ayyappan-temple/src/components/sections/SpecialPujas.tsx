import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { Flower2 } from 'lucide-react';
import { useSiteSettings, parseJsonSetting } from '@/hooks/useSiteSettings';

const DEFAULT_PUJAS = ['மாத முதல் சனி', 'பௌர்ணமி பூஜை', 'அமாவாசை பூஜை', 'மண்டல பூஜை', 'மகரஜோதி பூஜை'];

export function SpecialPujas() {
  const s = useSiteSettings();
  const pujas = parseJsonSetting<string[]>(s.special_pujas, DEFAULT_PUJAS);

  return (
    <section className="py-20 bg-[#F9F7F1]">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <motion.div initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-100px' }} variants={staggerContainer}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-border text-center">
          <motion.div variants={fadeUpVariant} className="flex justify-center mb-6">
            <Flower2 className="w-12 h-12 text-secondary" />
          </motion.div>
          <motion.h2 variants={fadeUpVariant}
            className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-8">
            சிறப்பு பூஜைகள்
          </motion.h2>
          <motion.div variants={fadeUpVariant} className="flex flex-wrap justify-center gap-4">
            {pujas.map((puja, idx) => (
              <div key={idx}
                className="bg-background px-6 py-3 rounded-full border border-primary/20 text-lg font-bold text-primary shadow-sm hover:bg-primary hover:text-white transition-colors cursor-default">
                {puja}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
