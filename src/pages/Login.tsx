import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import zemiLogo from "@/assets/zemi-logo.jpg";

const Login = () => {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error("Antre imèl ou"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setForgotLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Lyen reyanitalizasyon voye nan imèl ou!");
      setShowForgot(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-6">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
            <div className="text-center mb-8">
              <img src={zemiLogo} alt="ZEMI" className="h-16 w-16 mx-auto mb-4 rounded-xl object-contain shadow-lg" />
              <h1 className="text-3xl font-black font-serif text-foreground">Konekte</h1>
              <p className="text-muted-foreground mt-1">Antre nan kont ZEMI ou</p>
            </div>

            {showForgot ? (
              <form className="space-y-5" onSubmit={handleForgotPassword}>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Imèl</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="email" placeholder="ou@egzanp.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                      className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <button type="submit" disabled={forgotLoading}
                  className="w-full rounded-xl gradient-brand text-primary-foreground py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                  {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Voye Lyen Reyanitalizasyon
                </button>
                <button type="button" onClick={() => setShowForgot(false)} className="w-full text-center text-sm text-primary font-semibold hover:underline">
                  Retounen nan koneksyon
                </button>
              </form>
            ) : (
              <>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Imèl</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input type="email" placeholder="ou@egzanp.com" value={email} onChange={e => setEmail(e.target.value)} required
                        className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Modpas</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                        className="w-full rounded-xl border border-input bg-background pl-10 pr-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-primary font-semibold hover:underline">
                    Bliye modpas?
                  </button>
                  <button type="submit" disabled={loading}
                    className="w-full rounded-xl gradient-brand text-primary-foreground py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Konekte
                  </button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Pa gen kont? <Link to="/register" className="text-primary font-semibold hover:underline">Kreye kont</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
