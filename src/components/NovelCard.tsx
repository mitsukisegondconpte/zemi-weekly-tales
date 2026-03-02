import { Link } from "react-router-dom";
import { BookOpen, Star } from "lucide-react";

interface NovelCardProps {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
  chapters: number;
  rating: number;
  genre: string;
}

const NovelCard = ({ id, title, author, description, chapters, rating, genre }: NovelCardProps) => (
  <Link
    to={`/novel/${id}`}
    className="group block rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
  >
    <div className="aspect-[3/4] gradient-brand relative overflow-hidden">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-primary-foreground">
        <BookOpen className="h-12 w-12 mb-3 opacity-60" />
        <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{genre}</span>
      </div>
      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold text-foreground">
        <Star className="h-3 w-3 fill-primary text-primary" />
        {rating}
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-serif font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">{author}</p>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{description}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-medium text-primary">{chapters} chapit</span>
      </div>
    </div>
  </Link>
);

export default NovelCard;
