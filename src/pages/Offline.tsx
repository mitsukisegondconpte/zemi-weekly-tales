import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Link } from "react-router-dom";
import { BookOpen, Download, Trash2, WifiOff } from "lucide-react";
import { useDownloadedNovels, useOnlineStatus, removeNovelDownload } from "@/hooks/useOffline";

const Offline = () => {
  const { novels, refresh } = useDownloadedNovels();
  const online = useOnlineStatus();

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black font-serif text-foreground">Lekti Offline</h1>
        </div>
        {!online && (
          <div className="mb-4 p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-2 text-sm">
            <WifiOff className="h-4 w-4 text-primary" />
            <span className="text-foreground">Ou pa konekte. Sèlman novèl telechaje yo disponib.</span>
          </div>
        )}
        {novels.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">Pa gen novèl telechaje ankò.</p>
            <p className="text-xs text-muted-foreground mt-1">Ouvri yon novèl epi peze "Telechaje tout".</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {novels.map(n => (
              <div key={n.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                {n.cover_url ? (
                  <img src={n.cover_url} alt={n.title} className="w-14 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-20 rounded-lg gradient-brand flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary-foreground opacity-70" />
                  </div>
                )}
                <Link to={`/novel/${n.id}`} className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">pa {n.author}</p>
                  <p className="text-xs text-primary mt-1">{n.genre}</p>
                </Link>
                <button
                  onClick={async () => { await removeNovelDownload(n.id); refresh(); }}
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive"
                  aria-label="Efase telechajman"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Offline;
