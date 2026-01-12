import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateDocument, useUpdateDocument, CampaignDocument } from "@/hooks/useDocuments";
import { Scroll, FileText, FileSignature, BookOpen, MapPin, Crown, Feather, Image } from "lucide-react";

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
  { value: 'book', label: 'Livro / Diário', icon: BookOpen },
  { value: 'map', label: 'Mapa / Nota de Localização', icon: MapPin },
  { value: 'decree', label: 'Decreto Real', icon: Crown },
  { value: 'missive', label: 'Missiva Secreta', icon: Feather },
];

const DOCUMENT_STYLES = [
  { value: 'parchment', label: 'Pergaminho Clássico' },
  { value: 'elegant', label: 'Elegante' },
  { value: 'dark', label: 'Sombrio' },
  { value: 'royal', label: 'Real / Nobre' },
  { value: 'aged', label: 'Envelhecido' },
  { value: 'arcane', label: 'Arcano / Místico' },
];

const WATERMARK_TYPES = [
  { value: 'none', label: 'Sem marca d\'água' },
  { value: 'signature', label: 'Assinatura / Texto' },
  { value: 'image', label: 'Imagem (URL)' },
];

export function DocumentFormSheet({ open, onOpenChange, campaignId, document }: DocumentFormSheetProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [documentType, setDocumentType] = useState('letter');
  const [style, setStyle] = useState('parchment');
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [watermarkType, setWatermarkType] = useState('none');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkImageUrl, setWatermarkImageUrl] = useState('');

  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();

  const isEditing = !!document;

  // Reset form when document changes
  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setContent(document.content || '');
      setDocumentType(document.document_type || 'letter');
      setStyle(document.style || 'parchment');
      setRequiresSignature(document.requires_signature || false);
      setWatermarkType(document.watermark_type || 'none');
      setWatermarkText(document.watermark_text || '');
      setWatermarkImageUrl(document.watermark_image_url || '');
    } else {
      setTitle('');
      setContent('');
      setDocumentType('letter');
      setStyle('parchment');
      setRequiresSignature(false);
      setWatermarkType('none');
      setWatermarkText('');
      setWatermarkImageUrl('');
    }
  }, [document, open]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const documentData = {
      title,
      content,
      document_type: documentType,
      style,
      requires_signature: requiresSignature,
      watermark_type: watermarkType === 'none' ? null : watermarkType,
      watermark_text: watermarkType === 'signature' ? watermarkText : null,
      watermark_image_url: watermarkType === 'image' ? watermarkImageUrl : null,
    };

    if (isEditing) {
      updateDocument.mutate({
        id: document.id,
        campaignId,
        ...documentData
      }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createDocument.mutate({
        campaign_id: campaignId,
        ...documentData
      }, {
        onSuccess: () => {
          onOpenChange(false);
          setTitle('');
          setContent('');
          setDocumentType('letter');
          setStyle('parchment');
          setRequiresSignature(false);
          setWatermarkType('none');
          setWatermarkText('');
          setWatermarkImageUrl('');
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
              className="min-h-[200px] font-serif"
            />
          </div>

          {/* Watermark Section */}
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              <Label className="text-sm font-medium">Marca D'água</Label>
            </div>
            
            <Select value={watermarkType} onValueChange={setWatermarkType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WATERMARK_TYPES.map(w => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {watermarkType === 'signature' && (
              <Input
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Ex: Selo da Corte Imperial"
              />
            )}

            {watermarkType === 'image' && (
              <Input
                value={watermarkImageUrl}
                onChange={(e) => setWatermarkImageUrl(e.target.value)}
                placeholder="URL da imagem (PNG transparente)"
              />
            )}
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
