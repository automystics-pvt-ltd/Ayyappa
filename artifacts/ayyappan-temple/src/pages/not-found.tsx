import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center px-4">
      <h1 className="text-6xl font-serif font-bold text-primary mb-4">404</h1>
      <p className="text-xl mb-8 font-medium">பக்கம் காணப்படவில்லை</p>
      <Link href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-md">
        முகப்பிற்குச் செல்ல
      </Link>
    </div>
  );
}
