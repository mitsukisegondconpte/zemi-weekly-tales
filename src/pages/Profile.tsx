import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Coins, BookOpen, Heart, History, Key, Lock, LogOut, Bell, Shield, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

const COIN_PACKAGES = [
  { coins: 50, price: "$2.99", popular: false },
  { coins: 120, price: "$5.99", popular: true },
  { coins: 300, price: "$12.99", popular: false },
];

const TABS = [
  { id: "overview", label: "Pwofil", icon: Shield },
  { id: "coins", label: "Coins", icon: Coins },
  { id: "activity", label: "Aktivite", icon: History },
  { id: "favorites", label: "Favoris", icon: Heart },
  { id: "security", label: "Sekirite", icon: Lock },
];

const Profile = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  // Password change
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Reading history
  const { data: readingHistory = [] } = useQuery({
    queryKey: ["reading_history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("reading_history")
        .select("*, chapters(title, chapter_number), novels:novel_id(title)")
        .eq("user_id", user!.id)
        .order("read_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  // Unlocked chapters
  const { data: unlockedChapters = [] } = useQuery({
    queryKey: ["unlocked_history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("unlocked_chapters")
        .select("*, chapters(title, chapter_number, novel_id)")
        .eq("user_id", user!.id)
        .order("unlocked_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  // Favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ["my_favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("*, novels:novel_id(id, title, author, genre, reactions)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  // Coin redemption history
  const { data: redemptions = [] } = useQuery({
    queryKey: ["redemptions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("code_redemptions")
        .select("*, coin_codes(code, coins)")
        .eq("user_id", user!.id)
        .order("redeemed_at", { ascending: false });
      return data ?? [];
    },
  });

  const redeemCode = async () => {
    if (!code.trim()) { toast.error("Antre yon kòd"); return; }
    if (!user) { toast.error("Ou dwe konekte"); return; }
    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc("redeem_coin_code", {
        _user_id: user.id,
        _code: code.trim(),
      });
      if (error) {
        if (error.message.includes("not found")) toast.error("Kòd sa a pa valid oswa pa aktif");
        else if (error.message.includes("maximum")) toast.error("Kòd sa a deja itilize twòp fwa");
        else if (error.message.includes("already redeemed")) toast.error("Ou deja itilize kòd sa a");
        else toast.error("Yon erè rive");
        return;
      }
      await refreshProfile();
      setCode("");
      toast.success(`🎉 ${data} coins ajoute nan kont ou!`);
    } catch {
      toast.error("Yon erè rive");
    } finally {
      setRedeeming(false);
    }
  };

  const changePassword = async () => {
    if (newPw.length < 6) { toast.error("Nouvo modpas dwe gen omwen 6 karaktè"); return; }
    if (newPw !== confirmPw) { toast.error("Modpas yo pa menm"); return; }
    setChangingPw(true);
    // Verify old password by re-signing in
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user!.email!, password: oldPw
    });
    if (signInErr) { toast.error("Ansyen modpas pa kòrèk"); setChangingPw(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setChangingPw(false);
    if (error) { toast.error(error.message); } else {
      toast.success("Modpas chanje!");
      setOldPw(""); setNewPw(""); setConfirmPw("");
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) toast.error(error.message);
    else toast.success("Lyen reyanitalizasyon voye nan imèl ou!");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-HT", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        <div className="container py-6 max-w-4xl">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl border border-border bg-card shadow-sm">
            <div className="h-14 w-14 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg">
              {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold font-serif text-foreground truncate">{profile?.display_name || "Itilizatè"}</h1>
              <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-bold hover:bg-destructive/20 transition-colors active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Dekonekte</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <Coins className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{profile?.coins ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Coins</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <BookOpen className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{readingHistory.length}</p>
              <p className="text-[11px] text-muted-foreground">Chapit li</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <Heart className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{favorites.length}</p>
              <p className="text-[11px] text-muted-foreground">Favoris</p>
            </div>
          </div>

          {/* Tabs - scrollable */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-secondary overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "gradient-brand text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === "overview" && (
            <div className="animate-fade-in space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h2 className="text-lg font-bold font-serif text-foreground">Enfòmasyon Kont</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Non</p>
                    <p className="text-foreground font-medium">{profile?.display_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Imèl</p>
                    <p className="text-foreground font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coins</p>
                    <p className="text-foreground font-medium">{profile?.coins ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Manm depi</p>
                    <p className="text-foreground font-medium">{createdAt}</p>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-bold font-serif text-foreground mb-3 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" /> Notifikasyon
                </h2>
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Pa gen notifikasyon.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n: any) => (
                      <div key={n.id} className={`p-3 rounded-lg border text-sm ${n.is_read ? "border-border bg-background" : "border-primary/30 bg-primary/5"}`}>
                        <p className="font-medium text-foreground">{n.title}</p>
                        <p className="text-muted-foreground text-xs">{n.message}</p>
                        <p className="text-muted-foreground text-[10px] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Continue Reading */}
              {readingHistory.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-lg font-bold font-serif text-foreground mb-3">Kontinye Li</h2>
                  <div className="space-y-2">
                    {readingHistory.slice(0, 3).map((r: any) => (
                      <Link key={r.id} to={`/chapter/${r.novel_id}/${r.chapter_id}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:shadow-sm transition-all">
                        <div>
                          <p className="text-foreground font-medium text-sm">{(r as any).novels?.title}</p>
                          <p className="text-muted-foreground text-xs">Chapit {(r as any).chapters?.chapter_number}: {(r as any).chapters?.title}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== COINS TAB ===== */}
          {activeTab === "coins" && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold font-serif text-foreground mb-3">Achte Coins</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {COIN_PACKAGES.map((pkg) => (
                  <button key={pkg.coins}
                    className={`relative rounded-2xl border-2 bg-card p-5 text-center transition-all hover:shadow-xl hover:shadow-primary/10 active:scale-95 ${
                      pkg.popular ? "border-primary shadow-lg" : "border-border hover:border-primary"
                    }`}>
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow">
                        Popilè
                      </span>
                    )}
                    <div className="coin-badge inline-flex items-center gap-1 mb-2">
                      <Coins className="h-4 w-4" /> {pkg.coins}
                    </div>
                    <p className="text-xl font-bold text-foreground">{pkg.price}</p>
                  </button>
                ))}
              </div>

              <h2 className="text-lg font-bold font-serif text-foreground mb-3">Itilize Kòd</h2>
              <div className="flex gap-2 max-w-md">
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && redeemCode()}
                  placeholder="Antre kòd inik ou..."
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase" />
                <button onClick={redeemCode} disabled={redeeming}
                  className="px-5 py-3 rounded-xl gradient-brand text-primary-foreground font-bold hover:opacity-90 shadow-lg active:scale-95 disabled:opacity-50">
                  {redeeming ? "..." : "Valide"}
                </button>
              </div>

              {/* Redemption history */}
              {redemptions.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold font-serif text-foreground mb-3">Istwa Kòd</h2>
                  <div className="space-y-2">
                    {redemptions.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                        <div>
                          <p className="font-mono font-bold text-foreground text-sm">{(r as any).coin_codes?.code}</p>
                          <p className="text-muted-foreground text-xs">{new Date(r.redeemed_at).toLocaleDateString()}</p>
                        </div>
                        <span className="coin-badge text-xs">+{r.coins_received}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== ACTIVITY TAB ===== */}
          {activeTab === "activity" && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h2 className="text-lg font-bold font-serif text-foreground mb-3">Istwa Lekti</h2>
                {readingHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Ou poko li okenn chapit.</p>
                ) : (
                  <div className="space-y-2">
                    {readingHistory.map((r: any) => (
                      <Link key={r.id} to={`/chapter/${r.novel_id}/${r.chapter_id}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary transition-all">
                        <div>
                          <p className="text-foreground font-medium text-sm">{(r as any).novels?.title}</p>
                          <p className="text-muted-foreground text-xs">Chapit {(r as any).chapters?.chapter_number}: {(r as any).chapters?.title}</p>
                        </div>
                        <p className="text-muted-foreground text-xs">{new Date(r.read_at).toLocaleDateString()}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold font-serif text-foreground mb-3">Chapit Debloke</h2>
                {unlockedChapters.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Ou poko debloke okenn chapit premium.</p>
                ) : (
                  <div className="space-y-2">
                    {unlockedChapters.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                        <div>
                          <p className="text-foreground font-medium text-sm">Chapit {(u as any).chapters?.chapter_number}: {(u as any).chapters?.title}</p>
                          <p className="text-muted-foreground text-xs">{new Date(u.unlocked_at).toLocaleDateString()}</p>
                        </div>
                        <span className="coin-badge text-xs">-{u.coins_spent}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== FAVORITES TAB ===== */}
          {activeTab === "favorites" && (
            <div className="animate-fade-in">
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Ou poko ajoute okenn favoris.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favorites.map((f: any) => (
                    <Link key={f.id} to={`/novel/${(f as any).novels?.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-sm transition-all">
                      <div>
                        <p className="text-foreground font-bold">{(f as any).novels?.title}</p>
                        <p className="text-muted-foreground text-sm">{(f as any).novels?.author} • {(f as any).novels?.genre}</p>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Heart className="h-4 w-4 fill-primary" />{(f as any).novels?.reactions}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== SECURITY TAB ===== */}
          {activeTab === "security" && (
            <div className="animate-fade-in">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md">
                <h2 className="text-lg font-bold font-serif text-foreground">Chanje Modpas</h2>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Ansyen modpas</label>
                  <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Nouvo modpas</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Konfime nouvo modpas</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex gap-3">
                  <button onClick={changePassword} disabled={changingPw}
                    className="px-5 py-2.5 rounded-xl gradient-brand text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50">
                    {changingPw ? "..." : "Chanje Modpas"}
                  </button>
                  <button onClick={handleForgotPassword}
                    className="px-5 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary">
                    Bliye Modpas?
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Profile;
