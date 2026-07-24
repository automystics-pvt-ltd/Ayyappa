import { Navbar } from '@/components/sections/Navbar';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Gurus } from '@/components/sections/Gurus';
import { Renovation } from '@/components/sections/Renovation';
import { Kumbhabhishekam } from '@/components/sections/Kumbhabhishekam';
import { Donation } from '@/components/sections/Donation';
import { SpecialPujas } from '@/components/sections/SpecialPujas';
import { Gallery } from '@/components/sections/Gallery';
import { EventsSection } from '@/components/sections/EventsSection';
import { NewsSection } from '@/components/sections/NewsSection';
import { Faq } from '@/components/sections/Faq';
import { Appeal } from '@/components/sections/Appeal';
import { Footer } from '@/components/sections/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Gurus />
        <Renovation />
        <Kumbhabhishekam />
        <EventsSection />
        <NewsSection />
        <Donation />
        <Gallery />
        <SpecialPujas />
        <Faq />
        <Appeal />
      </main>
      <Footer />
    </div>
  );
}
