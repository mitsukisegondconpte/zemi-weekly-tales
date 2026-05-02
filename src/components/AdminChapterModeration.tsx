import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileCheck, Check, X, Eye, Clock, Loader2, Bell } from "lucide-react";
import { formatRelative } from "@/hooks/useAuthor";
import DOMPurify from "dompurify";
import AdminWarnAuthorDialog from "@/components/AdminWarnAuthorDialog";

const REJECT_REASONS = [
  "Kontni inapwopriye",
  "Kalite ekriti pa sifizan",
  "Kontni dwòl/ofansif",
  "Pa respekte règleman yo",
  "Lòt (presize)",
];

const AdminChapterModeration = () => {
  const queryClient = useQueryClient();
  const [previewChapter, setPreviewChapter] = useState<any | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [warnTarget, setWarnTarget] = useState<{ authorId: string; name?: string; context?: string } | null>(null);

  const { data: pendingChapters = [], isLoading } = useQuery({
    queryKey: ["admin_pending_chapters"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chapters")
        .select("*, novels:novel_id(title)")
        .eq("moderation_status", "pending")
        .order("created_at", { ascending: false });
      const authorIds = Array.from(new Set((data ?? []).map((c: any) => c.author_id).filter(Boolean)));
      const { data: profiles } = authorIds.length
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", authorIds)
        : { data: [] as any[] };
      const map = new Map((profiles ?? []).map((p: any) => [p.user_id, p.display_name]));
      return (data ?? []).map((c: any) => ({ ...c, author_name: map.get(c.author_id) ?? "—" }));
    },
  });

  const approve = async (id: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("moderate_chapter", {
        _chapter_id: id,
        _decision: "approved",
      });
      if (error) throw error;
      toast.success("Chapit apwouve!");
      queryClient.invalidateQueries({ queryKey: ["admin_pending_chapters"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erè");
    } finally {
      setBusy(false);
    }
  };

  const submitReject = async () => {
    if (!rejectingId) return;
    const finalReason = rejectReason === "Lòt (presize)" ? customReason.trim() : rejectReason;
    if (!finalReason) {
      toast.error("Bay yon rezon");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("moderate_chapter", {
        _chapter_id: rejectingId,
        _decision: "rejected",
        _reason: finalReason,
      });
      if (error) throw error;
      toast.success("Chapit refize");
      setRejectingId(null);
      setCustomReason("");
      setRejectReason(REJECT_REASONS[0]);
      queryClient.invalidateQueries({ queryKey: ["admin_pending_chapters"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erè");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold font-serif text-foreground flex items-center gap-2">
        <FileCheck className="h-5 w-5 text-primary" />
        Chapit ki ap tann moderasyon ({pendingChapters.length})
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : pendingChapters.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">Pa gen chapit ap tann.</p>
      ) : (
        <div className="space-y-3">
          {pendingChapters.map((c: any, i) => (
            <div
              key={c.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className="rounded-2xl border border-border bg-card p-4 animate-slide-up-bounce"
            >
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground break-words">
                    Ch. {c.chapter_number}: {c.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Novèl: <span className="font-medium">{c.novels?.title ?? "—"}</span> · Otè:{" "}
                    <span className="font-medium">{c.author_name}</span> · {formatRelative(c.created_at)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 shrink-0">
                  <Clock className="h-3 w-3" /> Ap tann
                </span>
              </div>

              <div className="flex gap-2 flex-wrap mt-3">
                <Button size="sm" variant="outline" onClick={() => setPreviewChapter(c)} className="btn-tactile">
                  <Eye className="h-4 w-4 mr-1.5" /> Wè
                </Button>
                <Button
                  size="sm"
                  onClick={() => approve(c.id)}
                  disabled={busy}
                  className="bg-green-600 hover:bg-green-700 text-white btn-tactile"
                >
                  <Check className="h-4 w-4 mr-1.5" /> Apwouve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectingId(c.id)}
                  disabled={busy}
                  className="btn-tactile"
                >
                  <X className="h-4 w-4 mr-1.5" /> Refize
                </Button>
                {c.author_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setWarnTarget({ authorId: c.author_id, name: c.author_name, context: `Chapit: ${c.title}` })}
                    className="btn-tactile border-orange-500/40 text-orange-600 hover:bg-orange-500/10"
                  >
                    <Bell className="h-4 w-4 mr-1.5" /> Avèti
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {warnTarget && (
        <AdminWarnAuthorDialog
          open={!!warnTarget}
          onOpenChange={(o) => !o && setWarnTarget(null)}
          authorId={warnTarget.authorId}
          authorName={warnTarget.name}
          contextLabel={warnTarget.context}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewChapter} onOpenChange={(o) => !o && setPreviewChapter(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {previewChapter && `Ch. ${previewChapter.chapter_number}: ${previewChapter.title}`}
            </DialogTitle>
          </DialogHeader>
          {previewChapter && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewChapter.content || "") }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Refize chapit la</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Rezon</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {REJECT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {rejectReason === "Lòt (presize)" && (
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Eksplike rezon an..."
                rows={3}
              />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRejectingId(null)} className="flex-1">
                Anile
              </Button>
              <Button variant="destructive" onClick={submitReject} disabled={busy} className="flex-1 btn-tactile">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Konfime refize"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChapterModeration;
