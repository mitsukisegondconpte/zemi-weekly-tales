import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NovelCard from "@/components/NovelCard";
import { Search } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("Tout");

  const filtered = MOCK_NOVELS.filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.author.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "Tout" || n.genre === genre;
    return matchSearch && matchGenre;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="gradient-brand py-16 md:py-24">
          <div className="container text-center text-primary-foreground">
            <h1 className="text-4xl md:text-6xl font-black font-serif tracking-tight mb-4">
              ZEMI Chak Semèn
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Dekouvri novèl orijinal chak semèn. Li chapit gratis oswa debloke istwa premium ak coins.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Chèche novèl oswa otè..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full bg-background text-foreground pl-12 pr-4 py-3 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Genres filter */}
        <section className="container py-8">
          <div className="flex flex-wrap gap-2 mb-8">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  genre === g
                    ? "bg-primary text-primary-foreground shadow-md"
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
    </div>
  );
};

export default Index;
