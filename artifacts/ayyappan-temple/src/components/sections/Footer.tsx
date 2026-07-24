import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

const MAPS_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123.5!2d78.1003317!3d10.4371753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baa07d265880d21%3A0x8e9624bb1f4bed9a!2sAyyapa%20Temple!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin';

const MAPS_LINK =
  'https://www.google.com/maps/place/Ayyapa+Temple/@10.4371753,78.1003317,18z';

export function Footer() {
  return (
    <footer id="contact" className="bg-foreground text-white pt-20 pb-8 border-t-[8px] border-secondary">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-3xl font-serif font-bold text-secondary mb-6">
              அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்
            </h3>
            <p className="text-white/70 text-lg max-w-md">
              திருப்பணி மற்றும் மகா கும்பாபிஷேக நிதி திரட்டும் இணையதளம்
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6 text-white/90 border-b border-white/10 pb-2">தொடர்புக்கு</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h5 className="font-semibold text-white/80 text-sm uppercase tracking-wider mb-1">முகவரி</h5>
                  <p className="text-lg">வடமதுரை, திண்டுக்கல் மாவட்டம்</p>
                  <a
                    href={MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-sm text-secondary hover:text-secondary/80 transition-colors"
                  >
                    Google Maps-ல் பார்க்க
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h5 className="font-semibold text-white/80 text-sm uppercase tracking-wider mb-1">கைபேசி</h5>
                  <p className="text-lg text-white/40 italic">(விவரங்கள் பின்னர் சேர்க்கப்படும்)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h5 className="font-semibold text-white/80 text-sm uppercase tracking-wider mb-1">மின்னஞ்சல்</h5>
                  <p className="text-lg text-white/40 italic">(விவரங்கள் பின்னர் சேர்க்கப்படும்)</p>
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
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 transition-colors"
            >
              பெரிதாக பார்க்க <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <iframe
            title="ஸ்ரீ ஐயப்பன் திருக்கோவில் இருப்பிடம்"
            src={MAPS_EMBED_URL}
            width="100%"
            height="340"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/50 text-sm">
          <p>© {new Date().getFullYear()} ஸ்ரீ ஐயப்பன் திருக்கோவில், வடமதுரை. All rights reserved.</p>
          <p className="font-serif text-secondary/80 font-bold tracking-widest">ஸ்வாமியே சரணம் ஐயப்பா</p>
        </div>
      </div>
    </footer>
  );
}
