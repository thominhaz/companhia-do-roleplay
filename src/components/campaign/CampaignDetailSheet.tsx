import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CampaignDB, useDeleteCampaign } from "@/hooks/useCampaigns";
import { useCampaignSessions, useCreateSession, useCampaignPlayers, useInvitePlayer, useLeaveCampaign } from "@/hooks/useSessions";
import { 
  Crown, Users, Calendar, Settings, Plus, Trash2, 
  Copy, User, Loader2, ChevronRight, Clock, MapPin,
  UserPlus, Share2, Swords, StickyNote, MessageCircle, LogOut
} from "lucide-react";
import { format, formatDistanceToNow, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
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
import { CreateSessionSheet } from "./CreateSessionSheet";
import { AddPlayerSheet } from "./AddPlayerSheet";
import { CombatTracker } from "./CombatTracker";
import { CampaignNotesSheet } from "./CampaignNotesSheet";
import { CampaignChatSheet } from "./CampaignChatSheet";
import { CampaignCompendiumSheet } from "./CampaignCompendiumSheet";
import { DiscordWebhookConfig } from "./DiscordWebhookConfig";
import { Library } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface CampaignDetailSheetProps {
  campaign: (CampaignDB & { discord_webhook_url?: string | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMaster: boolean;
}

export function CampaignDetailSheet({ campaign, open, onOpenChange, isMaster }: CampaignDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("sessoes");
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showCombatTracker, setShowCombatTracker] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCompendium, setShowCompendium] = useState(false);
  
  const { data: sessions, isLoading: loadingSessions } = useCampaignSessions(campaign?.id || '');
  const { data: players, isLoading: loadingPlayers } = useCampaignPlayers(campaign?.id || '');
  const deleteCampaign = useDeleteCampaign();
  const leaveCampaign = useLeaveCampaign();
  const { data: subscription } = useSubscription();

  if (!campaign) return null;

  const upcomingSessions = sessions?.filter(s => isFuture(new Date(s.scheduled_at))) || [];
  const pastSessions = sessions?.filter(s => isPast(new Date(s.scheduled_at))) || [];

  const handleCopyInviteCode = () => {
    if (campaign.invite_code) {
      navigator.clipboard.writeText(campaign.invite_code);
      toast.success("Código copiado: " + campaign.invite_code);
    }
  };

  const handleDeleteCampaign = async () => {
    try {
      await deleteCampaign.mutateAsync(campaign.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleLeaveCampaign = async () => {
    try {
      await leaveCampaign.mutateAsync(campaign.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/30 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{campaign.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isMaster ? "Você é o Mestre" : "Jogador"} • D&D 5e
                  </p>
                </div>
              </div>
              {isMaster ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Todas as sessões e dados serão perdidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteCampaign}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sair da campanha?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você será removido da campanha e perderá acesso às sessões e notas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleLeaveCampaign}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Sair
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {campaign.description && (
              <p className="text-sm text-muted-foreground mt-4">{campaign.description}</p>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="bg-card/50 rounded-xl p-3 text-center">
                <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{players?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground">Jogadores</p>
              </div>
              <div className="bg-card/50 rounded-xl p-3 text-center">
                <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{sessions?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground">Sessões</p>
              </div>
              <button 
                onClick={() => setShowNotes(true)}
                className="bg-card/50 rounded-xl p-3 text-center hover:bg-card/70 transition-colors"
              >
                <StickyNote className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <p className="text-sm font-bold">Notas</p>
                <p className="text-[10px] text-muted-foreground">Ver</p>
              </button>
              <button 
                onClick={() => setShowChat(true)}
                className="bg-card/50 rounded-xl p-3 text-center hover:bg-card/70 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                <p className="text-sm font-bold">Chat</p>
                <p className="text-[10px] text-muted-foreground">Abrir</p>
              </button>
              <button 
                onClick={() => setShowCompendium(true)}
                className="bg-card/50 rounded-xl p-3 text-center hover:bg-card/70 transition-colors"
              >
                <Library className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                <p className="text-sm font-bold">Compêndio</p>
                <p className="text-[10px] text-muted-foreground">Homebrew</p>
              </button>
            </div>

            {/* Invite Code */}
            {isMaster && campaign.invite_code && (
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 bg-card/50 rounded-xl p-3 flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Código de convite</p>
                    <p className="text-lg font-mono font-bold tracking-widest">{campaign.invite_code}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCopyInviteCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="w-full bg-transparent border-b border-border rounded-none h-12 p-0">
              <TabsTrigger 
                value="sessoes" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Sessões
              </TabsTrigger>
              <TabsTrigger 
                value="jogadores" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Users className="w-4 h-4 mr-2" />
                Jogadores
              </TabsTrigger>
              {isMaster && (
                <TabsTrigger 
                  value="config" 
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Config
                </TabsTrigger>
              )}
            </TabsList>

            <ScrollArea className="h-[calc(90vh-380px)]">
              <TabsContent value="sessoes" className="p-4 mt-0">
                {isMaster && (
                  <div className="flex gap-2 mb-4">
                    <Button 
                      onClick={() => setShowCreateSession(true)}
                      className="flex-1 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agendar Sessão
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => setShowCombatTracker(true)}
                      className="gap-2"
                    >
                      <Swords className="w-4 h-4" />
                      Combate
                    </Button>
                  </div>
                )}

                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {upcomingSessions.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Próximas Sessões</h3>
                        <div className="space-y-2">
                          {upcomingSessions.map(session => (
                            <div key={session.id} className="bg-card rounded-xl p-4 border border-primary/30">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">{session.title}</h4>
                                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                                  {formatDistanceToNow(new Date(session.scheduled_at), { locale: ptBR, addSuffix: true })}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(session.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </div>
                                {session.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {session.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pastSessions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Sessões Anteriores</h3>
                        <div className="space-y-2">
                          {pastSessions.map(session => (
                            <div key={session.id} className="bg-muted/30 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-sm">{session.title}</h4>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(session.scheduled_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sessions?.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Nenhuma sessão agendada</p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Players Tab */}
              <TabsContent value="jogadores" className="p-4 mt-0">
                {isMaster && (
                  <Button 
                    onClick={() => setShowAddPlayer(true)}
                    variant="outline"
                    className="w-full mb-4 gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Adicionar Jogador
                  </Button>
                )}

                {loadingPlayers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {players?.map(player => (
                      <div key={player.id} className="bg-card rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {player.role === 'master' ? (
                            <Crown className="w-5 h-5 text-amber-500" />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {player.profile?.display_name || 'Jogador'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {player.character?.name 
                              ? `${player.character.name} • ${player.character.class} Nv.${player.character.level}`
                              : 'Sem personagem vinculado'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          player.role === 'master' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/20 text-primary'
                        }`}>
                          {player.role === 'master' ? 'Mestre' : 'Jogador'}
                        </span>
                      </div>
                    ))}

                    {(!players || players.length === 0) && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Nenhum jogador ainda</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Config Tab */}
              <TabsContent value="config" className="p-4 mt-0">
                <div className="space-y-4">
                  <div className="bg-card rounded-xl p-4">
                    <h4 className="font-semibold mb-1">Nome da Campanha</h4>
                    <p className="text-sm text-muted-foreground">{campaign.name}</p>
                  </div>
                  
                  <div className="bg-card rounded-xl p-4">
                    <h4 className="font-semibold mb-1">Descrição</h4>
                    <p className="text-sm text-muted-foreground">
                      {campaign.description || "Sem descrição"}
                    </p>
                  </div>

                  <div className="bg-card rounded-xl p-4">
                    <h4 className="font-semibold mb-1">Criada em</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(campaign.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  {/* Discord Integration - Only for Mestre tier */}
                  {subscription?.limits.hasDiscordIntegration && (
                    <DiscordWebhookConfig
                      campaignId={campaign.id}
                      currentWebhookUrl={campaign.discord_webhook_url || null}
                    />
                  )}

                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleDeleteCampaign}
                    disabled={deleteCampaign.isPending}
                  >
                    {deleteCampaign.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Excluir Campanha
                  </Button>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      <CreateSessionSheet 
        campaignId={campaign.id}
        open={showCreateSession}
        onOpenChange={setShowCreateSession}
      />

      <AddPlayerSheet
        campaignId={campaign.id}
        open={showAddPlayer}
        onOpenChange={setShowAddPlayer}
      />

      {isMaster && (
        <CombatTracker
          campaignId={campaign.id}
          open={showCombatTracker}
          onOpenChange={setShowCombatTracker}
        />
      )}

      <CampaignNotesSheet
        campaignId={campaign.id}
        open={showNotes}
        onOpenChange={setShowNotes}
      />

      <CampaignChatSheet
        campaignId={campaign.id}
        open={showChat}
        onOpenChange={setShowChat}
      />

      <CampaignCompendiumSheet
        campaignId={campaign.id}
        open={showCompendium}
        onOpenChange={setShowCompendium}
      />
    </>
  );
}
