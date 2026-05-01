import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Cookie, UserCheck, Mail, AlertTriangle, Globe, FileText, Baby, RefreshCw } from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "1. Entwodiksyon",
    body: (
      <>
        <p>
          Byenveni sou <strong>ZEMI</strong> ("nou", "nou menm", "platfòm la"). Konfidansyalite w se yon priyorite pou nou.
          Politik sa a eksplike ki done nou kolekte, kijan nou itilize yo, ak ki dwa ou genyen sou yo.
        </p>
        <p className="mt-2">
          Lè w itilize ZEMI (sit entènèt, aplikasyon mobil, oswa nenpòt sèvis ki lye), w aksepte pratik ki dekri nan dokiman sa a.
          Si w pa dakò, tanpri pa itilize sèvis nou yo.
        </p>
      </>
    ),
  },
  {
    icon: Database,
    title: "2. Done nou kolekte",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Enfòmasyon kont:</strong> imèl, non itilizatè, modpas (chiffre/hashed), foto pwofil.</li>
        <li><strong>Aktivite lekti:</strong> roman ou li, chapit ou ouvri, pwogrè (scroll position), favori, lis lekti.</li>
        <li><strong>Tranzaksyon:</strong> achte pyès (coins), kòd kado itilize, chapit deblòke, istwa peman (San enfòmasyon kat bankè ki konplè).</li>
        <li><strong>Kontni ou bay:</strong> kòmantè, evalyasyon, mesaj, manuscript (pou ekriven), aplikasyon ekriven.</li>
        <li><strong>Done teknik:</strong> adrès IP, tip aparèy, navigatè, sistèm operasyon, paj ou vizite, dat/lè.</li>
        <li><strong>Cookies & estokaj lokal:</strong> sesyon, preferans (tèm, gwosè polis), token otantifikasyon.</li>
      </ul>
    ),
  },
  {
    icon: Eye,
    title: "3. Kijan nou itilize done w",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Bay ak amelyore sèvis lekti, otantifikasyon, ak rekòmandasyon.</li>
        <li>Trete peman ak deblokaj kontni premium.</li>
        <li>Voye notifikasyon (nouvo chapit, repons kòmantè, mesaj enpòtan).</li>
        <li>Modere kontni, anpeche fwòd, espam, oswa abi.</li>
        <li>Analize itilizasyon pou amelyore eksperyans (estatistik anonim).</li>
        <li>Respekte obligasyon legal yo.</li>
      </ul>
    ),
  },
  {
    icon: UserCheck,
    title: "4. Pataj enfòmasyon",
    body: (
      <>
        <p>Nou <strong>pa janm vann</strong> done pèsonèl ou. Nou pataje sèlman lè:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Founisè sèvis:</strong> Supabase (baz done & otantifikasyon), founisè peman (pou tranzaksyon).</li>
          <li><strong>Obligasyon legal:</strong> si lalwa egzije sa (jij, otorite konpetan).</li>
          <li><strong>Pwoteksyon:</strong> pou anpeche fwòd oswa pwoteje sekirite itilizatè yo.</li>
          <li><strong>Konsantman ou:</strong> nan lòt ka, n ap mande pèmisyon w klèman.</li>
        </ul>
      </>
    ),
  },
  {
    icon: Lock,
    title: "5. Sekirite",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Modpas chiffre ak <code>bcrypt</code>; nou pa janm wè modpas an klè.</li>
        <li>Koneksyon HTTPS chiffre pou tout trafik.</li>
        <li>Row-Level Security (RLS) sou tout tab sansib nan baz done a.</li>
        <li>Sanitasyon HTML (DOMPurify) kont atak XSS.</li>
        <li>Limit sou inifòm fichye (.jpg, .png, .webp) pou anpeche kontni malveyan.</li>
        <li>Trigger baz done pou pwoteje balans pyès kont manipilasyon.</li>
      </ul>
    ),
  },
  {
    icon: Cookie,
    title: "6. Cookies & teknoloji similè",
    body: (
      <>
        <p>Nou itilize cookies ak <code>localStorage</code> pou:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Kenbe w konekte (sesyon).</li>
          <li>Sonje preferans ou (tèm fonse/klè, gwosè tèks).</li>
          <li>Mezi pèfòmans ak deteksyon erè.</li>
        </ul>
        <p className="mt-2">Ou ka efase yo nan paramèt navigatè w nenpòt lè (sa ka dekonekte w).</p>
      </>
    ),
  },
  {
    icon: Shield,
    title: "7. Dwa ou yo",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Aksè:</strong> mande yon kopi done w yo.</li>
        <li><strong>Korije:</strong> mete done ou ajou nenpòt lè nan pwofil ou.</li>
        <li><strong>Efase:</strong> mande efasman kont ou (sèten done legal ka konsève).</li>
        <li><strong>Pòtabilite:</strong> mande done w nan fòma estanda (JSON).</li>
        <li><strong>Opozisyon:</strong> refize sèten itilizasyon (pa egzanp marketing).</li>
      </ul>
    ),
  },
  {
    icon: Baby,
    title: "8. Pwoteksyon timoun",
    body: (
      <p>
        ZEMI pa fèt pou timoun ki gen mwens pase <strong>13 lane</strong>. Sèten kontni ka gen restriksyon laj.
        Si w aprann yon timoun anrejistre san konsantman paran, kontakte nou pou nou ka efase kont la.
      </p>
    ),
  },
  {
    icon: Globe,
    title: "9. Transfè entènasyonal",
    body: (
      <p>
        Done w yo ka stoke sou sèvè ki sitiye andeyò Ayiti (founisè enfrastrikti). Nou asire pwoteksyon
        ekivalan ak sa ki egzije pa lalwa ak meyè pratik entènasyonal.
      </p>
    ),
  },
  {
    icon: RefreshCw,
    title: "10. Konsèvasyon done",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Done kont: kenbe pandan kont la aktif.</li>
        <li>Tranzaksyon: kenbe pou rezon legal/kontablite (jiska 5 lane).</li>
        <li>Lòg teknik: kenbe maks 12 mwa.</li>
      </ul>
    ),
  },
  {
    icon: AlertTriangle,
    title: "11. Chanjman nan politik la",
    body: (
      <p>
        Nou ka mete politik sa a ajou. N ap enfòme w sou chanjman enpòtan yo nan aplikasyon an oswa pa imèl.
        Dat dènye mizajou parèt anba paj la.
      </p>
    ),
  },
  {
    icon: Mail,
    title: "12. Kontakte nou",
    body: (
      <>
        <p>Pou nenpòt kesyon sou konfidansyalite oswa egzèsis dwa w yo:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>WhatsApp: <a href="https://wa.me/50943003284" className="text-primary underline">+509 4300-3284</a></li>
          <li>Instagram: <a href="https://www.instagram.com/zemi_chak_semen" className="text-primary underline" target="_blank" rel="noopener noreferrer">@zemi_chak_semen</a></li>
        </ul>
      </>
    ),
  },
];

const Privacy = () => {
  useEffect(() => {
    document.title = "Politik Konfidansyalite | ZEMI";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Politik konfidansyalite ZEMI: kijan nou kolekte, itilize ak pwoteje done w yo.");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-10 md:py-16 max-w-4xl">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-brand mb-4 shadow-lg shadow-primary/30">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-serif text-foreground mb-3">Politik Konfidansyalite</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transparans total sou kijan ZEMI trete enfòmasyon w yo. Li dokiman sa a ak atansyon.
          </p>
          <p className="text-xs text-muted-foreground mt-3">Dènye mizajou: 1ye Me 2026</p>
        </header>

        <nav className="mb-10 p-4 rounded-xl border border-border bg-card/50">
          <p className="text-sm font-semibold mb-2 text-foreground">Tab matyè:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {sections.map((s, i) => (
              <li key={i}>
                <a href={`#section-${i}`} className="text-muted-foreground hover:text-primary transition-colors">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} id={`section-${i}`} className="scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <span className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    {s.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground leading-relaxed">{s.body}</CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link to="/faq" className="text-primary hover:underline font-semibold">
            Gen kesyon? Konsilte FAQ nou →
          </Link>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Privacy;
