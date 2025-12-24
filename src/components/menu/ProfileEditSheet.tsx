import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Camera, X, Trash2, Upload } from "lucide-react";
import { compressImage, getExtensionFromBlob } from "@/lib/imageCompression";

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditSheet({ open, onOpenChange }: ProfileEditSheetProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
      }

      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || "");
      } else {
        // Use metadata as fallback
        setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");
        setAvatarUrl("");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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
      // Compress the image before upload (256x256 for profile avatars)
      toast.info("Comprimindo imagem...");
      const compressedBlob = await compressImage(file, 256, 256, 0.85);
      
      // Get the appropriate extension based on compressed format
      const fileExt = getExtensionFromBlob(compressedBlob);
      
      // Create a unique file name with user folder for RLS
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

      // Upload compressed image to Supabase Storage
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedBlob, {
          contentType: compressedBlob.type,
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
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

      setAvatarUrl(urlData.publicUrl);
      
      const savedKB = ((file.size - compressedBlob.size) / 1024).toFixed(1);
      toast.success(`Imagem enviada! Economizou ${savedKB}KB`);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Erro ao enviar imagem. Tente usar uma URL externa.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Upsert profile
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Also update user metadata
      await supabase.auth.updateUser({
        data: { display_name: displayName.trim() }
      });

      toast.success("Perfil atualizado com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const currentInitial = displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-darker">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-lg font-bold text-foreground">
            Editar Perfil
          </SheetTitle>
        </SheetHeader>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="py-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {avatarUrl ? (
                  <>
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary/30"
                    />
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-primary/30">
                    <span className="text-3xl font-bold text-foreground">
                      {currentInitial}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? "Enviando..." : "Enviar Foto"}
                </Button>
                
                {avatarUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
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
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium text-foreground">
                  Nome de Exibição
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="bg-dark border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl" className="text-sm font-medium text-foreground">
                  Ou cole uma URL de imagem
                </Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://exemplo.com/avatar.jpg"
                  className="bg-dark border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-muted border-border text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={loading || !displayName.trim()}
              className="w-full bg-gradient-primary"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Salvar Alterações
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
