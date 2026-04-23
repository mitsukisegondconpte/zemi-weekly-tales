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
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-fade-in">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="group flex items-center gap-2 btn-tactile">
          <img
            src={zemiLogo}
            alt="ZEMI"
            className="h-9 w-9 rounded-lg object-contain shadow-md transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-110"
          />
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tight font-serif text-foreground">ZEMI</span>
            <span className="text-[9px] font-medium italic text-muted-foreground">chak semèn</span>
          </div>
        </Link>

        {/* Admin link */}
        <nav className="flex items-center gap-4">
          {isAdmin && (
            <Link
              to="/admin"
              className={`link-underline flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/admin" ? "text-primary is-active" : "text-muted-foreground"
              }`}
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {user && (
            <Link to="/profile" className="coin-badge btn-tactile flex items-center gap-1.5 text-xs">
              <Coins className="h-3.5 w-3.5 animate-float" />
              <span key={coins} className="inline-block animate-pop-in">{coins}</span>
            </Link>
          )}

          <button
            onClick={toggleDark}
            className="btn-tactile ripple p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
            title={darkMode ? "Mode klè" : "Mode nwa"}
          >
            <span key={darkMode ? "sun" : "moon"} className="inline-block animate-pop-in">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </span>
          </button>

          {user && (
            <>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="btn-tactile ripple p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary relative"
                >
                  <Bell className={`h-4 w-4 ${unreadCount > 0 ? "animate-wobble" : ""}`} />
                  {unreadCount > 0 && (
                    <span
                      key={unreadCount}
                      className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-badge-pulse"
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl z-50 animate-scale-in origin-top-right">
                      <div className="p-3 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold text-foreground text-sm">Notifikasyon</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-primary link-underline">Make tout li</button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground text-sm animate-fade-in">Pa gen notifikasyon.</p>
                      ) : (
                        notifications.map((n: any, i: number) => (
                          <div
                            key={n.id}
                            style={{ animationDelay: `${i * 40}ms` }}
                            className={`p-3 border-b border-border last:border-0 animate-fade-in-left ${!n.is_read ? "bg-primary/5" : ""}`}
                          >
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

              <Link
                to="/profile"
                className="avatar-wobble h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-xs shadow-md"
              >
                {(profile?.display_name || user.email || "U")[0].toUpperCase()}
              </Link>
              <button
                onClick={handleSignOut}
                className="btn-tactile ripple p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Dekonekte"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}

          {!user && (
            <div className="flex gap-2">
              <Link to="/login" className="link-underline px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary">
                Konekte
              </Link>
              <Link
                to="/register"
                className="btn-tactile ripple px-3 py-1.5 text-sm font-medium rounded-xl gradient-brand text-primary-foreground shadow-md"
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
