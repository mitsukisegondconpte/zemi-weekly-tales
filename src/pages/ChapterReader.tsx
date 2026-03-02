import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ChapterReader = () => {
  const { novelId, chapterId } = useParams();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container max-w-3xl py-8">
          <Link to={`/novel/${novelId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
            <ChevronLeft className="h-4 w-4" /> Retounen nan novèl la
          </Link>

          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Chapit 1</span>
            <h1 className="text-3xl font-black font-serif text-foreground mt-1">Kòmansman</h1>
          </div>

          <article className="prose prose-lg max-w-none text-foreground leading-relaxed space-y-4">
            <p>
              Lè solèy la te kòmanse desann dèyè mòn yo, Mari te kanpe sou galri kay la. Li t ap gade wout la ki mennen nan vil la, yon wout ki te plen pousyè ak istwa ki pa janm rakonte.
            </p>
            <p>
              Li te konnen jou sa a t ap diferan. Yon bagay nan lè a te chanje — tankou yon pwomès ki t ap vin vre, oswa yon danje ki t ap pwoche dousman tankou yon lonbraj nan mitan laprèmidi.
            </p>
            <p>
              "Mari!" Grann li te rele l depi anndan kay la. Vwa l te gen yon vibrasyon espesyal — pa laperèz egzakteman, men yon bagay ki te pwòch.
            </p>
            <p>
              Li te retounen anndan, kote flanm chandelye a te danse sou mi an. Grann li te chita bò tab la, men sa k te fè l sezi se sa ki te sou tab la: yon ansyen liv avèk yon kouvèti an kwi ki te parèt tankou li te gen dè santèn ane.
            </p>
            <p>
              "Sa a," Grann li te di, vwa l te desann tankou yon soupir, "se eritaj ou. Mwen te kenbe l pou ou depi lè ou te fèt. Kounye a, li lè pou ou konnen verite a."
            </p>
            <p>
              Mari te lonje men l pou l manyen liv la. Kou dwèt li te touche kwi a, li te santi yon chalè ki te monte nan bra l — pa yon chalè dezagreyab, men yon chalè ki te sanble tankou li te rekonèt li, tankou liv la te konnen se li ki mèt li.
            </p>
          </article>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
            <button className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium opacity-50 cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" /> Chapit anvan
            </button>
            <span className="text-sm text-muted-foreground">1 / 8</span>
            <Link
              to={`/chapter/${novelId}/c2`}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Chapit swivan <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChapterReader;
