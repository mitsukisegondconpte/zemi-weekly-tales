import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import NovelCard from "@/components/NovelCard";
import HeroSlideshow from "@/components/HeroSlideshow";
import { BookOpen, Coins, Users } from "lucide-react";
import { useState } from "react";
import { usePublishedNovels, GENRES } from "@/hooks/useNovels";

const ALL_GENRES = ["Tout", ...GENRES];

const Index = () => {
  const [genre, setGenre] = useState("Tout");
  const { data: novels = [], isLoading } = usePublishedNovels();

  const filtered = novels.filter((n) => genre === "Tout" || n.genre === genre);
  const topNovels = [...novels].sort((a, b) => b.reactions - a.reactions);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        {/* Hero Slideshow - Full width */}
        <section className="w-full pt-0">
          <HeroSlideshow novels={topNovels.map(n => ({ id: n.id, title: n.title, author: n.author, description: n.description || "", rating: n.reactions, genre: n.genre }))} />
        </section>

        {/* Stats bar */}
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

        {/* Genres filter */}
        <section className="container py-6">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {filtered.map((novel) => (
                <NovelCard key={novel.id} id={novel.id} title={novel.title} author={novel.author}
                  description={novel.description || ""} chapters={0} rating={novel.reactions} genre={novel.genre} />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">Pa gen novèl ki koresponn ak rechèch ou.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
