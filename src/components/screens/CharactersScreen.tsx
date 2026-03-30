import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  Shield, 
  Heart,
  Wand2,
  Target,
  Flame,
  Sparkles,
  Lock,
  Loader2,
  Archive,
  ArchiveRestore,
  Trash2,
  Gift
} from "lucide-react";
import { useCharacters, useArchiveCharacter, useDeleteCharacter } from "@/hooks/useCharacters";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/menu/UpgradeModal";
import { SubscriptionSheet } from "@/components/menu/SubscriptionSheet";
import { useAuth } from "@/hooks/useAuth";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FilterTab = "all" | "active" | "archived";

const classIcons: Record<string, typeof Shield> = {
  'Guerreiro': Shield,
  'Mago': Wand2,
  'Ladino': Target,
  'Feiticeiro': Flame,
  'Bardo': Sparkles,
  'Clérigo': Shield,
  'Druida': Sparkles,
  'Monge': Target,
  'Paladino': Shield,
  'Patrulheiro': Target,
  'Bruxo': Flame,
  'Bárbaro': Shield,
};

const classGradients: Record<string, string> = {
  'Guerreiro': 'primary',
  'Mago': 'secondary',
  'Ladino': 'muted',
  'Feiticeiro': 'destructive',
  'Bardo': 'secondary',
  'Clérigo': 'primary',
  'Druida': 'secondary',
  'Monge': 'primary',
  'Paladino': 'primary',
  'Patrulheiro': 'primary',
  'Bruxo': 'secondary',
  'Bárbaro': 'primary',
};

export function CharactersScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalTier, setUpgradeModalTier] = useState<SubscriptionTier>('aldeao');
  const [upgradeModalFeature, setUpgradeModalFeature] = useState('');
  const [upgradeModalDescription, setUpgradeModalDescription] = useState('');
  const [subscriptionSheetOpen, setSubscriptionSheetOpen] = useState(false);
  
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: characters, isLoading } = useCharacters();
  const archiveCharacter = useArchiveCharacter();
  const deleteCharacter = useDeleteCharacter();

  const isVisitante = subscription?.tier === 'visitante';

  const showUpgradeModal = (tier: SubscriptionTier, feature: string, description: string) => {
    setUpgradeModalTier(tier);
    setUpgradeModalFeature(feature);
    setUpgradeModalDescription(description);
    setUpgradeModalOpen(true);
  };

  // Open wizard if ?create=true in URL
  useEffect(() => {
    if (searchParams.get('create') === 'true' && user && subscription?.canCreateCharacter) {
      setShowWizard(true);
      setSearchParams({});
    }
  }, [searchParams, user, subscription?.canCreateCharacter, setSearchParams]);

  const canCreateCharacter = subscription?.canCreateCharacter ?? false;

  const handleCreateCharacter = () => {
    if (!user) return;
    if (isVisitante) {
      showUpgradeModal('aldeao', 'Criar Personagens', 'Crie e gerencie seus personagens de RPG');
      return;
    }
    if (!canCreateCharacter) {
      showUpgradeModal('heroi', 'Mais Personagens', 'Aumente seu limite de personagens');
      return;
    }
    setShowWizard(true);
  };

  const handleArchive = (id: string, currentlyArchived: boolean) => {
    archiveCharacter.mutate({ id, archive: !currentlyArchived });
  };

  const handleDeleteClick = (id: string) => {
    setCharacterToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (characterToDelete) {
      deleteCharacter.mutate(characterToDelete);
      setDeleteDialogOpen(false);
      setCharacterToDelete(null);
    }
  };

  // Filter characters based on active tab
  const allCharacters = characters || [];
  const activeCharacters = allCharacters.filter(c => !c.is_archived);
  const archivedCharacters = allCharacters.filter(c => c.is_archived);
  
  const filteredCharacters = activeTab === "archived" 
    ? archivedCharacters 
    : activeTab === "active" 
      ? activeCharacters 
      : allCharacters;

  const tabs = [
    { id: "all" as FilterTab, label: `Todos (${allCharacters.length})` },
    { id: "active" as FilterTab, label: `Ativos (${activeCharacters.length})` },
    { id: "archived" as FilterTab, label: `Arquivados (${archivedCharacters.length})` },
  ];

  if (showWizard) {
    return <CharacterWizard onClose={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-surface-0 pb-24 md:pb-8">
      <AppHeader
        title="Personagens"
        subtitle={user && subscription && !isVisitante ? `${subscription.characterCount}/${subscription.limits.maxCharacters === 'unlimited' ? '∞' : subscription.limits.maxCharacters} personagens` : undefined}
        rightContent={
          <div className="flex items-center gap-2">
            {!user && (
              <button 
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-colors"
              >
                Entrar
              </button>
            )}
            <div className="relative group">
              <button 
                onClick={handleCreateCharacter}
                disabled={!user}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                  canCreateCharacter 
                    ? "border border-primary/60 bg-primary/10" 
                    : "bg-muted"
                }`}
              >
                {canCreateCharacter ? <Plus className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
              </button>
              {/* Tooltip for limit reached */}
              {user && !canCreateCharacter && !isVisitante && (
                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="text-xs text-muted-foreground text-center">
                    Você atingiu o limite de {subscription?.limits.maxCharacters} personagens. 
                    <span className="text-primary font-medium block mt-1">Faça upgrade para criar mais!</span>
                  </p>
                </div>
              )}
              {user && isVisitante && (
                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="text-xs text-muted-foreground text-center">
                    Resgate um código de acesso para criar personagens.
                    <span className="text-primary font-medium block mt-1">Apoie no Catarse!</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        }
      >
        {!isVisitante && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-surface-3 text-foreground shadow-depth-sm"
                    : "bg-surface-1 text-muted-foreground hover:bg-surface-2"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </AppHeader>

      {/* Content */}
      <main className="px-4 sm:px-5 md:px-8 lg:px-12 mt-4 sm:mt-6 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Faça login para ver seus personagens</p>
          </div>
        ) : isVisitante ? (
          // Visitante view - show access gate
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Acesso Restrito
            </h3>
            <p className="text-muted-foreground text-sm mb-6 px-4 max-w-md mx-auto">
              Para criar e gerenciar personagens, você precisa resgatar um código de acesso. 
              Apoie o Go20 no Catarse para obter seu código!
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.open('https://catarse.me/go20', '_blank')}
                className="bg-gradient-primary"
              >
                <Gift className="w-4 h-4 mr-2" />
                Apoiar no Catarse
              </Button>
              <p className="text-xs text-muted-foreground">
                Já tem um código? Vá em Menu → Assinatura para resgatar
              </p>
            </div>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              {activeTab === "archived" ? (
                <Archive className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
              ) : (
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              {activeTab === "archived" ? "Nenhum personagem arquivado" : "Nenhum personagem"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6 px-4">
              {activeTab === "archived" 
                ? "Personagens arquivados aparecerão aqui" 
                : "Crie seu primeiro personagem para começar sua aventura!"}
            </p>
            {activeTab !== "archived" && canCreateCharacter && (
              <button
                onClick={handleCreateCharacter}
                className="px-5 sm:px-6 py-2.5 sm:py-3 border border-primary/60 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground rounded-xl font-medium text-sm sm:text-base transition-colors"
              >
                Criar Personagem
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredCharacters.map((character) => {
              const Icon = classIcons[character.class] || Shield;
              const gradient = classGradients[character.class] || 'primary';
              const isArchived = character.is_archived;

              return (
                <div
                  key={character.id}
                  className={`bg-surface-1/80 backdrop-blur-md border border-border/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-depth-sm hover:shadow-depth-md transition-all ${isArchived ? 'opacity-70' : ''}`}
                >
                  <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-foreground opacity-5 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div 
                        className="flex items-center gap-2.5 sm:gap-3 flex-1 cursor-pointer min-w-0"
                        onClick={() => navigate(`/character/${character.id}`)}
                      >
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl border ${gradient === 'primary' ? 'border-primary/40 bg-primary/10' : gradient === 'secondary' ? 'border-secondary/40 bg-secondary/10' : gradient === 'destructive' ? 'border-destructive/40 bg-destructive/10' : 'border-border bg-muted/30'} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${gradient === 'primary' ? 'text-primary' : gradient === 'secondary' ? 'text-secondary' : gradient === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold truncate">{character.name}</h3>
                            {isArchived && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-muted rounded-full text-[9px] sm:text-[10px] font-medium shrink-0 text-muted-foreground">
                                Arquivado
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm opacity-80 truncate">
                            {character.race} {character.class}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
                          >
                            <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => navigate(`/character/${character.id}`)}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Ver Ficha
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleArchive(character.id, isArchived)}
                          >
                            {isArchived ? (
                              <>
                                <ArchiveRestore className="w-4 h-4 mr-2" />
                                Restaurar
                              </>
                            ) : (
                              <>
                                <Archive className="w-4 h-4 mr-2" />
                                Arquivar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(character.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div 
                      className="cursor-pointer"
                      onClick={() => navigate(`/character/${character.id}`)}
                    >
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                        <div className="bg-muted/50 rounded-lg p-2 sm:p-2.5">
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Nível</p>
                          <p className="text-lg sm:text-xl font-bold">{character.level}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 sm:p-2.5">
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">HP</p>
                          <p className="text-base sm:text-xl font-bold">{character.current_hp}/{character.max_hp}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 sm:p-2.5">
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">CA</p>
                          <p className="text-lg sm:text-xl font-bold">{character.armor_class}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-border/30 gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(character.updated_at), { locale: ptBR, addSuffix: true })}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/character/${character.id}`);
                          }}
                          className="px-2.5 sm:px-3 py-1 sm:py-1.5 border border-primary/60 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground rounded-lg text-[10px] sm:text-xs font-semibold shrink-0 transition-colors"
                        >
                          Jogar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir personagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O personagem será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        requiredTier={upgradeModalTier}
        featureName={upgradeModalFeature}
        featureDescription={upgradeModalDescription}
        onOpenSubscription={() => {
          setUpgradeModalOpen(false);
          setSubscriptionSheetOpen(true);
        }}
      />

      {/* Subscription Sheet */}
      <SubscriptionSheet
        open={subscriptionSheetOpen}
        onOpenChange={setSubscriptionSheetOpen}
      />
    </div>
  );
}
