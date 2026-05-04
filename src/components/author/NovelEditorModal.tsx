import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, BookOpen, Upload } from "lucide-react";

const GENRES = [
  "Romantik", "Dram", "Avanti", "Thriller", "Fanmi",
  "Fantezi", "Aksyon", "Komedi", "Orre", "Syans-Fiksyon",
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  novel?: any | null;
}

const NovelEditorModal = ({ open, onOpenChange, novel }: Props) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "Dram" as (typeof GENRES)[number],
  });

  useEffect(() => {
    if (novel) {
      setForm({
        title: novel.title ?? "",
        description: novel.description ?? "",
        genre: novel.genre ?? "Dram",
      });
    } else {
      setForm({ title: "", description: "", genre: "Dram" });
    }
    setCoverFile(null);
  }, [novel, open]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Tit obligatwa");
      return;
    }
    setSaving(true);
    try {
      let cover_url: string | null = null;
      if (coverFile) {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(coverFile.type)) {
          toast.error("Sèlman .jpg, .png, .webp");
          setSaving(false);
          return;
        }
        if (coverFile.size > 3 * 1024 * 1024) {
          toast.error("Imaj twò gwo (max 3MB)");
          setSaving(false);
          return;
        }
        const ext = coverFile.name.split(".").pop();
        const path = `covers/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("chapter-images")
          .upload(path, coverFile);
        if (upErr) {
          toast.error("Erè upload: " + upErr.message);
          setSaving(false);
          return;
        }
        cover_url = supabase.storage.from("chapter-images").getPublicUrl(path).data.publicUrl;
      }

      if (novel?.id) {
        const updateData: any = {
          title: form.title.trim(),
          description: form.description.trim() || null,
          genre: form.genre as any,
        };
        if (cover_url) updateData.cover_url = cover_url;
        const { error } = await supabase.from("novels").update(updateData).eq("id", novel.id);
        if (error) {
          toast.error(error.message.includes("duplicate") ? "Ou gen deja yon novèl ak menm tit la." : error.message);
          return;
        }
        toast.success("Novèl modifye!");
      } else {
        const insertData: any = {
          title: form.title.trim(),
          author: profile?.display_name || user.email || "Otè",
          author_id: user.id,
          created_by: user.id,
          description: form.description.trim() || null,
          genre: form.genre as any,
          status: "published",
        };
        if (cover_url) insertData.cover_url = cover_url;
        const { error } = await supabase.from("novels").insert(insertData);
        if (error) {
          toast.error(error.message.includes("duplicate") ? "Ou gen deja yon novèl ak menm tit la." : error.message);
          return;
        }
        toast.success("Novèl kreye!");
      }
      queryClient.invalidateQueries({ queryKey: ["my_novels"] });
      queryClient.invalidateQueries({ queryKey: ["novels"] });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full gradient-brand flex items-center justify-center mb-2 animate-pop-in">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center font-serif text-xl">
            {novel ? "Modifye Novèl" : "Kreye Nouvo Novèl"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Ranpli enfòmasyon yo pou novèl ou.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="n-title" className="text-sm font-semibold flex items-center justify-between">
              <span>Tit *</span>
              <span className={`text-[10px] font-normal ${form.title.length > 100 ? "text-destructive" : "text-muted-foreground"}`}>
                {form.title.length}/100
              </span>
            </Label>
            <Input
              id="n-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Tit novèl la"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="n-genre" className="text-sm font-semibold">Janr</Label>
            <select
              id="n-genre"
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value as any }))}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="n-desc" className="text-sm font-semibold">Deskripsyon</Label>
            <Textarea
              id="n-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Yon ti rezime sou novèl la..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="n-cover" className="text-sm font-semibold flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Kouvèti (jpg/png/webp, max 3MB)
            </Label>
            <Input
              id="n-cover"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
            {novel?.cover_url && !coverFile && (
              <img src={novel.cover_url} alt="" className="h-20 rounded mt-1" />
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
              novel ? "Sove Modifikasyon" : "Kreye Novèl"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NovelEditorModal;
