import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Map, Upload } from "lucide-react";
import { useCreateBattleMap } from "@/hooks/useBattleMaps";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

export function CreateBattleMapSheet({ open, onOpenChange, campaignId }: Props) {
  const [name, setName] = useState("Novo Mapa");
  const [gridWidth, setGridWidth] = useState(20);
  const [gridHeight, setGridHeight] = useState(20);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const createMap = useCreateBattleMap();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${campaignId}/battlemap-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('campaign-images')
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-images')
        .getPublicUrl(path);
      setImageUrl(publicUrl);
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createMap.mutateAsync({
        campaign_id: campaignId,
        name,
        grid_width: gridWidth,
        grid_height: gridHeight,
        image_url: imageUrl || undefined,
      });
      setName("Novo Mapa");
      setGridWidth(20);
      setGridHeight(20);
      setImageUrl(null);
      onOpenChange(false);
    } catch {}
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Map className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Criar Mapa Tático</SheetTitle>
              <p className="text-sm text-muted-foreground">Configure o grid e imagem de fundo</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Nome do Mapa</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-muted/50 border-0" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Largura (colunas)</Label>
              <Input
                type="number" min={5} max={50}
                value={gridWidth}
                onChange={e => setGridWidth(Number(e.target.value))}
                className="bg-muted/50 border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Altura (linhas)</Label>
              <Input
                type="number" min={5} max={50}
                value={gridHeight}
                onChange={e => setGridHeight(Number(e.target.value))}
                className="bg-muted/50 border-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagem de Fundo (opcional)</Label>
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={imageUrl} alt="Map preview" className="w-full h-32 object-cover" />
                <Button
                  variant="destructive" size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setImageUrl(null)}
                >Remover</Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Enviando...' : 'Clique para enviar imagem do mapa'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            )}
          </div>

          <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground">
            Grid de <strong>{gridWidth}×{gridHeight}</strong> = {gridWidth * gridHeight} quadrados (cada um = 5ft / 1.5m)
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createMap.isPending}
            className="w-full h-12 text-base font-semibold"
          >
            {createMap.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar Mapa
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
