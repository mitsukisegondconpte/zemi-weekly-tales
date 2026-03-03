import { Link, useLocation } from "react-router-dom";
import { Coins, Shield, LogOut, Settings, Bell, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import zemiLogo from "@/assets/zemi-logo.jpg";

const Header = () => {
  const location = useLocation();
  const { user, isAdmin, profile, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const coins = profile?.coins ?? 0;

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/admin" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && (
            <Link to="/profile" className="coin-badge flex items-center gap-1.5 text-xs">
              <Coins className="h-3.5 w-3.5" />
              {coins}
            </Link>
          )}

          {/* Settings bar - horizontal icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 active:scale-90"
              title={darkMode ? "Mode klè" : "Mode nwa"}
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {user && (
              <>
                <button
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 active:scale-90"
                  title="Notifikasyon"
                >
                  <Bell className="h-4.5 w-4.5" />
                </button>
                <Link
                  to="/profile"
                  className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-xs shadow-md hover:scale-110 transition-transform duration-200"
                >
                  {(profile?.display_name || user.email || "U")[0].toUpperCase()}
                </Link>
                <button
                  onClick={signOut}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 active:scale-90"
                  title="Dekonekte"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </>
            )}

            {!user && (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Konekte
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm font-medium rounded-xl gradient-brand text-primary-foreground hover:opacity-90 transition-opacity shadow-md"
                >
                  Kreye Kont
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
