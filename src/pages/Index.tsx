import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NovelCard from "@/components/NovelCard";
import { Search, BookOpen, Coins, Users } from "lucide-react";
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
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-brand opacity-95" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
          <div className="relative container text-center text-primary-foreground py-20 md:py-32">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-serif tracking-tight mb-6">
              ZEMI<br />
              <span className="text-2xl md:text-3xl lg:text-4xl font-medium italic opacity-90">Chak Semèn</span>
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-10 leading-relaxed">
              Dekouvri novèl orijinal chak semèn. Li chapit gratis oswa debloke istwa premium ak coins.
            </p>
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Chèche novèl oswa otè..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl bg-background text-foreground pl-14 pr-6 py-4 text-base shadow-2xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-b border-border bg-card">
          <div className="container py-4 flex justify-center gap-8 md:gap-16">
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
        <section className="container py-8">
          <div className="flex flex-wrap gap-2 mb-8">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
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
    </div>
  );
};

export default Index;
