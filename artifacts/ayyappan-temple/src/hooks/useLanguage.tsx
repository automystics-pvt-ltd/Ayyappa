import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Lang = 'ta' | 'en';

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (ta: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ta',
  toggleLang: () => {},
  t: (ta) => ta,
});

function readStored(): Lang {
  try { return (localStorage.getItem('site-lang') as Lang) || 'ta'; }
  catch { return 'ta'; }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readStored);

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next: Lang = prev === 'ta' ? 'en' : 'ta';
      try { localStorage.setItem('site-lang', next); } catch {}
      return next;
    });
  }, []);

  const t = useCallback((ta: string, en: string) => lang === 'ta' ? ta : en, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
