import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  rating: number;
  genre: string;
}

interface HeroSlideshowProps {
  novels: Novel[];
}

const HeroSlideshow = ({ novels }: HeroSlideshowProps) => {
  const [current, setCurrent] = useState(0);
  const topNovels = novels.slice(0, 5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % topNovels.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [topNovels.length]);

  if (topNovels.length === 0) return null;

  const novel = topNovels[current];

  return (
    <div className="relative overflow-hidden gradient-brand min-h-[300px] md:min-h-[400px] w-full">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />

      <div className="relative flex items-center h-full p-6 md:p-10">
        {/* Left arrow */}
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + topNovels.length) % topNovels.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-background/20 text-primary-foreground hover:bg-background/40 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col md:flex-row items-center gap-6 w-full animate-fade-in" key={novel.id}>
          <Link
            to={`/novel/${novel.id}`}
            className="w-32 h-44 md:w-40 md:h-56 rounded-xl bg-background/20 flex items-center justify-center shrink-0 hover:scale-105 transition-transform shadow-2xl"
          >
            <BookOpen className="h-12 w-12 text-primary-foreground opacity-60" />
          </Link>
          <div className="text-primary-foreground text-center md:text-left flex-1">
            <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{novel.genre} • TOP</span>
            <h2 className="text-2xl md:text-4xl font-black font-serif mt-1">{novel.title}</h2>
            <p className="text-sm opacity-80 mt-1">pa {novel.author}</p>
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-bold">{novel.rating}</span>
            </div>
            <p className="text-sm opacity-75 mt-3 max-w-md line-clamp-2">{novel.description}</p>
            <Link
              to={`/novel/${novel.id}`}
              className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-background text-foreground font-bold text-sm hover:bg-background/90 transition-colors shadow-lg"
            >
              Li Kounye a →
            </Link>
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % topNovels.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-background/20 text-primary-foreground hover:bg-background/40 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {topNovels.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2 bg-primary-foreground"
                : "w-2 h-2 bg-primary-foreground/40 hover:bg-primary-foreground/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlideshow;
