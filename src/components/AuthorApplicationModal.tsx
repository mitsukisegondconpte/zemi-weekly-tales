import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSubmitApplication } from "@/hooks/useAuthor";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthorApplicationModal = ({ open, onOpenChange }: Props) => {
  const [bio, setBio] = useState("");
  const [motivation, setMotivation] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [acceptTos, setAcceptTos] = useState(false);
  const submit = useSubmitApplication();

  const handleSubmit = async () => {
    if (!acceptTos) {
      toast.error("Ou dwe aksepte kondisyon yo");
      return;
    }
    if (bio.trim().length < 10) {
      toast.error("Bio dwe gen omwen 10 karaktè");
      return;
    }
    if (bio.length > 200) {
      toast.error("Bio twò long (max 200)");
      return;
    }
    if (motivation.trim().length < 20) {
      toast.error("Motivasyon dwe gen omwen 20 karaktè");
      return;
    }
    try {
      await submit.mutateAsync({
        bio: bio.trim(),
        motivation: motivation.trim(),
        portfolio_url: portfolio.trim() || undefined,
      });
      toast.success("Aplikasyon ou voye! N ap reponn ou byento.");
      setBio("");
      setMotivation("");
      setPortfolio("");
      setAcceptTos(false);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("Already")) toast.error("Ou deja yon otè!");
      else if (msg.includes("pending")) toast.error("Aplikasyon w deja ap tann");
      else toast.error("Yon erè rive. Eseye ankò.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full gradient-brand flex items-center justify-center mb-2 animate-pop-in">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center font-serif text-xl">Devni Ekriven sou Zemi</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Pataje istwa w yo ak kominote a. Admin ap revize aplikasyon w lan byento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-sm font-semibold">
              Bio kout <span className="text-muted-foreground font-normal">({bio.length}/200)</span>
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Di nou yon ti kras sou ou..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motivation" className="text-sm font-semibold">
              Poukisa w vle ekri sou Zemi?
            </Label>
            <Textarea
              id="motivation"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Ki tip istwa w vle pataje..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="portfolio" className="text-sm font-semibold">
              Lyen pòtfolyo <span className="text-muted-foreground font-normal">(opsyonèl)</span>
            </Label>
            <Input
              id="portfolio"
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
            <Checkbox
              checked={acceptTos}
              onCheckedChange={(c) => setAcceptTos(!!c)}
              className="mt-0.5"
            />
            <span className="text-xs text-muted-foreground leading-snug">
              M aksepte kondisyon yo: Tout chapit m yo ap pase nan moderasyon admin avan yo pibliye.
              M angaje m respekte règ kominote a.
            </span>
          </label>

          <Button
            onClick={handleSubmit}
            disabled={submit.isPending || !acceptTos}
            className="w-full gradient-brand text-primary-foreground btn-tactile ripple"
          >
            {submit.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ap voye...
              </>
            ) : (
              "Voye Aplikasyon"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthorApplicationModal;
