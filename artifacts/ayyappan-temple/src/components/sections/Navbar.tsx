import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronDown, Newspaper, CalendarDays, Images,
  HandCoins, Phone, Mail, Home, BookOpen, Users2, HardHat,
  FlameKindling, HelpCircle, MessageSquare, Flame, Bell, HeartHandshake
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

/* ── Types ── */
interface NewsItem  { id: number; title: string; publishedAt?: string; createdAt: string }
interface EventItem { id: number; title: string; eventDate?: string; eventType?: string }

/* ── Nav structure ── */
const TEMPLE_LINKS = [
  { ta: 'வரலாறு',          en: 'History',          href: '#about',           icon: BookOpen },
  { ta: 'குருநாதர்கள்',     en: 'Gurus',            href: '#gurus',           icon: Users2 },
  { ta: 'திருப்பணி',        en: 'Renovation',       href: '#renovation',      icon: HardHat },
  { ta: 'கும்பாபிஷேகம்',    en: 'Kumbhabhishekam',  href: '#kumbhabhishekam', icon: Flame },
  { ta: 'சிறப்பு பூஜைகள்',  en: 'Special Pujas',    href: '#pujas',           icon: FlameKindling },
  { ta: 'படங்கள்',          en: 'Gallery',          href: '#gallery',         icon: Images },
  { ta: 'கேள்வி-பதில்',      en: 'Q & A',            href: '#faq',             icon: HelpCircle },
];

/* ── Language toggle pill ── */
function LangToggle({ scrolled }: { scrolled: boolean }) {
  const { lang, toggleLang } = useLanguage();
  return (
    <button
      onClick={toggleLang}
      title={lang === 'ta' ? 'Switch to English' : 'தமிழில் மாற்று'}
      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 ${
        scrolled
          ? 'border-primary/30 text-primary bg-primary/8 hover:bg-primary/15'
          : 'border-white/40 text-white/90 bg-white/15 hover:bg-white/25'
      }`}
    >
      {lang === 'ta' ? 'EN' : 'தமிழ்'}
    </button>
  );
}

/* ── Smooth scroll helper — accounts for fixed navbar + breathing room ── */
function scrollTo(href: string, close?: () => void) {
  close?.();
  setTimeout(() => {
    const el = document.querySelector(href);
    if (!el) return;
    const header = document.querySelector('header');
    const headerH = header ? header.getBoundingClientRect().height : 80;
    const EXTRA = 16;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - EXTRA;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, close ? 300 : 0);
}

/* ── Ticker: auto-scroll latest news ── */
function Ticker({ items }: { items: NewsItem[] }) {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % items.length), 4000);
    return () => clearInterval(timer);
  }, [items.length]);
  if (!items.length) return null;
  return (
    <div className="bg-primary text-primary-foreground text-[11px] py-1 px-4 hidden sm:flex items-center gap-3 overflow-hidden">
      <span className="shrink-0 flex items-center gap-1 font-bold opacity-90">
        <Bell className="w-3 h-3" /> {t('செய்தி', 'News')}
      </span>
      <div className="h-4 w-px bg-primary-foreground/30 shrink-0" />
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{  y: -12, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="block truncate opacity-90"
          >
            {items[idx]?.title}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Badge pill ── */
function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">
      {n > 99 ? '99+' : n}
    </span>
  );
}

/* ── Desktop dropdown ── */
function TempleDropdown({ scrolled }: { scrolled: boolean }) {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const textCls = scrolled
    ? 'text-foreground/80 hover:text-primary'
    : 'text-white/90 drop-shadow-sm hover:text-white';

  return (
    <div ref={ref} className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${textCls}`}
      >
        {t('ஆலயம்', 'Temple')}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{  opacity: 0, y: 6,  scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onMouseLeave={() => setOpen(false)}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-background rounded-2xl shadow-xl border border-border/60 overflow-hidden z-50"
          >
            {TEMPLE_LINKS.map(({ ta, en, href, icon: Icon }) => (
              <button
                key={href}
                onClick={() => { scrollTo(href); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors text-left group"
              >
                <Icon className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors shrink-0" />
                {lang === 'ta' ? ta : en}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════ Main Navbar ══════════════════ */
export function Navbar() {
  const { lang, t, toggleLang } = useLanguage();
  const [scrolled, setScrolled]       = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [templeOpen, setTempleOpen]   = useState(false);
  const [news,  setNews]              = useState<NewsItem[]>([]);
  const [events, setEvents]           = useState<EventItem[]>([]);

  /* Scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Prevent body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  /* Fetch live news + events for badges / ticker */
  useEffect(() => {
    apiFetch<NewsItem[]>('/news').then(setNews).catch(() => {});
    apiFetch<EventItem[]>('/events').then(setEvents).catch(() => {});
  }, []);

  const publishedNews   = news.filter(n => (n as any).published !== false);
  const upcomingEvents  = events.filter(e => {
    if (!(e as any).published && (e as any).published !== undefined) return false;
    return true;
  });

  const close = () => setDrawerOpen(false);

  const textCls = scrolled
    ? 'text-foreground/80 hover:text-primary'
    : 'text-white/90 drop-shadow-sm hover:text-white';

  return (
    <header className="fixed top-0 left-0 right-0 z-50">

      {/* ── Live news ticker ── */}
      <Ticker items={publishedNews} />

      {/* ── Automystics credit bar ── */}
      <div className="bg-gray-900 text-white text-[10px] sm:text-[11px] py-1 px-3 sm:px-4">
        <div className="container mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-center">
          <span className="text-gray-400 hidden sm:inline">
            Website · App · ERP?
            <span className="text-yellow-400 font-semibold ml-1">Automystics Technologies Pvt. Ltd.</span>
          </span>
          <span className="text-yellow-400 font-semibold sm:hidden">Automystics Technologies</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="tel:9345127734" className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-medium">
              <Phone className="w-3 h-3" />9345127734
            </a>
            <span className="text-gray-600">|</span>
            <a href="mailto:info@automystics.com" className="hidden sm:flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-medium">
              <Mail className="w-3 h-3" />info@automystics.com
            </a>
          </div>
        </div>
      </div>

      {/* ── Main nav bar ── */}
      <div className={`transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-md shadow-md py-2'
          : 'bg-transparent py-4'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <button
              onClick={() => scrollTo('#home')}
              className="flex items-center gap-2 shrink-0 min-w-0 group"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md transition-colors overflow-hidden shrink-0 ${
                scrolled ? 'bg-orange-50 ring-2 ring-orange-300' : 'bg-white/20 backdrop-blur-sm ring-2 ring-white/40'
              }`}>
                <img src="/iyyappan-logo.png" alt="ஐயப்பன்" className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow" />
              </div>
              <div className="text-left min-w-0">
                <div className={`font-serif text-xs sm:text-sm md:text-base font-bold leading-tight transition-colors truncate max-w-[140px] sm:max-w-none ${
                  scrolled ? 'text-primary' : 'text-white drop-shadow-md'
                }`}>
                  {t('ஸ்ரீ ஐயப்பன் திருக்கோவில்', 'Sri Ayyappan Temple')}
                </div>
                <div className={`text-[9px] sm:text-[10px] leading-tight transition-colors hidden xs:block sm:block ${
                  scrolled ? 'text-muted-foreground' : 'text-white/70'
                }`}>
                  {t('வடமதுரை, திண்டுக்கல்', 'Vadamadurai, Dindigul')}
                </div>
              </div>
            </button>

            {/* ── Desktop nav ── */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">

              {/* Home */}
              <button onClick={() => scrollTo('#home')}
                className={`text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-white/10 whitespace-nowrap ${textCls}`}>
                {t('முகப்பு', 'Home')}
              </button>

              {/* Temple dropdown */}
              <div className="px-2 py-1">
                <TempleDropdown scrolled={scrolled} />
              </div>

              {/* News */}
              <button onClick={() => scrollTo('#news')}
                className={`flex items-center text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-white/10 whitespace-nowrap ${textCls}`}>
                <Newspaper className="w-3.5 h-3.5 mr-1 opacity-70" />
                {t('செய்திகள்', 'News')}
                <CountBadge n={publishedNews.length} />
              </button>

              {/* Events */}
              <button onClick={() => scrollTo('#events')}
                className={`flex items-center text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-white/10 whitespace-nowrap ${textCls}`}>
                <CalendarDays className="w-3.5 h-3.5 mr-1 opacity-70" />
                {t('நிகழ்வுகள்', 'Events')}
                <CountBadge n={upcomingEvents.length} />
              </button>

              {/* Donors */}
              <button onClick={() => scrollTo('#donors')}
                className={`flex items-center text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-white/10 whitespace-nowrap ${textCls}`}>
                <HeartHandshake className="w-3.5 h-3.5 mr-1 opacity-70" />
                {t('நன்கொடையாளர்கள்', 'Donors')}
              </button>

              {/* Contact */}
              <button onClick={() => scrollTo('#contact')}
                className={`flex items-center text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-white/10 whitespace-nowrap ${textCls}`}>
                <MessageSquare className="w-3.5 h-3.5 mr-1 opacity-70" />
                {t('தொடர்புக்கு', 'Contact')}
              </button>

              {/* Language toggle */}
              <LangToggle scrolled={scrolled} />

              {/* Donate CTA */}
              <button
                onClick={() => scrollTo('#donate')}
                className="ml-1 flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 whitespace-nowrap"
              >
                <HandCoins className="w-4 h-4" />
                {t('நன்கொடை', 'Donate')}
              </button>
            </nav>

            {/* ── Mobile: lang + donate + hamburger ── */}
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              <LangToggle scrolled={scrolled} />
              <button
                onClick={() => scrollTo('#donate')}
                className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-md whitespace-nowrap"
              >
                <HandCoins className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('நன்கொடை', 'Donate')}</span>
              </button>
              <button
                onClick={() => setDrawerOpen(true)}
                className={`p-2.5 rounded-xl transition-colors border ${
                  scrolled
                    ? 'text-foreground bg-muted hover:bg-muted/80 border-border'
                    : 'text-white bg-white/15 hover:bg-white/25 border-white/20'
                }`}
                aria-label="Menu திற"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ════ Mobile full-screen drawer ════ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-background z-[210] flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-primary/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-base">🕉</div>
                  <div>
                    <p className="text-sm font-bold text-primary leading-tight">{t('ஐயப்பன் கோவில்', 'Ayyappan Temple')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('வடமதுரை, திண்டுக்கல்', 'Vadamadurai, Dindigul')}</p>
                  </div>
                </div>
                <button onClick={close} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer links */}
              <div className="flex-1 overflow-y-auto py-3">

                {/* Quick links */}
                <div className="px-3 mb-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {t('கண்ணோட்டம்', 'Navigation')}
                  </p>
                  {[
                    { ta: 'முகப்பு',          en: 'Home',     href: '#home',    icon: Home },
                    { ta: 'செய்திகள்',        en: 'News',     href: '#news',    icon: Newspaper,   count: publishedNews.length },
                    { ta: 'நிகழ்வுகள்',       en: 'Events',   href: '#events',  icon: CalendarDays, count: upcomingEvents.length },
                    { ta: 'நன்கொடையாளர்கள்', en: 'Donors',   href: '#donors',  icon: HeartHandshake },
                    { ta: 'தொடர்புக்கு',      en: 'Contact',  href: '#contact', icon: MessageSquare },
                  ].map(({ ta, en, href, icon: Icon, count }) => (
                    <button
                      key={href}
                      onClick={() => scrollTo(href, close)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-left text-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                          <Icon className="w-4 h-4 text-primary/70 group-hover:text-primary" />
                        </div>
                        <span className="font-medium text-sm">{lang === 'ta' ? ta : en}</span>
                      </div>
                      {!!count && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{count}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mx-3 my-3 border-t border-border/40" />

                {/* Temple accordion */}
                <div className="px-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {t('ஆலய தகவல்கள்', 'Temple Info')}
                  </p>
                  <button
                    onClick={() => setTempleOpen(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-left text-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                        <Flame className="w-4 h-4 text-primary/70" />
                      </div>
                      <span className="font-medium text-sm">{t('ஆலயம் பற்றி', 'About Temple')}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${templeOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {templeOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 pl-3 border-l-2 border-primary/20 mt-1 space-y-0.5">
                          {TEMPLE_LINKS.map(({ ta, en, href, icon: Icon }) => (
                            <button
                              key={href}
                              onClick={() => scrollTo(href, close)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-foreground/70 hover:bg-primary/5 hover:text-primary transition-colors"
                            >
                              <Icon className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                              {lang === 'ta' ? ta : en}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Language toggle in drawer */}
                <div className="mx-3 my-3 border-t border-border/40" />
                <div className="px-3">
                  <button
                    onClick={toggleLang}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-foreground/70 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary/70">A</span>
                      </div>
                      <span className="font-medium text-sm">
                        {lang === 'ta' ? 'Switch to English' : 'தமிழில் மாற்று'}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {lang === 'ta' ? 'EN' : 'தமிழ்'}
                    </span>
                  </button>
                </div>

              </div>

              {/* Donate footer */}
              <div className="p-4 border-t border-border/50 bg-primary/5">
                <button
                  onClick={() => scrollTo('#donate', close)}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-2xl font-bold text-base transition-all active:scale-95 shadow-lg shadow-primary/30"
                >
                  <HandCoins className="w-5 h-5" />
                  {t('நன்கொடை வழங்க', 'Donate Now')}
                </button>
                <p className="text-center text-[11px] text-muted-foreground mt-2">
                  {t('ஸ்வாமி அனுகிரகம் உங்களுக்கு கிடைக்கட்டும் 🙏', "Swami's blessings be upon you 🙏")}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </header>
  );
}
