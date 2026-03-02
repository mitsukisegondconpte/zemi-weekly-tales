import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Coins, BookOpen, Heart, ShoppingCart, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const COIN_PACKAGES = [
  { coins: 50, price: "$2.99", popular: false },
  { coins: 120, price: "$5.99", popular: true },
  { coins: 300, price: "$12.99", popular: false },
];

const Profile = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8 max-w-4xl">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-8 p-6 rounded-2xl border border-border bg-card shadow-sm">
            <div className="h-16 w-16 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
              {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-serif text-foreground">{profile?.display_name || "Itilizatè"}</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Dekonekte
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
              <Coins className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{profile?.coins ?? 0}</p>
              <p className="text-xs text-muted-foreground">Coins</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
              <BookOpen className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Chapit li</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
              <Heart className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Favoris</p>
            </div>
          </div>

          {/* Buy Coins */}
          <h2 className="text-xl font-bold font-serif text-foreground mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Achte Coins
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {COIN_PACKAGES.map((pkg) => (
              <button
                key={pkg.coins}
                className={`relative rounded-2xl border-2 bg-card p-6 text-center transition-all hover:shadow-xl hover:shadow-primary/10 ${
                  pkg.popular ? "border-primary shadow-lg" : "border-border hover:border-primary"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow">
                    Popilè
                  </span>
                )}
                <div className="coin-badge inline-flex items-center gap-1 mb-3">
                  <Coins className="h-4 w-4" /> {pkg.coins}
                </div>
                <p className="text-2xl font-bold text-foreground">{pkg.price}</p>
                <p className="text-xs text-muted-foreground mt-1">PayPal / Stripe</p>
              </button>
            ))}
          </div>

          {/* Redeem code */}
          <h2 className="text-xl font-bold font-serif text-foreground mb-4">Itilize Kòd</h2>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="Antre kòd inik ou..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            <button className="px-6 py-3 rounded-xl gradient-brand text-primary-foreground font-bold hover:opacity-90 transition-opacity shadow-lg">
              Valide
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
