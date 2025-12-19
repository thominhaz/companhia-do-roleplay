import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

interface AddPlayerSheetProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPlayerSheet({ campaignId, open, onOpenChange }: AddPlayerSheetProps) {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(campaignId);
    toast.success("Código copiado! Envie para seus jogadores.");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Convite para Campanha",
          text: `Entre na minha campanha de RPG! Código: ${campaignId}`,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopyCode();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Adicionar Jogador</SheetTitle>
              <p className="text-sm text-muted-foreground">Convide jogadores para sua campanha</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Compartilhe o código abaixo com seus jogadores. Eles poderão usar esse código para entrar na campanha.
            </p>
            
            <div className="space-y-2">
              <Label>Código da Campanha</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={campaignId}
                  className="bg-background font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={handleCopyCode}
            >
              <Copy className="w-4 h-4" />
              Copiar Código
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </div>

          <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
            <h4 className="font-semibold text-sm mb-2 text-primary">Como funciona?</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copie o código acima</li>
              <li>Envie para seus jogadores</li>
              <li>Eles usam o código para entrar na campanha</li>
              <li>Você aprova a entrada de cada jogador</li>
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
