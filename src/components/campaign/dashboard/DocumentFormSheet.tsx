import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateDocument, useUpdateDocument, CampaignDocument } from "@/hooks/useDocuments";
import { Scroll, FileText, FileSignature } from "lucide-react";

interface DocumentFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  document?: CampaignDocument | null;
}

const DOCUMENT_TYPES = [
  { value: 'letter', label: 'Carta', icon: FileText },
  { value: 'scroll', label: 'Pergaminho', icon: Scroll },
  { value: 'contract', label: 'Contrato', icon: FileSignature },
];

const DOCUMENT_STYLES = [
  { value: 'parchment', label: 'Pergaminho Clássico' },
  { value: 'elegant', label: 'Elegante' },
  { value: 'dark', label: 'Sombrio' },
  { value: 'royal', label: 'Real' },
];

export function DocumentFormSheet({ open, onOpenChange, campaignId, document }: DocumentFormSheetProps) {
  const [title, setTitle] = useState(document?.title || '');
  const [content, setContent] = useState(document?.content || '');
  const [documentType, setDocumentType] = useState(document?.document_type || 'letter');
  const [style, setStyle] = useState(document?.style || 'parchment');
  const [requiresSignature, setRequiresSignature] = useState(document?.requires_signature || false);

  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();

  const isEditing = !!document;

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (isEditing) {
      updateDocument.mutate({
        id: document.id,
        campaignId,
        title,
        content,
        document_type: documentType,
        style,
        requires_signature: requiresSignature
      }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createDocument.mutate({
        campaign_id: campaignId,
        title,
        content,
        document_type: documentType,
        style,
        requires_signature: requiresSignature
      }, {
        onSuccess: () => {
          onOpenChange(false);
          setTitle('');
          setContent('');
          setDocumentType('letter');
          setStyle('parchment');
          setRequiresSignature(false);
        }
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Documento' : 'Novo Documento'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do documento..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estilo Visual</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_STYLES.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o conteúdo do documento..."
              className="min-h-[200px]"
            />
          </div>

          {documentType === 'contract' && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-sm">Requer Assinatura</p>
                <p className="text-xs text-muted-foreground">
                  Jogadores poderão assinar este contrato
                </p>
              </div>
              <Switch
                checked={requiresSignature}
                onCheckedChange={setRequiresSignature}
              />
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!title.trim() || createDocument.isPending || updateDocument.isPending}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Documento'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
