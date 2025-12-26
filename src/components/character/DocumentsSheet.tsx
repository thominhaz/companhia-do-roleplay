import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCharacterDocuments, useMarkDocumentRead, useSignDocument, CampaignDocument } from "@/hooks/useDocuments";
import { FileText, Scroll, FileSignature, Check, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface DocumentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  letter: FileText,
  scroll: Scroll,
  contract: FileSignature,
};

const TYPE_LABELS: Record<string, string> = {
  letter: 'Carta',
  scroll: 'Pergaminho',
  contract: 'Contrato',
};

const STYLE_CLASSES: Record<string, string> = {
  parchment: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100',
  elegant: 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100',
  dark: 'bg-zinc-900 border-zinc-700 text-zinc-100',
  royal: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100',
};

export function DocumentsSheet({ open, onOpenChange, characterId, characterName }: DocumentsSheetProps) {
  const { data: deliveries, isLoading } = useCharacterDocuments(characterId);
  const markRead = useMarkDocumentRead();
  const signDocument = useSignDocument();
  
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const handleOpenDocument = (deliveryId: string, documentId: string, isRead: boolean) => {
    if (expandedDoc === documentId) {
      setExpandedDoc(null);
    } else {
      setExpandedDoc(documentId);
      if (!isRead) {
        markRead.mutate({ deliveryId, characterId });
      }
    }
  };

  const handleSign = (doc: CampaignDocument) => {
    const alreadySigned = doc.signature_data.some(s => s.character_id === characterId);
    if (alreadySigned) return;

    signDocument.mutate({
      documentId: doc.id,
      campaignId: doc.campaign_id,
      characterId,
      characterName,
      currentSignatures: doc.signature_data
    });
  };

  const unreadCount = deliveries?.filter(d => !d.read_at).length || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Meus Documentos
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} novo(s)
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : deliveries && deliveries.length > 0 ? (
            deliveries.map(delivery => {
              const doc = delivery.document as CampaignDocument | null;
              if (!doc) return null;

              const Icon = TYPE_ICONS[doc.document_type] || FileText;
              const isExpanded = expandedDoc === doc.id;
              const styleClass = STYLE_CLASSES[doc.style] || STYLE_CLASSES.parchment;
              const alreadySigned = doc.signature_data.some(s => s.character_id === characterId);

              return (
                <div key={delivery.id} className="space-y-2">
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      !delivery.read_at 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-card hover:bg-muted/50'
                    }`}
                    onClick={() => handleOpenDocument(delivery.id, doc.id, !!delivery.read_at)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                          {!delivery.read_at && (
                            <Badge variant="secondary" className="text-xs shrink-0">Novo</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {TYPE_LABELS[doc.document_type]} • Recebido em {format(new Date(delivery.delivered_at), "dd/MM", { locale: ptBR })}
                        </p>
                      </div>
                      <Eye className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={`rounded-lg border-2 p-4 ${styleClass}`}>
                      <div className="text-center mb-3">
                        <Icon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <h3 className="font-serif font-bold">{doc.title}</h3>
                      </div>
                      
                      <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                        {doc.content || 'Documento sem conteúdo.'}
                      </div>

                      {doc.requires_signature && (
                        <div className="mt-4 pt-3 border-t border-current/20">
                          <p className="text-xs font-medium mb-2">Assinaturas:</p>
                          {doc.signature_data.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {doc.signature_data.map((sig, idx) => (
                                <div key={idx} className="text-xs italic">
                                  ✒️ {sig.character_name} - {format(new Date(sig.signed_at), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {alreadySigned ? (
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <Check className="w-3 h-3" />
                              Você já assinou este documento
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSign(doc)}
                              disabled={signDocument.isPending}
                            >
                              <FileSignature className="w-4 h-4 mr-2" />
                              Assinar Documento
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Scroll className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum documento recebido ainda
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
