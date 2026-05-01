import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Search, BookOpen, Coins, PenTool, Shield, User, Smartphone, MessageCircle, Instagram } from "lucide-react";

type QA = { q: string; a: React.ReactNode };
type Category = { id: string; label: string; icon: any; items: QA[] };

const categories: Category[] = [
  {
    id: "kont",
    label: "Kont & Koneksyon",
    icon: User,
    items: [
      { q: "Kijan pou m kreye yon kont sou ZEMI?", a: <p>Klike sou <strong>"Enskri"</strong> nan tèt paj la, antre imèl ou ak yon modpas solid. W ap resevwa yon imèl konfimasyon — klike sou lyen an pou aktive kont ou.</p> },
      { q: "Mwen pa resevwa imèl konfimasyon an, kisa pou m fè?", a: <p>Verifye dosye <strong>spam/jonk</strong> ou. Si w pa wè l, atann 5 minit epi mande yon nouvo imèl. Si pwoblèm nan kontinye, kontakte nou sou WhatsApp.</p> },
      { q: "Mwen bliye modpas mwen", a: <p>Sou paj koneksyon an, klike <strong>"Bliye modpas?"</strong>. Antre imèl ou epi swiv enstriksyon ki nan imèl la.</p> },
      { q: "Kijan pou m chanje foto pwofil oswa non m?", a: <p>Ale sou paj <strong>Pwofil</strong> mwen, klike sou icon modifikasyon an, telechaje yon nouvo foto (.jpg, .png, oswa .webp) oswa chanje non w.</p> },
      { q: "Èske m ka efase kont mwen?", a: <p>Wi. Kontakte ekip nou an sou WhatsApp pou yon demand efasman. N ap trete l nan 7 jou ouvrab.</p> },
    ],
  },
  {
    id: "lekti",
    label: "Lekti",
    icon: BookOpen,
    items: [
      { q: "Èske m ka li gratis sou ZEMI?", a: <p>Wi! Anpil chapit gratis. Sèlman chapit <strong>premium</strong> yo mande pyès (coins) pou deblòke yo.</p> },
      { q: "Èske ZEMI sove pwogrè lekti m?", a: <p>Wi, otomatikman. Lè w retounen, w ap wè seksyon <strong>"Kontinye Lekti"</strong> sou paj akèy la ak pozisyon eg eg ou te kanpe a.</p> },
      { q: "Kijan pou m chanje gwosè tèks oswa tèm lekti a?", a: <p>Nan paj lekti yon chapit, klike sou icon paramèt yo. Ou ka chwazi tèm <strong>klè, fonse, oswa sepia</strong> epi ajiste gwosè polis la.</p> },
      { q: "Èske m ka li san entènèt?", a: <p>Pa kounye a. Lekti òflin se yon fonksyonalite k ap vini nan vèsyon mobil natif la.</p> },
      { q: "Kijan favori yo mache?", a: <p>Klike sou kè a sou nenpòt roman pou ajoute l nan favori w. Aksè rapid via paj <Link to="/favorites" className="text-primary underline">Favori</Link>.</p> },
    ],
  },
  {
    id: "pyès",
    label: "Pyès & Peman",
    icon: Coins,
    items: [
      { q: "Kisa pyès yo ye?", a: <p>Pyès (coins) se monè vityèl ZEMI a. Yo pèmèt ou deblòke chapit premium ki disponib sèlman pou lektè ki sipòte ekriven yo.</p> },
      { q: "Kijan pou m achte pyès?", a: <p>Ale nan pwofil ou, klike <strong>"Achte pyès"</strong>, chwazi yon pak, epi swiv enstriksyon peman an (MonCash, kat bankè, eltr.).</p> },
      { q: "Èske gen kòd kado?", a: <p>Wi! Si w gen yon kòd, antre l nan paj pwofil sou seksyon <strong>"Itilize yon kòd"</strong>. Pyès yo ap parèt imedyatman.</p> },
      { q: "Èske pyès yo ekspire?", a: <p>Non. Yon fwa ou achte yo, pyès yo rete nan kont ou jiskaske w itilize yo.</p> },
      { q: "Èske m ka mande ranbousman?", a: <p>Pyès ki te itilize pou deblòke chapit pa ranbousab. Pou pwoblèm tranzaksyon, kontakte nou nan 48 èdtan.</p> },
    ],
  },
  {
    id: "ekriven",
    label: "Ekriven & Piblikasyon",
    icon: PenTool,
    items: [
      { q: "Kijan pou m vin ekriven sou ZEMI?", a: <p>Soumèt yon <strong>aplikasyon ekriven</strong> nan paj pwofil ou. Ekip admin nou an verifye chak aplikasyon <strong>manyèlman</strong> pou asire kalite.</p> },
      { q: "Konbyen tan verifikasyon an pran?", a: <p>Anjeneral 3 a 7 jou ouvrab. W ap resevwa yon notifikasyon lè desizyon an pran.</p> },
      { q: "Kijan pou m piblike yon roman?", a: <p>Apre w aktive kòm ekriven, ale nan <strong>Tablo Bòd Ekriven</strong>, kreye yon nouvo roman, ajoute kouvèti, deskripsyon, kategori, epi kòmanse ajoute chapit.</p> },
      { q: "Èske ekriven yo touche?", a: <p>Wi. Ekriven touche yon pousantaj sou chak chapit premium ki deblòke. Estatistik yo disponib nan tablo bòd ou.</p> },
      { q: "Èske m ka enpòte yon manuscript PDF?", a: <p>Wi. Nan editè chapit la, itilize fonksyon enpòtasyon PDF. Sistèm nan ap konvèti tèks la otomatikman.</p> },
      { q: "Èske kontni m yo pwoteje?", a: <p>Wi. Nou itilize pwoteksyon kont kopi, watermark, ak aksè sekirize via RPC pou chapit premium.</p> },
    ],
  },
  {
    id: "sekirite",
    label: "Sekirite & Konfidansyalite",
    icon: Shield,
    items: [
      { q: "Èske done m yo an sekirite?", a: <p>Wi. Nou itilize HTTPS, modpas chiffre, Row-Level Security, ak sanitasyon kontni. Wè <Link to="/privacy" className="text-primary underline">Politik Konfidansyalite</Link> nou.</p> },
      { q: "Èske ZEMI vann done m?", a: <p><strong>Janm.</strong> Nou pa vann ni lokasyon done pèsonèl ou.</p> },
      { q: "Kisa pou m fè si m wè kontni ki pa apwopriye?", a: <p>Itilize bouton <strong>"Rapòte"</strong> nan kòmantè oswa chapit la. Ekip moderasyon nou an ap revize l rapidman.</p> },
      { q: "Kijan m ka pwoteje kont mwen?", a: <ul className="list-disc pl-5 space-y-1"><li>Itilize yon modpas solid (10+ karaktè, melanj).</li><li>Pa pataje koneksyon w.</li><li>Dekonekte sou aparèy piblik.</li></ul> },
    ],
  },
  {
    id: "teknik",
    label: "Pwoblèm Teknik",
    icon: Smartphone,
    items: [
      { q: "Aplikasyon an lan/krash, kisa pou m fè?", a: <ol className="list-decimal pl-5 space-y-1"><li>Aktyalize paj la (F5 oswa pull-to-refresh).</li><li>Efase cache navigatè a.</li><li>Eseye yon lòt navigatè.</li><li>Si l pèsiste, kontakte sipò.</li></ol> },
      { q: "Èske ZEMI mache sou tout aparèy?", a: <p>Wi. Sit la responsive sou òdinatè, tablèt, ak telefòn. Yon vèsyon Android/iOS ap vini.</p> },
      { q: "Foto m yo pa telechaje", a: <p>Asire w fichye a se .jpg, .png, oswa .webp epi mwens pase 5 MB. Verifye koneksyon entènèt ou.</p> },
      { q: "Notifikasyon yo pa parèt", a: <p>Asire w ou bay otorizasyon notifikasyon nan navigatè a. Ou ka aktive yo nan paramèt sit la.</p> },
    ],
  },
];

const FAQ = () => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "FAQ — Kesyon yo Poze Souvan | ZEMI";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Repons pou tout kesyon w sou ZEMI: kont, lekti, pyès, ekriven, sekirite ak plis.");
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => it.q.toLowerCase().includes(q) || (typeof it.a === "string" && (it.a as string).toLowerCase().includes(q))
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [query]);

  const totalCount = categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-10 md:py-16 max-w-4xl">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-brand mb-4 shadow-lg shadow-primary/30">
            <HelpCircle className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-serif text-foreground mb-3">Kesyon yo Poze Souvan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {totalCount} repons pou ede w pwofite eksperyans ZEMI w okonplè.
          </p>
        </header>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chache yon kesyon..."
            className="pl-12 h-12 text-base"
          />
        </div>

        {!query && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((c) => (
              <a key={c.id} href={`#cat-${c.id}`}>
                <Badge variant="secondary" className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  <c.icon className="h-3.5 w-3.5 mr-1.5" />
                  {c.label}
                </Badge>
              </a>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Okenn rezilta pa jwenn pou "<strong>{query}</strong>".</p>
            <p className="text-sm mt-2">Eseye yon lòt mo oswa kontakte nou dirèkteman.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {filtered.map((cat) => {
              const Icon = cat.icon;
              return (
                <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-black font-serif text-foreground mb-4">
                    <span className="p-2 rounded-lg gradient-brand text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    {cat.label}
                  </h2>
                  <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-4">
                    {cat.items.map((it, i) => (
                      <AccordionItem key={i} value={`${cat.id}-${i}`} className="border-b last:border-b-0">
                        <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                          {it.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {it.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })}
          </div>
        )}

        <section className="mt-16 p-8 rounded-2xl gradient-brand text-primary-foreground text-center shadow-xl shadow-primary/20">
          <h2 className="text-2xl font-black font-serif mb-2">Ou pa jwenn repons ou?</h2>
          <p className="mb-6 opacity-90">Ekip nou an la pou ede w. Kontakte nou dirèkteman:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://wa.me/50943003284?text=bonjour%20l%27equipe%20de%20zemi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-background text-foreground font-semibold hover:scale-105 transition-transform"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
            <a
              href="https://www.instagram.com/zemi_chak_semen?igsh=ajZmYWlycTFrdGkx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-background text-foreground font-semibold hover:scale-105 transition-transform"
            >
              <Instagram className="h-5 w-5" />
              Instagram
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default FAQ;
