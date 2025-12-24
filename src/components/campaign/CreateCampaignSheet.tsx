import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { useCampaignImageUpload } from "@/hooks/useCampaignImageUpload";
import { Loader2, Wand2, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateCampaignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignSheet({ open, onOpenChange }: CreateCampaignSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createCampaign = useCreateCampaign();
  const { uploadImage, isUploading, progress } = useCampaignImageUpload();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to storage
    const url = await uploadImage(file, { folder: 'campaigns', maxSizeKB: 800 });
    if (url) {
      setImageUrl(url);
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    try {
      await createCampaign.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl || undefined,
      });
      setName("");
      setDescription("");
      setImageUrl(null);
      setImagePreview(null);
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="text-left mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Nova Campanha</SheetTitle>
              <p className="text-sm text-muted-foreground">Crie uma nova aventura épica</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Imagem de Capa</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden h-40 bg-muted">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">{progress}%</p>
                    </div>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full h-32 rounded-xl border-2 border-dashed border-muted-foreground/30",
                  "flex flex-col items-center justify-center gap-2",
                  "hover:border-primary/50 hover:bg-muted/30 transition-colors"
                )}
              >
                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Adicionar imagem</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha *</Label>
            <Input
              id="name"
              placeholder="Ex: A Maldição de Strahd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/50 border-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva a premissa da sua campanha..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/50 border-0 min-h-[80px]"
            />
          </div>

          <div className="bg-muted/30 rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-2">Dicas para mestres</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Após criar, convide jogadores pelo código da campanha</li>
              <li>• Agende sessões para manter todos organizados</li>
              <li>• Use as notas para guardar informações importantes</li>
            </ul>
          </div>
        </div>

        <div className="flex-shrink-0 pt-4 border-t border-border">
          <Button 
            onClick={handleCreate} 
            disabled={!name.trim() || createCampaign.isPending || isUploading}
            className="w-full h-12 text-base font-semibold"
          >
            {createCampaign.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Campanha"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
