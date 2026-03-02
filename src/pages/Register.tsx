import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import zemiLogo from "@/assets/zemi-logo.jpg";

const Register = () => {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-8">
            <img src={zemiLogo} alt="ZEMI" className="h-16 w-16 mx-auto mb-4 rounded-xl object-contain" />
            <h1 className="text-3xl font-black font-serif text-foreground">Kreye Kont</h1>
            <p className="text-muted-foreground mt-1">Rejwenn kominote ZEMI a</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Non</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Non ou" className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Imèl</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" placeholder="ou@egzanp.com" className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Modpas</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPw ? "text" : "password"} placeholder="••••••••" className="w-full rounded-lg border border-input bg-background pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-semibold hover:opacity-90 transition-opacity">
              Kreye Kont
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Deja gen kont? <Link to="/login" className="text-primary font-medium hover:underline">Konekte</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
