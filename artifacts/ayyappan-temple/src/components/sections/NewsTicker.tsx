import { useEffect, useState, useRef } from 'react';
import { Radio } from 'lucide-react';
import { api } from '@/lib/api';

type NewsPost = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

export function NewsTicker() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api
      .getNews()
      .then((data) => setPosts((data as NewsPost[]).slice(0, 5)))
      .catch(() => {});
  }, []);

  // Cycle through titles every 4 seconds
  useEffect(() => {
    if (posts.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % posts.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [posts.length]);

  if (posts.length === 0) return null;

  const scrollToNews = () => {
    document.querySelector('#news')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <button
        onClick={scrollToNews}
        className="w-full flex items-center gap-3 bg-black/50 backdrop-blur-sm border border-secondary/40 rounded-xl px-4 py-2.5 hover:bg-black/60 transition-colors group"
        aria-label="செய்திகள் பகுதிக்கு செல்க"
      >
        {/* Label */}
        <span className="flex items-center gap-1.5 shrink-0 text-secondary font-bold text-xs uppercase tracking-widest border-r border-secondary/30 pr-3">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          செய்தி
        </span>

        {/* Scrolling title */}
        <div className="flex-1 overflow-hidden text-left relative h-5">
          {posts.map((post, i) => (
            <span
              key={post.id}
              className={`absolute inset-0 text-sm text-white/90 font-medium truncate transition-all duration-500 ${
                i === activeIdx
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              {post.title}
            </span>
          ))}
        </div>

        {/* Dot indicators */}
        {posts.length > 1 && (
          <div className="flex gap-1 shrink-0">
            {posts.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  i === activeIdx ? 'bg-secondary' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </button>
    </div>
  );
}
