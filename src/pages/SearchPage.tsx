import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import NovelCard from "@/components/NovelCard";
import { Search } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { usePublishedNovels, GENRES } from "@/hooks/useNovels";
import { useNavigate } from "react-router-dom";

const SearchPage = () => {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: novels = [] } = usePublishedNovels();

  // Genre suggestions
  const genreSuggestions = useMemo(() => {
    if (!search.trim()) return [...GENRES];
    return GENRES.filter(g => g.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  // Filtered novels
  const filtered = useMemo(() => {
    let result = novels;
    if (selectedGenre) {
      result = result.filter(n => n.genre === selectedGenre);
    } else if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.author.toLowerCase().includes(q) ||
        n.genre.toLowerCase().includes(q)
      );
    }
    return result;
  }, [novels, search, selectedGenre]);

  const selectGenre = (genre: string) => {
    setSelectedGenre(genre);
    setSearch(genre);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const clearSelection = () => {
    setSelectedGenre(null);
    setSearch("");
    inputRef.current?.focus();
  };

  // Keyboard nav
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || genreSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % genreSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + genreSuggestions.length) % genreSuggestions.length);
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectGenre(genreSuggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-black font-serif text-foreground mb-4">Rechèche</h1>

        {/* Search bar */}
        <div className="relative max-w-lg mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Chèche jan, novèl oswa otè..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedGenre(null); setShowSuggestions(true); setHighlightedIndex(-1); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-2xl border border-input bg-background text-foreground pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          {selectedGenre && (
            <button onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary hover:underline">
              Efase
            </button>
          )}

          {/* Genre suggestions dropdown */}
          {showSuggestions && genreSuggestions.length > 0 && !selectedGenre && (
            <div className="absolute z-50 left-0 right-0 top-full mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">Jan yo</div>
              <div className="flex flex-wrap gap-2 p-3 pt-0">
                {genreSuggestions.map((genre, i) => (
                  <button
                    key={genre}
                    onMouseDown={() => selectGenre(genre)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      i === highlightedIndex
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-accent/60 text-accent-foreground hover:bg-accent hover:shadow-sm"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedGenre && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtre:</span>
            <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">{selectedGenre}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map((novel) => (
            <NovelCard key={novel.id} id={novel.id} title={novel.title} author={novel.author}
              description={novel.description || ""} chapters={0} rating={0} genre={novel.genre} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-16 text-muted-foreground">Pa gen rezilta{search ? ` pou "${search}"` : ""}</p>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default SearchPage;
