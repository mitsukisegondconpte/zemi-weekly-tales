import { Link, useLocation, useNavigate } from "react-router-dom";
import { Coins, Shield, LogOut, Bell, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserNotifications, useUnreadCount, useMarkAllRead, useMarkNotificationRead, formatRelative } from "@/hooks/useAuthor";
import zemiLogo from "@/assets/zemi-logo.jpg";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, profile, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [showNotifs, setShowNotifs] = useState(false);

  const coins = profile?.coins ?? 0;

  const { data: notifications = [] } = useUserNotifications(10);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAll = useMarkAllRead();
  const markOne = useMarkNotificationRead();

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

  const markAllRead = () => markAll.mutate();

  const handleNotifClick = (n: any) => {
    if (!n.is_read) markOne.mutate(n.id);
    setShowNotifs(false);
    if (n.link) navigate(n.link);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={zemiLogo} alt="ZEMI" className="h-8 w-8 rounded object-contain" />
          <span className="text-base font-semibold tracking-tight text-foreground">ZEMI</span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">· chak semèn</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 text-sm transition-colors hover:text-primary ${
                location.pathname === "/admin" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          {user && (
            <Link to="/profile" className="coin-badge flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span>{coins}</span>
            </Link>
          )}

          <button
            onClick={toggleDark}
            className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={darkMode ? "Mode klè" : "Mode nwa"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </button>
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded border border-border bg-card shadow-lg z-50">
                      <div className="p-3 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-foreground text-sm">Notifikasyon</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-primary hover:underline">Make tout li</button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground text-sm">Pa gen notifikasyon.</p>
                      ) : (
                        notifications.map((n: any) => (
                          <button
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`w-full text-left p-3 border-b border-border last:border-0 hover:bg-secondary transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
                          >
                            <p className="font-medium text-foreground text-sm">{n.title}</p>
                            <p className="text-muted-foreground text-xs line-clamp-2">{n.message}</p>
                            <p className="text-muted-foreground text-[10px] mt-1">{formatRelative(n.created_at)}</p>
                          </button>
                        ))
                      )}
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifs(false)}
                        className="block p-3 text-center text-xs text-primary border-t border-border hover:bg-secondary transition-colors"
                      >
                        Wè tout notifikasyon
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <Link
                to="/profile"
                className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-medium text-xs"
              >
                {(profile?.display_name || user.email || "U")[0].toUpperCase()}
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                title="Dekonekte"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}

          {!user && (
            <div className="flex gap-2">
              <Link to="/login" className="px-3 py-1.5 text-sm text-foreground hover:text-primary transition-colors">
                Konekte
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
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
