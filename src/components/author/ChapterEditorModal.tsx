import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";
import { useIsVerifiedAuthor } from "@/hooks/useAuthor";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  novelId: string;
  chapter?: any | null;
  nextChapterNumber: number;
}

const ChapterEditorModal = ({ open, onOpenChange, novelId, chapter, nextChapterNumber }: Props) => {
  const { user } = useAuth();
  const isVerified = useIsVerifiedAuthor();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    chapter_number: nextChapterNumber,
    is_premium: false,
    coin_price: 0,
  });

  useEffect(() => {
    if (chapter) {
      setForm({
        title: chapter.title ?? "",
        content: chapter.content ?? "",
        chapter_number: chapter.chapter_number ?? nextChapterNumber,
        is_premium: !!chapter.is_premium,
        coin_price: chapter.coin_price ?? 0,
      });
    } else {
      setForm({
        title: "",
        content: "",
        chapter_number: nextChapterNumber,
        is_premium: false,
        coin_price: 0,
      });
    }
  }, [chapter, nextChapterNumber, open]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Tit ak kontni obligatwa");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        novel_id: novelId,
        author_id: user.id,
        title: form.title.trim(),
        content: form.content,
        chapter_number: form.chapter_number,
        is_premium: form.is_premium,
        coin_price: form.is_premium ? Math.max(0, form.coin_price) : 0,
        status: isVerified ? "published" : "draft",
      };

      if (chapter?.id) {
        const { error } = await supabase
          .from("chapters")
          .update(payload)
          .eq("id", chapter.id);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Chapit modifye!");
      } else {
        const { error } = await supabase.from("chapters").insert(payload);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(
          isVerified
            ? "Chapit pibliye!"
            : "Chapit voye pou moderasyon. Ap tann apwobasyon admin."
        );
      }
      queryClient.invalidateQueries({ queryKey: ["my_chapters"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full gradient-brand flex items-center justify-center mb-2 animate-pop-in">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center font-serif text-xl">
            {chapter ? "Modifye Chapit" : "Nouvo Chapit"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {isVerified
              ? "W ap pibliye dirèkteman (otè verifye)."
              : "Chapit la pral pase nan moderasyon admin avan li parèt."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="c-title" className="text-sm font-semibold">Tit *</Label>
              <Input
                id="c-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Tit chapit la"
                maxLength={140}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-num" className="text-sm font-semibold">Nimewo</Label>
              <Input
                id="c-num"
                type="number"
                min={1}
                value={form.chapter_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, chapter_number: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-content" className="text-sm font-semibold">Kontni *</Label>
            <Textarea
              id="c-content"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Ekri chapit ou la..."
              rows={14}
              className="resize-y font-serif leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">
              Ou ka itilize HTML senp: &lt;p&gt;, &lt;b&gt;, &lt;i&gt;, &lt;br&gt;
            </p>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={form.is_premium}
                onCheckedChange={(c) => setForm((f) => ({ ...f, is_premium: !!c }))}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-semibold">Chapit Premium</span>
                <span className="block text-xs text-muted-foreground">
                  Lektè peye coins pou debloke.
                </span>
              </span>
            </label>
            {form.is_premium && (
              <div className="space-y-1.5 pl-6">
                <Label htmlFor="c-price" className="text-xs font-semibold">Pri (coins)</Label>
                <Input
                  id="c-price"
                  type="number"
                  min={1}
                  value={form.coin_price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coin_price: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full gradient-brand text-primary-foreground btn-tactile"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ap sove...</>
            ) : (
              chapter ? "Sove Modifikasyon" : "Sove Chapit"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChapterEditorModal;
