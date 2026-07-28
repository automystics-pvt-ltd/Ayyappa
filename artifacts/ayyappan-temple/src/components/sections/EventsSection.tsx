import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { CalendarDays, MapPin, Tag } from 'lucide-react';
import { api } from '@/lib/api';

type TempleEvent = {
  id: number;
  title: string;
  eventType?: string;
  description?: string;
  eventDate: string;
  location?: string;
  posterUrl?: string;
};

export function EventsSection() {
  const [events, setEvents] = useState<TempleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents()
      .then((data) => setEvents(data as TempleEvent[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="events" className="py-20 bg-[#F9F7F1]">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUpVariant}
        >
          <div className="inline-flex items-center justify-center gap-2 text-primary mb-3">
            <CalendarDays className="w-5 h-5" />
            <span className="uppercase tracking-widest text-sm font-bold">நிகழ்வுகள்</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            வரவிருக்கும் நிகழ்வுகள்
          </h2>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-border" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">விரைவில் நிகழ்வுகள் அறிவிக்கப்படும்</p>
          </div>
        ) : (
          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {events.map((event) => {
              const date = new Date(event.eventDate);
              const day = date.toLocaleDateString('ta-IN', { day: '2-digit' });
              const month = date.toLocaleDateString('ta-IN', { month: 'short' });
              const year = date.getFullYear();
              const time = date.toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.div
                  key={event.id}
                  variants={fadeUpVariant}
                  className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow duration-300 flex"
                >
                  {/* Date badge */}
                  <div className="bg-primary text-white flex flex-col items-center justify-center px-5 py-4 min-w-[80px] text-center shrink-0">
                    <span className="text-2xl font-bold leading-none">{day}</span>
                    <span className="text-xs font-medium mt-1 opacity-90">{month}</span>
                    <span className="text-xs opacity-75">{year}</span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-center px-5 py-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground text-base md:text-lg">{event.title}</h3>
                      {event.eventType && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                          <Tag className="w-3 h-3" />
                          {event.eventType}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-muted-foreground text-sm line-clamp-1 mb-1">{event.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {time}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Poster thumbnail */}
                  {event.posterUrl && (
                    <div className="hidden sm:block w-24 shrink-0">
                      <img
                        src={event.posterUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
