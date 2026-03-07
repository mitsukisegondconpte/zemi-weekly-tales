import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Lock, Coins, Type, Minus, Plus, MessageSquare, Send, BookOpen } from "lucide-react";
import { useChapter, useChapters } from "@/hooks/useNovels";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { Progress } from "@/components/ui/progress";

type ReadingTheme = "light" | "dark" | "sepia";

const THEME_STYLES: Record<ReadingTheme, { bg: string; text: string; label: string; icon: string }> = {
  light: { bg: "bg-white", text: "text-gray-900", label: "Klè", icon: "☀️" },
  dark: { bg: "bg-[#1a1a2e]", text: "text-gray-200", label: "Nwa", icon: "🌙" },
  sepia: { bg: "bg-[#f4ecd8]", text: "text-[#5b4636]", label: "Sepia", icon: "📜" },
};

const PARAGRAPHS_PER_PAGE = 12;

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
  const [showSettings, setShowSettings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<ReadingTheme>(() =>
    (localStorage.getItem("reading-theme") as ReadingTheme) || "light"
  );
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("reading-font-size") || "18"));
  const [maxWidth, setMaxWidth] = useState(() => parseInt(localStorage.getItem("reading-max-width") || "720"));
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    localStorage.setItem("reading-theme", theme);
    localStorage.setItem("reading-font-size", String(fontSize));
    localStorage.setItem("reading-max-width", String(maxWidth));
  }, [theme, fontSize, maxWidth]);

  useEffect(() => {
    if (chapterId) {
      const saved = localStorage.getItem(`page-${chapterId}`);
      if (saved) setCurrentPage(parseInt(saved));
      else setCurrentPage(0);
    }
  }, [chapterId]);

  useEffect(() => {
    if (chapterId) localStorage.setItem(`page-${chapterId}`, String(currentPage));
  }, [currentPage, chapterId]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) setScrollProgress((scrollTop / docHeight) * 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user && !isLoading) {
      toast.error("Ou dwe konekte pou li.");
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const { data: unlockedIds = [] } = useQuery({
    queryKey: ["unlocked", novelId, user?.id],
    enabled: !!user && !!novelId,
    queryFn: async () => {
      const { data } = await supabase.from("unlocked_chapters").select("chapter_id").eq("user_id", user!.id);
      return (data ?? []).map(d => d.chapter_id);
    },
  });

  useEffect(() => {
    if (user && chapterId && novelId && chapter) {
      supabase.from("reading_history").upsert(
        { user_id: user.id, novel_id: novelId, chapter_id: chapterId, read_at: new Date().toISOString() },
        { onConflict: "user_id,chapter_id" }
      ).then(() => {});
    }
  }, [user, chapterId, novelId, chapter]);

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

  // Comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["comments", chapterId],
    enabled: !!chapterId,
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles:user_id(display_name)")
        .eq("chapter_id", chapterId!)
        .eq("is_approved", true)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const submitComment = async () => {
    if (!commentText.trim() || !user || !chapterId || !novelId) return;
    setSubmittingComment(true);
    const { error } = await supabase.from("comments").insert({
      user_id: user.id, chapter_id: chapterId, novel_id: novelId, content: commentText.trim()
    });
    setSubmittingComment(false);
    if (error) { toast.error("Erè"); return; }
    setCommentText("");
    refetchComments();
    toast.success("Kòmantè ajoute!");
  };

  // Paginate: use HTML content, split by blocks
  const pages = useMemo(() => {
    if (!chapter?.content) return [[""]];
    const content = chapter.content;
    // If content is HTML (from Quill), render as single block per page
    if (content.includes("<")) {
      // Split HTML by paragraphs/blocks
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const blocks: string[] = [];
      doc.body.childNodes.forEach(node => {
        const el = node as HTMLElement;
        if (el.outerHTML) blocks.push(el.outerHTML);
        else if (el.textContent?.trim()) blocks.push(`<p>${el.textContent}</p>`);
      });
      if (blocks.length === 0) return [[content]];
      const result: string[][] = [];
      for (let i = 0; i < blocks.length; i += PARAGRAPHS_PER_PAGE) {
        result.push([blocks.slice(i, i + PARAGRAPHS_PER_PAGE).join("")]);
      }
      return result;
    }
    // Plain text
    const allParagraphs = content.split("\n").filter(p => p.trim());
    const result: string[][] = [];
    for (let i = 0; i < allParagraphs.length; i += PARAGRAPHS_PER_PAGE) {
      result.push(allParagraphs.slice(i, i + PARAGRAPHS_PER_PAGE));
    }
    return result.length > 0 ? result : [[""]];
  }, [chapter?.content]);

  const totalPages = pages.length;
  const safePage = Math.min(currentPage, totalPages - 1);

  const currentIndex = allChapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const handleNavigateChapter = useCallback((ch: typeof allChapters[0]) => {
    if (!ch) return;
    if (!ch.is_premium || ch.coin_price === 0 || unlockedIds.includes(ch.id)) {
      navigate(`/chapter/${novelId}/${ch.id}`);
      return;
    }
    if (!user) { toast.error("Konekte pou li chapit premium yo"); navigate("/login"); return; }
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
      const { error } = await supabase.rpc("unlock_chapter", { _user_id: user.id, _chapter_id: pendingChapter.id });
      if (error) { toast.error(error.message.includes("Not enough") ? "Pa gen ase coins" : "Yon erè rive"); return; }
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["unlocked"] });
      toast.success(`${pendingChapter.coin_price} coins retire. Bòn lekti!`);
      navigate(`/chapter/${novelId}/${pendingChapter.id}`);
    } catch { toast.error("Yon erè rive"); }
    finally { setUnlocking(false); setShowUnlockDialog(false); setPendingChapter(null); }
  };

  if (!user) return null;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Chajman...</p></div>;
  if (!chapter) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Chapit pa jwenn</p></div>;

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
              <Link to={`/novel/${novelId}`} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium">Retounen</Link>
              <button onClick={() => { setPendingChapter(chapter); setShowUnlockDialog(true); }}
                className="px-4 py-2 rounded-xl gradient-brand text-primary-foreground font-medium">
                Debloke ({chapter.coin_price} coins)
              </button>
            </div>
          </div>
        </main>
        <Footer />
        {showUnlockDialog && <UnlockDialog chapter={pendingChapter} coins={profile?.coins ?? 0} onConfirm={confirmUnlock} onCancel={() => { setShowUnlockDialog(false); setPendingChapter(null); }} loading={unlocking} />}
      </div>
    );
  }

  const ts = THEME_STYLES[theme];

  return (
    <div className={`min-h-screen flex flex-col ${ts.bg} transition-colors duration-300`}>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1">
        <div className="h-full gradient-brand transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Sticky toolbar */}
      <div className={`sticky top-0 z-50 border-b ${theme === 'dark' ? 'border-white/10 bg-[#1a1a2e]/95' : theme === 'sepia' ? 'border-[#c4a882] bg-[#f4ecd8]/95' : 'border-border bg-white/95'} backdrop-blur`}>
        <div className="flex items-center justify-between px-4 py-2.5 max-w-4xl mx-auto">
          <Link to={`/novel/${novelId}`} className={`flex items-center gap-1.5 text-sm font-medium ${ts.text} opacity-70 hover:opacity-100`}>
            <ChevronLeft className="h-5 w-5" /> Retounen
          </Link>
          <span className={`text-xs font-semibold ${ts.text} opacity-60`}>
            Ch. {chapter.chapter_number} • Paj {safePage + 1}/{totalPages}
          </span>
          <div className="flex items-center gap-0.5">
            {/* Settings button - VERY VISIBLE */}
            <button onClick={() => { setShowSettings(!showSettings); setShowComments(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                showSettings
                  ? "gradient-brand text-white shadow-md"
                  : `${theme === 'dark' ? 'bg-white/10 text-white' : theme === 'sepia' ? 'bg-[#d4c4a8] text-[#5b4636]' : 'bg-secondary text-secondary-foreground'}`
              }`}>
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">Tèks</span>
            </button>
            {/* Comments button - VERY VISIBLE */}
            <button onClick={() => { setShowComments(!showComments); setShowSettings(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 relative ${
                showComments
                  ? "gradient-brand text-white shadow-md"
                  : `${theme === 'dark' ? 'bg-white/10 text-white' : theme === 'sepia' ? 'bg-[#d4c4a8] text-[#5b4636]' : 'bg-secondary text-secondary-foreground'}`
              }`}>
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Kòmantè</span>
              {comments.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-md">
                  {comments.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className={`border-t ${theme === 'dark' ? 'border-white/10' : theme === 'sepia' ? 'border-[#c4a882]' : 'border-border'} px-4 py-4`}>
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Theme selector */}
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${ts.text} opacity-50 block mb-2`}>Tèm Lekti</span>
                <div className="flex gap-2">
                  {(Object.keys(THEME_STYLES) as ReadingTheme[]).map(t => (
                    <button key={t} onClick={() => setTheme(t)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                        theme === t
                          ? "gradient-brand text-white shadow-lg ring-2 ring-primary/30"
                          : `${THEME_STYLES[t].bg} ${THEME_STYLES[t].text} border-2 border-current/10`
                      }`}>
                      {THEME_STYLES[t].icon} {THEME_STYLES[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${ts.text} opacity-50 block mb-2`}>Tay Tèks</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFontSize(f => Math.max(14, f - 2))}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg active:scale-95 ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-secondary text-secondary-foreground'}`}>
                    A-
                  </button>
                  <div className="flex-1 flex items-center justify-center">
                    <span className={`text-lg font-black ${ts.text}`}>{fontSize}px</span>
                  </div>
                  <button onClick={() => setFontSize(f => Math.min(28, f + 2))}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg active:scale-95 ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-secondary text-secondary-foreground'}`}>
                    A+
                  </button>
                </div>
              </div>

              {/* Width */}
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${ts.text} opacity-50 block mb-2`}>Lajè Tèks</span>
                <div className="flex gap-2">
                  {[{ w: 600, l: "Etwat" }, { w: 720, l: "Mwayen" }, { w: 900, l: "Laj" }].map(({ w, l }) => (
                    <button key={w} onClick={() => setMaxWidth(w)}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                        maxWidth === w ? "gradient-brand text-white shadow-lg" : `${ts.text} opacity-60 border-2 ${theme === 'dark' ? 'border-white/10' : 'border-border'}`
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="flex-1">
        <div className="mx-auto px-4 py-8" style={{ maxWidth: `${maxWidth}px` }} ref={contentRef}>
          <div className="mb-8">
            <span className={`text-xs font-semibold uppercase tracking-widest ${theme === 'dark' ? 'text-orange-400' : 'text-primary'}`}>Chapit {chapter.chapter_number}</span>
            <h1 className={`text-2xl md:text-3xl font-black font-serif ${ts.text} mt-1`}>{chapter.title}</h1>
          </div>

          {/* Watermark for premium */}
          <article className={`relative ${chapter.is_premium ? "select-none" : ""}`} style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
            {chapter.is_premium && (
              <div className={`pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] ${ts.text} text-4xl font-black rotate-[-30deg] z-10 overflow-hidden`}>
                <div className="whitespace-nowrap">{user?.email} • {new Date().toLocaleDateString()}</div>
              </div>
            )}

            {/* Render current page - HTML content support */}
            <div className={`${ts.text} chapter-content`}>
              {pages[safePage]?.map((block, i) => {
                if (block.includes("<")) {
                  return <div key={i} dangerouslySetInnerHTML={{ __html: block }} />;
                }
                return <p key={i} className="mb-6">{block}</p>;
              })}
            </div>
          </article>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="mt-10 space-y-4">
              <Progress value={((safePage + 1) / totalPages) * 100} className="h-2" />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setCurrentPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0); }}
                  disabled={safePage === 0}
                  className={`px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    safePage === 0 ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"
                  } ${theme === 'dark' ? 'bg-white/10 text-white' : theme === 'sepia' ? 'bg-[#d4c4a8] text-[#5b4636]' : 'bg-secondary text-secondary-foreground'}`}>
                  <ChevronLeft className="h-4 w-4 inline mr-1" /> Paj anvan
                </button>

                <div className="flex gap-1.5 flex-wrap justify-center">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => { setCurrentPage(i); window.scrollTo(0, 0); }}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        i === safePage ? "gradient-brand text-white shadow-md" : `${ts.text} opacity-40 hover:opacity-70`
                      }`}>
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setCurrentPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0); }}
                  disabled={safePage >= totalPages - 1}
                  className={`px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    safePage >= totalPages - 1 ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"
                  } ${theme === 'dark' ? 'bg-white/10 text-white' : theme === 'sepia' ? 'bg-[#d4c4a8] text-[#5b4636]' : 'bg-secondary text-secondary-foreground'}`}>
                  Paj swivan <ChevronRight className="h-4 w-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Chapter navigation */}
          <div className={`flex items-center justify-between mt-8 pt-6 border-t ${theme === 'dark' ? 'border-white/10' : theme === 'sepia' ? 'border-[#c4a882]' : 'border-border'}`}>
            {prevChapter ? (
              <button onClick={() => handleNavigateChapter(prevChapter)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold active:scale-95 ${theme === 'dark' ? 'bg-white/10 text-white' : theme === 'sepia' ? 'bg-[#d4c4a8] text-[#5b4636]' : 'bg-secondary text-secondary-foreground'}`}>
                <ChevronLeft className="h-5 w-5" /> Chapit anvan
              </button>
            ) : <div />}
            <span className={`text-sm font-semibold ${ts.text} opacity-50`}>{chapter.chapter_number} / {allChapters.length}</span>
            {nextChapter ? (
              <button onClick={() => handleNavigateChapter(nextChapter)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-brand text-white text-sm font-bold hover:opacity-90 shadow-lg active:scale-95">
                Chapit swivan <ChevronRight className="h-5 w-5" />
                {nextChapter.is_premium && nextChapter.coin_price > 0 && !unlockedIds.includes(nextChapter.id) && <Lock className="h-4 w-4" />}
              </button>
            ) : <div />}
          </div>

          {/* Comments section - ALWAYS VISIBLE at bottom */}
          <div className={`mt-10 pt-6 border-t ${theme === 'dark' ? 'border-white/10' : theme === 'sepia' ? 'border-[#c4a882]' : 'border-border'}`}>
            <h3 className={`text-xl font-black font-serif ${ts.text} mb-6 flex items-center gap-3`}>
              <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              Kòmantè ({comments.length})
            </h3>

            {/* Comment input */}
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitComment()}
                placeholder="Ekri yon kòmantè..."
                className={`flex-1 rounded-xl border-2 px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                  theme === 'dark' ? 'border-white/20 bg-white/5 text-white placeholder:text-white/40' :
                  theme === 'sepia' ? 'border-[#c4a882] bg-[#ede0c8] text-[#5b4636]' :
                  'border-border bg-background text-foreground'
                }`}
              />
              <button onClick={submitComment} disabled={submittingComment || !commentText.trim()}
                className="px-5 py-3.5 rounded-xl gradient-brand text-white font-bold hover:opacity-90 disabled:opacity-50 shadow-lg active:scale-95 flex items-center gap-2">
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Voye</span>
              </button>
            </div>

            {/* Comment list */}
            <div className="space-y-3">
              {comments.map((c: any) => (
                <div key={c.id} className={`p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-white/5 border border-white/10' :
                  theme === 'sepia' ? 'bg-[#ede0c8] border border-[#c4a882]' :
                  'bg-card border border-border'
                }`}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {((c as any).profiles?.display_name || "U")[0].toUpperCase()}
                    </div>
                    <span className={`text-sm font-bold ${ts.text}`}>{(c as any).profiles?.display_name || "Anonim"}</span>
                    <span className={`text-xs ${ts.text} opacity-40`}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-sm ${ts.text} opacity-80 pl-10`}>{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className={`text-center py-10 ${ts.text} opacity-40`}>
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Pa gen kòmantè ankò.</p>
                  <p className="text-xs mt-1">Ou ka premye a! 🎉</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      {showUnlockDialog && <UnlockDialog chapter={pendingChapter} coins={profile?.coins ?? 0} onConfirm={confirmUnlock} onCancel={() => { setShowUnlockDialog(false); setPendingChapter(null); }} loading={unlocking} />}
    </div>
  );
};

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
          {!hasEnough && <p className="text-destructive text-sm font-medium mb-4">Pa gen ase coins!</p>}
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary">Anile</button>
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
