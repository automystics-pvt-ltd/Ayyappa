import { MapPin, Phone, Mail, ExternalLink, Eye } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

const DEFAULT_MAPS_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123.5!2d78.1003317!3d10.4371753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baa07d265880d21%3A0x8e9624bb1f4bed9a!2sAyyapa%20Temple!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin';
const DEFAULT_MAPS_LINK  = 'https://www.google.com/maps/place/Ayyapa+Temple/@10.4371753,78.1003317,18z';

export function Footer() {
  const s = useSiteSettings();
  const [visitorCount, setVisitorCount] = useState<{ total: number; today: number } | null>(null);
  const [countAnimKey, setCountAnimKey] = useState(0);
  const prevCountRef = useRef<{ total: number; today: number } | null>(null);

  const lastFetchRef = useRef<number>(0);
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const applyCount = (d: { total: number; today: number }) => {
      const prev = prevCountRef.current;
      if (prev !== null && (d.total !== prev.total || d.today !== prev.today)) {
        // Count changed — bump key to restart the CSS animation
        setCountAnimKey((k) => k + 1);
      }
      prevCountRef.current = { total: d.total, today: d.today };
      setVisitorCount({ total: d.total, today: d.today });
      lastFetchRef.current = Date.now();
    };

    const fetchWithRetry = (attempt = 0): void => {
      if (document.visibilityState === 'hidden') return;
      api.getVisitorCount()
        .then(applyCount)
        .catch(() => {
          if (attempt < 3) {
            // Exponential backoff: 1s, 2s, 4s
            setTimeout(() => fetchWithRetry(attempt + 1), 1000 * Math.pow(2, attempt));
          }
        });
    };

    fetchWithRetry();
    const interval = setInterval(() => fetchWithRetry(), REFRESH_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const idleMs = Date.now() - lastFetchRef.current;
        if (idleMs >= REFRESH_INTERVAL) {
          fetchWithRetry();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const phone     = s.temple_phone;
  const email     = s.temple_email;
  const address   = s.temple_address   || 'வடமதுரை, திண்டுக்கல் மாவட்டம்';
  const mapsEmbed = s.temple_maps_embed || DEFAULT_MAPS_EMBED;
  const mapsLink  = s.temple_maps_link  || DEFAULT_MAPS_LINK;

  return (
    <footer id="contact" className="bg-foreground text-white pt-20 pb-8 border-t-[8px] border-secondary">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-secondary mb-4 sm:mb-6 leading-snug">
              அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்
            </h3>
            <p className="text-white/70 text-lg max-w-md">
              திருப்பணி மற்றும் மகா கும்பாபிஷேக நிதி திரட்டும் இணையதளம்
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6 text-white/90 border-b border-white/10 pb-2">தொடர்புக்கு</h4>
            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h5 className="font-semibold text-white/80 text-sm uppercase tracking-wider mb-1">முகவரி</h5>
                  <p className="text-lg whitespace-pre-line">{address}</p>
                  <a href={mapsLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-sm text-secondary hover:text-secondary/80 transition-colors">
                    Google Maps-ல் பார்க்க <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h5 className="font-semibold text-white/80 text-sm uppercase tracking-wider mb-1">கைபேசி</h5>
                  {phone ? (
                    <a href={`tel:${phone}`} className="text-lg hover:text-secondary transition-colors">{phone}</a>
                  ) : (
                    <p className="text-lg text-white/40 italic">(விவரங்கள் பின்னர் சேர்க்கப்படும்)</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h5 className="font-semibold text-white/80 text-sm uppercase tracking-wider mb-1">மின்னஞ்சல்</h5>
                  {email ? (
                    <a href={`mailto:${email}`} className="text-lg hover:text-secondary transition-colors">{email}</a>
                  ) : (
                    <p className="text-lg text-white/40 italic">(விவரங்கள் பின்னர் சேர்க்கப்படும்)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Google Map */}
        <div className="mb-12 rounded-xl overflow-hidden border-2 border-secondary/30 shadow-lg shadow-black/40">
          <div className="bg-white/5 px-4 py-3 flex items-center gap-2 border-b border-white/10">
            <MapPin className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold text-white/80 tracking-wide">
              அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில் — வடமதுரை
            </span>
            <a href={mapsLink} target="_blank" rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 transition-colors">
              பெரிதாக பார்க்க <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <iframe title="ஸ்ரீ ஐயப்பன் திருக்கோவில் இருப்பிடம்"
            src={mapsEmbed} width="100%" height="340"
            style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy"
            referrerPolicy="no-referrer-when-downgrade" />
        </div>

        {visitorCount !== null && (
          <div className="flex justify-center mb-6 px-2">
            <div className="flex flex-col xs:flex-row flex-wrap items-center justify-center gap-2 xs:gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-secondary/30 text-white/70 text-xs sm:text-sm w-full xs:w-auto max-w-full">
              <Eye className="w-4 h-4 text-secondary flex-shrink-0" />
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-white/50">இதுவரை பார்வையிட்டவர்கள்:</span>
                <span
                  key={`total-${countAnimKey}`}
                  className={`font-bold text-secondary tracking-wide${countAnimKey > 0 ? ' visitor-count-animate' : ''}`}
                >
                  {visitorCount.total.toLocaleString('en-IN')}
                </span>
              </span>
              <span className="text-white/30 hidden xs:inline">|</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-white/50">இன்று பார்வையிட்டவர்கள்:</span>
                <span
                  key={`today-${countAnimKey}`}
                  className={`font-bold text-secondary tracking-wide${countAnimKey > 0 ? ' visitor-count-animate' : ''}`}
                >
                  {visitorCount.today.toLocaleString('en-IN')}
                </span>
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/50 text-sm">
          <p>© {new Date().getFullYear()} ஸ்ரீ ஐயப்பன் திருக்கோவில், வடமதுரை. All rights reserved.</p>
          <p className="font-serif text-secondary/80 font-bold tracking-widest">ஸ்வாமியே சரணம் ஐயப்பா</p>
        </div>
        <div className="border-t border-white/10 mt-6 pt-4 text-center text-white/30 text-xs">
          Powered by{' '}
          <a href="https://www.automystics.com" target="_blank" rel="noopener noreferrer"
            className="text-white/50 hover:text-secondary transition-colors">
            Automystics Technologies Pvt. Ltd.
          </a>
        </div>
      </div>
    </footer>
  );
}
