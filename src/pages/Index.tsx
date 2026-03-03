import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import NovelCard from "@/components/NovelCard";
import HeroSlideshow from "@/components/HeroSlideshow";
import { BookOpen, Coins, Users } from "lucide-react";
import { useState } from "react";

const MOCK_NOVELS = [
  { id: "1", title: "Zetwal Lannwit", author: "Marie-Claire Joseph", description: "Yon istwa damou ak mistè nan mitan Pòtoprens lannwit.", chapters: 24, rating: 4.8, genre: "Romantik" },
  { id: "2", title: "Rivyè Lavi", author: "Jean-Baptiste Pierre", description: "Yon jennfi ki ap chèche idantite li nan yon peyi ki ap chanje.", chapters: 18, rating: 4.5, genre: "Dram" },
  { id: "3", title: "Kòd Ansyen", author: "Sophia Belmont", description: "Yon avanti epik pou dekouvri sekrè ansyen yo.", chapters: 32, rating: 4.9, genre: "Avanti" },
  { id: "4", title: "Lapli Dòmaj", author: "André Michel", description: "Yon thriller psikolojik ki pral fè w poze kesyon.", chapters: 15, rating: 4.3, genre: "Thriller" },
  { id: "5", title: "Solèy Leve", author: "Nadia Clermont", description: "Istwa yon fanmi ki ap lite pou yon lavi miyò.", chapters: 20, rating: 4.6, genre: "Fanmi" },
  { id: "6", title: "Lanmè Blè", author: "Patrick Dorvil", description: "Yon marendò ki dekouvri yon zile misteryèz.", chapters: 28, rating: 4.7, genre: "Fantezi" },
];

const GENRES = ["Tout", "Romantik", "Dram", "Avanti", "Thriller", "Fanmi", "Fantezi"];

const Index = () => {
  const [genre, setGenre] = useState("Tout");

  const filtered = MOCK_NOVELS.filter((n) => {
    return genre === "Tout" || n.genre === genre;
  });

  // Sort by rating for "top" slideshow
  const topNovels = [...MOCK_NOVELS].sort((a, b) => b.rating - a.rating);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        {/* Hero Slideshow */}
        <section className="container pt-6 pb-4">
          <HeroSlideshow novels={topNovels} />
        </section>

        {/* Stats bar */}
        <section className="border-b border-border bg-card">
          <div className="container py-3 flex justify-center gap-8 md:gap-16">
            {[
              { icon: BookOpen, label: "Novèl", value: "42+" },
              { icon: Users, label: "Lektè", value: "1.2K+" },
              { icon: Coins, label: "Chapit", value: "500+" },
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
            {GENRES.map((g) => (
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {filtered.map((novel) => (
              <NovelCard key={novel.id} {...novel} />
            ))}
          </div>

          {filtered.length === 0 && (
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
