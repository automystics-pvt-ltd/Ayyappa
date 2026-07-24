import { MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contact" className="bg-foreground text-white pt-20 pb-8 border-t-[8px] border-secondary">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
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
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h5 className="font-semibold text-white/80 text-sm uppercase tracking-wider mb-1">கைபேசி</h5>
                  <p className="text-lg text-muted-foreground italic">(விவரங்கள் பின்னர் சேர்க்கப்படும்)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h5 className="font-semibold text-white/80 text-sm uppercase tracking-wider mb-1">மின்னஞ்சல்</h5>
                  <p className="text-lg text-muted-foreground italic">(விவரங்கள் பின்னர் சேர்க்கப்படும்)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/50 text-sm">
          <p>© {new Date().getFullYear()} ஸ்ரீ ஐயப்பன் திருக்கோவில், வடமதுரை. All rights reserved.</p>
          <p className="font-serif text-secondary/80 font-bold tracking-widest">ஸ்வாமியே சரணம் ஐயப்பா</p>
        </div>
      </div>
    </footer>
  );
}
