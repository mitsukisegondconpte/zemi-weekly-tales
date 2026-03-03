import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useParams, Link, useNavigate } from "react-router-dom";
import { BookOpen, Coins, Lock, ChevronLeft, Star, Heart } from "lucide-react";
import { useNovel, useChapters } from "@/hooks/useNovels";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const NovelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: novel, isLoading } = useNovel(id);
  const { data: chapters = [] } = useChapters(id);

  // Check unlocked chapters
  const { data: unlockedIds = [] } = useQuery({
    queryKey: ["unlocked", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("unlocked_chapters")
        .select("chapter_id")
        .eq("user_id", user!.id);
      return (data ?? []).map(d => d.chapter_id);
    },
  });

  const handleChapterClick = async (ch: typeof chapters[0]) => {
    // Free chapter
    if (!ch.is_premium || ch.coin_price === 0) {
      navigate(`/chapter/${id}/${ch.id}`);
      return;
    }
    // Already unlocked
    if (unlockedIds.includes(ch.id)) {
      navigate(`/chapter/${id}/${ch.id}`);
      return;
    }
    // Need login
    if (!user) {
      toast.error("Konekte pou li chapit premium yo");
      navigate("/login");
      return;
    }
    // Check coins
    if (!profile || profile.coins < ch.coin_price) {
      toast.error(`Ou bezwen ${ch.coin_price} coins. Ou gen ${profile?.coins ?? 0} coins.`);
      return;
    }
    // Deduct coins + unlock
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ coins: profile.coins - ch.coin_price })
      .eq("user_id", user.id);
    if (updateErr) { toast.error("Erè pandan retire coins"); return; }

    const { error: unlockErr } = await supabase
      .from("unlocked_chapters")
      .insert({ user_id: user.id, chapter_id: ch.id, coins_spent: ch.coin_price });
    if (unlockErr) { toast.error("Erè pandan debloking"); return; }

    toast.success(`${ch.coin_price} coins retire. Bòn lekti!`);
    queryClient.invalidateQueries({ queryKey: ["unlocked"] });
    navigate(`/chapter/${id}/${ch.id}`);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Chajman...</p></div>;
  if (!novel) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Novèl pa jwenn</p></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        <div className="container py-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
            <ChevronLeft className="h-4 w-4" /> Retounen
          </Link>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="w-40 h-56 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-lg">
              <BookOpen className="h-14 w-14 text-primary-foreground opacity-60" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">{novel.genre}</span>
              <h1 className="text-2xl md:text-3xl font-black font-serif text-foreground mt-1">{novel.title}</h1>
              <p className="text-muted-foreground mt-1 text-sm">pa {novel.author}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-sm"><Heart className="h-4 w-4 fill-primary text-primary" /> {novel.reactions}</span>
                <span className="text-sm text-muted-foreground">{chapters.length} chapit</span>
              </div>
              {novel.description && <p className="text-muted-foreground mt-3 max-w-xl text-sm">{novel.description}</p>}
            </div>
          </div>

          <h2 className="text-xl font-bold font-serif text-foreground mb-3">Chapit yo</h2>
          {chapters.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Pa gen chapit pibliye ankò.</p>
          ) : (
            <div className="space-y-2">
              {chapters.map((ch) => {
                const unlocked = !ch.is_premium || ch.coin_price === 0 || unlockedIds.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleChapterClick(ch)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all active:scale-[0.98] text-left ${
                      unlocked
                        ? "border-border bg-card hover:border-primary hover:shadow-sm"
                        : "border-border bg-card opacity-80 hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground">
                        {ch.chapter_number}
                      </span>
                      <span className="font-medium text-foreground text-sm">{ch.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ch.is_premium && ch.coin_price > 0 ? (
                        unlocked ? (
                          <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">DEBLOKE</span>
                        ) : (
                          <>
                            <span className="coin-badge inline-flex items-center gap-1 text-xs">
                              <Coins className="h-3 w-3" />{ch.coin_price}
                            </span>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </>
                        )
                      ) : (
                        <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">GRATIS</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default NovelDetail;
