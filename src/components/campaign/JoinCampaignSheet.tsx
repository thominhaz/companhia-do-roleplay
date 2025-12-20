import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJoinCampaign } from "@/hooks/useSessions";
import { useCharacters } from "@/hooks/useCharacters";
import { Loader2, Users, User, AlertTriangle, Plus } from "lucide-react";
import { Link } from "react-router-dom";

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
    if (!campaignCode.trim() || !selectedCharacter) return;
    
    try {
      await joinCampaign.mutateAsync({
        inviteCode: campaignCode.trim(),
        characterId: selectedCharacter,
      });
      setCampaignCode("");
      setSelectedCharacter("");
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const hasCharacters = characters && characters.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
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
              placeholder="Ex: ABC123"
              value={campaignCode}
              onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
              className="bg-muted/50 border-0 font-mono text-center text-2xl tracking-widest uppercase"
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label>Personagem *</Label>
            {hasCharacters ? (
              <>
                <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                  <SelectTrigger className="bg-muted/50 border-0">
                    <SelectValue placeholder="Selecione um personagem" />
                  </SelectTrigger>
                  <SelectContent>
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
                  Você deve vincular um personagem para participar da campanha
                </p>
              </>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-200">
                      Você precisa criar um personagem primeiro
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Para entrar em uma campanha, você deve ter pelo menos um personagem criado e vinculá-lo.
                    </p>
                    <Link 
                      to="/?tab=personagens" 
                      onClick={() => onOpenChange(false)}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Criar Personagem
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-muted/30 rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-2">Como funciona</h4>
            <p className="text-xs text-muted-foreground">
              Peça o código da campanha ao seu mestre. Após entrar com seu personagem vinculado, você terá acesso às sessões, notas e poderá participar dos combates.
            </p>
          </div>

          <Button 
            onClick={handleJoin} 
            disabled={!campaignCode.trim() || !selectedCharacter || joinCampaign.isPending}
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
