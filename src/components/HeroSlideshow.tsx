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
  coverUrl?: string | null;
}

interface HeroSlideshowProps {
  novels: Novel[];
}

const HeroSlideshow = ({ novels }: HeroSlideshowProps) => {
  const [current, setCurrent] = useState(0);
  const topNovels = novels.slice(0, 5);

  useEffect(() => {
    if (topNovels.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % topNovels.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [topNovels.length]);

  if (topNovels.length === 0) return null;
  const novel = topNovels[current];

  return (
    <div className="relative w-full bg-secondary border-b border-border">
      <div className="container py-6 md:py-8">
        <div className="flex items-center gap-4 md:gap-8">
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + topNovels.length) % topNovels.length)}
            className="hidden md:flex p-2 rounded text-muted-foreground hover:text-foreground hover:bg-background transition-colors shrink-0"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
            <Link
              to={`/novel/${novel.id}`}
              className="w-24 h-32 md:w-32 md:h-44 overflow-hidden shrink-0 bg-background border border-border"
            >
              {novel.coverUrl ? (
                <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                {novel.genre}
              </p>
              <h2 className="text-lg md:text-2xl font-semibold leading-tight text-foreground line-clamp-2">
                <Link to={`/novel/${novel.id}`} className="hover:text-primary transition-colors">
                  {novel.title}
                </Link>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">pa {novel.author}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>{novel.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 hidden sm:block">
                {novel.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrent((prev) => (prev + 1) % topNovels.length)}
            className="hidden md:flex p-2 rounded text-muted-foreground hover:text-foreground hover:bg-background transition-colors shrink-0"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-center gap-1.5 mt-4">
          {topNovels.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all ${
                i === current ? "w-6 bg-primary" : "w-3 bg-border hover:bg-muted-foreground/40"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSlideshow;
