import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useChapter, useChapters } from "@/hooks/useNovels";

const ChapterReader = () => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const { data: chapter, isLoading } = useChapter(chapterId);
  const { data: allChapters = [] } = useChapters(novelId);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Chajman...</p></div>;
  if (!chapter) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Chapit pa jwenn</p></div>;

  const currentIndex = allChapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container max-w-3xl py-8">
          <Link to={`/novel/${novelId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
            <ChevronLeft className="h-4 w-4" /> Retounen nan novèl la
          </Link>

          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Chapit {chapter.chapter_number}</span>
            <h1 className="text-3xl font-black font-serif text-foreground mt-1">{chapter.title}</h1>
          </div>

          <article className="prose prose-lg max-w-none text-foreground leading-relaxed space-y-4">
            {chapter.content.split("\n").map((paragraph, i) => (
              paragraph.trim() ? <p key={i}>{paragraph}</p> : null
            ))}
          </article>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
            {prevChapter ? (
              <Link to={`/chapter/${novelId}/${prevChapter.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80">
                <ChevronLeft className="h-4 w-4" /> Chapit anvan
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium opacity-50 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" /> Chapit anvan
              </span>
            )}
            <span className="text-sm text-muted-foreground">{chapter.chapter_number} / {allChapters.length}</span>
            {nextChapter ? (
              <Link to={`/chapter/${novelId}/${nextChapter.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                Chapit swivan <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-50 cursor-not-allowed">
                Chapit swivan <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChapterReader;
