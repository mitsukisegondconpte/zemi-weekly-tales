import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useIsAuthor,
  useIsVerifiedAuthor,
  useMyNovels,
  useMyChapters,
} from "@/hooks/useAuthor";
import { useAuthorStats } from "@/hooks/useExtra";
import {
  BookOpen, Plus, Edit, Eye, Clock, CheckCircle2, XCircle,
  Sparkles, BadgeCheck, Loader2, ArrowRight, Trash2, FileText,
  MessageSquare, Coins, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NovelEditorModal from "@/components/author/NovelEditorModal";
import ChapterEditorModal from "@/components/author/ChapterEditorModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
    draft: { label: "Bouyon", icon: FileText, cls: "bg-secondary text-muted-foreground border-border" },
    pending: { label: "Ap tann", icon: Clock, cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30" },
    approved: { label: "Apwouve", icon: CheckCircle2, cls: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" },
    rejected: { label: "Refize", icon: XCircle, cls: "bg-destructive/10 text-destructive border-destructive/30" },
  };
  const cfg = map[status] ?? map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
};

const AuthorDashboard = () => {
  const { user, loading } = useAuth();
  const isAuthor = useIsAuthor();
  const isVerified = useIsVerifiedAuthor();
  const queryClient = useQueryClient();
  const { data: novels = [], isLoading: novelsLoading } = useMyNovels();
  const { data: stats } = useAuthorStats(user?.id);
  const [selectedNovel, setSelectedNovel] = useState<string | undefined>();
  const { data: chapters = [], isLoading: chaptersLoading } = useMyChapters(selectedNovel);

  const [novelModalOpen, setNovelModalOpen] = useState(false);
  const [editingNovel, setEditingNovel] = useState<any | null>(null);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "novel" | "chapter"; id: string; title: string } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAuthor) {
    return (
      <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
        <Header />
        <main className="flex-1 container py-12 max-w-md text-center animate-fade-in">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-float" />
          <h1 className="text-2xl font-bold font-serif text-foreground mb-2">Ou poko yon otè</h1>
          <p className="text-muted-foreground mb-6">
            Aplike pou vin otè depi nan paj pwofil ou.
          </p>
          <Link to="/profile">
            <Button className="gradient-brand text-primary-foreground btn-tactile">
              Ale nan Pwofil <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const openNewNovel = () => { setEditingNovel(null); setNovelModalOpen(true); };
  const openEditNovel = (n: any) => { setEditingNovel(n); setNovelModalOpen(true); };
  const openNewChapter = () => { setEditingChapter(null); setChapterModalOpen(true); };
  const openEditChapter = (c: any) => { setEditingChapter(c); setChapterModalOpen(true); };

  const performDelete = async () => {
    if (!confirmDelete) return;
    const { kind, id } = confirmDelete;
    if (kind === "novel") {
      const { error } = await supabase.from("novels").delete().eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Novèl efase");
      if (selectedNovel === id) setSelectedNovel(undefined);
      queryClient.invalidateQueries({ queryKey: ["my_novels"] });
    } else {
      const { error } = await supabase.from("chapters").delete().eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Chapit efase");
      queryClient.invalidateQueries({ queryKey: ["my_chapters"] });
    }
    setConfirmDelete(null);
  };

  const nextChapterNumber = chapters.length > 0
    ? Math.max(...chapters.map((c: any) => c.chapter_number ?? 0)) + 1
    : 1;

  const selectedNovelData = novels.find((n: any) => n.id === selectedNovel);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        <div className="container py-6 max-w-5xl">
          {/* Hero */}
          <div className="rounded-2xl border border-border bg-card p-5 mb-6 animate-fade-in">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
                  Dashboard Otè
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/30">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verifye
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                      <Clock className="h-3.5 w-3.5" /> Ap tann verifikasyon
                    </span>
                  )}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {isVerified
                    ? "Chapit ou yo pibliye dirèkteman."
                    : "Chapit ou yo bezwen apwobasyon admin avan yo pibliye."}
                </p>
              </div>
              <Button onClick={openNewNovel} className="gradient-brand text-primary-foreground btn-tactile">
                <Plus className="h-4 w-4 mr-1.5" /> Nouvo Novèl
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-2xl border border-border bg-card p-4 text-center animate-pop-in">
              <BookOpen className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{stats?.total_novels ?? novels.length}</p>
              <p className="text-[11px] text-muted-foreground">Novèl</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center animate-pop-in" style={{ animationDelay: "60ms" }}>
              <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{stats?.total_published ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Chapit pibliye</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center animate-pop-in" style={{ animationDelay: "120ms" }}>
              <MessageSquare className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{stats?.total_comments ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Kòmantè</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center animate-pop-in" style={{ animationDelay: "180ms" }}>
              <Coins className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{stats?.total_coins_earned ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Coins ganye</p>
            </div>
          </div>

          {/* My Novels */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold font-serif text-foreground">Novèl mwen yo</h2>
            </div>
            {novelsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />
                ))}
              </div>
            ) : novels.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground">Ou poko gen okenn novèl.</p>
                <Button onClick={openNewNovel} variant="outline" className="mt-4 btn-tactile">
                  <Plus className="h-4 w-4 mr-1.5" /> Kreye premye novèl ou
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {novels.map((n: any, i) => (
                  <div
                    key={n.id}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer animate-fade-in-left ${
                      selectedNovel === n.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedNovel(n.id)}
                  >
                    {n.cover_url ? (
                      <img src={n.cover_url} alt={n.title} className="h-14 w-10 rounded object-cover shrink-0" />
                    ) : (
                      <div className="h-14 w-10 rounded bg-secondary flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{n.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <StatusBadge status={n.status === "published" ? "approved" : "pending"} />
                        <span className="text-[11px] text-muted-foreground">
                          <Eye className="h-3 w-3 inline" /> {n.reactions ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditNovel(n); }}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground btn-tactile"
                        aria-label="Modifye"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/novel/${n.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground btn-tactile"
                        aria-label="Wè"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ kind: "novel", id: n.id, title: n.title }); }}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive btn-tactile"
                        aria-label="Efase"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Chapters of selected novel */}
          {selectedNovel && (
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-lg font-bold font-serif text-foreground">
                  Chapit{selectedNovelData ? ` — ${selectedNovelData.title}` : ""}
                </h2>
                <Button
                  size="sm"
                  onClick={openNewChapter}
                  className="gradient-brand text-primary-foreground btn-tactile"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Ajoute Chapit
                </Button>
              </div>
              {chaptersLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : chapters.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-dashed border-border">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Pa gen chapit ankò.</p>
                  <Button onClick={openNewChapter} variant="outline" size="sm" className="mt-3 btn-tactile">
                    <Plus className="h-4 w-4 mr-1.5" /> Premye chapit
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((c: any, i) => (
                    <div
                      key={c.id}
                      style={{ animationDelay: `${i * 30}ms` }}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card animate-slide-up-bounce"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          Ch. {c.chapter_number}: {c.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <StatusBadge status={c.moderation_status ?? "pending"} />
                          {c.is_premium && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                              {c.coin_price} coins
                            </span>
                          )}
                        </div>
                        {c.moderation_status === "rejected" && c.rejection_reason && (
                          <p className="text-[11px] text-destructive mt-1.5 break-words">
                            <strong>Rezon:</strong> {c.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditChapter(c)}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground btn-tactile"
                          aria-label="Modifye"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ kind: "chapter", id: c.id, title: c.title })}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive btn-tactile"
                          aria-label="Efase"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <NovelEditorModal
        open={novelModalOpen}
        onOpenChange={setNovelModalOpen}
        novel={editingNovel}
      />
      {selectedNovel && (
        <ChapterEditorModal
          open={chapterModalOpen}
          onOpenChange={setChapterModalOpen}
          novelId={selectedNovel}
          chapter={editingChapter}
          nextChapterNumber={nextChapterNumber}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase {confirmDelete?.kind === "novel" ? "novèl" : "chapit"} sa a?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" — Aksyon sa a pa ka defèt.
              {confirmDelete?.kind === "novel" && " Tout chapit yo pral efase tou."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anile</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Efase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default AuthorDashboard;
