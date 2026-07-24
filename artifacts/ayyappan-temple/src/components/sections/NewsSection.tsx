import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { Newspaper, Calendar, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

type NewsPost = {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
};

export function NewsSection() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNews()
      .then((data) => setPosts(data as NewsPost[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section id="news" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUpVariant}
        >
          <div className="inline-flex items-center justify-center gap-2 text-primary mb-3">
            <Newspaper className="w-5 h-5" />
            <span className="uppercase tracking-widest text-sm font-bold">செய்திகள்</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            அறிவிப்புகள் & செய்திகள்
          </h2>
        </motion.div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#F9F7F1] rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {posts.map((post) => (
              <motion.article
                key={post.id}
                variants={fadeUpVariant}
                className="bg-[#F9F7F1] rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                {post.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(post.createdAt).toLocaleDateString('ta-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">
                    {post.content}
                  </p>
                  {post.videoUrl && (
                    <a
                      href={post.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      வீடியோ காண்க
                    </a>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
