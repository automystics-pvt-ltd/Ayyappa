import { motion } from 'framer-motion';
import { fadeUpVariant } from '@/lib/animations';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function Appeal() {
  const s = useSiteSettings();
  const heading  = s.appeal_heading  || 'பக்தர்களுக்கான வேண்டுகோள்';
  const body     = s.appeal_body     || 'அன்பார்ந்த ஐயப்ப பக்தர்களே, ஆலய திருப்பணி மற்றும் மகா கும்பாபிஷேகம் என்பது ஒரு தலைமுறைக்கு ஒருமுறை கிடைக்கும் புனித வாய்ப்பாகும். இந்த திருப்பணியில் தங்களால் இயன்ற அளவு நிதி, பொருள் அல்லது சேவையாக பங்களித்து இறைவனின் அருளைப் பெறுமாறு அன்புடன் கேட்டுக்கொள்கிறோம்.';
  const tagline  = s.appeal_tagline  || 'நாம் கட்டும் கோவில்... நம் சந்ததியினர் வழிபடும் தெய்வீக தலம்.';
  const closing  = s.appeal_closing  || 'ஸ்வாமியே சரணம் ஐயப்பா';

  return (
    <section className="py-24 bg-gradient-to-b from-primary to-orange-700 text-white relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIyIiBmaWxsPSIjRkZGIi8+PC9zdmc+')] bg-repeat" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-6 sm:mb-8 text-secondary drop-shadow-md">
            {heading}
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-relaxed mb-6 sm:mb-8 opacity-90 whitespace-pre-line">
            {body}
          </p>

          <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-serif font-bold text-white mb-8 sm:mb-12 drop-shadow-lg leading-snug">
            {tagline}
          </p>

          <div className="inline-block border-y-2 border-secondary/50 py-3 sm:py-4 px-4 sm:px-6 md:px-8 max-w-full">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-secondary break-words">
              {closing}
            </h3>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
