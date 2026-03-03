import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Link } from "react-router-dom";
import { BookOpen, Star, Heart, TrendingUp } from "lucide-react";
import { usePublishedNovels } from "@/hooks/useNovels";

const CanvasPage = () => {
  const { data: novels = [], isLoading } = usePublishedNovels();
  const topNovels = [...novels].sort((a, b) => b.reactions - a.reactions);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-black font-serif text-foreground mb-1 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Top Novèl
        </h1>
        <p className="text-muted-foreground text-sm mb-6">Klase pa reyaksyon lektè yo</p>

        {isLoading ? (
          <p className="text-center py-16 text-muted-foreground">Chajman...</p>
        ) : topNovels.length === 0 ? (
          <p className="text-center py-16 text-muted-foreground">Pa gen novèl ankò.</p>
        ) : (
          <div className="space-y-3">
            {topNovels.map((novel, index) => (
              <Link key={novel.id} to={`/novel/${novel.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                  index === 0 ? "gradient-brand text-primary-foreground shadow-lg" : index < 3 ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                }`}>{index + 1}</div>
                <div className="w-14 h-20 rounded-lg gradient-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="h-6 w-6 text-primary-foreground opacity-60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors truncate">{novel.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{novel.author}</p>
                  <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5 mt-1 inline-block">{novel.genre}</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-primary shrink-0">
                  <Heart className="h-4 w-4 fill-primary" />{novel.reactions}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default CanvasPage;
