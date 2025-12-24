import { useState, useEffect, useRef } from "react";
import { Edit3, Save, User, Camera, X, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateCharacter, CharacterDB } from "@/hooks/useCharacters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage, getExtensionFromBlob } from "@/lib/imageCompression";

interface EditStatsSheetProps {
  character: CharacterDB;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStatsSheet({ character, open, onOpenChange }: EditStatsSheetProps) {
  const updateCharacter = useUpdateCharacter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(character.name);
  const [imageUrl, setImageUrl] = useState(character.image_url || "");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setName(character.name);
    setImageUrl(character.image_url || "");
  }, [character]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Compress the image before upload (512x512 max, 80% quality)
      toast.info("Comprimindo imagem...");
      const compressedBlob = await compressImage(file, 512, 512, 0.8);
      
      // Get the appropriate extension based on compressed format
      const fileExt = getExtensionFromBlob(compressedBlob);
      
      // Get current user for folder path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado para enviar imagens");
        return;
      }
      
      // Create a unique file name with user folder for RLS
      const fileName = `${user.id}/${character.id}-${Date.now()}.${fileExt}`;

      // Upload compressed image to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedBlob, {
          contentType: compressedBlob.type,
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        // If bucket doesn't exist, show helpful message
        if (error.message.includes('Bucket not found')) {
          toast.error("Storage não configurado. Use uma URL de imagem externa.");
          return;
        }
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setImageUrl(urlData.publicUrl);
      
      const savedKB = ((file.size - compressedBlob.size) / 1024).toFixed(1);
      toast.success(`Imagem enviada! Economizou ${savedKB}KB`);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Erro ao enviar imagem. Tente usar uma URL externa.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("O nome do personagem é obrigatório");
      return;
    }

    await updateCharacter.mutateAsync({
      id: character.id,
      name: name.trim(),
      image_url: imageUrl || null,
    });

    toast.success("Personagem atualizado!");
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] bg-darker">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Editar Personagem
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full py-4">
          <div className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-primary/30">
                  <AvatarImage src={imageUrl} alt={name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                
                {imageUrl && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isUploading ? "Enviando..." : "Escolher Foto"}
                </Button>
                
                {imageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* URL Input as fallback */}
              <div className="w-full space-y-2">
                <Label className="text-xs text-muted-foreground">Ou cole a URL da imagem:</Label>
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Character Name */}
            <div className="glass rounded-xl p-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Nome do Personagem
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do personagem"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Save Button */}
            <Button
              className="w-full bg-gradient-primary"
              size="lg"
              onClick={handleSave}
              disabled={updateCharacter.isPending || !name.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateCharacter.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}