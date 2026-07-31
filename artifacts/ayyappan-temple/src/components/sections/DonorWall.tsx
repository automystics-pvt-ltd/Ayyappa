import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, ArrowUpDown, Eye, EyeOff, ChevronDown, Star } from 'lucide-react';
import { fadeUpVariant } from '@/lib/animations';

/* ── Types ──────────────────────────────────────────────────────────────── */
export interface Donor {
  id: number;
  donorName: string;
  place?: string | null;
  amount: string;
  anonymous: boolean;
  message?: string | null;
  reviewedAt: string;
  createdAt: string;
}

export interface InKindContribution {
  id: number;
  donorName: string;
  place?: string | null;
  description: string;
  contributedAt: string;
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const PAGE_SIZE   = 12;
const NEW_DAYS    = 7;    // badge: approved within last N days
const TOP_AMOUNT  = 5001; // badge: "சிறப்பு நன்கொடையாளர்"
const MEDAL_META  = [
  { emoji: '🥇', bg: 'from-yellow-50 to-amber-100',  border: 'border-amber-300',  text: 'text-amber-700'  },
  { emoji: '🥈', bg: 'from-slate-50 to-slate-100',   border: 'border-slate-300',  text: 'text-slate-600'  },
  { emoji: '🥉', bg: 'from-orange-50 to-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const dateStr = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ta-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return ''; }
};

const isNew    = (iso: string) =>
  Date.now() - new Date(iso).getTime() < NEW_DAYS * 86_400_000;

const isTop    = (amount: string, threshold: number) =>
  Number(amount) >= threshold;

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const displayName = (d: Donor) =>
  d.anonymous ? 'அடையாளம் தெரியாதவர்' : d.donorName;

/* ── Donor Card ─────────────────────────────────────────────────────────── */
function DonorCard({
  donor, rank, showAmount,
}: { donor: Donor; rank: number; showAmount: boolean }) {
  const name   = displayName(donor);
  const newBadge  = isNew(donor.reviewedAt);
  const topBadge  = isTop(donor.amount, TOP_AMOUNT);
  const avatarBg  = topBadge
    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
    : 'bg-gradient-to-br from-primary/70 to-primary';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-card-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 relative overflow-hidden"
    >
      {/* Subtle background glow for top donors */}
      {topBadge && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent pointer-events-none" />
      )}

      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {newBadge && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
            🎉 புதியவர்
          </span>
        )}
        {topBadge && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            <Star className="w-2.5 h-2.5 fill-amber-500 stroke-none" /> சிறப்பு நன்கொடையாளர்
          </span>
        )}
        {donor.anonymous && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
            🔒 Anonymous
          </span>
        )}
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          {donor.anonymous ? (
            <span className="text-lg">🙏</span>
          ) : (
            <span className="text-white font-bold text-sm">{initials(donor.donorName)}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-foreground text-sm leading-tight truncate">{name}</div>
          {donor.place && !donor.anonymous && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{donor.place}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount + date */}
      <div className="flex items-end justify-between pt-1 border-t border-border/50">
        <div>
          {showAmount ? (
            <div className="text-lg font-bold text-primary">{fmt(Number(donor.amount))}</div>
          ) : (
            <div className="text-lg font-bold text-muted-foreground/40">₹ ••••••</div>
          )}
          <div className="text-[10px] text-muted-foreground mt-0.5">
            📅 {dateStr(donor.reviewedAt)}
          </div>
        </div>
        <div className="text-2xl opacity-20 font-bold text-muted-foreground">#{rank}</div>
      </div>

      {/* Message */}
      {donor.message && !donor.anonymous && (
        <div className="bg-secondary/10 border-l-2 border-secondary/40 rounded-r-xl px-3 py-2">
          <p className="text-xs text-foreground/70 italic leading-relaxed break-words">
            "{donor.message}"
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* ── Podium Card (top 3) ─────────────────────────────────────────────────── */
function PodiumCard({
  donor, rank, showAmount,
}: { donor: Donor; rank: number; showAmount: boolean }) {
  const m    = MEDAL_META[rank];
  const name = displayName(donor);

  return (
    <div className={`border-2 ${m.border} bg-gradient-to-br ${m.bg} rounded-2xl p-5 text-center shadow-md relative overflow-hidden`}>
      <div className="text-4xl mb-2">{m.emoji}</div>
      <div className={`font-bold text-sm mb-0.5 truncate ${m.text}`}>{name}</div>
      {donor.place && !donor.anonymous && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />{donor.place}
        </div>
      )}
      {showAmount ? (
        <div className="text-xl font-bold text-primary mt-1">{fmt(Number(donor.amount))}</div>
      ) : (
        <div className="text-xl font-bold text-muted-foreground/30 mt-1">₹ •••</div>
      )}
      <div className="text-[10px] text-muted-foreground mt-1.5">{dateStr(donor.reviewedAt)}</div>
      {donor.message && !donor.anonymous && (
        <div className="mt-3 text-[10px] italic text-muted-foreground leading-relaxed px-1 break-words">
          "{donor.message}"
        </div>
      )}
      {isNew(donor.reviewedAt) && (
        <span className="absolute top-2 right-2 text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
      )}
    </div>
  );
}

/* ── Main DonorWall ──────────────────────────────────────────────────────── */
type SortKey = 'recent' | 'amount_desc' | 'amount_asc';

export function DonorWall({
  donors,
  stats,
  inKindContributions = [],
}: {
  donors: Donor[];
  stats: { totalRaised: number; donorCount: number } | null;
  inKindContributions?: InKindContribution[];
}) {
  const [search,      setSearch]      = useState('');
  const [sort,        setSort]        = useState<SortKey>('recent');
  const [showAmounts, setShowAmounts] = useState(true);
  const [page,        setPage]        = useState(1);

  /* ── Derived data ── */

  // Top 3 by amount (always shown in podium, never in grid)
  const top3 = useMemo(() =>
    [...donors].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, Math.min(3, donors.length)),
  [donors]);

  const top3Ids = useMemo(() => new Set(top3.map(d => d.id)), [top3]);

  // Remaining donors — searched + sorted
  const filtered = useMemo(() => {
    let list = donors.filter(d => !top3Ids.has(d.id));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        (!d.anonymous && d.donorName.toLowerCase().includes(q)) ||
        (d.place?.toLowerCase().includes(q))
      );
    }

    if (sort === 'amount_desc') list = [...list].sort((a, b) => Number(b.amount) - Number(a.amount));
    else if (sort === 'amount_asc') list = [...list].sort((a, b) => Number(a.amount) - Number(b.amount));
    // 'recent' → already ordered from API

    return list;
  }, [donors, top3Ids, search, sort]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const totalNew = donors.filter(d => isNew(d.reviewedAt)).length;

  return (
    <div className="space-y-10">

      {/* ── Stats bar ── */}
      {donors.length > 0 && stats && (
        <div className="flex flex-wrap items-center justify-center gap-6 bg-primary/5 border border-primary/15 rounded-2xl px-6 py-4">
          {[
            { value: donors.length.toLocaleString('en-IN'), label: 'நன்கொடையாளர்கள்', icon: '🙏' },
            { value: fmt(stats.totalRaised),                label: 'மொத்தம் திரட்டப்பட்டது', icon: '💰' },
            ...(totalNew > 0 ? [{ value: totalNew.toString(), label: 'இந்த வாரம் சேர்ந்தவர்கள்', icon: '🎉' }] : []),
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {i > 0 && <div className="w-px h-8 bg-border hidden sm:block" />}
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Top 3 Podium ── */}
      {top3.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
              🏆 நன்கொடையாளர்கள்
            </h4>
            <button
              onClick={() => setShowAmounts(v => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors min-h-[36px]"
            >
              {showAmounts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showAmounts ? 'தொகை மறை' : 'தொகை காட்டு'}
            </button>
          </div>
          <div className={`grid gap-4 ${
            top3.length === 1 ? 'grid-cols-1 max-w-xs mx-auto'
            : top3.length === 2 ? 'grid-cols-2 max-w-md mx-auto'
            : 'grid-cols-1 sm:grid-cols-3'
          }`}>
            {top3.map((d, i) => (
              <PodiumCard key={d.id} donor={d} rank={i} showAmount={showAmounts} />
            ))}
          </div>
        </div>
      )}

      {/* ── Search + Sort controls ── */}
      {donors.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="பெயர் / ஊர் தேடவும்..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={sort}
                onChange={e => { setSort(e.target.value as SortKey); setPage(1); }}
                className="appearance-none w-full sm:w-52 pl-9 pr-8 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background cursor-pointer"
              >
                <option value="recent">சமீபத்தியது முதல்</option>
                <option value="amount_desc">அதிக தொகை முதல்</option>
                <option value="amount_asc">குறைந்த தொகை முதல்</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {search && (
            <p className="text-xs text-muted-foreground mt-2 ml-1">
              "{search}" — {filtered.length} பதிவு கிடைத்தது
            </p>
          )}
        </div>
      )}

      {/* ── Card Grid ── */}
      {filtered.length === 0 && search ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">"{search}" என்று யாரும் இல்லை</p>
          <button onClick={() => setSearch('')} className="text-primary text-sm mt-2 hover:underline">
            தேடலை நீக்கு
          </button>
        </div>
      ) : visible.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {visible.map((d, idx) => (
                <DonorCard
                  key={d.id}
                  donor={d}
                  rank={top3.length + idx + 1}
                  showAmount={showAmounts}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Load More */}
          {hasMore && (
            <motion.div className="text-center" variants={fadeUpVariant}>
              <button
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-2 bg-card border border-card-border hover:border-primary/40 text-foreground font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm"
              >
                <ChevronDown className="w-4 h-4" />
                மேலும் காண்க ({filtered.length - visible.length} பதிவுகள் உள்ளன)
              </button>
            </motion.div>
          )}
        </>
      ) : null}

      {/* Empty state (no donors at all) */}
      {donors.length === 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-14 text-center">
          <div className="text-5xl mb-4">🙏</div>
          <p className="text-muted-foreground font-medium">
            முதல் நன்கொடையாளர் ஆக வாய்ப்பு உங்களுக்கே!
          </p>
        </div>
      )}

      {/* ── In-kind contributions ── */}
      {inKindContributions.length > 0 && (
        <InKindWall contributions={inKindContributions} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IN-KIND WALL  — mirrors the DonorWall structure exactly
   ═══════════════════════════════════════════════════════════════════════════ */

const IK_PAGE_SIZE = 12;
const IK_MEDAL = [
  { emoji: '🥇', bg: 'from-yellow-50 to-amber-100',  border: 'border-amber-300',  text: 'text-amber-700'  },
  { emoji: '🥈', bg: 'from-slate-50 to-slate-100',   border: 'border-slate-300',  text: 'text-slate-600'  },
  { emoji: '🥉', bg: 'from-orange-50 to-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
];

/* ── In-Kind Podium Card ─────────────────────────────────────────────────── */
function InKindPodiumCard({ c, rank }: { c: InKindContribution; rank: number }) {
  const m = IK_MEDAL[rank];
  return (
    <div className={`border-2 ${m.border} bg-gradient-to-br ${m.bg} rounded-2xl p-5 text-center shadow-md relative overflow-hidden`}>
      <div className="text-4xl mb-2">{m.emoji}</div>
      <div className={`font-bold text-sm mb-0.5 truncate ${m.text}`}>{c.donorName}</div>
      {c.place && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />{c.place}
        </div>
      )}
      <div className="text-sm font-semibold text-primary mt-1 leading-snug px-1 break-words">
        {c.description}
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">{dateStr(c.contributedAt)}</div>
      {isNew(c.contributedAt) && (
        <span className="absolute top-2 right-2 text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
      )}
    </div>
  );
}

/* ── In-Kind Card ────────────────────────────────────────────────────────── */
function InKindCard({ c, rank }: { c: InKindContribution; rank: number }) {
  const newBadge = isNew(c.contributedAt);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-card-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 relative overflow-hidden"
    >
      {/* Badge */}
      {newBadge && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
            🎉 புதியவர்
          </span>
        </div>
      )}

      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white font-bold text-sm">{initials(c.donorName)}</span>
        </div>
        <div className="min-w-0">
          <div className="font-bold text-foreground text-sm leading-tight truncate">{c.donorName}</div>
          {c.place && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{c.place}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description + date */}
      <div className="flex items-end justify-between pt-1 border-t border-border/50">
        <div className="min-w-0 pr-2">
          <div className="text-sm font-semibold text-primary leading-snug break-words">{c.description}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">📅 {dateStr(c.contributedAt)}</div>
        </div>
        <div className="text-2xl opacity-20 font-bold text-muted-foreground flex-shrink-0">#{rank}</div>
      </div>
    </motion.div>
  );
}

/* ── InKindWall ──────────────────────────────────────────────────────────── */
type IKSort = 'recent' | 'name_asc';

function InKindWall({ contributions }: { contributions: InKindContribution[] }) {
  const [search, setSearch] = useState('');
  const [sort,   setSort]   = useState<IKSort>('recent');
  const [page,   setPage]   = useState(1);

  // Top 3 most-recent always shown in podium
  const top3 = useMemo(() =>
    [...contributions]
      .sort((a, b) => new Date(b.contributedAt).getTime() - new Date(a.contributedAt).getTime())
      .slice(0, Math.min(3, contributions.length)),
  [contributions]);
  const top3Ids = useMemo(() => new Set(top3.map(c => c.id)), [top3]);

  const filtered = useMemo(() => {
    let list = contributions.filter(c => !top3Ids.has(c.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.donorName.toLowerCase().includes(q) ||
        c.place?.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    if (sort === 'name_asc') list = [...list].sort((a, b) => a.donorName.localeCompare(b.donorName, 'ta'));
    // 'recent' → already ordered from API
    return list;
  }, [contributions, top3Ids, search, sort]);

  const visible = filtered.slice(0, page * IK_PAGE_SIZE);
  const hasMore = visible.length < filtered.length;
  const totalNew = contributions.filter(c => isNew(c.contributedAt)).length;

  return (
    <div className="space-y-10 pt-6 border-t border-border/40">

      {/* ── Section heading ── */}
      <div className="text-center">
        <h3 className="font-serif font-bold text-2xl text-foreground flex items-center justify-center gap-2">
          🎁 பொருள் நன்கொடையாளர்கள்
        </h3>
        <p className="text-sm text-muted-foreground mt-1">பொருளால் ஆலயத்திற்கு உதவியவர்கள்</p>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap items-center justify-center gap-6 bg-orange-50 border border-orange-200/60 rounded-2xl px-6 py-4">
        {[
          { value: contributions.length.toLocaleString('en-IN'), label: 'பொருள் நன்கொடையாளர்கள்', icon: '🎁' },
          ...(totalNew > 0 ? [{ value: totalNew.toString(), label: 'இந்த வாரம் சேர்ந்தவர்கள்', icon: '🎉' }] : []),
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            {i > 0 && <div className="w-px h-8 bg-border hidden sm:block" />}
            <div className="text-center">
              <div className="text-xl font-bold text-orange-700">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Top 3 Podium ── */}
      {top3.length > 0 && (
        <div>
          <h4 className="font-serif font-bold text-foreground text-lg flex items-center gap-2 mb-4">
            🏆 சிறப்பு பொருள் நன்கொடை
          </h4>
          <div className={`grid gap-4 ${
            top3.length === 1 ? 'grid-cols-1 max-w-xs mx-auto'
            : top3.length === 2 ? 'grid-cols-2 max-w-md mx-auto'
            : 'grid-cols-1 sm:grid-cols-3'
          }`}>
            {top3.map((c, i) => (
              <InKindPodiumCard key={c.id} c={c} rank={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Search + Sort ── */}
      {contributions.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="பெயர் / ஊர் / பொருள் தேடவும்..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={sort}
                onChange={e => { setSort(e.target.value as IKSort); setPage(1); }}
                className="appearance-none w-full sm:w-52 pl-9 pr-8 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background cursor-pointer"
              >
                <option value="recent">சமீபத்தியது முதல்</option>
                <option value="name_asc">பெயர் வரிசையில்</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          {search && (
            <p className="text-xs text-muted-foreground mt-2 ml-1">
              "{search}" — {filtered.length} பதிவு கிடைத்தது
            </p>
          )}
        </div>
      )}

      {/* ── Card Grid ── */}
      {filtered.length === 0 && search ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">"{search}" என்று யாரும் இல்லை</p>
          <button onClick={() => setSearch('')} className="text-primary text-sm mt-2 hover:underline">
            தேடலை நீக்கு
          </button>
        </div>
      ) : visible.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {visible.map((c, idx) => (
                <InKindCard key={c.id} c={c} rank={top3.length + idx + 1} />
              ))}
            </AnimatePresence>
          </div>
          {hasMore && (
            <motion.div className="text-center" variants={fadeUpVariant}>
              <button
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-2 bg-card border border-card-border hover:border-primary/40 text-foreground font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm"
              >
                <ChevronDown className="w-4 h-4" />
                மேலும் காண்க ({filtered.length - visible.length} பதிவுகள் உள்ளன)
              </button>
            </motion.div>
          )}
        </>
      ) : null}
    </div>
  );
}
