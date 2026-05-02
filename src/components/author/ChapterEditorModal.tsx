import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, FileText, Image as ImageIcon, Upload } from "lucide-react";
import { useIsVerifiedAuthor } from "@/hooks/useAuthor";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  novelId: string;
  chapter?: any | null;
  nextChapterNumber: number;
}

const QUILL_MODULES = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote"],
      ["link", "image"],
      [{ align: [] }],
      ["clean"],
    ],
  },
};

const ChapterEditorModal = ({ open, onOpenChange, novelId, chapter, nextChapterNumber }: Props) => {
  const { user } = useAuth();
  const isVerified = useIsVerifiedAuthor();
  const queryClient = useQueryClient();
  const quillRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
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

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast.error("Imaj twò gwo (max 5MB)"); return; }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
        toast.error("Fòma pa sipòte. Itilize jpg, png oswa webp.");
        return;
      }
      toast.info("Ap upload imaj...");
      const path = `chapters/${user?.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chapter-images").upload(path, file);
      if (error) { toast.error("Erè upload: " + error.message); return; }
      const { data } = supabase.storage.from("chapter-images").getPublicUrl(path);
      const quill = quillRef.current?.getEditor?.();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, "image", data.publicUrl);
        quill.setSelection(range.index + 1);
      } else {
        setForm((p) => ({ ...p, content: p.content + `<p><img src="${data.publicUrl}" /></p>` }));
      }
      toast.success("Imaj ajoute!");
    };
    input.click();
  };

  const handlePdfImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) { toast.error("PDF twò gwo (max 20MB)"); return; }
      if (!file.name.toLowerCase().endsWith(".pdf")) { toast.error("Sèlman fichye PDF"); return; }

      const replace = form.content && form.content.replace(/<[^>]+>/g, "").trim().length > 0
        ? confirm("Editè a gen deja kontni. Ranplase l ak kontni PDF la?")
        : true;
      if (!replace) return;

      setPdfImporting(true);
      setPdfProgress("Ap li PDF la...");
      try {
        const buf = await file.arrayBuffer();
        let binary = "";
        const bytes = new Uint8Array(buf);
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
        }
        const fileBase64 = btoa(binary);
        setPdfProgress("Ap ekstrè tèks ak imaj... (sa ka pran 30-60 segond)");
        const { data, error } = await supabase.functions.invoke("import-pdf-chapter", {
          body: { fileBase64, fileName: file.name },
        });
        if (error) throw error;
        if (!data?.html) throw new Error("Pa gen kontni jenere");
        const stats = data.stats || {};
        setForm((p) => ({ ...p, content: data.html }));
        toast.success(`PDF enpòte! ${stats.pages || 0} paj, ${stats.images || 0} imaj`);
      } catch (e: any) {
        const msg = e?.context?.error || e?.message || "Erè enpòte PDF la";
        toast.error(typeof msg === "string" ? msg : "Erè enpòte PDF la");
      } finally {
        setPdfImporting(false);
        setPdfProgress("");
      }
    };
    input.click();
  };

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
        const { error } = await supabase.from("chapters").update(payload).eq("id", chapter.id);
        if (error) { toast.error(error.message); return; }
        toast.success("Chapit modifye!");
      } else {
        const { error } = await supabase.from("chapters").insert(payload);
        if (error) { toast.error(error.message); return; }
        toast.success(isVerified ? "Chapit pibliye!" : "Chapit voye pou moderasyon.");
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
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
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

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleImageUpload} className="btn-tactile">
              <ImageIcon className="h-4 w-4 mr-1.5" /> Ajoute Imaj
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePdfImport}
              disabled={pdfImporting}
              className="btn-tactile"
            >
              {pdfImporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
              {pdfImporting ? pdfProgress || "Ap enpòte..." : "Enpòte PDF"}
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Kontni *</Label>
            <div className="rounded-lg border border-border overflow-hidden bg-background">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                modules={QUILL_MODULES}
                placeholder="Ekri chapit ou la..."
                style={{ minHeight: 280 }}
              />
            </div>
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
