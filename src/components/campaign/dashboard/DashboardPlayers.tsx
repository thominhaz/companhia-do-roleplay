import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignPlayers, useRemovePlayer, useUpdateMyCharacterInCampaign } from "@/hooks/useSessions";
import { useCharacters } from "@/hooks/useCharacters";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Crown, User, Loader2, UserMinus, Gift, Eye, Link2 } from "lucide-react";
import { AddPlayerSheet } from "../AddPlayerSheet";
import { MasterGiftSheet } from "./MasterGiftSheet";
import { PlayerCharacterSheet } from "./PlayerCharacterSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface DashboardPlayersProps {
  campaign: CampaignDB;
  isMaster: boolean;
}

export function DashboardPlayers({ campaign, isMaster }: DashboardPlayersProps) {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showGiftSheet, setShowGiftSheet] = useState(false);
  const [viewingCharacterId, setViewingCharacterId] = useState<string | null>(null);
  const [showLinkSheet, setShowLinkSheet] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");

  const { user } = useAuth();
  const { data: players, isLoading } = useCampaignPlayers(campaign.id);
  const { data: myCharacters } = useCharacters();
  const removePlayer = useRemovePlayer();
  const updateMyCharacter = useUpdateMyCharacterInCampaign();

  const myPlayer = players?.find(p => p.user_id === user?.id);
  const isPlayer = !isMaster && !!myPlayer;

  const handleRemovePlayer = async (playerId: string) => {
    try {
      await removePlayer.mutateAsync({ campaignId: campaign.id, playerId });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleLinkCharacter = async () => {
    if (!selectedCharacterId) return;
    const charId = selectedCharacterId === "none" ? null : selectedCharacterId;
    try {
      await updateMyCharacter.mutateAsync({
        campaignId: campaign.id,
        characterId: charId,
      });
      setShowLinkSheet(false);
      setSelectedCharacterId("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Jogadores</h2>
          <p className="text-sm text-muted-foreground">{players?.length || 0} membros na campanha</p>
        </div>
        <div className="flex gap-2">
          {isPlayer && (
            <Button onClick={() => {
              setSelectedCharacterId(myPlayer?.character_id || "none");
              setShowLinkSheet(true);
            }} variant="outline" className="gap-2">
              <Link2 className="w-4 h-4" />
              {myPlayer?.character_id ? 'Trocar Personagem' : 'Vincular Personagem'}
            </Button>
          )}
          {isMaster && (
            <>
              <Button onClick={() => setShowGiftSheet(true)} variant="outline" className="gap-2">
                <Gift className="w-4 h-4" />
                Entregar Item
              </Button>
              <Button onClick={() => setShowAddPlayer(true)} variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Adicionar
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {players?.map(player => (
            <div 
              key={player.id} 
              className={`bg-card rounded-xl p-4 flex items-center gap-3 border border-border ${
                isMaster && player.character?.id ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''
              }`}
              onClick={() => {
                if (isMaster && player.character?.id) {
                  setViewingCharacterId(player.character.id);
                }
              }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                {player.role === 'master' ? (
                  <Crown className="w-6 h-6 text-gold" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {player.profile?.display_name || 'Jogador'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {player.character?.name 
                    ? `${player.character.name} • ${player.character.class} Nv.${player.character.level}`
                    : 'Sem personagem vinculado'}
                </p>
              </div>
              {isMaster && player.character?.id && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="flex-shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingCharacterId(player.character!.id);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <span className={`text-xs px-3 py-1 rounded-full flex-shrink-0 ${
                player.role === 'master' ? 'bg-gold/20 text-gold' : 'bg-primary/20 text-primary'
              }`}>
                {player.role === 'master' ? 'Mestre' : 'Jogador'}
              </span>
              {isMaster && player.role !== 'master' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover jogador?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {player.profile?.display_name || 'Este jogador'} será removido da campanha.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleRemovePlayer(player.id)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}

          {players?.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Nenhum jogador na campanha</p>
              {isMaster && (
                <Button onClick={() => setShowAddPlayer(true)} variant="outline">
                  Adicionar Primeiro Jogador
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <AddPlayerSheet
        open={showAddPlayer}
        onOpenChange={setShowAddPlayer}
        campaignId={campaign.id}
      />

      <MasterGiftSheet
        open={showGiftSheet}
        onOpenChange={setShowGiftSheet}
        campaignId={campaign.id}
        players={players || []}
      />

      <PlayerCharacterSheet
        characterId={viewingCharacterId || ''}
        open={!!viewingCharacterId}
        onOpenChange={(open) => !open && setViewingCharacterId(null)}
      />

      {/* Sheet para jogador vincular/trocar personagem */}
      <Sheet open={showLinkSheet} onOpenChange={setShowLinkSheet}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
          <SheetHeader className="text-left mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">Vincular Personagem</SheetTitle>
                <p className="text-sm text-muted-foreground">Escolha qual personagem usar nesta campanha</p>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {myCharacters && myCharacters.length > 0 ? (
              <>
                <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                  <SelectTrigger className="bg-muted/50 border-0">
                    <SelectValue placeholder="Selecione um personagem..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Desvincular personagem</span>
                    </SelectItem>
                    {myCharacters.map(char => (
                      <SelectItem key={char.id} value={char.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {char.name} - {char.class} Nível {char.level}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleLinkCharacter}
                  disabled={!selectedCharacterId || updateMyCharacter.isPending}
                  className="w-full h-12 text-base font-semibold"
                >
                  {updateMyCharacter.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {selectedCharacterId === "none" ? "Desvincular" : "Vincular Personagem"}
                </Button>
              </>
            ) : (
              <div className="bg-muted/30 rounded-xl p-4 text-center text-sm text-muted-foreground">
                Você ainda não tem personagens criados. Crie um na aba de Personagens primeiro.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
