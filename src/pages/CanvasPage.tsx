import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Link } from "react-router-dom";
import { BookOpen, Star, Heart, TrendingUp } from "lucide-react";

const TOP_NOVELS = [
  { id: "3", title: "Kòd Ansyen", author: "Sophia Belmont", rating: 4.9, genre: "Avanti", reactions: 842, chapters: 32 },
  { id: "1", title: "Zetwal Lannwit", author: "Marie-Claire Joseph", rating: 4.8, genre: "Romantik", reactions: 723, chapters: 24 },
  { id: "6", title: "Lanmè Blè", author: "Patrick Dorvil", rating: 4.7, genre: "Fantezi", reactions: 651, chapters: 28 },
  { id: "5", title: "Solèy Leve", author: "Nadia Clermont", rating: 4.6, genre: "Fanmi", reactions: 534, chapters: 20 },
  { id: "2", title: "Rivyè Lavi", author: "Jean-Baptiste Pierre", rating: 4.5, genre: "Dram", reactions: 412, chapters: 18 },
  { id: "4", title: "Lapli Dòmaj", author: "André Michel", rating: 4.3, genre: "Thriller", reactions: 389, chapters: 15 },
];

const CanvasPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-black font-serif text-foreground mb-1 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Top Novèl
        </h1>
        <p className="text-muted-foreground text-sm mb-6">Klase pa reyaksyon lektè yo</p>

        <div className="space-y-3">
          {TOP_NOVELS.map((novel, index) => (
            <Link
              key={novel.id}
              to={`/novel/${novel.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all group"
            >
              {/* Rank */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                  index === 0
                    ? "gradient-brand text-primary-foreground shadow-lg"
                    : index < 3
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {index + 1}
              </div>

              {/* Cover */}
              <div className="w-14 h-20 rounded-lg gradient-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="h-6 w-6 text-primary-foreground opacity-60" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {novel.title}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{novel.author}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {novel.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">{novel.chapters} chapit</span>
                  <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    {novel.genre}
                  </span>
                </div>
              </div>

              {/* Reactions */}
              <div className="flex items-center gap-1 text-sm font-bold text-primary shrink-0">
                <Heart className="h-4 w-4 fill-primary" />
                {novel.reactions}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default CanvasPage;
