import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useParams, Link, useNavigate } from "react-router-dom";
import { BookOpen, Coins, Lock, ChevronLeft, Heart, Star } from "lucide-react";
import { useNovel, useChapters } from "@/hooks/useNovels";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const NovelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const { data: novel, isLoading } = useNovel(id);
  const { data: chapters = [] } = useChapters(id);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [pendingChapter, setPendingChapter] = useState<any>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Unlocked chapters
  const { data: unlockedIds = [] } = useQuery({
    queryKey: ["unlocked", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data } = await supabase.from("unlocked_chapters").select("chapter_id").eq("user_id", user!.id);
      return (data ?? []).map(d => d.chapter_id);
    },
  });

  // Favorite
  const { data: isFavorited = false } = useQuery({
    queryKey: ["favorite", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("id").eq("user_id", user!.id).eq("novel_id", id!).maybeSingle();
      return !!data;
    },
  });

  // Ratings
  const { data: ratingData } = useQuery({
    queryKey: ["ratings", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("novel_ratings").select("rating").eq("novel_id", id!);
      const ratings = data ?? [];
      const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
      return { avg: Math.round(avg * 10) / 10, count: ratings.length };
    },
  });

  // User's rating
  const { data: userRating = 0 } = useQuery({
    queryKey: ["my_rating", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data } = await supabase.from("novel_ratings").select("rating").eq("user_id", user!.id).eq("novel_id", id!).maybeSingle();
      return data?.rating ?? 0;
    },
  });

  const submitRating = async (rating: number) => {
    if (!user) { toast.error("Konekte pou vote"); navigate("/login"); return; }
    if (userRating > 0) {
      await supabase.from("novel_ratings").update({ rating }).eq("user_id", user.id).eq("novel_id", id!);
    } else {
      await supabase.from("novel_ratings").insert({ user_id: user.id, novel_id: id!, rating });
    }
    queryClient.invalidateQueries({ queryKey: ["ratings", id] });
    queryClient.invalidateQueries({ queryKey: ["my_rating", id] });
    toast.success("Mèsi pou nòt ou!");
  };

  const toggleFavorite = async () => {
    if (!user) { toast.error("Konekte pou ajoute nan favoris"); navigate("/login"); return; }
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("novel_id", id!);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, novel_id: id! });
    }
    queryClient.invalidateQueries({ queryKey: ["favorite", id] });
  };

  const handleChapterClick = async (ch: typeof chapters[0]) => {
    if (!user) { toast.error("Ou dwe kreye yon kont pou li"); navigate("/login"); return; }
    if (!ch.is_premium || ch.coin_price === 0 || unlockedIds.includes(ch.id)) {
      navigate(`/chapter/${id}/${ch.id}`);
      return;
    }
    setPendingChapter(ch);
    setShowUnlockDialog(true);
  };

  const confirmUnlock = async () => {
    if (!pendingChapter || !user) return;
    if (!profile || profile.coins < pendingChapter.coin_price) {
      toast.error(`Ou bezwen ${pendingChapter.coin_price} coins. Ou gen ${profile?.coins ?? 0} coins.`);
      setShowUnlockDialog(false);
      return;
    }
    setUnlocking(true);
    try {
      const { error } = await supabase.rpc("unlock_chapter", { _user_id: user.id, _chapter_id: pendingChapter.id });
      if (error) { toast.error(error.message.includes("Not enough") ? "Pa gen ase coins" : "Yon erè rive"); return; }
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["unlocked"] });
      toast.success(`${pendingChapter.coin_price} coins retire. Bòn lekti!`);
      navigate(`/chapter/${id}/${pendingChapter.id}`);
    } catch { toast.error("Yon erè rive"); }
    finally { setUnlocking(false); setShowUnlockDialog(false); setPendingChapter(null); }
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
            {novel.cover_url ? (
              <img src={novel.cover_url} alt={novel.title} className="w-40 h-56 rounded-xl object-cover shrink-0 shadow-lg" loading="lazy" />
            ) : (
              <div className="w-40 h-56 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-lg">
                <BookOpen className="h-14 w-14 text-primary-foreground opacity-60" />
              </div>
            )}
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">{novel.genre}</span>
              <h1 className="text-2xl md:text-3xl font-black font-serif text-foreground mt-1">{novel.title}</h1>
              <p className="text-muted-foreground mt-1 text-sm">pa {novel.author}</p>

              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm"><Heart className="h-4 w-4 fill-primary text-primary" /> {novel.reactions}</span>
                <span className="text-sm text-muted-foreground">{chapters.length} chapit</span>
                {ratingData && ratingData.count > 0 && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {ratingData.avg} <span className="text-muted-foreground">({ratingData.count})</span>
                  </span>
                )}
              </div>

              {novel.description && <p className="text-muted-foreground mt-3 max-w-xl text-sm">{novel.description}</p>}

              <div className="flex gap-3 mt-4 flex-wrap">
                <button onClick={toggleFavorite}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isFavorited ? "gradient-brand text-primary-foreground shadow-md" : "border border-border text-foreground hover:border-primary"
                  }`}>
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                  {isFavorited ? "Nan Favoris" : "Ajoute Favoris"}
                </button>
              </div>

              {/* Star rating */}
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">Note novèl sa a:</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => submitRating(star)}
                      className="transition-transform hover:scale-125 active:scale-90">
                      <Star className={`h-6 w-6 transition-colors ${
                        star <= (hoverRating || userRating) ? "fill-primary text-primary" : "text-muted-foreground"
                      }`} />
                    </button>
                  ))}
                  {userRating > 0 && <span className="text-xs text-muted-foreground ml-2">Nòt ou: {userRating}/5</span>}
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold font-serif text-foreground mb-3">Chapit yo</h2>
          {!user && (
            <div className="mb-4 p-4 rounded-xl border border-primary/30 bg-primary/5 text-center">
              <p className="text-sm text-foreground font-medium">Ou dwe <Link to="/login" className="text-primary font-bold hover:underline">konekte</Link> oswa <Link to="/register" className="text-primary font-bold hover:underline">kreye yon kont</Link> pou li novèl sa a.</p>
            </div>
          )}
          {chapters.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Pa gen chapit pibliye ankò.</p>
          ) : (
            <div className="space-y-2">
              {chapters.map((ch) => {
                const unlocked = !ch.is_premium || ch.coin_price === 0 || unlockedIds.includes(ch.id);
                return (
                  <button key={ch.id} onClick={() => handleChapterClick(ch)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all active:scale-[0.98] text-left ${
                      unlocked ? "border-border bg-card hover:border-primary hover:shadow-sm" : "border-border bg-card opacity-80 hover:border-primary/30"
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground">{ch.chapter_number}</span>
                      <span className="font-medium text-foreground text-sm">{ch.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ch.is_premium && ch.coin_price > 0 ? (
                        unlocked ? (
                          <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">DEBLOKE</span>
                        ) : (
                          <>
                            <span className="coin-badge inline-flex items-center gap-1 text-xs"><Coins className="h-3 w-3" />{ch.coin_price}</span>
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

      {/* Unlock dialog */}
      {showUnlockDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => { setShowUnlockDialog(false); setPendingChapter(null); }}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="h-14 w-14 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
                <Coins className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Debloke Chapit?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Chapit sa a koute <strong className="text-foreground">{pendingChapter?.coin_price} coins</strong>.
                <br />Ou gen <strong className={profile && profile.coins >= (pendingChapter?.coin_price ?? 0) ? "text-primary" : "text-destructive"}>{profile?.coins ?? 0} coins</strong>.
              </p>
              {profile && profile.coins < (pendingChapter?.coin_price ?? 0) && (
                <p className="text-destructive text-sm font-medium mb-4">Pa gen ase coins!</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowUnlockDialog(false); setPendingChapter(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary">Anile</button>
                <button onClick={confirmUnlock}
                  disabled={!profile || profile.coins < (pendingChapter?.coin_price ?? 0) || unlocking}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50">
                  {unlocking ? "..." : "Debloke"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelDetail;
