import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Check, X, ExternalLink, Clock, Loader2, BadgeCheck } from "lucide-react";
import { formatRelative } from "@/hooks/useAuthor";

/** Admin tab: review pending author applications + manage author roles. */
const AdminAuthorReview = () => {
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin_applications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("author_applications")
        .select("*")
        .order("created_at", { ascending: false });
      // Fetch profiles separately
      const userIds = Array.from(new Set((data ?? []).map((a) => a.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : { data: [] as any[] };
      const map = new Map((profiles ?? []).map((p: any) => [p.user_id, p.display_name]));
      return (data ?? []).map((a) => ({ ...a, display_name: map.get(a.user_id) ?? "Itilizatè" }));
    },
  });

  const { data: authors = [] } = useQuery({
    queryKey: ["admin_authors_list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["author", "verified_author"]);
      const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : { data: [] as any[] };
      const map = new Map((profiles ?? []).map((p: any) => [p.user_id, p.display_name]));
      // Group roles per user
      const grouped = new Map<string, { user_id: string; display_name: string; roles: string[] }>();
      for (const r of data ?? []) {
        const key = r.user_id;
        const entry = grouped.get(key) ?? { user_id: key, display_name: map.get(key) ?? "Itilizatè", roles: [] };
        entry.roles.push(r.role);
        grouped.set(key, entry);
      }
      return Array.from(grouped.values());
    },
  });

  const handleSubmitReview = async () => {
    if (!reviewingId || !decision) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("review_author_application", {
        _application_id: reviewingId,
        _decision: decision,
        _admin_notes: adminNotes.trim() || null,
      });
      if (error) throw error;
      toast.success(decision === "accepted" ? "Aplikasyon aksepte!" : "Aplikasyon refize");
      setReviewingId(null);
      setAdminNotes("");
      setDecision(null);
      queryClient.invalidateQueries({ queryKey: ["admin_applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin_authors_list"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erè");
    } finally {
      setBusy(false);
    }
  };

  const toggleVerified = async (userId: string, currentlyVerified: boolean) => {
    try {
      if (currentlyVerified) {
        // Remove verified_author role
        await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "verified_author" as any);
        toast.success("Verifikasyon retire");
      } else {
        await supabase.from("user_roles").insert({ user_id: userId, role: "verified_author" as any });
        toast.success("Otè verifye!");
      }
      queryClient.invalidateQueries({ queryKey: ["admin_authors_list"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erè");
    }
  };

  const pending = applications.filter((a) => a.status === "pending");
  const reviewed = applications.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Pending applications */}
      <section>
        <h2 className="text-lg font-bold font-serif text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Aplikasyon ki ap tann ({pending.length})
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Pa gen aplikasyon ap tann.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((a, i) => (
              <div
                key={a.id}
                style={{ animationDelay: `${i * 50}ms` }}
                className="rounded-2xl border border-border bg-card p-4 animate-slide-up-bounce"
              >
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <p className="font-bold text-foreground">{a.display_name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatRelative(a.created_at)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div>
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Bio</p>
                    <p className="text-sm text-foreground break-words">{a.bio}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Motivasyon</p>
                    <p className="text-sm text-foreground break-words">{a.motivation}</p>
                  </div>
                  {a.portfolio_url && (
                    <a
                      href={a.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1 break-all"
                    >
                      <ExternalLink className="h-3 w-3" /> {a.portfolio_url}
                    </a>
                  )}
                </div>

                {reviewingId === a.id ? (
                  <div className="space-y-2 pt-3 border-t border-border">
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Nòt pou otè a (opsyonèl)..."
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => { setDecision("accepted"); handleSubmitReview(); }}
                        disabled={busy}
                        className="bg-green-600 hover:bg-green-700 text-white btn-tactile"
                      >
                        {busy && decision === "accepted" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Aksepte
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { setDecision("rejected"); handleSubmitReview(); }}
                        disabled={busy}
                        className="btn-tactile"
                      >
                        {busy && decision === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Refize
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setReviewingId(null); setAdminNotes(""); setDecision(null); }}
                        disabled={busy}
                      >
                        Anile
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setReviewingId(a.id)}
                    className="gradient-brand text-primary-foreground btn-tactile"
                  >
                    Revize
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviewed history */}
      {reviewed.length > 0 && (
        <section>
          <h2 className="text-lg font-bold font-serif text-foreground mb-3">Istwa desizyon ({reviewed.length})</h2>
          <div className="space-y-2">
            {reviewed.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-card text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{a.display_name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatRelative(a.created_at)}</p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    a.status === "accepted"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {a.status === "accepted" ? "Aksepte" : "Refize"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Authors list with verification toggle */}
      <section>
        <h2 className="text-lg font-bold font-serif text-foreground mb-3 flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-primary" />
          Otè yo ({authors.length})
        </h2>
        {authors.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Pa gen otè ankò.</p>
        ) : (
          <div className="space-y-2">
            {authors.map((a) => {
              const verified = a.roles.includes("verified_author");
              return (
                <div key={a.user_id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-card">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{a.display_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {verified ? "Verifye" : "Otè senp"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={verified ? "outline" : "default"}
                    onClick={() => toggleVerified(a.user_id, verified)}
                    className="btn-tactile shrink-0"
                  >
                    {verified ? "Retire verifikasyon" : "Verifye"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminAuthorReview;
