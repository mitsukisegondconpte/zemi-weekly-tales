import { Link } from "react-router-dom";
import { Instagram, MessageCircle } from "lucide-react";
import zemiLogo from "@/assets/zemi-logo.jpg";

const Footer = () => (
  <footer className="border-t border-border bg-card py-10 mt-16 mb-16 md:mb-0">
    <div className="container">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={zemiLogo} alt="ZEMI" className="h-8 w-8 rounded-lg object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-black font-serif text-foreground">ZEMI</span>
            <span className="text-[9px] italic text-muted-foreground">chak semèn</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/zemi_chak_semen?igsh=ajZmYWlycTFrdGkx"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
            title="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="https://wa.me/50943003284?text=bonjour%20l%27equipe%20de%20zemi"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
            title="WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        </div>

        <p className="text-sm text-muted-foreground">
          © 2026 ZEMI. Tout dwa rezève.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
