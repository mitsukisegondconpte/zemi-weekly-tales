import { Link, useLocation, useNavigate } from "react-router-dom";
import { Coins, Shield, LogOut, Bell, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import zemiLogo from "@/assets/zemi-logo.jpg";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [showNotifs, setShowNotifs] = useState(false);

  const coins = profile?.coins ?? 0;

  // Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["header_notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Restore theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n: any) => !n.is_read);
    for (const n of unread) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", (n as any).id);
    }
    queryClient.invalidateQueries({ queryKey: ["header_notifications"] });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={zemiLogo} alt="ZEMI" className="h-9 w-9 rounded-lg object-contain shadow-md" />
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tight font-serif text-foreground">ZEMI</span>
            <span className="text-[9px] font-medium italic text-muted-foreground">chak semèn</span>
          </div>
        </Link>

        {/* Admin link */}
        <nav className="flex items-center gap-4">
          {isAdmin && (
            <Link to="/admin"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/admin" ? "text-primary" : "text-muted-foreground"
              }`}>
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {user && (
            <Link to="/profile" className="coin-badge flex items-center gap-1.5 text-xs">
              <Coins className="h-3.5 w-3.5" />{coins}
            </Link>
          )}

          <button onClick={toggleDark}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90"
            title={darkMode ? "Mode klè" : "Mode nwa"}>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user && (
            <>
              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90 relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl z-50">
                      <div className="p-3 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold text-foreground text-sm">Notifikasyon</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-primary hover:underline">Make tout li</button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground text-sm">Pa gen notifikasyon.</p>
                      ) : (
                        notifications.map((n: any) => (
                          <div key={n.id} className={`p-3 border-b border-border last:border-0 ${!n.is_read ? "bg-primary/5" : ""}`}>
                            <p className="font-medium text-foreground text-sm">{n.title}</p>
                            <p className="text-muted-foreground text-xs">{n.message}</p>
                            <p className="text-muted-foreground text-[10px] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <Link to="/profile"
                className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-xs shadow-md hover:scale-110 transition-transform">
                {(profile?.display_name || user.email || "U")[0].toUpperCase()}
              </Link>
              <button onClick={handleSignOut}
                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                title="Dekonekte">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}

          {!user && (
            <div className="flex gap-2">
              <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors">
                Konekte
              </Link>
              <Link to="/register" className="px-3 py-1.5 text-sm font-medium rounded-xl gradient-brand text-primary-foreground hover:opacity-90 shadow-md">
                Kreye Kont
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
