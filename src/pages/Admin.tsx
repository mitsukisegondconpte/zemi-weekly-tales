import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { BookOpen, Coins, BarChart3, FileText, Plus, Trash2, Edit, Save, X, Eye, EyeOff, Key, Calendar, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminNovels, useAdminChapters, GENRES } from "@/hooks/useNovels";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const TABS = [
  { id: "novels", label: "Novèl", icon: BookOpen },
  { id: "chapters", label: "Chapit", icon: FileText },
  { id: "codes", label: "Kòd Coins", icon: Key },
  { id: "stats", label: "Statistik", icon: BarChart3 },
];

// Confirmation dialog component
const ConfirmDialog = ({ title, message, onConfirm, onCancel, destructive = false }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; destructive?: boolean;
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
        <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary text-sm">
          Anile
        </button>
        <button onClick={onConfirm}
          className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm ${destructive ? "bg-destructive text-destructive-foreground hover:opacity-90" : "gradient-brand text-primary-foreground hover:opacity-90"}`}>
          Konfime
        </button>
      </div>
    </div>
  </div>
);

const Admin = () => {
  const [tab, setTab] = useState("novels");
  const queryClient = useQueryClient();

  // Confirmation state
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void; destructive?: boolean } | null>(null);

  const withConfirm = (title: string, message: string, action: () => void, destructive = false) => {
    setConfirmAction({ title, message, action, destructive });
  };

  // Novel form
  const [showNovelForm, setShowNovelForm] = useState(false);
  const [novelForm, setNovelForm] = useState({ title: "", author: "", description: "", genre: "Dram" as string, scheduled_at: "" });
  const [editingNovel, setEditingNovel] = useState<string | null>(null);

  // Chapter form
  const [selectedNovelId, setSelectedNovelId] = useState<string>("");
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapterForm, setChapterForm] = useState({ title: "", content: "", chapter_number: 1, is_premium: false, coin_price: 0, status: "draft", scheduled_at: "" });

  // Code form
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [codeForm, setCodeForm] = useState({ code: "", coins: 10, max_uses: 1 });

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

  // ===== NOVEL CRUD =====
  const saveNovel = async () => {
    if (!novelForm.title || !novelForm.author) { toast.error("Tit ak otè obligatwa"); return; }
    const scheduled = novelForm.scheduled_at ? new Date(novelForm.scheduled_at).toISOString() : null;
    const status = novelForm.scheduled_at ? "draft" : "published";

    const doSave = async () => {
      if (editingNovel) {
        const { error } = await supabase.from("novels").update({
          title: novelForm.title, author: novelForm.author,
          description: novelForm.description, genre: novelForm.genre as any,
          scheduled_at: scheduled
        }).eq("id", editingNovel);
        if (error) { toast.error(error.message); return; }
        toast.success("Novèl modifye!");
      } else {
        const { error } = await supabase.from("novels").insert({
          title: novelForm.title, author: novelForm.author,
          description: novelForm.description, genre: novelForm.genre as any,
          status, scheduled_at: scheduled
        });
        if (error) { toast.error(error.message); return; }
        toast.success("Novèl kreye!");
      }
      setShowNovelForm(false); setEditingNovel(null);
      setNovelForm({ title: "", author: "", description: "", genre: "Dram", scheduled_at: "" });
      queryClient.invalidateQueries({ queryKey: ["novels"] });
    };
    withConfirm(editingNovel ? "Modifye Novèl" : "Kreye Novèl", `Ou sèten ou vle ${editingNovel ? "modifye" : "kreye"} novèl "${novelForm.title}"?`, doSave);
  };

  const toggleNovelStatus = async (id: string, current: string) => {
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

  const deleteNovel = async (id: string) => {
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
    const scheduled = chapterForm.scheduled_at ? new Date(chapterForm.scheduled_at).toISOString() : null;
    const status = chapterForm.scheduled_at ? "draft" : chapterForm.status;

    withConfirm("Ajoute Chapit", `Kreye chapit "${chapterForm.title}"?`, async () => {
      const { error } = await supabase.from("chapters").insert({
        novel_id: selectedNovelId, title: chapterForm.title, content: chapterForm.content,
        chapter_number: chapterForm.chapter_number, is_premium: chapterForm.is_premium,
        coin_price: chapterForm.is_premium ? chapterForm.coin_price : 0,
        status, scheduled_at: scheduled,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Chapit ajoute!");
      setShowChapterForm(false);
      setChapterForm({ title: "", content: "", chapter_number: chapters.length + 2, is_premium: false, coin_price: 0, status: "draft", scheduled_at: "" });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
    });
  };

  const toggleChapterStatus = async (id: string, current: string) => {
    const newStatus = current === "published" ? "draft" : "published";
    withConfirm(
      newStatus === "published" ? "Pibliye Chapit" : "Retire Chapit",
      `Ou sèten ou vle ${newStatus === "published" ? "pibliye" : "mete an bouyon"} chapit sa a?`,
      async () => {
        await supabase.from("chapters").update({ status: newStatus }).eq("id", id);
        queryClient.invalidateQueries({ queryKey: ["chapters"] });
        toast.success(newStatus === "published" ? "Chapit pibliye!" : "Chapit an bouyon");
      }
    );
  };

  const deleteChapter = async (id: string) => {
    withConfirm("Efase Chapit", "Aksyon sa a pa ka defèt!", async () => {
      await supabase.from("chapters").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapit efase");
    }, true);
  };

  // ===== CODE CRUD =====
  const saveCode = async () => {
    if (!codeForm.code.trim()) { toast.error("Kòd obligatwa"); return; }
    withConfirm("Kreye Kòd", `Kreye kòd "${codeForm.code.toUpperCase()}" ak ${codeForm.coins} coins?`, async () => {
      const { error } = await supabase.from("coin_codes").insert({
        code: codeForm.code.trim().toUpperCase(),
        coins: codeForm.coins,
        max_uses: codeForm.max_uses,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Kòd kreye!");
      setShowCodeForm(false);
      setCodeForm({ code: "", coins: 10, max_uses: 1 });
      queryClient.invalidateQueries({ queryKey: ["coin_codes"] });
    });
  };

  const toggleCode = async (id: string, active: boolean) => {
    withConfirm(active ? "Dezaktive Kòd" : "Aktive Kòd", `Ou sèten?`, async () => {
      await supabase.from("coin_codes").update({ is_active: !active }).eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["coin_codes"] });
    });
  };

  const deleteCode = async (id: string) => {
    withConfirm("Efase Kòd", "Aksyon sa a pa ka defèt!", async () => {
      await supabase.from("coin_codes").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["coin_codes"] });
      toast.success("Kòd efase");
    }, true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-black font-serif text-foreground mb-6">Panel Admin</h1>

          {/* Tabs - mobile friendly */}
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-1 mb-6 sm:mb-8">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-sm font-bold transition-all active:scale-95 ${
                  tab === t.id ? "gradient-brand text-primary-foreground shadow-lg" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                }`}>
                <t.icon className="h-5 w-5 sm:h-4 sm:w-4" />{t.label}
              </button>
            ))}
          </div>

          {/* ========== NOVELS TAB ========== */}
          {tab === "novels" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Tout Novèl ({novels.length})</h2>
                <button onClick={() => { setShowNovelForm(true); setEditingNovel(null); setNovelForm({ title: "", author: "", description: "", genre: "Dram", scheduled_at: "" }); }}
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
                      <label className="text-sm font-medium text-foreground block mb-1.5 flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Piblikasyon planifye
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
                  <button onClick={saveNovel} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-primary-foreground font-bold text-sm hover:opacity-90 shadow-lg active:scale-95">
                    <Save className="h-5 w-5" /> {editingNovel ? "Anrejistre" : "Kreye"}
                  </button>
                </div>
              )}

              {/* Novel cards for mobile */}
              {novelsLoading ? <p className="text-muted-foreground">Chajman...</p> : (
                <div className="space-y-3">
                  {novels.map((n) => (
                    <div key={n.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground truncate">{n.title}</h3>
                          <p className="text-sm text-muted-foreground">{n.author} • {n.genre}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ml-2 ${n.status === "published" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          {n.status === "published" ? "Pibliye" : "Bouyon"}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => toggleNovelStatus(n.id, n.status)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold active:scale-95 ${
                            n.status === "published" ? "bg-secondary text-secondary-foreground" : "gradient-brand text-primary-foreground shadow-md"
                          }`}>
                          {n.status === "published" ? <><EyeOff className="h-4 w-4" /> Retire</> : <><Eye className="h-4 w-4" /> Pibliye</>}
                        </button>
                        <button onClick={() => { setEditingNovel(n.id); setNovelForm({ title: n.title, author: n.author, description: n.description || "", genre: n.genre, scheduled_at: "" }); setShowNovelForm(true); }}
                          className="px-3 py-2.5 rounded-xl bg-secondary text-secondary-foreground active:scale-95">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteNovel(n.id)}
                          className="px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive active:scale-95">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {novels.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">Pa gen novèl ankò. Kreye premye a!</p>
                  )}
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
                      <label className="text-sm font-medium text-foreground block mb-1.5 flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Piblikasyon planifye
                      </label>
                      <input type="datetime-local" value={chapterForm.scheduled_at} onChange={e => setChapterForm(p => ({ ...p, scheduled_at: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Kontni *</label>
                    <textarea rows={12} value={chapterForm.content} onChange={e => setChapterForm(p => ({ ...p, content: e.target.value }))}
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground resize-y"
                      placeholder="Ekri kontni chapit la isit..." />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {!chapterForm.scheduled_at && (
                      <select value={chapterForm.status} onChange={e => setChapterForm(p => ({ ...p, status: e.target.value }))}
                        className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground">
                        <option value="draft">Bouyon</option>
                        <option value="published">Pibliye kounye a</option>
                      </select>
                    )}
                    <button onClick={saveChapter} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-primary-foreground font-bold text-sm hover:opacity-90 shadow-lg active:scale-95">
                      <Save className="h-5 w-5" /> Anrejistre
                    </button>
                  </div>
                </div>
              )}

              {/* Chapter cards */}
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
                            ) : (
                              <span className="text-xs font-semibold text-primary">GRATIS</span>
                            )}
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
                        <button onClick={() => deleteChapter(ch.id)}
                          className="px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive active:scale-95">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedNovelId && chapters.length === 0 && !showChapterForm && (
                <p className="text-muted-foreground text-center py-8">Pa gen chapit ankò pou novèl sa a.</p>
              )}
              {!selectedNovelId && <p className="text-muted-foreground text-center py-8">Chwazi yon novèl pou wè chapit li yo.</p>}
            </div>
          )}

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
                  <button onClick={saveCode} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-primary-foreground font-bold text-sm hover:opacity-90 shadow-lg active:scale-95">
                    <Save className="h-5 w-5" /> Kreye Kòd
                  </button>
                </div>
              )}

              {/* Code cards */}
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
                      <button onClick={() => deleteCode(c.id)}
                        className="px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive active:scale-95">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {codes.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">Pa gen kòd ankò.</p>
                )}
              </div>
            </div>
          )}

          {/* ========== STATS TAB ========== */}
          {tab === "stats" && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {[
                { label: "Total Novèl", value: novels.length, icon: BookOpen },
                { label: "Novèl Pibliye", value: novels.filter(n => n.status === "published").length, icon: Eye },
                { label: "Total Reyaksyon", value: novels.reduce((s, n) => s + n.reactions, 0), icon: FileText },
                { label: "Bouyon", value: novels.filter(n => n.status === "draft").length, icon: EyeOff },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-5 text-center">
                  <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      {/* Confirmation dialog */}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          destructive={confirmAction.destructive}
          onConfirm={() => { confirmAction.action(); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

export default Admin;
