import { Book } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-secondary/50 py-8 mt-16">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Book className="h-5 w-5 text-primary" />
        <span className="font-serif font-bold text-foreground">ZEMI</span>
        <span className="text-xs italic text-muted-foreground">chak semèn</span>
      </div>
      <p className="text-sm text-muted-foreground">
        © 2026 ZEMI Chak Semèn. Tout dwa rezève.
      </p>
    </div>
  </footer>
);

export default Footer;
