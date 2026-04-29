import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import NovelCard from "@/components/NovelCard";
import { Heart, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const Favorites = () => {
  const { user } = useAuth();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["my_favorites_full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("novel_id, created_at, novels:novel_id(id, title, author, description, cover_url, genre, reactions)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []).filter((f: any) => f.novels);
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        <div className="container py-6 max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary fill-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif text-foreground">Favoris mwen yo</h1>
              <p className="text-muted-foreground text-sm">{favorites.length} novèl</p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center py-12 text-muted-foreground">Chajman...</p>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border">
              <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Ou poko gen okenn favoris.</p>
              <Link to="/" className="inline-block mt-4 text-primary font-semibold hover:underline">
                Dekouvri novèl yo →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
              {favorites.map((f: any) => (
                <NovelCard
                  key={f.novel_id}
                  id={f.novels.id}
                  title={f.novels.title}
                  author={f.novels.author}
                  description={f.novels.description || ""}
                  coverUrl={f.novels.cover_url || undefined}
                  chapters={0}
                  rating={f.novels.reactions}
                  genre={f.novels.genre}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Favorites;
