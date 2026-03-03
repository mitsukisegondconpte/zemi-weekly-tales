import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { BookOpen, Coins, BarChart3, Users, FileText, Plus, Trash2, Edit, Save, X, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminNovels, useAdminChapters, GENRES } from "@/hooks/useNovels";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const TABS = [
  { id: "novels", label: "Novèl", icon: BookOpen },
  { id: "chapters", label: "Chapit", icon: FileText },
  { id: "stats", label: "Statistik", icon: BarChart3 },
];

const Admin = () => {
  const [tab, setTab] = useState("novels");
  const queryClient = useQueryClient();

  // Novel form
  const [showNovelForm, setShowNovelForm] = useState(false);
  const [novelForm, setNovelForm] = useState({ title: "", author: "", description: "", genre: "Dram" as string });
  const [editingNovel, setEditingNovel] = useState<string | null>(null);

  // Chapter form
  const [selectedNovelId, setSelectedNovelId] = useState<string>("");
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapterForm, setChapterForm] = useState({ title: "", content: "", chapter_number: 1, is_premium: false, coin_price: 0, status: "draft" });

  const { data: novels = [], isLoading: novelsLoading } = useAdminNovels();
  const { data: chapters = [] } = useAdminChapters(selectedNovelId || undefined);

  // ===== NOVEL CRUD =====
  const saveNovel = async () => {
    if (!novelForm.title || !novelForm.author) { toast.error("Tit ak otè obligatwa"); return; }

    if (editingNovel) {
      const { error } = await supabase.from("novels").update({
        title: novelForm.title, author: novelForm.author,
        description: novelForm.description, genre: novelForm.genre as any
      }).eq("id", editingNovel);
      if (error) { toast.error(error.message); return; }
      toast.success("Novèl modifye!");
    } else {
      const { error } = await supabase.from("novels").insert({
        title: novelForm.title, author: novelForm.author,
        description: novelForm.description, genre: novelForm.genre as any, status: "draft"
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Novèl kreye!");
    }
    setShowNovelForm(false);
    setEditingNovel(null);
    setNovelForm({ title: "", author: "", description: "", genre: "Dram" });
    queryClient.invalidateQueries({ queryKey: ["novels"] });
  };

  const toggleNovelStatus = async (id: string, current: string) => {
    const newStatus = current === "published" ? "draft" : "published";
    await supabase.from("novels").update({ status: newStatus }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["novels"] });
    toast.success(newStatus === "published" ? "Pibliye!" : "Mete an bouyon");
  };

  const deleteNovel = async (id: string) => {
    if (!confirm("Efase novèl sa a ak tout chapit li yo?")) return;
    await supabase.from("novels").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["novels"] });
    toast.success("Novèl efase");
  };

  // ===== CHAPTER CRUD =====
  const saveChapter = async () => {
    if (!selectedNovelId) { toast.error("Chwazi yon novèl"); return; }
    if (!chapterForm.title || !chapterForm.content) { toast.error("Tit ak kontni obligatwa"); return; }

    const { error } = await supabase.from("chapters").insert({
      novel_id: selectedNovelId,
      title: chapterForm.title,
      content: chapterForm.content,
      chapter_number: chapterForm.chapter_number,
      is_premium: chapterForm.is_premium,
      coin_price: chapterForm.is_premium ? chapterForm.coin_price : 0,
      status: chapterForm.status,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Chapit ajoute!");
    setShowChapterForm(false);
    setChapterForm({ title: "", content: "", chapter_number: chapters.length + 2, is_premium: false, coin_price: 0, status: "draft" });
    queryClient.invalidateQueries({ queryKey: ["chapters"] });
  };

  const toggleChapterStatus = async (id: string, current: string) => {
    const newStatus = current === "published" ? "draft" : "published";
    await supabase.from("chapters").update({ status: newStatus }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["chapters"] });
    toast.success(newStatus === "published" ? "Chapit pibliye!" : "Chapit an bouyon");
  };

  const deleteChapter = async (id: string) => {
    if (!confirm("Efase chapit sa a?")) return;
    await supabase.from("chapters").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["chapters"] });
    toast.success("Chapit efase");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-black font-serif text-foreground mb-6">Panel Admin</h1>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </div>

          {/* ========== NOVELS TAB ========== */}
          {tab === "novels" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Tout Novèl ({novels.length})</h2>
                <button onClick={() => { setShowNovelForm(true); setEditingNovel(null); setNovelForm({ title: "", author: "", description: "", genre: "Dram" }); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                  <Plus className="h-4 w-4" /> Nouvo Novèl
                </button>
              </div>

              {/* Novel Form */}
              {showNovelForm && (
                <div className="rounded-xl border border-primary/30 bg-card p-6 mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">{editingNovel ? "Modifye Novèl" : "Nouvo Novèl"}</h3>
                    <button onClick={() => setShowNovelForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Tit *</label>
                      <input value={novelForm.title} onChange={e => setNovelForm(p => ({ ...p, title: e.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Tit novèl la" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Otè *</label>
                      <input value={novelForm.author} onChange={e => setNovelForm(p => ({ ...p, author: e.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Non otè a" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Jan</label>
                      <select value={novelForm.genre} onChange={e => setNovelForm(p => ({ ...p, genre: e.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Deskripsyon</label>
                      <input value={novelForm.description} onChange={e => setNovelForm(p => ({ ...p, description: e.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Kèk mo sou novèl la" />
                    </div>
                  </div>
                  <button onClick={saveNovel} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90">
                    <Save className="h-4 w-4" /> {editingNovel ? "Anrejistre" : "Kreye"}
                  </button>
                </div>
              )}

              {/* Novels List */}
              {novelsLoading ? <p className="text-muted-foreground">Chajman...</p> : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Tit</th>
                        <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Jan</th>
                        <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Estati</th>
                        <th className="text-right px-4 py-3 font-medium text-secondary-foreground">Aksyon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {novels.map((n) => (
                        <tr key={n.id} className="border-t border-border">
                          <td className="px-4 py-3 font-medium text-foreground">{n.title}<br/><span className="text-xs text-muted-foreground">{n.author}</span></td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{n.genre}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${n.status === "published" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                              {n.status === "published" ? "Pibliye" : "Bouyon"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button onClick={() => toggleNovelStatus(n.id, n.status)} title={n.status === "published" ? "Retire" : "Pibliye"}>
                              {n.status === "published" ? <EyeOff className="h-4 w-4 inline text-muted-foreground hover:text-foreground" /> : <Eye className="h-4 w-4 inline text-primary" />}
                            </button>
                            <button onClick={() => { setEditingNovel(n.id); setNovelForm({ title: n.title, author: n.author, description: n.description || "", genre: n.genre }); setShowNovelForm(true); }}>
                              <Edit className="h-4 w-4 inline text-muted-foreground hover:text-foreground" />
                            </button>
                            <button onClick={() => deleteNovel(n.id)}><Trash2 className="h-4 w-4 inline text-destructive" /></button>
                          </td>
                        </tr>
                      ))}
                      {novels.length === 0 && (
                        <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Pa gen novèl ankò. Kreye premye a!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========== CHAPTERS TAB ========== */}
          {tab === "chapters" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-foreground">Chapit yo</h2>
                  <select value={selectedNovelId} onChange={e => setSelectedNovelId(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                    <option value="">— Chwazi novèl —</option>
                    {novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                  </select>
                </div>
                {selectedNovelId && (
                  <button onClick={() => { setShowChapterForm(true); setChapterForm({ title: "", content: "", chapter_number: chapters.length + 1, is_premium: false, coin_price: 0, status: "draft" }); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    <Plus className="h-4 w-4" /> Ajoute Chapit
                  </button>
                )}
              </div>

              {/* Chapter Form */}
              {showChapterForm && selectedNovelId && (
                <div className="rounded-xl border border-primary/30 bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">Nouvo Chapit</h3>
                    <button onClick={() => setShowChapterForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Nimewo *</label>
                      <input type="number" min={1} value={chapterForm.chapter_number} onChange={e => setChapterForm(p => ({ ...p, chapter_number: +e.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Tit *</label>
                      <input value={chapterForm.title} onChange={e => setChapterForm(p => ({ ...p, title: e.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Tit chapit la" />
                    </div>
                    <div className="flex gap-4 items-end">
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input type="checkbox" checked={chapterForm.is_premium} onChange={e => setChapterForm(p => ({ ...p, is_premium: e.target.checked }))}
                          className="rounded border-input" />
                        Premium
                      </label>
                      {chapterForm.is_premium && (
                        <div>
                          <label className="text-xs font-medium text-foreground block mb-1">Pri (Coins)</label>
                          <input type="number" min={1} value={chapterForm.coin_price} onChange={e => setChapterForm(p => ({ ...p, coin_price: +e.target.value }))}
                            className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Kontni *</label>
                    <textarea rows={12} value={chapterForm.content} onChange={e => setChapterForm(p => ({ ...p, content: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-y"
                      placeholder="Ekri kontni chapit la isit..." />
                  </div>
                  <div className="flex items-center gap-3">
                    <select value={chapterForm.status} onChange={e => setChapterForm(p => ({ ...p, status: e.target.value }))}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="draft">Bouyon</option>
                      <option value="published">Pibliye</option>
                    </select>
                    <button onClick={saveChapter} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90">
                      <Save className="h-4 w-4" /> Anrejistre
                    </button>
                  </div>
                </div>
              )}

              {/* Chapters list */}
              {selectedNovelId && chapters.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-secondary-foreground">#</th>
                        <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Tit</th>
                        <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Tip</th>
                        <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Estati</th>
                        <th className="text-right px-4 py-3 font-medium text-secondary-foreground">Aksyon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapters.map((ch) => (
                        <tr key={ch.id} className="border-t border-border">
                          <td className="px-4 py-3 font-bold text-foreground">{ch.chapter_number}</td>
                          <td className="px-4 py-3 text-foreground">{ch.title}</td>
                          <td className="px-4 py-3">
                            {ch.is_premium ? (
                              <span className="coin-badge inline-flex items-center gap-1 text-xs"><Coins className="h-3 w-3" />{ch.coin_price}</span>
                            ) : (
                              <span className="text-xs font-semibold text-primary">GRATIS</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ch.status === "published" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                              {ch.status === "published" ? "Pibliye" : "Bouyon"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button onClick={() => toggleChapterStatus(ch.id, ch.status)}>
                              {ch.status === "published" ? <EyeOff className="h-4 w-4 inline text-muted-foreground hover:text-foreground" /> : <Eye className="h-4 w-4 inline text-primary" />}
                            </button>
                            <button onClick={() => deleteChapter(ch.id)}><Trash2 className="h-4 w-4 inline text-destructive" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedNovelId && chapters.length === 0 && !showChapterForm && (
                <p className="text-muted-foreground text-center py-8">Pa gen chapit ankò pou novèl sa a.</p>
              )}
              {!selectedNovelId && <p className="text-muted-foreground text-center py-8">Chwazi yon novèl pou wè chapit li yo.</p>}
            </div>
          )}

          {/* ========== STATS TAB ========== */}
          {tab === "stats" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Novèl", value: novels.length, icon: BookOpen },
                { label: "Novèl Pibliye", value: novels.filter(n => n.status === "published").length, icon: Eye },
                { label: "Total Reyaksyon", value: novels.reduce((s, n) => s + n.reactions, 0), icon: Users },
                { label: "Bouyon", value: novels.filter(n => n.status === "draft").length, icon: FileText },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-6">
                  <s.icon className="h-6 w-6 text-primary mb-3" />
                  <p className="text-3xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
