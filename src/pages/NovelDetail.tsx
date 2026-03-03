import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Coins, Lock, ChevronLeft, Star, Heart } from "lucide-react";

// Mock chapters data
const MOCK_CHAPTERS = [
  { id: "c1", number: 1, title: "Kòmansman", premium: false, coins: 0 },
  { id: "c2", number: 2, title: "Rankontre", premium: false, coins: 0 },
  { id: "c3", number: 3, title: "Sekrè a", premium: false, coins: 0 },
  { id: "c4", number: 4, title: "Dezisyon", premium: true, coins: 5 },
  { id: "c5", number: 5, title: "Konsekans", premium: true, coins: 5 },
  { id: "c6", number: 6, title: "Revèy", premium: true, coins: 10 },
  { id: "c7", number: 7, title: "Batay La", premium: true, coins: 10 },
  { id: "c8", number: 8, title: "Final", premium: true, coins: 15 },
];

const NovelDetail = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        <div className="container py-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
            <ChevronLeft className="h-4 w-4" /> Retounen
          </Link>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="w-40 h-56 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-lg">
              <BookOpen className="h-14 w-14 text-primary-foreground opacity-60" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Avanti</span>
              <h1 className="text-2xl md:text-3xl font-black font-serif text-foreground mt-1">Kòd Ansyen</h1>
              <p className="text-muted-foreground mt-1 text-sm">pa Sophia Belmont</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-primary text-primary" /> 4.9</span>
                <span className="text-sm text-muted-foreground">32 chapit</span>
              </div>
              <p className="text-muted-foreground mt-3 max-w-xl text-sm">
                Yon avanti epik pou dekouvri sekrè ansyen yo.
              </p>
              <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors active:scale-95 text-sm">
                <Heart className="h-4 w-4" /> Ajoute nan Favoris
              </button>
            </div>
          </div>

          <h2 className="text-xl font-bold font-serif text-foreground mb-3">Chapit yo</h2>
          <div className="space-y-2">
            {MOCK_CHAPTERS.map((ch) => (
              <Link
                key={ch.id}
                to={ch.premium ? "#" : `/chapter/${id}/${ch.id}`}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all active:scale-[0.98] ${
                  ch.premium
                    ? "border-border bg-card opacity-80 hover:border-primary/30"
                    : "border-border bg-card hover:border-primary hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground">
                    {ch.number}
                  </span>
                  <span className="font-medium text-foreground text-sm">{ch.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {ch.premium ? (
                    <span className="coin-badge inline-flex items-center gap-1 text-xs">
                      <Coins className="h-3 w-3" />
                      {ch.coins}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">GRATIS</span>
                  )}
                  {ch.premium && <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default NovelDetail;
