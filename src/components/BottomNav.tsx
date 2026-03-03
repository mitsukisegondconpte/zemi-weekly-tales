import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Search, LayoutGrid, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/lecture", label: "Lekti", icon: BookOpen },
  { to: "/search", label: "Rechèch", icon: Search },
  { to: "/canvas", label: "Canvas", icon: LayoutGrid },
  { to: "/profile", label: "Mwen", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [tapped, setTapped] = useState<string | null>(null);

  const handleTap = (to: string) => {
    setTapped(to);
    setTimeout(() => setTapped(null), 300);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          const isTapped = tapped === item.to;
          const dest = item.to === "/profile" && !user ? "/login" : item.to;

          return (
            <Link
              key={item.to}
              to={dest}
              onClick={() => handleTap(item.to)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "gradient-brand text-primary-foreground scale-110 shadow-lg shadow-primary/30"
                    : "text-muted-foreground"
                } ${isTapped ? "scale-125" : ""}`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary animate-scale-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
