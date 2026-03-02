import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Coins, BookOpen, Heart, ShoppingCart } from "lucide-react";

const COIN_PACKAGES = [
  { coins: 50, price: "$2.99" },
  { coins: 120, price: "$5.99" },
  { coins: 300, price: "$12.99" },
];

const Profile = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8 max-w-4xl">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-2xl font-bold">
              U
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif text-foreground">User Demo</h1>
              <p className="text-muted-foreground text-sm">user@demo.com</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Coins className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">150</p>
              <p className="text-xs text-muted-foreground">Coins</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Chapit li</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Heart className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">3</p>
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
                className="rounded-xl border-2 border-border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
              >
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
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
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
