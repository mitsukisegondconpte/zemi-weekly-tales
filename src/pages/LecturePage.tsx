import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import NovelCard from "@/components/NovelCard";
import { BookOpen } from "lucide-react";

const MOCK_READING = [
  { id: "1", title: "Zetwal Lannwit", author: "Marie-Claire Joseph", description: "Yon istwa damou ak mistè nan mitan Pòtoprens lannwit.", chapters: 24, rating: 4.8, genre: "Romantik" },
  { id: "3", title: "Kòd Ansyen", author: "Sophia Belmont", description: "Yon avanti epik pou dekouvri sekrè ansyen yo.", chapters: 32, rating: 4.9, genre: "Avanti" },
];

const LecturePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-black font-serif text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Lekti Mwen
        </h1>
        <p className="text-muted-foreground text-sm mb-6">Novèl ou ap li kounye a</p>

        {MOCK_READING.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {MOCK_READING.map((novel) => (
              <NovelCard key={novel.id} {...novel} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Ou poko kòmanse li okenn novèl.</p>
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default LecturePage;
