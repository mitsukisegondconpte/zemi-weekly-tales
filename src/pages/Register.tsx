import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import zemiLogo from "@/assets/zemi-logo.jpg";

const Register = () => {
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setShakeKey(k => k + 1);
      toast({ variant: "destructive", title: "Erè", description: "Modpas dwe gen omwen 6 karaktè." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      setShakeKey(k => k + 1);
      toast({ variant: "destructive", title: "Erè", description: error.message });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md px-6">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xl text-center animate-pop-in">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 breathe">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-black font-serif text-foreground mb-2 field-rise" style={{ ["--d" as any]: "100ms" }}>
                Tcheke imèl ou!
              </h1>
              <p className="text-muted-foreground mb-6 field-rise" style={{ ["--d" as any]: "200ms" }}>
                Nou voye yon lyen verifikasyon nan <strong className="text-foreground break-all">{email}</strong>.
                Klike sou lyen an pou aktive kont ou.
              </p>
              <Link
                to="/login"
                className="btn-tactile ripple field-rise inline-block rounded-xl gradient-brand text-primary-foreground px-6 py-3 font-bold shadow-lg"
                style={{ ["--d" as any]: "300ms" }}
              >
                Ale nan paj Koneksyon
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-6">
          <div
            key={shakeKey}
            className={`rounded-2xl border border-border bg-card p-8 shadow-xl animate-pop-in ${shakeKey > 0 ? "shake" : ""}`}
          >
            <div className="text-center mb-8">
              <img
                src={zemiLogo}
                alt="ZEMI"
                className="h-16 w-16 mx-auto mb-4 rounded-xl object-contain shadow-lg breathe hover:rotate-6 transition-transform duration-500"
              />
              <h1 className="text-3xl font-black font-serif text-foreground field-rise" style={{ ["--d" as any]: "60ms" }}>
                Kreye Kont
              </h1>
              <p className="text-muted-foreground mt-1 field-rise" style={{ ["--d" as any]: "140ms" }}>
                Rejwenn kominote ZEMI a
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="field-rise" style={{ ["--d" as any]: "200ms" }}>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Non</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    type="text"
                    placeholder="Non ou"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-300 focus:scale-[1.01]"
                  />
                </div>
              </div>
              <div className="field-rise" style={{ ["--d" as any]: "280ms" }}>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Imèl</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    type="email"
                    placeholder="ou@egzanp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-300 focus:scale-[1.01]"
                  />
                </div>
              </div>
              <div className="field-rise" style={{ ["--d" as any]: "360ms" }}>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Modpas</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Omwen 6 karaktè"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-300 focus:scale-[1.01]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="btn-tactile absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-tactile ripple field-rise w-full rounded-xl gradient-brand text-primary-foreground py-3 font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                style={{ ["--d" as any]: "440ms" }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Kreye Kont
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6 field-rise" style={{ ["--d" as any]: "520ms" }}>
              Deja gen kont? <Link to="/login" className="text-primary font-semibold link-underline">Konekte</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
