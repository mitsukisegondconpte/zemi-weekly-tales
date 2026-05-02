import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Send } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  authorId: string;
  authorName?: string;
  contextLabel?: string; // e.g. "Novèl: Title" or "Chapit: Title"
  link?: string; // optional deep link
  onSent?: () => void;
}

const PRESETS = [
  "Avètisman: Kontni ou pa respekte règleman platfòm la.",
  "Bug detekte nan novèl/chapit ou. Tanpri korije epi resoumèt.",
  "Kalite ekriti pa sifizan. Tanpri amelyore avan resoumèt.",
  "Imaj/kouvèti pa apwopriye. Chanje l souple.",
];

const AdminWarnAuthorDialog = ({ open, onOpenChange, authorId, authorName, contextLabel, link, onSent }: Props) => {
  const [title, setTitle] = useState("Avètisman ZEMI");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!message.trim()) { toast.error("Mesaj obligatwa"); return; }
    setSending(true);
    try {
      const { error } = await supabase.from("user_notifications").insert({
        user_id: authorId,
        title: title.trim() || "Avètisman ZEMI",
        message: contextLabel ? `${contextLabel}\n\n${message.trim()}` : message.trim(),
        type: "warning",
        link: link ?? null,
      });
      if (error) throw error;
      toast.success(`Avètisman voye${authorName ? " bay " + authorName : ""}`);
      setMessage("");
      onSent?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erè voye avètisman");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-orange-500/15 flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
          <DialogTitle className="text-center font-serif">Avèti Otè</DialogTitle>
          <DialogDescription className="text-center text-xs">
            {authorName ? `Voye yon mesaj bay ${authorName}` : "Voye yon mesaj prive bay otè a"}
            {contextLabel && <div className="mt-1 font-medium text-foreground">{contextLabel}</div>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Tit</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Modèl rapid</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMessage(p)}
                  className="text-[11px] px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                >
                  {p.split(":")[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Mesaj *</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Eksplike pwoblèm la..." />
          </div>
          <Button onClick={send} disabled={sending} className="w-full gradient-brand text-primary-foreground btn-tactile">
            {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ap voye...</> : <><Send className="h-4 w-4 mr-2" /> Voye Avètisman</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminWarnAuthorDialog;
