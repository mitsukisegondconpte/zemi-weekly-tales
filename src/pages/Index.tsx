import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import NovelCard from "@/components/NovelCard";
import HeroSlideshow from "@/components/HeroSlideshow";
import { BookOpen, Coins, Users, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { usePublishedNovels, GENRES } from "@/hooks/useNovels";
import { Link } from "react-router-dom";

const CATEGORIES = [
  { id: "new", label: "Nouvo Piblikasyon" },
  { id: "top15week", label: "Top 15 Semèn" },
  { id: "top15month", label: "Top 15 Mwa" },
  { id: "Dram", label: "Top Drama" },
  { id: "Syans-Fiksyon", label: "Top Fiksyon" },
  { id: "Avanti", label: "Top Aventure" },
  { id: "Orre", label: "Top Horreur" },
  { id: "Fantezi", label: "Gèm Kache" },
  { id: "Aksyon", label: "Etwal Filant" },
];

const ALL_GENRES = ["Tout", ...GENRES];

const Index = () => {
  const [genre, setGenre] = useState("Tout");
  const [activeCategory, setActiveCategory] = useState("new");
  const { data: novels = [], isLoading } = usePublishedNovels();
  const categoryRef = useRef<HTMLDivElement>(null);

  const topNovels = [...novels].sort((a, b) => b.reactions - a.reactions);

  // Category-based filtering
  const getCategoryNovels = () => {
    switch (activeCategory) {
      case "new":
        return [...novels].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "top15week":
      case "top15month":
        return topNovels.slice(0, 15);
      default:
        return novels.filter(n => n.genre === activeCategory);
    }
  };

  const categoryNovels = getCategoryNovels();
  const filteredByGenre = genre === "Tout" ? categoryNovels : categoryNovels.filter(n => n.genre === genre);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full">
          <HeroSlideshow novels={topNovels.map(n => ({ id: n.id, title: n.title, author: n.author, description: n.description || "", rating: n.reactions, genre: n.genre }))} />
        </section>

        {/* Stats */}
        <section className="border-b border-border bg-card">
          <div className="container py-3 flex justify-center gap-8 md:gap-16">
            {[
              { icon: BookOpen, label: "Novèl", value: `${novels.length}` },
              { icon: Users, label: "Lektè", value: "—" },
              { icon: Coins, label: "Chapit", value: "—" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">{s.value}</span>
                <span className="text-muted-foreground hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col md:flex-row">
          {/* Categories sidebar */}
          <aside className="md:w-48 lg:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border bg-card/50">
            <div ref={categoryRef} className="flex md:flex-col overflow-x-auto md:overflow-x-visible p-2 md:p-3 gap-1.5 md:sticky md:top-14">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 text-left ${
                    activeCategory === cat.id
                      ? "gradient-brand text-primary-foreground shadow-lg"
                      : "bg-secondary/50 text-secondary-foreground hover:bg-primary/10 hover:shadow-sm"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <section className="flex-1 container py-6">
            {/* Genre filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {ALL_GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    genre === g
                      ? "gradient-brand text-primary-foreground shadow-lg"
                      : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="text-center py-16 text-muted-foreground">Chajman...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {filteredByGenre.map((novel) => (
                  <NovelCard key={novel.id} id={novel.id} title={novel.title} author={novel.author}
                    description={novel.description || ""} chapters={0} rating={novel.reactions} genre={novel.genre} />
                ))}
              </div>
            )}

            {!isLoading && filteredByGenre.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">Pa gen novèl ki koresponn.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
