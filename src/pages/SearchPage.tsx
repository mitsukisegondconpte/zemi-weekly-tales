import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
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

const SearchPage = () => {
  const [search, setSearch] = useState("");

  const filtered = MOCK_NOVELS.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-black font-serif text-foreground mb-4">Rechèche</h1>
        <div className="relative max-w-lg mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Chèche novèl oswa otè..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-input bg-background text-foreground pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map((novel) => (
            <NovelCard key={novel.id} {...novel} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-16 text-muted-foreground">Pa gen rezilta pou "{search}"</p>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default SearchPage;
