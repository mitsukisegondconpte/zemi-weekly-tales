import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Coins, BookOpen, Heart, ShoppingCart, LogOut, History, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const COIN_PACKAGES = [
  { coins: 50, price: "$2.99", popular: false },
  { coins: 120, price: "$5.99", popular: true },
  { coins: 300, price: "$12.99", popular: false },
];

const TABS = [
  { id: "coins", label: "Coins", icon: Coins },
  { id: "history", label: "Istwa", icon: History },
  { id: "favorites", label: "Favoris", icon: Heart },
];

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("coins");

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
            <div className="flex-1">
              <h1 className="text-xl font-bold font-serif text-foreground">{profile?.display_name || "Itilizatè"}</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Dekonekte
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
              <p className="text-xl font-bold text-foreground">0</p>
              <p className="text-[11px] text-muted-foreground">Chapit li</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <Heart className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">0</p>
              <p className="text-[11px] text-muted-foreground">Favoris</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-secondary">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "gradient-brand text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "coins" && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold font-serif text-foreground mb-3 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Achte Coins
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {COIN_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.coins}
                    className={`relative rounded-2xl border-2 bg-card p-5 text-center transition-all hover:shadow-xl hover:shadow-primary/10 active:scale-95 ${
                      pkg.popular ? "border-primary shadow-lg" : "border-border hover:border-primary"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow">
                        Popilè
                      </span>
                    )}
                    <div className="coin-badge inline-flex items-center gap-1 mb-2">
                      <Coins className="h-4 w-4" /> {pkg.coins}
                    </div>
                    <p className="text-xl font-bold text-foreground">{pkg.price}</p>
                    <p className="text-xs text-muted-foreground mt-1">PayPal / Stripe</p>
                  </button>
                ))}
              </div>

              <h2 className="text-lg font-bold font-serif text-foreground mb-3">Itilize Kòd</h2>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Antre kòd inik ou..."
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
                <button className="px-5 py-3 rounded-xl gradient-brand text-primary-foreground font-bold hover:opacity-90 transition-opacity shadow-lg active:scale-95">
                  Valide
                </button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="animate-fade-in text-center py-12 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Istwa lekti ou pral parèt isit la.</p>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="animate-fade-in text-center py-12 text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Favoris ou yo pral parèt isit la.</p>
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
