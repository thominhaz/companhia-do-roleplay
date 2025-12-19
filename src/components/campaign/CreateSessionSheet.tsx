import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateSession } from "@/hooks/useSessions";
import { Loader2, Calendar } from "lucide-react";

interface CreateSessionSheetProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSessionSheet({ campaignId, open, onOpenChange }: CreateSessionSheetProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  
  const createSession = useCreateSession();

  const handleCreate = async () => {
    if (!title.trim() || !scheduledAt) return;
    
    try {
      await createSession.mutateAsync({
        campaign_id: campaignId,
        title: title.trim(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setTitle("");
      setScheduledAt("");
      setLocation("");
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Get current datetime for min value
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl">
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Agendar Sessão</SheetTitle>
              <p className="text-sm text-muted-foreground">Marque o próximo encontro</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Sessão 1 - O Início da Jornada"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted/50 border-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime">Data e Hora *</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={minDateTime}
              className="bg-muted/50 border-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local / Link</Label>
            <Input
              id="location"
              placeholder="Ex: Discord, Roll20, Casa do João..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-muted/50 border-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Anotações sobre a sessão..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-muted/50 border-0 min-h-[80px]"
            />
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={!title.trim() || !scheduledAt || createSession.isPending}
            className="w-full h-12 text-base font-semibold"
          >
            {createSession.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Agendar Sessão"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
