import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateDocument, useUpdateDocument, CampaignDocument } from "@/hooks/useDocuments";
import { Scroll, FileText, FileSignature, BookOpen, MapPin, Crown, Feather, Image, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  { value: 'image', label: 'Imagem (PNG)' },
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
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para fazer upload');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('document-seals')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('document-seals')
        .getPublicUrl(fileName);

      setWatermarkImageUrl(publicUrl);
      toast.success('Imagem do selo enviada!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setWatermarkImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
              <Label className="text-sm font-medium">Marca D'água / Selo</Label>
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
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {watermarkImageUrl ? (
                  <div className="relative">
                    <div className="w-full h-32 rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden">
                      <img 
                        src={watermarkImageUrl} 
                        alt="Selo" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Clique para enviar PNG</span>
                      </div>
                    )}
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Recomendado: PNG transparente, máximo 2MB
                </p>
              </div>
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
            disabled={!title.trim() || createDocument.isPending || updateDocument.isPending || isUploading}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Documento'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
