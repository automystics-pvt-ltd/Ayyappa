import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'முகப்பு', href: '#home' },
  { label: 'வரலாறு', href: '#about' },
  { label: 'திருப்பணி', href: '#renovation' },
  { label: 'கும்பாபிஷேகம்', href: '#kumbhabhishekam' },
  { label: 'நன்கொடை', href: '#donate' },
  { label: 'தொடர்புக்கு', href: '#contact' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => scrollTo('#home')}
          >
            <div className={`font-serif text-lg md:text-xl font-bold transition-colors whitespace-nowrap ${isScrolled ? 'text-primary' : 'text-white drop-shadow-md'}`}>
              ஸ்ரீ ஐயப்பன் திருக்கோவில்
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={`text-sm lg:text-base font-medium transition-colors hover:text-secondary ${
                  isScrolled ? 'text-foreground/80' : 'text-white/90 drop-shadow-sm hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('#donate')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg"
            >
              நன்கொடை
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className={`h-6 w-6 ${isScrolled ? 'text-foreground' : 'text-white'}`} />
            ) : (
              <Menu className={`h-6 w-6 ${isScrolled ? 'text-foreground' : 'text-white'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-background border-b border-border/50 shadow-lg md:hidden"
          >
            <div className="flex flex-col p-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="py-3 text-left text-foreground/80 hover:text-primary font-medium text-lg border-b border-border/20 last:border-0"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => scrollTo('#donate')}
                className="mt-4 bg-primary text-primary-foreground py-3 rounded-md font-medium text-lg text-center"
              >
                நன்கொடை வழங்க
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
