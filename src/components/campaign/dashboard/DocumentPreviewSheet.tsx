import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CampaignDocument, useDocumentDeliveries, useDeliverDocument } from "@/hooks/useDocuments";
import { Scroll, FileText, FileSignature, Send, Check, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface DocumentPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: CampaignDocument;
  players?: { character_id: string | null; character?: { id: string; name: string } | null }[];
}

const STYLE_CLASSES: Record<string, string> = {
  parchment: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100',
  elegant: 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100',
  dark: 'bg-zinc-900 border-zinc-700 text-zinc-100',
  royal: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100',
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  letter: FileText,
  scroll: Scroll,
  contract: FileSignature,
};

export function DocumentPreviewSheet({ open, onOpenChange, document, players }: DocumentPreviewSheetProps) {
  const [showDelivery, setShowDelivery] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  const { data: deliveries } = useDocumentDeliveries(document.id);
  const deliverDocument = useDeliverDocument();

  const Icon = TYPE_ICONS[document.document_type] || FileText;
  const styleClass = STYLE_CLASSES[document.style] || STYLE_CLASSES.parchment;

  const deliveredCharacterIds = deliveries?.map(d => d.character_id) || [];
  const availablePlayers = players?.filter(p => 
    p.character_id && !deliveredCharacterIds.includes(p.character_id)
  ) || [];

  const handleDeliver = () => {
    if (selectedPlayers.length === 0) return;
    
    deliverDocument.mutate({
      documentId: document.id,
      characterIds: selectedPlayers
    }, {
      onSuccess: () => {
        setSelectedPlayers([]);
        setShowDelivery(false);
      }
    });
  };

  const togglePlayer = (characterId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(characterId) 
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {document.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Document Preview */}
          <div className={`rounded-lg border-2 p-6 ${styleClass}`}>
            <div className="text-center mb-4">
              <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <h3 className="text-lg font-serif font-bold">{document.title}</h3>
            </div>
            
            <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
              {document.content || 'Documento sem conteúdo.'}
            </div>

            {document.requires_signature && (
              <div className="mt-6 pt-4 border-t border-current/20">
                <p className="text-xs font-medium mb-2">Assinaturas:</p>
                {document.signature_data.length > 0 ? (
                  <div className="space-y-1">
                    {document.signature_data.map((sig, idx) => (
                      <div key={idx} className="text-xs italic">
                        ✒️ {sig.character_name} - {format(new Date(sig.signed_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic opacity-60">Aguardando assinaturas...</p>
                )}
              </div>
            )}
          </div>

          {/* Delivery Status */}
          {deliveries && deliveries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Entregue para:
              </h4>
              <div className="space-y-1">
                {deliveries.map(delivery => (
                  <div 
                    key={delivery.id} 
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                  >
                    <span>{(delivery.characters as { name: string })?.name}</span>
                    {delivery.read_at ? (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Lido
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Não lido</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Section */}
          {players && (
            <>
              {!showDelivery ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowDelivery(true)}
                  disabled={availablePlayers.length === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {availablePlayers.length > 0 
                    ? 'Entregar a Jogadores' 
                    : 'Todos já receberam'}
                </Button>
              ) : (
                <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                  <h4 className="text-sm font-medium">Selecione os jogadores:</h4>
                  <div className="space-y-2">
                    {availablePlayers.map(player => (
                      <label
                        key={player.character_id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedPlayers.includes(player.character_id!)}
                          onCheckedChange={() => togglePlayer(player.character_id!)}
                        />
                        <span className="text-sm">{player.character?.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setShowDelivery(false);
                        setSelectedPlayers([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleDeliver}
                      disabled={selectedPlayers.length === 0 || deliverDocument.isPending}
                    >
                      Entregar ({selectedPlayers.length})
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Criado em {format(new Date(document.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
