import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignDocuments, useDeleteDocument, CampaignDocument } from "@/hooks/useDocuments";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { FileText, Plus, Scroll, FileSignature, MoreVertical, Pencil, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentFormSheet } from "./DocumentFormSheet";
import { DocumentPreviewSheet } from "./DocumentPreviewSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkshopDocumentsProps {
  campaign: CampaignDB;
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

export function WorkshopDocuments({ campaign }: WorkshopDocumentsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<CampaignDocument | null>(null);
  const [previewDocument, setPreviewDocument] = useState<CampaignDocument | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<CampaignDocument | null>(null);

  const { data: documents, isLoading } = useCampaignDocuments(campaign.id);
  const { data: players } = useCampaignPlayers(campaign.id);
  const deleteDocumentMutation = useDeleteDocument();

  const handleEdit = (doc: CampaignDocument) => {
    setEditingDocument(doc);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (!deleteDocument) return;
    deleteDocumentMutation.mutate({
      id: deleteDocument.id,
      campaignId: campaign.id
    }, {
      onSuccess: () => setDeleteDocument(null)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Oficina de Documentos
          </h2>
          <p className="text-sm text-muted-foreground">
            Crie e entregue documentos personalizados aos jogadores
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => {
            const Icon = TYPE_ICONS[doc.document_type] || FileText;
            return (
              <div
                key={doc.id}
                className="bg-card rounded-xl border p-4 hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => setPreviewDocument(doc)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        {TYPE_LABELS[doc.document_type]}
                      </span>
                      <h3 className="font-medium text-sm line-clamp-1">{doc.title}</h3>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDocument(doc);
                      }}>
                        <Send className="w-4 h-4 mr-2" />
                        Entregar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(doc);
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDocument(doc);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {doc.content || 'Sem conteúdo'}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  {doc.requires_signature && (
                    <span className="flex items-center gap-1 text-primary">
                      <FileSignature className="w-3 h-3" />
                      {doc.signature_data.length} assinatura(s)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-8 border border-dashed border-border text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Scroll className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum documento criado</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Crie cartas, pergaminhos e contratos para entregar aos seus jogadores durante a campanha.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Documento
          </Button>
        </div>
      )}

      <DocumentFormSheet
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingDocument(null);
        }}
        campaignId={campaign.id}
        document={editingDocument}
      />

      {previewDocument && (
        <DocumentPreviewSheet
          open={!!previewDocument}
          onOpenChange={(open) => !open && setPreviewDocument(null)}
          document={previewDocument}
          players={players}
        />
      )}

      <AlertDialog open={!!deleteDocument} onOpenChange={(open) => !open && setDeleteDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento "{deleteDocument?.title}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
