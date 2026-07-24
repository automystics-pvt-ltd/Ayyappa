import { motion } from 'framer-motion';
import { fadeUpVariant } from '@/lib/animations';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { useSiteSettings, parseJsonSetting } from '@/hooks/useSiteSettings';

const DEFAULT_FAQS = [
  { q: 'நன்கொடை வருமான வரி விலக்கு பெறுமா?', a: 'தேவையான அனுமதி இருந்தால் விவரங்கள் வழங்கப்படும்.' },
  { q: 'ஆன்லைனில் நன்கொடை வழங்கலாமா?', a: 'ஆம். UPI, Net Banking, Debit Card, Credit Card ஆகியவற்றின் மூலம் வழங்கலாம்.' },
  { q: 'ரசீது கிடைக்குமா?', a: 'ஆம். உடனடியாக மின்னஞ்சல் மற்றும் WhatsApp மூலம் அனுப்பப்படும்.' },
];

export function Faq() {
  const s = useSiteSettings();
  const faqs = parseJsonSetting<{ q: string; a: string }[]>(s.faqs, DEFAULT_FAQS);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <motion.div initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-100px' }} variants={fadeUpVariant}>
          <div className="flex items-center justify-center gap-3 mb-10">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              அடிக்கடி கேட்கப்படும் கேள்விகள்
            </h2>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-4 md:p-8 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-lg md:text-xl font-bold text-foreground hover:text-primary text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-base md:text-lg text-muted-foreground leading-relaxed pt-2">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
