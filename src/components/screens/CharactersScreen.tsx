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
  Trash2
} from "lucide-react";
import { useCharacters, useArchiveCharacter, useDeleteCharacter } from "@/hooks/useCharacters";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { CharacterWizard } from "@/components/character/CharacterWizard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppHeader } from "@/components/layout/AppHeader";
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
  'Guerreiro': 'from-purple-900 to-purple-700',
  'Mago': 'from-blue-900 to-blue-700',
  'Ladino': 'from-gray-800 to-gray-600',
  'Feiticeiro': 'from-red-900 to-red-700',
  'Bardo': 'from-pink-900 to-pink-700',
  'Clérigo': 'from-yellow-900 to-yellow-700',
  'Druida': 'from-green-900 to-green-700',
  'Monge': 'from-amber-900 to-amber-700',
  'Paladino': 'from-cyan-900 to-cyan-700',
  'Patrulheiro': 'from-emerald-900 to-emerald-700',
  'Bruxo': 'from-violet-900 to-violet-700',
  'Bárbaro': 'from-orange-900 to-orange-700',
};

export function CharactersScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [showWizard, setShowWizard] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: characters, isLoading } = useCharacters();
  const archiveCharacter = useArchiveCharacter();
  const deleteCharacter = useDeleteCharacter();

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
    if (!canCreateCharacter) return;
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
    <div className="min-h-screen bg-darker pb-24">
      <AppHeader
        title="Personagens"
        subtitle={user && subscription ? `${subscription.characterCount}/${subscription.limits.maxCharacters === 'unlimited' ? '∞' : subscription.limits.maxCharacters} personagens` : undefined}
        rightContent={
          <button 
            onClick={handleCreateCharacter}
            disabled={!user || !canCreateCharacter}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              canCreateCharacter 
                ? "bg-gradient-to-br from-primary to-purple-700" 
                : "bg-muted"
            }`}
          >
            {canCreateCharacter ? <Plus className="w-5 h-5" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
          </button>
        }
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-foreground"
                  : "bg-dark text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </AppHeader>

      {/* Content */}
      <main className="px-5 mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Faça login para ver seus personagens</p>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              {activeTab === "archived" ? (
                <Archive className="w-10 h-10 text-muted-foreground" />
              ) : (
                <Shield className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {activeTab === "archived" ? "Nenhum personagem arquivado" : "Nenhum personagem"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {activeTab === "archived" 
                ? "Personagens arquivados aparecerão aqui" 
                : "Crie seu primeiro personagem para começar sua aventura!"}
            </p>
            {activeTab !== "archived" && canCreateCharacter && (
              <button
                onClick={handleCreateCharacter}
                className="px-6 py-3 bg-gradient-primary rounded-xl font-medium"
              >
                Criar Personagem
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCharacters.map((character) => {
              const Icon = classIcons[character.class] || Shield;
              const gradient = classGradients[character.class] || 'from-purple-900 to-purple-700';
              const isArchived = character.is_archived;

              return (
                <div
                  key={character.id}
                  className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 relative overflow-hidden ${isArchived ? 'opacity-70' : ''}`}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-foreground opacity-5 rounded-full -mr-16 -mt-16" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => navigate(`/character/${character.id}`)}
                      >
                        <div className="w-14 h-14 rounded-xl bg-foreground/20 flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">{character.name}</h3>
                            {isArchived && (
                              <span className="px-2 py-0.5 bg-background/30 rounded-full text-[10px] font-medium">
                                Arquivado
                              </span>
                            )}
                          </div>
                          <p className="text-sm opacity-80">
                            {character.race} {character.class}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-lg bg-background/20 flex items-center justify-center hover:bg-background/30 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 opacity-80" />
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
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-background/20 rounded-lg p-2.5">
                          <p className="text-xs opacity-80 mb-0.5">Nível</p>
                          <p className="text-xl font-bold">{character.level}</p>
                        </div>
                        <div className="bg-background/20 rounded-lg p-2.5">
                          <p className="text-xs opacity-80 mb-0.5">HP</p>
                          <p className="text-xl font-bold">{character.current_hp}/{character.max_hp}</p>
                        </div>
                        <div className="bg-background/20 rounded-lg p-2.5">
                          <p className="text-xs opacity-80 mb-0.5">CA</p>
                          <p className="text-xl font-bold">{character.armor_class}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-foreground/20">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 opacity-80" />
                          <span className="text-xs opacity-80">
                            Atualizado {formatDistanceToNow(new Date(character.updated_at), { locale: ptBR, addSuffix: true })}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/character/${character.id}`);
                          }}
                          className="px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-semibold"
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
    </div>
  );
}