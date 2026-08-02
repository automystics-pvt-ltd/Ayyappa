import { useEffect, useState, useRef } from 'react';
import { Radio, Heart } from 'lucide-react';
import { api } from '@/lib/api';

/* ── Types ──────────────────────────────────────────────────────────────── */
type NewsPost = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

type RecentDonation = {
  id: number;
  donorName: string;
  anonymous: boolean;
  amount: string;
  reviewedAt: string;
};

type TickerItem = {
  key: string;
  kind: 'news' | 'donation';
  text: string;
  target: string; // scroll target selector
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

function donationToTicker(d: RecentDonation): TickerItem {
  const name   = d.anonymous ? 'ஒரு பக்தர்' : d.donorName;
  const amount = fmt(Number(d.amount));
  return {
    key:    `d-${d.id}`,
    kind:   'donation',
    text:   `${name} அவர்கள் ${amount} நன்கொடை வழங்கினார்கள் 🙏`,
    target: '#donors',
  };
}

function newsToTicker(p: NewsPost): TickerItem {
  return {
    key:    `n-${p.id}`,
    kind:   'news',
    text:   p.title,
    target: '#news',
  };
}

/* ── Component ───────────────────────────────────────────────────────────── */
export function NewsTicker() {
  const [items,     setItems]     = useState<TickerItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIdxRef = useRef(0);
  activeIdxRef.current = activeIdx;

  /* Fetch + merge */
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const [newsRaw, donationsRaw] = await Promise.all([
          api.getNews().catch(() => []),
          api.getRecentDonationTicker().catch(() => []),
        ]);

        if (cancelled) return;

        const donations = (donationsRaw as RecentDonation[]).map(donationToTicker);
        const news      = (newsRaw as NewsPost[]).slice(0, 5).map(newsToTicker);

        // Donations first (most recent activity), then news
        const merged = [...donations, ...news].slice(0, 8);

        setItems(prev => {
          const prevKeys = prev.map(i => i.key).join(',');
          const nextKeys = merged.map(i => i.key).join(',');
          if (prevKeys === nextKeys) return prev;
          setActiveIdx(idx => Math.min(idx, Math.max(merged.length - 1, 0)));
          return merged;
        });
      } catch {
        // silently ignore
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  /* Cycle every 4 s */
  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % items.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items.length]);

  if (items.length === 0) return null;

  const active = items[activeIdx];

  const handleClick = () => {
    document.querySelector(active.target)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 bg-black/50 backdrop-blur-sm border border-secondary/40 rounded-xl px-4 py-2.5 hover:bg-black/60 transition-colors group"
        aria-label="தகவலுக்கு செல்க"
      >
        {/* Kind badge — switches between news and donation */}
        <span className={`flex items-center gap-1.5 shrink-0 font-bold text-xs uppercase tracking-widest border-r border-secondary/30 pr-3 transition-colors
          ${active.kind === 'donation' ? 'text-amber-400' : 'text-secondary'}`}>
          {active.kind === 'donation'
            ? <Heart className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
            : <Radio  className="w-3.5 h-3.5 animate-pulse" />}
          {active.kind === 'donation' ? 'நன்கொடை' : 'செய்தி'}
        </span>

        {/* Scrolling text */}
        <div className="flex-1 overflow-hidden text-left relative h-5">
          {items.map((item, i) => (
            <span
              key={item.key}
              className={`absolute inset-0 text-sm font-medium truncate transition-all duration-500
                ${item.kind === 'donation' ? 'text-amber-100' : 'text-white/90'}
                ${i === activeIdx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {item.text}
            </span>
          ))}
        </div>

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="flex gap-1 shrink-0">
            {items.map((item, i) => (
              <span
                key={item.key}
                className={`block rounded-full transition-all duration-300
                  ${i === activeIdx
                    ? `w-3 h-1.5 ${item.kind === 'donation' ? 'bg-amber-400' : 'bg-secondary'}`
                    : 'w-1.5 h-1.5 bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </button>
    </div>
  );
}
