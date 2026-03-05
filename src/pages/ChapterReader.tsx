import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Lock, Coins } from "lucide-react";
import { useChapter, useChapters } from "@/hooks/useNovels";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useCallback, useState } from "react";

const ChapterReader = () => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const { data: chapter, isLoading } = useChapter(chapterId);
  const { data: allChapters = [] } = useChapters(novelId);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [pendingChapter, setPendingChapter] = useState<any>(null);
  const [unlocking, setUnlocking] = useState(false);

  // Force login
  useEffect(() => {
    if (!user && !isLoading) {
      toast.error("Ou dwe konekte pou li.");
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  // Check unlocked chapters
  const { data: unlockedIds = [] } = useQuery({
    queryKey: ["unlocked", novelId, user?.id],
    enabled: !!user && !!novelId,
    queryFn: async () => {
      const { data } = await supabase
        .from("unlocked_chapters")
        .select("chapter_id")
        .eq("user_id", user!.id);
      return (data ?? []).map(d => d.chapter_id);
    },
  });

  // Track reading history
  useEffect(() => {
    if (user && chapterId && novelId && chapter) {
      supabase.from("reading_history").upsert(
        { user_id: user.id, novel_id: novelId, chapter_id: chapterId, read_at: new Date().toISOString() },
        { onConflict: "user_id,chapter_id" }
      ).then(() => {});
    }
  }, [user, chapterId, novelId, chapter]);

  // Copy protection for premium chapters
  useEffect(() => {
    if (!chapter?.is_premium) return;
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
    };
  }, [chapter?.is_premium]);

  const currentIndex = allChapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const handleNavigateChapter = useCallback((ch: typeof allChapters[0]) => {
    if (!ch) return;
    // Free chapter or already unlocked
    if (!ch.is_premium || ch.coin_price === 0 || unlockedIds.includes(ch.id)) {
      navigate(`/chapter/${novelId}/${ch.id}`);
      return;
    }
    // Need to unlock - show confirmation
    if (!user) {
      toast.error("Konekte pou li chapit premium yo");
      navigate("/login");
      return;
    }
    setPendingChapter(ch);
    setShowUnlockDialog(true);
  }, [unlockedIds, user, novelId, navigate]);

  const confirmUnlock = async () => {
    if (!pendingChapter || !user) return;
    if (!profile || profile.coins < pendingChapter.coin_price) {
      toast.error(`Ou bezwen ${pendingChapter.coin_price} coins. Ou gen ${profile?.coins ?? 0} coins.`);
      setShowUnlockDialog(false);
      return;
    }
    setUnlocking(true);
    try {
      const { data, error } = await supabase.rpc("unlock_chapter", {
        _user_id: user.id,
        _chapter_id: pendingChapter.id,
      });
      if (error) {
        toast.error(error.message.includes("Not enough") ? "Pa gen ase coins" : "Yon erè rive");
        return;
      }
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["unlocked"] });
      toast.success(`${pendingChapter.coin_price} coins retire. Bòn lekti!`);
      navigate(`/chapter/${novelId}/${pendingChapter.id}`);
    } catch {
      toast.error("Yon erè rive");
    } finally {
      setUnlocking(false);
      setShowUnlockDialog(false);
      setPendingChapter(null);
    }
  };

  if (!user) return null;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Chajman...</p></div>;
  if (!chapter) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Chapit pa jwenn</p></div>;

  // Check if current chapter is premium and not unlocked
  const currentIsLocked = chapter.is_premium && chapter.coin_price > 0 && !unlockedIds.includes(chapter.id);
  if (currentIsLocked) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Chapit Premium</h2>
            <p className="text-muted-foreground mb-4">Ou bezwen {chapter.coin_price} coins pou debloke chapit sa a.</p>
            <div className="flex gap-3 justify-center">
              <Link to={`/novel/${novelId}`} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium">
                Retounen
              </Link>
              <button onClick={() => { setPendingChapter(chapter); setShowUnlockDialog(true); }}
                className="px-4 py-2 rounded-xl gradient-brand text-primary-foreground font-medium">
                Debloke ({chapter.coin_price} coins)
              </button>
            </div>
          </div>
        </main>
        <Footer />
        {/* Unlock dialog */}
        {showUnlockDialog && <UnlockDialog chapter={pendingChapter} coins={profile?.coins ?? 0} onConfirm={confirmUnlock} onCancel={() => { setShowUnlockDialog(false); setPendingChapter(null); }} loading={unlocking} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container max-w-3xl py-8">
          <Link to={`/novel/${novelId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
            <ChevronLeft className="h-4 w-4" /> Retounen nan novèl la
          </Link>

          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Chapit {chapter.chapter_number}</span>
            <h1 className="text-3xl font-black font-serif text-foreground mt-1">{chapter.title}</h1>
          </div>

          {/* Watermark for premium */}
          <article className={`prose prose-lg max-w-none text-foreground leading-relaxed space-y-4 relative ${chapter.is_premium ? "select-none" : ""}`}>
            {chapter.is_premium && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] text-foreground text-4xl font-black rotate-[-30deg] z-10 overflow-hidden">
                <div className="whitespace-nowrap">
                  {user?.email} • {new Date().toLocaleDateString()}
                </div>
              </div>
            )}
            {chapter.content.split("\n").map((paragraph, i) => (
              paragraph.trim() ? <p key={i}>{paragraph}</p> : null
            ))}
          </article>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
            {prevChapter ? (
              <button onClick={() => handleNavigateChapter(prevChapter)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80">
                <ChevronLeft className="h-4 w-4" /> Chapit anvan
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium opacity-50 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" /> Chapit anvan
              </span>
            )}
            <span className="text-sm text-muted-foreground">{chapter.chapter_number} / {allChapters.length}</span>
            {nextChapter ? (
              <button onClick={() => handleNavigateChapter(nextChapter)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                Chapit swivan <ChevronRight className="h-4 w-4" />
                {nextChapter.is_premium && nextChapter.coin_price > 0 && !unlockedIds.includes(nextChapter.id) && (
                  <Lock className="h-3 w-3 ml-1" />
                )}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-50 cursor-not-allowed">
                Chapit swivan <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </main>
      <Footer />
      {/* Unlock dialog */}
      {showUnlockDialog && <UnlockDialog chapter={pendingChapter} coins={profile?.coins ?? 0} onConfirm={confirmUnlock} onCancel={() => { setShowUnlockDialog(false); setPendingChapter(null); }} loading={unlocking} />}
    </div>
  );
};

// Unlock confirmation dialog
const UnlockDialog = ({ chapter, coins, onConfirm, onCancel, loading }: {
  chapter: any; coins: number; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) => {
  const hasEnough = coins >= (chapter?.coin_price ?? 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="h-14 w-14 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
            <Coins className="h-7 w-7 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Debloke Chapit?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Chapit sa a koute <strong className="text-foreground">{chapter?.coin_price} coins</strong>.
            <br />Ou gen <strong className={hasEnough ? "text-primary" : "text-destructive"}>{coins} coins</strong>.
          </p>
          {!hasEnough && (
            <p className="text-destructive text-sm font-medium mb-4">Pa gen ase coins! Ale nan pwofil ou pou achte plis.</p>
          )}
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary">
              Anile
            </button>
            <button onClick={onConfirm} disabled={!hasEnough || loading}
              className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50">
              {loading ? "..." : `Debloke (${chapter?.coin_price} coins)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterReader;
