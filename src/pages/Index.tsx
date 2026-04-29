import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import NovelCard from "@/components/NovelCard";
import HeroSlideshow from "@/components/HeroSlideshow";
import { BookOpen, ChevronRight, Star, TrendingUp, Flame, Sparkles, Play } from "lucide-react";
import { useState, useMemo } from "react";
import { usePublishedNovels, GENRES } from "@/hooks/useNovels";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContinueReading } from "@/hooks/useExtra";

const ALL_GENRES = ["Tout", ...GENRES];

const Index = () => {
  const [genre, setGenre] = useState("Tout");
  const { data: novels = [], isLoading } = usePublishedNovels();

  // Chapter counts
  const { data: chapterCounts = {} } = useQuery({
    queryKey: ["chapter_counts"],
    queryFn: async () => {
      const { data } = await supabase.from("chapters").select("novel_id").eq("status", "published");
      const counts: Record<string, number> = {};
      (data ?? []).forEach(c => { counts[c.novel_id] = (counts[c.novel_id] || 0) + 1; });
      return counts;
    },
  });

  const topNovels = useMemo(() => [...novels].sort((a, b) => b.reactions - a.reactions), [novels]);
  const newNovels = useMemo(() => [...novels].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [novels]);

  const sections = useMemo(() => [
    { id: "new", title: "Nouvo Piblikasyon", icon: Sparkles, items: newNovels.slice(0, 10) },
    { id: "trending", title: "Trending", icon: TrendingUp, items: topNovels.slice(0, 10) },
    { id: "top15", title: "Top 15 Semèn", icon: Flame, items: topNovels.slice(0, 15) },
    ...GENRES.slice(0, 6).map(g => ({
      id: g,
      title: `Top ${g}`,
      icon: Star,
      items: novels.filter(n => n.genre === g).sort((a, b) => b.reactions - a.reactions).slice(0, 10),
    })),
  ], [novels, topNovels, newNovels]);

  const filteredByGenre = genre === "Tout" ? novels : novels.filter(n => n.genre === genre);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full">
          <HeroSlideshow novels={topNovels.map(n => ({ id: n.id, title: n.title, author: n.author, description: n.description || "", rating: n.reactions, genre: n.genre, coverUrl: n.cover_url }))} />
        </section>

        {/* Vertical sections */}
        <div className="container py-8 space-y-12">
          {sections.map(section => (
            section.items.length > 0 && (
              <section key={section.id}>
                <div className="flex items-end justify-between mb-3 border-b border-border pb-2">
                  <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                  <span className="text-xs text-muted-foreground">{section.items.length}</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {section.items.map((novel) => (
                    <div key={novel.id} className="shrink-0 w-[140px] sm:w-[160px]">
                      <NovelCard id={novel.id} title={novel.title} author={novel.author}
                        description={novel.description || ""} coverUrl={novel.cover_url || undefined}
                        chapters={chapterCounts[novel.id] || 0} rating={novel.reactions} genre={novel.genre} />
                    </div>
                  ))}
                </div>
              </section>
            )
          ))}

          {/* Full catalog with genre filter */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3 border-b border-border pb-2">Tout Novèl</h2>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {ALL_GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-3 py-1 text-xs border transition-colors ${
                    genre === g
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="text-center py-16 text-muted-foreground text-sm">Chajman...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                {filteredByGenre.map((novel) => (
                  <NovelCard key={novel.id} id={novel.id} title={novel.title} author={novel.author}
                    description={novel.description || ""} coverUrl={novel.cover_url || undefined}
                    chapters={chapterCounts[novel.id] || 0} rating={novel.reactions} genre={novel.genre} />
                ))}
              </div>
            )}
            {!isLoading && filteredByGenre.length === 0 && (
              <div className="text-center py-16 text-muted-foreground text-sm">Pa gen novèl ki koresponn.</div>
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
