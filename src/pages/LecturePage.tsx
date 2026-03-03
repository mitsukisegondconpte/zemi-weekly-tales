import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import NovelCard from "@/components/NovelCard";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const LecturePage = () => {
  const { user } = useAuth();

  // Get novels where user has unlocked chapters
  const { data: readingNovels = [], isLoading } = useQuery({
    queryKey: ["reading", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: unlocked } = await supabase
        .from("unlocked_chapters")
        .select("chapter_id, chapters(novel_id)")
        .eq("user_id", user!.id);
      
      if (!unlocked || unlocked.length === 0) return [];
      
      const novelIds = [...new Set(unlocked.map((u: any) => u.chapters?.novel_id).filter(Boolean))];
      if (novelIds.length === 0) return [];

      const { data: novels } = await supabase
        .from("novels")
        .select("*")
        .in("id", novelIds);
      return novels ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-black font-serif text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Lekti Mwen
        </h1>
        <p className="text-muted-foreground text-sm mb-6">Novèl ou ap li kounye a</p>

        {!user ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Konekte pou wè istwa lekti ou.</p>
            <Link to="/login" className="inline-block mt-4 text-primary hover:underline font-medium">Konekte</Link>
          </div>
        ) : isLoading ? (
          <p className="text-center py-16 text-muted-foreground">Chajman...</p>
        ) : readingNovels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {readingNovels.map((novel: any) => (
              <NovelCard key={novel.id} id={novel.id} title={novel.title} author={novel.author}
                description={novel.description || ""} chapters={0} rating={novel.reactions} genre={novel.genre} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Ou poko kòmanse li okenn novèl.</p>
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default LecturePage;
