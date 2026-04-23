import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAuthor, useIsVerifiedAuthor, useMyNovels, useMyChapters } from "@/hooks/useAuthor";
import { BookOpen, Plus, Edit, Eye, Clock, CheckCircle2, XCircle, Sparkles, BadgeCheck, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
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
  const { data: novels = [], isLoading: novelsLoading } = useMyNovels();
  const [selectedNovel, setSelectedNovel] = useState<string | undefined>();
  const { data: chapters = [], isLoading: chaptersLoading } = useMyChapters(selectedNovel);

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
              <Link to="/admin">
                <Button variant="outline" className="btn-tactile">
                  <Plus className="h-4 w-4 mr-1.5" /> Kreye nan Admin
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl border border-border bg-card p-4 text-center animate-pop-in">
              <BookOpen className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{novels.length}</p>
              <p className="text-[11px] text-muted-foreground">Novèl</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center animate-pop-in" style={{ animationDelay: "60ms" }}>
              <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-xl font-bold text-foreground">{novels.filter((n: any) => n.status === "published").length}</p>
              <p className="text-[11px] text-muted-foreground">Pibliye</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center animate-pop-in" style={{ animationDelay: "120ms" }}>
              <Clock className="h-5 w-5 mx-auto text-orange-500 mb-1" />
              <p className="text-xl font-bold text-foreground">{novels.filter((n: any) => n.status !== "published").length}</p>
              <p className="text-[11px] text-muted-foreground">Bouyon</p>
            </div>
          </div>

          {/* My Novels */}
          <section className="mb-8">
            <h2 className="text-lg font-bold font-serif text-foreground mb-3">Novèl mwen yo</h2>
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
                <p className="text-muted-foreground text-xs mt-1">Kreye yon nan Admin Panel.</p>
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
                    <Link
                      to={`/novel/${n.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground btn-tactile"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Chapters of selected novel */}
          {selectedNovel && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-bold font-serif text-foreground mb-3">Chapit yo</h2>
              {chaptersLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : chapters.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Pa gen chapit.</p>
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
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default AuthorDashboard;
