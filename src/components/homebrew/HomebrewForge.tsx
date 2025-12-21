import { useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Gem,
  Users,
  Skull,
  BookOpen,
  Star,
  Sword,
  Search,
  Crown,
  Loader2,
  Trash2,
  Edit,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomebrew } from "@/hooks/useHomebrew";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HomebrewContentType, HomebrewContent } from "@/types";
import { CreateSpellSheet } from "./CreateSpellSheet";
import { CreateItemSheet } from "./CreateItemSheet";
import { CreateRaceSheet } from "./CreateRaceSheet";
import { CreateBackgroundSheet } from "./CreateBackgroundSheet";
import { CreateFeatSheet } from "./CreateFeatSheet";
import { CreateMonsterSheet } from "./CreateMonsterSheet";
import { CreateClassSheet } from "./CreateClassSheet";
import { CreateSubclassSheet } from "./CreateSubclassSheet";
import { HomebrewCard } from "./HomebrewCard";
import { ShareHomebrewSheet } from "./ShareHomebrewSheet";
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

interface HomebrewForgeProps {
  onBack: () => void;
}

const contentTypes: { type: HomebrewContentType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'spell', label: 'Magias', icon: Sparkles, color: 'from-purple-500 to-purple-700' },
  { type: 'item', label: 'Itens', icon: Gem, color: 'from-amber-500 to-amber-700' },
  { type: 'race', label: 'Raças', icon: Users, color: 'from-blue-500 to-blue-700' },
  { type: 'class', label: 'Classes', icon: Sword, color: 'from-red-500 to-red-700' },
  { type: 'subclass', label: 'Subclasses', icon: Star, color: 'from-pink-500 to-pink-700' },
  { type: 'monster', label: 'Monstros', icon: Skull, color: 'from-gray-500 to-gray-700' },
  { type: 'background', label: 'Antecedentes', icon: BookOpen, color: 'from-green-500 to-green-700' },
  { type: 'feat', label: 'Talentos', icon: Crown, color: 'from-orange-500 to-orange-700' },
];

export function HomebrewForge({ onBack }: HomebrewForgeProps) {
  const { user } = useAuth();
  const subscription = useSubscription();
  const isPremium = subscription.data?.status === 'premium';
  
  const [selectedType, setSelectedType] = useState<HomebrewContentType>('spell');
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateSpell, setShowCreateSpell] = useState(false);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showCreateRace, setShowCreateRace] = useState(false);
  const [showCreateBackground, setShowCreateBackground] = useState(false);
  const [showCreateFeat, setShowCreateFeat] = useState(false);
  const [showCreateMonster, setShowCreateMonster] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showCreateSubclass, setShowCreateSubclass] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<HomebrewContent | null>(null);
  const [sharingItem, setSharingItem] = useState<HomebrewContent | null>(null);
  const [deletingItem, setDeletingItem] = useState<HomebrewContent | null>(null);
  
  const { 
    homebrewContent, 
    homebrewCount, 
    canCreate, 
    isLoading,
    deleteHomebrew,
    isDeleting
  } = useHomebrew(selectedType);

  const filteredContent = homebrewContent.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateClick = () => {
    if (!isPremium) return;
    
    switch (selectedType) {
      case 'spell': setShowCreateSpell(true); break;
      case 'item': setShowCreateItem(true); break;
      case 'race': setShowCreateRace(true); break;
      case 'background': setShowCreateBackground(true); break;
      case 'feat': setShowCreateFeat(true); break;
      case 'monster': setShowCreateMonster(true); break;
      case 'class': setShowCreateClass(true); break;
      case 'subclass': setShowCreateSubclass(true); break;
    }
  };

  const handleEdit = (item: HomebrewContent) => {
    setEditingItem(item);
    switch (item.type) {
      case 'spell': setShowCreateSpell(true); break;
      case 'item': setShowCreateItem(true); break;
      case 'race': setShowCreateRace(true); break;
      case 'background': setShowCreateBackground(true); break;
      case 'feat': setShowCreateFeat(true); break;
      case 'monster': setShowCreateMonster(true); break;
      case 'class': setShowCreateClass(true); break;
      case 'subclass': setShowCreateSubclass(true); break;
    }
  };

  const handleDelete = (item: HomebrewContent) => {
    setDeletingItem(item);
  };

  const handleShare = (item: HomebrewContent) => {
    setSharingItem(item);
    setShowShareSheet(true);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteHomebrew(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const handleSheetClose = () => {
    setShowCreateSpell(false);
    setShowCreateItem(false);
    setShowCreateRace(false);
    setShowCreateBackground(false);
    setShowCreateFeat(false);
    setShowCreateMonster(false);
    setEditingItem(null);
  };

  const selectedTypeInfo = contentTypes.find(t => t.type === selectedType);
    setShowShareSheet(false);
    setSharingItem(null);
  };

  const selectedTypeInfo = contentTypes.find(t => t.type === selectedType);
  const isAvailableType = ['spell', 'item', 'race', 'background', 'feat', 'monster'].includes(selectedType);

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-darker/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Sword className="w-5 h-5 text-primary" />
                A Forja
              </h1>
              <p className="text-xs text-muted-foreground">
                Crie seu conteúdo homebrew
              </p>
            </div>
            {isPremium && (
              <Badge variant="secondary" className="bg-gold/20 text-gold border-gold/30">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Premium Gate */}
        {!isPremium && (
          <div className="glass rounded-xl p-4 border-2 border-gold/30 bg-gradient-to-br from-gold/10 to-transparent">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gold">Recurso Premium</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  A criação de conteúdo homebrew é exclusiva para assinantes premium. 
                  Crie magias, itens, raças e monstros personalizados!
                </p>
                <Button 
                  size="sm" 
                  className="mt-3 bg-gold hover:bg-gold/90 text-black"
                >
                  Fazer Upgrade
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Type Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.type;
            return (
              <button
                key={type.type}
                onClick={() => setSelectedType(type.type)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all flex-shrink-0",
                  isSelected 
                    ? `bg-gradient-to-r ${type.color} text-white` 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Create */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Buscar ${selectedTypeInfo?.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button
            onClick={handleCreateClick}
            disabled={!isPremium || !isAvailableType}
            className={cn(
              "h-10 px-4 gap-2",
              isPremium 
                ? `bg-gradient-to-r ${selectedTypeInfo?.color}` 
                : "bg-muted text-muted-foreground"
            )}
          >
            <Plus className="w-4 h-4" />
            Criar
          </Button>
        </div>

        {/* Stats */}
        {isPremium && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{homebrewCount} conteúdos criados</span>
          </div>
        )}

        {/* Content List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <div className={cn(
              "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br",
              selectedTypeInfo?.color,
              "opacity-50"
            )}>
              {selectedTypeInfo && <selectedTypeInfo.icon className="w-8 h-8 text-white" />}
            </div>
            <h3 className="font-semibold text-foreground">
              {searchQuery 
                ? `Nenhum resultado para "${searchQuery}"`
                : `Nenhum ${selectedTypeInfo?.label.toLowerCase().slice(0, -1)} criado`
              }
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isPremium 
                ? `Clique em "Criar" para adicionar seu primeiro ${selectedTypeInfo?.label.toLowerCase().slice(0, -1)}` 
                : "Faça upgrade para criar conteúdo homebrew"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContent.map((item) => (
              <HomebrewCard
                key={item.id}
                item={item}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
                onShare={() => handleShare(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Sheets */}
      <CreateSpellSheet
        open={showCreateSpell}
        onOpenChange={handleSheetClose}
        editingSpell={editingItem?.type === 'spell' ? editingItem : undefined}
      />
      <CreateItemSheet
        open={showCreateItem}
        onOpenChange={handleSheetClose}
        editingItem={editingItem?.type === 'item' ? editingItem : undefined}
      />
      <CreateRaceSheet
        open={showCreateRace}
        onOpenChange={handleSheetClose}
        editingRace={editingItem?.type === 'race' ? editingItem : undefined}
      />
      <CreateBackgroundSheet
        open={showCreateBackground}
        onOpenChange={handleSheetClose}
        editingBackground={editingItem?.type === 'background' ? editingItem : undefined}
      />
      <CreateFeatSheet
        open={showCreateFeat}
        onOpenChange={handleSheetClose}
        editingFeat={editingItem?.type === 'feat' ? editingItem : undefined}
      />
      <CreateMonsterSheet
        open={showCreateMonster}
        onOpenChange={handleSheetClose}
        editingMonster={editingItem?.type === 'monster' ? editingItem : undefined}
      />
      <CreateClassSheet
        open={showCreateClass}
        onOpenChange={handleSheetClose}
        editingClass={editingItem?.type === 'class' ? editingItem : undefined}
      />
      <CreateSubclassSheet
        open={showCreateSubclass}
        onOpenChange={handleSheetClose}
        editingSubclass={editingItem?.type === 'subclass' ? editingItem : undefined}
      />

      {/* Share Sheet */}
      <ShareHomebrewSheet
        open={showShareSheet}
        onOpenChange={handleShareSheetClose}
        item={sharingItem}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deletingItem?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O conteúdo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
