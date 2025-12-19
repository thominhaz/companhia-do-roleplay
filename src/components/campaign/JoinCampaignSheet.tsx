import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJoinCampaign } from "@/hooks/useSessions";
import { useCharacters } from "@/hooks/useCharacters";
import { Loader2, Users, User } from "lucide-react";

interface JoinCampaignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinCampaignSheet({ open, onOpenChange }: JoinCampaignSheetProps) {
  const [campaignCode, setCampaignCode] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState("");
  
  const joinCampaign = useJoinCampaign();
  const { data: characters } = useCharacters();

  const handleJoin = async () => {
    if (!campaignCode.trim()) return;
    
    try {
      await joinCampaign.mutateAsync({
        campaignId: campaignCode.trim(),
        characterId: selectedCharacter || undefined,
      });
      setCampaignCode("");
      setSelectedCharacter("");
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Entrar em Campanha</SheetTitle>
              <p className="text-sm text-muted-foreground">Use o código do mestre</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Código da Campanha *</Label>
            <Input
              id="code"
              placeholder="Cole o código aqui..."
              value={campaignCode}
              onChange={(e) => setCampaignCode(e.target.value)}
              className="bg-muted/50 border-0 font-mono"
            />
          </div>

          {characters && characters.length > 0 && (
            <div className="space-y-2">
              <Label>Personagem (opcional)</Label>
              <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                <SelectTrigger className="bg-muted/50 border-0">
                  <SelectValue placeholder="Selecione um personagem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {characters.map(char => (
                    <SelectItem key={char.id} value={char.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {char.name} - {char.class} Nível {char.level}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Você pode vincular um personagem agora ou depois
              </p>
            </div>
          )}

          <div className="bg-muted/30 rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-2">Dica</h4>
            <p className="text-xs text-muted-foreground">
              Peça o código da campanha ao seu mestre. Após entrar, você terá acesso às sessões, notas e poderá interagir com os outros jogadores.
            </p>
          </div>

          <Button 
            onClick={handleJoin} 
            disabled={!campaignCode.trim() || joinCampaign.isPending}
            className="w-full h-12 text-base font-semibold"
          >
            {joinCampaign.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar na Campanha"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
