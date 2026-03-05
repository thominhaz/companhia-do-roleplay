import { BattleMap } from "@/hooks/useBattleMaps";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Eye, EyeOff, Grid3X3, Image, Trash2, Loader2, Swords } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface Props {
  map: BattleMap;
  isMaster: boolean;
  onBack: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onToggleGridSettings: () => void;
  onImageUpload: (file: File) => Promise<void>;
  onToggleTokens?: () => void;
}

export function MapEditorTopBar({ map, isMaster, onBack, onToggleActive, onDelete, onToggleGridSettings, onImageUpload, onToggleTokens }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onImageUpload(file);
      toast.success("Imagem do mapa atualizada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-card/80 border-b border-border/50 backdrop-blur-sm shrink-0">
      <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 w-8 h-8 sm:w-9 sm:h-9">
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>

      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-xs sm:text-sm truncate">{map.name}</h1>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground hidden sm:block">
          {map.grid_width}×{map.grid_height} • {map.token_positions.length} tokens
        </p>
      </div>

      {isMaster && (
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Mobile: tokens button */}
          {onToggleTokens && (
            <Button variant="ghost" size="icon" onClick={onToggleTokens} className="shrink-0 w-8 h-8">
              <Swords className="w-4 h-4" />
            </Button>
          )}

          {/* Upload image */}
          <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0 w-8 h-8 sm:w-9 sm:h-9">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* Grid settings */}
          <Button variant="ghost" size="icon" onClick={onToggleGridSettings} className="shrink-0 w-8 h-8 sm:w-9 sm:h-9">
            <Grid3X3 className="w-4 h-4" />
          </Button>

          {/* Toggle active */}
          <Button
            variant={map.is_active ? "secondary" : "ghost"}
            size="icon"
            onClick={onToggleActive}
            className="shrink-0 w-8 h-8 sm:w-9 sm:h-9"
          >
            {map.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0 w-8 h-8 sm:w-9 sm:h-9">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover mapa?</AlertDialogTitle>
                <AlertDialogDescription>O mapa "{map.name}" será removido permanentemente.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={onDelete}>
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
