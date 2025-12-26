import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignPlayers, useRemovePlayer } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Crown, User, Loader2, UserMinus, Gift, Eye } from "lucide-react";
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

interface DashboardPlayersProps {
  campaign: CampaignDB;
  isMaster: boolean;
}

export function DashboardPlayers({ campaign, isMaster }: DashboardPlayersProps) {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showGiftSheet, setShowGiftSheet] = useState(false);
  const [viewingCharacterId, setViewingCharacterId] = useState<string | null>(null);
  const { data: players, isLoading } = useCampaignPlayers(campaign.id);
  const removePlayer = useRemovePlayer();

  const handleRemovePlayer = async (playerId: string) => {
    try {
      await removePlayer.mutateAsync({ campaignId: campaign.id, playerId });
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
        {isMaster && (
          <div className="flex gap-2">
            <Button onClick={() => setShowGiftSheet(true)} variant="outline" className="gap-2">
              <Gift className="w-4 h-4" />
              Entregar Item
            </Button>
            <Button onClick={() => setShowAddPlayer(true)} variant="outline" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
        )}
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
                  <Crown className="w-6 h-6 text-amber-500" />
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
                player.role === 'master' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/20 text-primary'
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
    </div>
  );
}
