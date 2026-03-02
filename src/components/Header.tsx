import { Link, useLocation } from "react-router-dom";
import { Book, Coins, User, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import zemiLogo from "@/assets/zemi-logo.jpg";

const Header = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Mock auth state
  const isLoggedIn = true;
  const isAdmin = true;
  const coins = 150;

  const navLinks = [
    { to: "/", label: "Novèl", icon: Book },
    { to: "/profile", label: "Profil", icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={zemiLogo} alt="ZEMI" className="h-10 w-10 rounded-lg object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tight font-serif text-foreground">ZEMI</span>
            <span className="text-[10px] font-medium italic text-muted-foreground">chak semèn</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
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

        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="coin-badge flex items-center gap-1.5">
                <Coins className="h-4 w-4" />
                {coins} Coins
              </Link>
              <Link
                to="/profile"
                className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm"
              >
                U
              </Link>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-medium text-foreground hover:text-primary"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-medium text-foreground hover:text-primary"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
          <div className="pt-2 border-t border-border">
            <span className="coin-badge inline-flex items-center gap-1.5">
              <Coins className="h-4 w-4" />
              {coins} Coins
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
