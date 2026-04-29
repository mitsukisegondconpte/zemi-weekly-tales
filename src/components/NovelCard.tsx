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

const NovelCard = ({ id, title, author, description, coverUrl, chapters, rating, genre }: NovelCardProps) => (
  <Link
    to={`/novel/${id}`}
    className="group block transition-opacity hover:opacity-90"
  >
    <div className="aspect-[2/3] relative overflow-hidden bg-secondary border border-border">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-muted-foreground">
          <BookOpen className="h-8 w-8 mb-2 opacity-50" />
          <span className="text-[10px] uppercase tracking-wider opacity-70">{genre}</span>
        </div>
      )}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/95 px-1.5 py-0.5 text-[11px] text-foreground border border-border">
        <Star className="h-2.5 w-2.5 fill-primary text-primary" />
        {rating}
      </div>
    </div>
    <div className="pt-2">
      <h3 className="font-medium text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{author}</p>
      <p className="text-[11px] text-muted-foreground mt-1">
        {chapters} chapit · {genre}
      </p>
    </div>
  </Link>
);

export default NovelCard;
