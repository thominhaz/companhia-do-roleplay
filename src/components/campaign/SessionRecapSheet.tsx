import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Loader2, Calendar, Clock, MapPin, 
  Sparkles, Coins, Star, X, Plus, Check, BookOpen 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SessionDB, useUpdateSession } from "@/hooks/useSessions";
import { cn } from "@/lib/utils";

interface SessionRecapSheetProps {
  session: SessionDB | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMaster: boolean;
}

export function SessionRecapSheet({ session, open, onOpenChange, isMaster }: SessionRecapSheetProps) {
  const [summary, setSummary] = useState("");
  const [recap, setRecap] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");
  const [xpAwarded, setXpAwarded] = useState(0);
  const [goldAwarded, setGoldAwarded] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  const updateSession = useUpdateSession();

  // Load session data when sheet opens
  useEffect(() => {
    if (session) {
      setSummary(session.summary || "");
      setRecap(session.recap || "");
      setHighlights(session.highlights || []);
      setXpAwarded(session.xp_awarded || 0);
      setGoldAwarded(session.gold_awarded || 0);
      setIsEditing(!session.summary && !session.recap && isMaster);
    }
  }, [session, isMaster]);

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!session) return;

    try {
      await updateSession.mutateAsync({
        id: session.id,
        summary: summary.trim() || null,
        recap: recap.trim() || null,
        highlights: highlights.length > 0 ? highlights : null,
        xp_awarded: xpAwarded,
        gold_awarded: goldAwarded,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!session) return null;

  const hasContent = summary || recap || (highlights && highlights.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="text-left mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl">{session.title}</SheetTitle>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(session.scheduled_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(session.scheduled_at), "HH:mm", { locale: ptBR })}
                </div>
                {session.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">{session.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-200px)] pr-4">
          {isEditing ? (
            <div className="space-y-5">
              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Resumo Breve
                </Label>
                <Textarea
                  id="summary"
                  placeholder="Ex: O grupo derrotou o dragão e resgatou a princesa..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="bg-muted/50 border-0 min-h-[80px]"
                />
              </div>

              {/* Recap */}
              <div className="space-y-2">
                <Label htmlFor="recap" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Recapitulação Detalhada
                </Label>
                <Textarea
                  id="recap"
                  placeholder="Narrativa detalhada dos eventos da sessão..."
                  value={recap}
                  onChange={(e) => setRecap(e.target.value)}
                  className="bg-muted/50 border-0 min-h-[150px]"
                />
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Momentos Marcantes
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Crítico natural do Bardo!"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHighlight()}
                    className="bg-muted/50 border-0 flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleAddHighlight}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {highlights.map((h, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 py-1">
                        <Star className="w-3 h-3 text-amber-500" />
                        {h}
                        <button 
                          onClick={() => handleRemoveHighlight(i)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Rewards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xp" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    XP Concedido
                  </Label>
                  <Input
                    id="xp"
                    type="number"
                    min={0}
                    value={xpAwarded}
                    onChange={(e) => setXpAwarded(parseInt(e.target.value) || 0)}
                    className="bg-muted/50 border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gold" className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    Ouro Concedido
                  </Label>
                  <Input
                    id="gold"
                    type="number"
                    min={0}
                    value={goldAwarded}
                    onChange={(e) => setGoldAwarded(parseInt(e.target.value) || 0)}
                    className="bg-muted/50 border-0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {!hasContent ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">Nenhum resumo registrado</p>
                  {isMaster && (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      Adicionar Resumo
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Summary Display */}
                  {summary && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Resumo
                      </h3>
                      <p className="text-foreground leading-relaxed">{summary}</p>
                    </div>
                  )}

                  {/* Recap Display */}
                  {recap && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Recapitulação
                      </h3>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{recap}</p>
                      </div>
                    </div>
                  )}

                  {/* Highlights Display */}
                  {highlights && highlights.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Momentos Marcantes
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {highlights.map((h, i) => (
                          <Badge key={i} variant="secondary" className="gap-1 py-1.5">
                            <Star className="w-3 h-3 text-amber-500" />
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rewards Display */}
                  {(xpAwarded > 0 || goldAwarded > 0) && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        {xpAwarded > 0 && (
                          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <p className="text-xs text-muted-foreground mb-1">XP Concedido</p>
                            <p className="text-2xl font-bold text-purple-400">{xpAwarded}</p>
                          </div>
                        )}
                        {goldAwarded > 0 && (
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Ouro Concedido</p>
                            <p className="text-2xl font-bold text-amber-400">{goldAwarded} PO</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="pt-4 flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={updateSession.isPending}
                className="flex-1"
              >
                {updateSession.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Salvar Resumo
                  </>
                )}
              </Button>
            </>
          ) : (
            hasContent && isMaster && (
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline"
                className="w-full"
              >
                Editar Resumo
              </Button>
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}