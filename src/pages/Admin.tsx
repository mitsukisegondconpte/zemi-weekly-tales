import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useRef } from "react";
import { BookOpen, Coins, BarChart3, FileText, Plus, Trash2, Edit, Save, X, Eye, EyeOff, Key, Calendar, AlertTriangle, Image, Upload, MessageSquare, Loader2, UserCheck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminNovels, useAdminChapters, GENRES } from "@/hooks/useNovels";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import RichTextEditor, { type RichTextEditorHandle } from "@/components/RichTextEditor";
import AdminAuthorReview from "@/components/AdminAuthorReview";
import AdminChapterModeration from "@/components/AdminChapterModeration";
import AdminWarnAuthorDialog from "@/components/AdminWarnAuthorDialog";
import AdminLogs from "@/components/AdminLogs";
import { useAdminOverview } from "@/hooks/useExtra";
import { Users, UserPlus, Hourglass, ShieldAlert, Bell, Ban, ScrollText } from "lucide-react";

const TABS = [
  { id: "overview", label: "Apèsi", icon: BarChart3 },
  { id: "novels", label: "Novèl", icon: BookOpen },
  { id: "chapters", label: "Chapit", icon: FileText },
  { id: "authors", label: "Aplikasyon Otè", icon: UserCheck },
  { id: "moderation", label: "Moderasyon", icon: ShieldCheck },
  { id: "logs", label: "Jounal", icon: ScrollText },
  { id: "codes", label: "Kòd Coins", icon: Key },
  { id: "comments", label: "Kòmantè", icon: MessageSquare },
];

const ConfirmDialog = ({ title, message, onConfirm, onCancel, destructive = false, loading = false }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; destructive?: boolean; loading?: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onCancel}>
    <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${destructive ? "bg-destructive/10" : "bg-primary/10"}`}>
          <AlertTriangle className={`h-5 w-5 ${destructive ? "text-destructive" : "text-primary"}`} />
        </div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary text-sm disabled:opacity-50">Anile</button>
        <button onClick={onConfirm} disabled={loading}
          className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${destructive ? "bg-destructive text-destructive-foreground hover:opacity-90" : "gradient-brand text-primary-foreground hover:opacity-90"} disabled:opacity-50`}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Ap trete..." : "Konfime"}
        </button>
      </div>
    </div>
  </div>
);

const Admin = () => {
  const [tab, setTab] = useState("overview");
  const { data: overview } = useAdminOverview();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => Promise<void>; destructive?: boolean } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const quillRef = useRef<RichTextEditorHandle>(null);
  const [warnTarget, setWarnTarget] = useState<{ authorId: string; name?: string; context?: string; link?: string } | null>(null);

  const withConfirm = (title: string, message: string, action: () => Promise<void>, destructive = false) => {
    setConfirmAction({ title, message, action, destructive });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      await confirmAction.action();
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  // Novel form
  const [showNovelForm, setShowNovelForm] = useState(false);
  const [novelForm, setNovelForm] = useState({ title: "", author: "", description: "", genre: "Dram" as string, scheduled_at: "" });
  const [editingNovel, setEditingNovel] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [savingNovel, setSavingNovel] = useState(false);

  // Chapter form
  const [selectedNovelId, setSelectedNovelId] = useState<string>("");
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapterForm, setChapterForm] = useState({ title: "", content: "", chapter_number: 1, is_premium: false, coin_price: 0, status: "draft", scheduled_at: "" });
  const [savingChapter, setSavingChapter] = useState(false);

  // Code form
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [codeForm, setCodeForm] = useState({ code: "", coins: 10, max_uses: 1 });
  const [savingCode, setSavingCode] = useState(false);

  const { data: novels = [], isLoading: novelsLoading } = useAdminNovels();
  const { data: chapters = [] } = useAdminChapters(selectedNovelId || undefined);
  const { data: codes = [] } = useQuery({
    queryKey: ["coin_codes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coin_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ["admin_comments"],
    queryFn: async () => {
      const { data: rawComments } = await supabase
        .from("comments")
        .select("*")
        .order("is_approved", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(100);
      const list = rawComments ?? [];
      if (list.length === 0) return [];
      const userIds = Array.from(new Set(list.map((c: any) => c.user_id)));
      const novelIds = Array.from(new Set(list.map((c: any) => c.novel_id)));
      const chapterIds = Array.from(new Set(list.map((c: any) => c.chapter_id)));
      const [{ data: profs }, { data: novs }, { data: chaps }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name").in("user_id", userIds),
        supabase.from("novels").select("id, title").in("id", novelIds),
        supabase.from("chapters_metadata").select("id, title, chapter_number").in("id", chapterIds),
      ]);
      const pMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.display_name]));
      const nMap = new Map((novs ?? []).map((n: any) => [n.id, n.title]));
      const cMap = new Map((chaps ?? []).map((c: any) => [c.id, { title: c.title, chapter_number: c.chapter_number }]));
      return list.map((c: any) => ({
        ...c,
        profiles: { display_name: pMap.get(c.user_id) || "Anonim" },
        novels: { title: nMap.get(c.novel_id) || "—" },
        chapters: cMap.get(c.chapter_id) || { title: "—", chapter_number: 0 },
      }));
    },
  });

  // ===== NOVEL CRUD =====
  const saveNovel = async () => {
    if (!novelForm.title || !novelForm.author) { toast.error("Tit ak otè obligatwa"); return; }
    if (savingNovel) return;

    const doSave = async () => {
      setSavingNovel(true);
      try {
        const scheduled = novelForm.scheduled_at ? new Date(novelForm.scheduled_at).toISOString() : null;
        const status = novelForm.scheduled_at ? "draft" : "published";
        let cover_url: string | null = null;
        if (coverFile) {
          const ext = coverFile.name.split(".").pop();
          const path = `covers/${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("chapter-images").upload(path, coverFile);
          if (upErr) { toast.error("Erè upload: " + upErr.message); return; }
          const { data: urlData } = supabase.storage.from("chapter-images").getPublicUrl(path);
          cover_url = urlData.publicUrl;
        }
        if (editingNovel) {
          const updateData: any = { title: novelForm.title, author: novelForm.author, description: novelForm.description, genre: novelForm.genre as any, scheduled_at: scheduled };
          if (cover_url) updateData.cover_url = cover_url;
          const { error } = await supabase.from("novels").update(updateData).eq("id", editingNovel);
          if (error) { toast.error(error.message); return; }
          toast.success("Novèl modifye!");
        } else {
          const insertData: any = { title: novelForm.title, author: novelForm.author, description: novelForm.description, genre: novelForm.genre as any, status, scheduled_at: scheduled };
          if (cover_url) insertData.cover_url = cover_url;
          const { error } = await supabase.from("novels").insert(insertData);
          if (error) { toast.error(error.message); return; }
          toast.success("Novèl kreye!");
        }
        setShowNovelForm(false); setEditingNovel(null); setCoverFile(null);
        setNovelForm({ title: "", author: "", description: "", genre: "Dram", scheduled_at: "" });
        queryClient.invalidateQueries({ queryKey: ["novels"] });
      } finally { setSavingNovel(false); }
    };
    withConfirm(editingNovel ? "Modifye Novèl" : "Kreye Novèl", `Ou sèten ou vle ${editingNovel ? "modifye" : "kreye"} novèl "${novelForm.title}"?`, doSave);
  };

  const toggleNovelStatus = (id: string, current: string) => {
    const newStatus = current === "published" ? "draft" : "published";
    withConfirm(
      newStatus === "published" ? "Pibliye Novèl" : "Retire Novèl",
      `Ou sèten ou vle ${newStatus === "published" ? "pibliye" : "mete an bouyon"} novèl sa a?`,
      async () => {
        await supabase.from("novels").update({ status: newStatus }).eq("id", id);
        queryClient.invalidateQueries({ queryKey: ["novels"] });
        toast.success(newStatus === "published" ? "Pibliye!" : "Mete an bouyon");
      }
    );
  };

  const deleteNovel = (id: string) => {
    withConfirm("Efase Novèl", "Aksyon sa a pa ka defèt. Tout chapit yo pral efase tou!", async () => {
      await supabase.from("novels").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["novels"] });
      toast.success("Novèl efase");
    }, true);
  };

  // ===== CHAPTER CRUD =====
  const saveChapter = async () => {
    if (!selectedNovelId) { toast.error("Chwazi yon novèl"); return; }
    if (!chapterForm.title || !chapterForm.content) { toast.error("Tit ak kontni obligatwa"); return; }
    if (savingChapter) return;

    withConfirm("Ajoute Chapit", `Kreye chapit "${chapterForm.title}"?`, async () => {
      setSavingChapter(true);
      try {
        const scheduled = chapterForm.scheduled_at ? new Date(chapterForm.scheduled_at).toISOString() : null;
        const status = chapterForm.scheduled_at ? "draft" : chapterForm.status;
        const { error } = await supabase.from("chapters").insert({
          novel_id: selectedNovelId, title: chapterForm.title, content: chapterForm.content,
          chapter_number: chapterForm.chapter_number, is_premium: chapterForm.is_premium,
          coin_price: chapterForm.is_premium ? chapterForm.coin_price : 0, status, scheduled_at: scheduled,
        });
        if (error) { toast.error(error.message); return; }
        toast.success("Chapit ajoute!");
        setShowChapterForm(false);
        setChapterForm({ title: "", content: "", chapter_number: chapters.length + 2, is_premium: false, coin_price: 0, status: "draft", scheduled_at: "" });
        queryClient.invalidateQueries({ queryKey: ["chapters"] });
      } finally { setSavingChapter(false); }
    });
  };

  const toggleChapterStatus = (id: string, current: string) => {
    const newStatus = current === "published" ? "draft" : "published";
    withConfirm(newStatus === "published" ? "Pibliye Chapit" : "Retire Chapit",
      `Ou sèten ou vle ${newStatus === "published" ? "pibliye" : "mete an bouyon"} chapit sa a?`,
      async () => {
        await supabase.from("chapters").update({ status: newStatus }).eq("id", id);
        queryClient.invalidateQueries({ queryKey: ["chapters"] });
        toast.success(newStatus === "published" ? "Chapit pibliye!" : "Chapit an bouyon");
      }
    );
  };

  const deleteChapter = (id: string) => {
    withConfirm("Efase Chapit", "Aksyon sa a pa ka defèt!", async () => {
      await supabase.from("chapters").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapit efase");
    }, true);
  };

  // ===== CODE CRUD =====
  const saveCode = async () => {
    if (!codeForm.code.trim()) { toast.error("Kòd obligatwa"); return; }
    if (savingCode) return;

    withConfirm("Kreye Kòd", `Kreye kòd "${codeForm.code.toUpperCase()}" ak ${codeForm.coins} coins?`, async () => {
      setSavingCode(true);
      try {
        const { error } = await supabase.from("coin_codes").insert({ code: codeForm.code.trim().toUpperCase(), coins: codeForm.coins, max_uses: codeForm.max_uses });
        if (error) { toast.error(error.message); return; }
        toast.success("Kòd kreye!");
        setShowCodeForm(false);
        setCodeForm({ code: "", coins: 10, max_uses: 1 });
        queryClient.invalidateQueries({ queryKey: ["coin_codes"] });
      } finally { setSavingCode(false); }
    });
  };

  const toggleCode = (id: string, active: boolean) => {
    withConfirm(active ? "Dezaktive Kòd" : "Aktive Kòd", `Ou sèten?`, async () => {
      await supabase.from("coin_codes").update({ is_active: !active }).eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["coin_codes"] });
    });
  };

  const deleteCode = (id: string) => {
    withConfirm("Efase Kòd", "Aksyon sa a pa ka defèt!", async () => {
      await supabase.from("coin_codes").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["coin_codes"] });
      toast.success("Kòd efase");
    }, true);
  };

  const deleteComment = (id: string) => {
    withConfirm("Efase Kòmantè", "Retire kòmantè sa a?", async () => {
      await supabase.from("comments").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["admin_comments"] });
      toast.success("Kòmantè efase");
    }, true);
  };

  // PDF import state
  const [pdfImporting, setPdfImporting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>("");

  const handlePdfImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) { toast.error("PDF twò gwo (max 20MB)"); return; }
      if (!file.name.toLowerCase().endsWith(".pdf")) { toast.error("Sèlman fichye PDF"); return; }

      const replace = chapterForm.content && chapterForm.content.replace(/<[^>]+>/g, "").trim().length > 0
        ? confirm("Editè a gen deja kontni. Ranplase l ak kontni PDF la?")
        : true;
      if (!replace) return;

      setPdfImporting(true);
      setPdfProgress("Ap li PDF la...");

      try {
        // Convert file to base64
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
        setChapterForm(p => ({ ...p, content: data.html }));
        toast.success(`PDF enpòte! ${stats.pages || 0} paj, ${stats.images || 0} imaj`);
      } catch (e: any) {
        console.error("PDF import error:", e);
        const msg = e?.context?.error || e?.message || "Erè enpòte PDF la";
        toast.error(typeof msg === "string" ? msg : "Erè enpòte PDF la");
      } finally {
        setPdfImporting(false);
        setPdfProgress("");
      }
    };
    input.click();
  };

  // Image upload handler - inserts directly into Quill editor
  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast.error("Imaj twò gwo (max 5MB)"); return; }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) { toast.error("Fòma pa sipòte. Itilize jpg, png oswa webp."); return; }
      
      toast.info("Ap upload imaj...");
      const path = `chapters/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chapter-images").upload(path, file);
      if (error) { toast.error("Erè upload: " + error.message); return; }
      const { data } = supabase.storage.from("chapter-images").getPublicUrl(path);
      
      // Insert into Quill editor at cursor position
      const quill = quillRef.current?.getEditor?.();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', data.publicUrl);
        quill.setSelection(range.index + 1);
      } else {
        // Fallback: append to content
        setChapterForm(p => ({ ...p, content: p.content + `<p><img src="${data.publicUrl}" /></p>` }));
      }
      toast.success("Imaj ajoute!");
    };
    input.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-black font-serif text-foreground mb-6">Panel Admin</h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-2 sm:gap-1 mb-6 sm:mb-8">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-sm font-bold transition-all active:scale-95 ${
                  tab === t.id ? "gradient-brand text-primary-foreground shadow-lg" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                }`}>
                <t.icon className="h-5 w-5 sm:h-4 sm:w-4" />{t.label}
              </button>
            ))}
          </div>

          {/* ========== OVERVIEW TAB ========== */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {[
                  { label: "Itilizatè total", value: overview?.total_users ?? 0, icon: Users, color: "text-primary" },
                  { label: "Nouvo (7 jou)", value: overview?.new_users_7d ?? 0, icon: UserPlus, color: "text-green-600" },
                  { label: "Novèl total", value: overview?.total_novels ?? 0, icon: BookOpen, color: "text-primary" },
                  { label: "Aplikasyon an atant", value: overview?.pending_applications ?? 0, icon: Hourglass, color: "text-yellow-600" },
                  { label: "Chapit an atant", value: overview?.pending_chapters ?? 0, icon: ShieldAlert, color: "text-orange-600" },
                  { label: "Kòmantè total", value: overview?.total_comments ?? 0, icon: MessageSquare, color: "text-primary" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-foreground">{Number(s.value).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: "Aplikasyon Otè", to: "authors", icon: UserCheck, badge: overview?.pending_applications },
                  { label: "Moderasyon Chapit", to: "moderation", icon: ShieldCheck, badge: overview?.pending_chapters },
                  { label: "Kòmantè", to: "comments", icon: MessageSquare },
                  { label: "Novèl", to: "novels", icon: BookOpen },
                  { label: "Chapit", to: "chapters", icon: FileText },
                  { label: "Kòd Coins", to: "codes", icon: Key },
                ].map((q) => (
                  <button key={q.to} onClick={() => setTab(q.to)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md active:scale-95 transition-all text-left">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <q.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-bold text-foreground text-sm">{q.label}</span>
                    </div>
                    {!!q.badge && Number(q.badge) > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                        {q.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========== NOVELS TAB ========== */}
          {tab === "novels" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Tout Novèl ({novels.length})</h2>
                <button onClick={() => { setShowNovelForm(true); setEditingNovel(null); setCoverFile(null); setNovelForm({ title: "", author: "", description: "", genre: "Dram", scheduled_at: "" }); }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-brand text-primary-foreground text-sm font-bold shadow-lg hover:opacity-90 active:scale-95">
                  <Plus className="h-5 w-5" /> Nouvo Novèl
                </button>
              </div>

              {showNovelForm && (
                <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 md:p-6 mb-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-lg">{editingNovel ? "Modifye Novèl" : "Nouvo Novèl"}</h3>
                    <button onClick={() => setShowNovelForm(false)} className="p-2 rounded-lg hover:bg-secondary"><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Tit *</label>
                      <input value={novelForm.title} onChange={e => setNovelForm(p => ({ ...p, title: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" placeholder="Tit novèl la" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Otè *</label>
                      <input value={novelForm.author} onChange={e => setNovelForm(p => ({ ...p, author: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" placeholder="Non otè a" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Jan</label>
                      <select value={novelForm.genre} onChange={e => setNovelForm(p => ({ ...p, genre: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground">
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Piblikasyon planifye</span>
                      </label>
                      <input type="datetime-local" value={novelForm.scheduled_at} onChange={e => setNovelForm(p => ({ ...p, scheduled_at: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Deskripsyon</label>
                    <textarea rows={3} value={novelForm.description} onChange={e => setNovelForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground resize-y" placeholder="Kèk mo sou novèl la" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      <span className="flex items-center gap-1"><Image className="h-4 w-4" /> Kouvèti (jpg, png, webp)</span>
                    </label>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setCoverFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  </div>
                  <button onClick={saveNovel} disabled={savingNovel}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-primary-foreground font-bold text-sm hover:opacity-90 shadow-lg active:scale-95 disabled:opacity-50">
                    {savingNovel ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {savingNovel ? "Ap trete..." : editingNovel ? "Anrejistre" : "Kreye"}
                  </button>
                </div>
              )}

              {novelsLoading ? <p className="text-muted-foreground">Chajman...</p> : (
                <div className="space-y-3">
                  {novels.map((n) => (
                    <div key={n.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {n.cover_url && <img src={n.cover_url} alt="" className="w-12 h-16 rounded-lg object-cover shrink-0" />}
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground truncate">{n.title}</h3>
                            <p className="text-sm text-muted-foreground">{n.author} • {n.genre}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ml-2 ${n.status === "published" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          {n.status === "published" ? "Pibliye" : "Bouyon"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button onClick={() => toggleNovelStatus(n.id, n.status)}
                          className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold active:scale-95 ${
                            n.status === "published" ? "bg-secondary text-secondary-foreground" : "gradient-brand text-primary-foreground shadow-md"
                          }`}>
                          {n.status === "published" ? <><EyeOff className="h-4 w-4" /> Retire</> : <><Eye className="h-4 w-4" /> Pibliye</>}
                        </button>
                        <button onClick={() => { setEditingNovel(n.id); setNovelForm({ title: n.title, author: n.author, description: n.description || "", genre: n.genre, scheduled_at: "" }); setShowNovelForm(true); }}
                          className="px-3 py-2.5 rounded-xl bg-secondary text-secondary-foreground active:scale-95" title="Modifye"><Edit className="h-4 w-4" /></button>
                        {n.author_id && (
                          <button
                            onClick={() => setWarnTarget({ authorId: n.author_id, name: n.author, context: `Novèl: ${n.title}`, link: `/novel/${n.id}` })}
                            className="px-3 py-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 active:scale-95"
                            title="Avèti otè"
                          >
                            <Bell className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => withConfirm(
                            "Diskalifye Novèl",
                            `Mete novèl "${n.title}" an bouyon epi voye yon notifikasyon bay otè a?`,
                            async () => {
                              await supabase.from("novels").update({ status: "draft" }).eq("id", n.id);
                              if (n.author_id) {
                                await supabase.from("user_notifications").insert({
                                  user_id: n.author_id,
                                  title: "Novèl diskalifye",
                                  message: `Novèl ou "${n.title}" te retire pa admin yo. Tanpri kontakte sipò pou plis detay.`,
                                  type: "warning",
                                  link: `/novel/${n.id}`,
                                });
                              }
                              await supabase.rpc("log_admin_action", {
                                _action: "novel_disqualified",
                                _target_type: "novel",
                                _target_id: n.id,
                                _target_label: n.title,
                                _reason: "Diskalifye pa admin",
                              });
                              queryClient.invalidateQueries({ queryKey: ["novels"] });
                              queryClient.invalidateQueries({ queryKey: ["admin_logs"] });
                              toast.success("Novèl diskalifye");
                            },
                            true
                          )}
                          className="px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive active:scale-95"
                          title="Diskalifye"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteNovel(n.id)}
                          className="px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive active:scale-95" title="Efase"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  {novels.length === 0 && <p className="text-center py-8 text-muted-foreground">Pa gen novèl ankò. Kreye premye a!</p>}
                </div>
              )}
            </div>
          )}

          {/* ========== CHAPTERS TAB ========== */}
          {tab === "chapters" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 mb-4">
                <select value={selectedNovelId} onChange={e => setSelectedNovelId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground font-medium">
                  <option value="">— Chwazi novèl —</option>
                  {novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                </select>
                {selectedNovelId && (
                  <button onClick={() => { setShowChapterForm(true); setChapterForm({ title: "", content: "", chapter_number: chapters.length + 1, is_premium: false, coin_price: 0, status: "draft", scheduled_at: "" }); }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-brand text-primary-foreground text-sm font-bold shadow-lg hover:opacity-90 active:scale-95">
                    <Plus className="h-5 w-5" /> Ajoute Chapit
                  </button>
                )}
              </div>

              {showChapterForm && selectedNovelId && (
                <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-lg">Nouvo Chapit</h3>
                    <button onClick={() => setShowChapterForm(false)} className="p-2 rounded-lg hover:bg-secondary"><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Nimewo *</label>
                      <input type="number" min={1} value={chapterForm.chapter_number} onChange={e => setChapterForm(p => ({ ...p, chapter_number: +e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Tit *</label>
                      <input value={chapterForm.title} onChange={e => setChapterForm(p => ({ ...p, title: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" placeholder="Tit chapit la" />
                    </div>
                    <div className="flex flex-wrap gap-4 items-end">
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input type="checkbox" checked={chapterForm.is_premium} onChange={e => setChapterForm(p => ({ ...p, is_premium: e.target.checked }))}
                          className="rounded border-input h-5 w-5" />
                        Premium
                      </label>
                      {chapterForm.is_premium && (
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1">Pri (Coins)</label>
                          <input type="number" min={1} value={chapterForm.coin_price} onChange={e => setChapterForm(p => ({ ...p, coin_price: +e.target.value }))}
                            className="w-28 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Piblikasyon planifye</span>
                      </label>
                      <input type="datetime-local" value={chapterForm.scheduled_at} onChange={e => setChapterForm(p => ({ ...p, scheduled_at: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" />
                    </div>
                  </div>

                  {/* Rich text editor */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="text-sm font-medium text-foreground">Kontni *</label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handlePdfImport} disabled={pdfImporting}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/80 active:scale-95 transition-all disabled:opacity-50">
                          {pdfImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                          {pdfImporting ? "Ap enpòte..." : "Enpòte PDF"}
                        </button>
                        <button onClick={handleImageUpload} disabled={pdfImporting} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 active:scale-95 transition-all disabled:opacity-50">
                          <Upload className="h-4 w-4" /> Ajoute Imaj
                        </button>
                      </div>
                    </div>
                    {pdfImporting && (
                      <div className="mb-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> {pdfProgress}
                      </div>
                    )}
                    <div className="border border-input rounded-xl overflow-hidden bg-background">
                      <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={chapterForm.content}
                        onChange={(value) => setChapterForm(p => ({ ...p, content: value }))}
                        modules={QUILL_MODULES}
                        placeholder="Ekri kontni chapit la isit... Itilize toolbar pou fòmate tèks la, ajoute imaj, elatriye."
                        className="min-h-[300px]"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Tip: Itilize "Enpòte PDF" pou konvèti yon woman PDF an chapit otomatikman (tèks + imaj). Oswa "Ajoute Imaj" pou yon sèl imaj.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {!chapterForm.scheduled_at && (
                      <select value={chapterForm.status} onChange={e => setChapterForm(p => ({ ...p, status: e.target.value }))}
                        className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground">
                        <option value="draft">Bouyon</option>
                        <option value="published">Pibliye kounye a</option>
                      </select>
                    )}
                    <button onClick={saveChapter} disabled={savingChapter}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-primary-foreground font-bold text-sm hover:opacity-90 shadow-lg active:scale-95 disabled:opacity-50">
                      {savingChapter ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      {savingChapter ? "Ap trete..." : "Anrejistre"}
                    </button>
                  </div>
                </div>
              )}

              {selectedNovelId && chapters.length > 0 && (
                <div className="space-y-2">
                  {chapters.map((ch) => (
                    <div key={ch.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{ch.chapter_number}</span>
                          <div>
                            <p className="font-bold text-foreground text-sm">{ch.title}</p>
                            {ch.is_premium ? (
                              <span className="coin-badge inline-flex items-center gap-1 text-[10px] mt-1"><Coins className="h-3 w-3" />{ch.coin_price}</span>
                            ) : <span className="text-xs font-semibold text-primary">GRATIS</span>}
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${ch.status === "published" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          {ch.status === "published" ? "Pibliye" : "Bouyon"}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => toggleChapterStatus(ch.id, ch.status)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold active:scale-95 ${
                            ch.status === "published" ? "bg-secondary text-secondary-foreground" : "gradient-brand text-primary-foreground shadow-md"
                          }`}>
                          {ch.status === "published" ? <><EyeOff className="h-4 w-4" /> Retire</> : <><Eye className="h-4 w-4" /> Pibliye</>}
                        </button>
                        <button onClick={() => deleteChapter(ch.id)} className="px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive active:scale-95"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedNovelId && chapters.length === 0 && !showChapterForm && <p className="text-muted-foreground text-center py-8">Pa gen chapit ankò pou novèl sa a.</p>}
              {!selectedNovelId && <p className="text-muted-foreground text-center py-8">Chwazi yon novèl pou wè chapit li yo.</p>}
            </div>
          )}

          {/* ========== AUTHOR APPLICATIONS TAB ========== */}
          {tab === "authors" && <AdminAuthorReview />}

          {/* ========== CHAPTER MODERATION TAB ========== */}
          {tab === "moderation" && <AdminChapterModeration />}

          {/* ========== CODES TAB ========== */}
          {tab === "codes" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Kòd Coins ({codes.length})</h2>
                <button onClick={() => { setShowCodeForm(true); setCodeForm({ code: "", coins: 10, max_uses: 1 }); }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-brand text-primary-foreground text-sm font-bold shadow-lg hover:opacity-90 active:scale-95">
                  <Plus className="h-5 w-5" /> Nouvo Kòd
                </button>
              </div>

              {showCodeForm && (
                <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 mb-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-lg">Nouvo Kòd</h3>
                    <button onClick={() => setShowCodeForm(false)} className="p-2 rounded-lg hover:bg-secondary"><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Kòd *</label>
                      <input value={codeForm.code} onChange={e => setCodeForm(p => ({ ...p, code: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground uppercase" placeholder="Ex: ZEMI2026" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Coins</label>
                      <input type="number" min={1} value={codeForm.coins} onChange={e => setCodeForm(p => ({ ...p, coins: +e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Max itilizasyon</label>
                      <input type="number" min={1} value={codeForm.max_uses} onChange={e => setCodeForm(p => ({ ...p, max_uses: +e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" />
                    </div>
                  </div>
                  <button onClick={saveCode} disabled={savingCode}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-primary-foreground font-bold text-sm hover:opacity-90 shadow-lg active:scale-95 disabled:opacity-50">
                    {savingCode ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {savingCode ? "Ap trete..." : "Kreye Kòd"}
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {codes.map((c: any) => (
                  <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-mono font-bold text-foreground text-lg">{c.code}</p>
                        <p className="text-muted-foreground text-xs">{c.used_count}/{c.max_uses} itilize</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="coin-badge text-xs"><Coins className="h-3 w-3 inline mr-1" />{c.coins}</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.is_active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          {c.is_active ? "Aktif" : "Dezaktive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => toggleCode(c.id, c.is_active)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold active:scale-95 ${
                          c.is_active ? "bg-secondary text-secondary-foreground" : "gradient-brand text-primary-foreground shadow-md"
                        }`}>
                        {c.is_active ? <><EyeOff className="h-4 w-4" /> Dezaktive</> : <><Eye className="h-4 w-4" /> Aktive</>}
                      </button>
                      <button onClick={() => deleteCode(c.id)} className="px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive active:scale-95"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
                {codes.length === 0 && <p className="text-center py-8 text-muted-foreground">Pa gen kòd ankò.</p>}
              </div>
            </div>
          )}

          {/* ========== COMMENTS TAB ========== */}
          {tab === "comments" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">
                Moderasyon Kòmantè ({allComments.length})
                {allComments.filter((c: any) => !c.is_approved).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs">
                    {allComments.filter((c: any) => !c.is_approved).length} an atant
                  </span>
                )}
              </h2>
              <div className="space-y-2">
                {allComments.map((c: any) => (
                  <div key={c.id} className={`rounded-xl border p-4 shadow-sm ${c.is_approved ? "border-border bg-card" : "border-destructive/40 bg-destructive/5"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{(c as any).profiles?.display_name || "Anonim"}</span>
                          {!c.is_approved && (
                            <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">AN ATANT</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-foreground mb-1">{c.content}</p>
                        <p className="text-xs text-muted-foreground">{(c as any).novels?.title} — Chapit {(c as any).chapters?.chapter_number}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            await supabase
                              .from("comments")
                              .update({ is_approved: !c.is_approved })
                              .eq("id", c.id);
                            queryClient.invalidateQueries({ queryKey: ["admin_comments"] });
                            toast.success(c.is_approved ? "Kòmantè refize" : "Kòmantè aprouve");
                          }}
                          className={`px-3 py-2 rounded-xl text-sm font-bold active:scale-95 shrink-0 transition-all ${
                            c.is_approved
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}>
                          {c.is_approved ? "Refize" : "Aprouve"}
                        </button>
                        <button onClick={() => deleteComment(c.id)} className="px-3 py-2 rounded-xl bg-destructive/10 text-destructive active:scale-95 shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {allComments.length === 0 && <p className="text-center py-8 text-muted-foreground">Pa gen kòmantè ankò.</p>}
              </div>
            </div>
          )}

          {/* ========== LOGS TAB ========== */}
          {tab === "logs" && <AdminLogs />}
        </div>
      </main>
      <Footer />
      {confirmAction && (
        <ConfirmDialog title={confirmAction.title} message={confirmAction.message} destructive={confirmAction.destructive}
          onConfirm={handleConfirm} onCancel={() => setConfirmAction(null)} loading={confirmLoading} />
      )}
      {warnTarget && (
        <AdminWarnAuthorDialog
          open={!!warnTarget}
          onOpenChange={(o) => !o && setWarnTarget(null)}
          authorId={warnTarget.authorId}
          authorName={warnTarget.name}
          contextLabel={warnTarget.context}
          link={warnTarget.link}
        />
      )}
    </div>
  );
};

export default Admin;
