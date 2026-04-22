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
  const [shakeKey, setShakeKey] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setShakeKey(k => k + 1);
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
                {showForgot ? "Bliye Modpas" : "Konekte"}
              </h1>
              <p className="text-muted-foreground mt-1 field-rise" style={{ ["--d" as any]: "140ms" }}>
                {showForgot ? "N ap voye yon lyen reyanitalizasyon ba ou" : "Antre nan kont ZEMI ou"}
              </p>
            </div>

            {showForgot ? (
              <form className="space-y-5" onSubmit={handleForgotPassword}>
                <div className="field-rise" style={{ ["--d" as any]: "200ms" }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Imèl</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                      type="email"
                      placeholder="ou@egzanp.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-300 focus:scale-[1.01]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-tactile ripple field-rise w-full rounded-xl gradient-brand text-primary-foreground py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                  style={{ ["--d" as any]: "280ms" }}
                >
                  {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Voye Lyen Reyanitalizasyon
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="field-rise w-full text-center text-sm text-primary font-semibold link-underline"
                  style={{ ["--d" as any]: "360ms" }}
                >
                  Retounen nan koneksyon
                </button>
              </form>
            ) : (
              <>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="field-rise" style={{ ["--d" as any]: "200ms" }}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Imèl</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <input
                        type="email"
                        placeholder="ou@egzanp.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-300 focus:scale-[1.01]"
                      />
                    </div>
                  </div>
                  <div className="field-rise" style={{ ["--d" as any]: "280ms" }}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Modpas</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
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
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="field-rise text-sm text-primary font-semibold link-underline"
                    style={{ ["--d" as any]: "360ms" }}
                  >
                    Bliye modpas?
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-tactile ripple field-rise w-full rounded-xl gradient-brand text-primary-foreground py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    style={{ ["--d" as any]: "440ms" }}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Konekte
                  </button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6 field-rise" style={{ ["--d" as any]: "520ms" }}>
                  Pa gen kont? <Link to="/register" className="text-primary font-semibold link-underline">Kreye kont</Link>
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
