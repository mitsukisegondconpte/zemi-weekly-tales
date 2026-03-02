import { Link } from "react-router-dom";
import zemiLogo from "@/assets/zemi-logo.jpg";

const Footer = () => (
  <footer className="border-t border-border bg-card py-10 mt-16">
    <div className="container">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={zemiLogo} alt="ZEMI" className="h-8 w-8 rounded-lg object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-black font-serif text-foreground">ZEMI</span>
            <span className="text-[9px] italic text-muted-foreground">chak semèn</span>
          </div>
        </Link>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Novèl</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">Konekte</Link>
          <Link to="/register" className="hover:text-foreground transition-colors">Kreye Kont</Link>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 ZEMI. Tout dwa rezève.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
