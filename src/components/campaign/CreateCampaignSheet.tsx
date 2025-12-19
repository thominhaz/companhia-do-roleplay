import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { Loader2, Wand2 } from "lucide-react";

interface CreateCampaignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignSheet({ open, onOpenChange }: CreateCampaignSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createCampaign = useCreateCampaign();

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    try {
      await createCampaign.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left mb-6">
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

        <div className="space-y-6">
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
              className="bg-muted/50 border-0 min-h-[120px]"
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

          <Button 
            onClick={handleCreate} 
            disabled={!name.trim() || createCampaign.isPending}
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
