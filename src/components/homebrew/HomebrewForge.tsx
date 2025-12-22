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
  Share2,
  Copy,
  Download,
  Upload,
  Filter,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomebrew } from "@/hooks/useHomebrew";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HomebrewContentType, HomebrewContent, HomebrewSpellData, HomebrewItemData } from "@/types";
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const spellLevelOptions = [
  { value: 'all', label: 'Todos os níveis' },
  { value: '0', label: 'Truque' },
  { value: '1', label: '1º Nível' },
  { value: '2', label: '2º Nível' },
  { value: '3', label: '3º Nível' },
  { value: '4', label: '4º Nível' },
  { value: '5', label: '5º Nível' },
  { value: '6', label: '6º Nível' },
  { value: '7', label: '7º Nível' },
  { value: '8', label: '8º Nível' },
  { value: '9', label: '9º Nível' },
];

const spellSchoolOptions = [
  { value: 'all', label: 'Todas as escolas' },
  { value: 'abjuration', label: 'Abjuração' },
  { value: 'conjuration', label: 'Conjuração' },
  { value: 'divination', label: 'Adivinhação' },
  { value: 'enchantment', label: 'Encantamento' },
  { value: 'evocation', label: 'Evocação' },
  { value: 'illusion', label: 'Ilusão' },
  { value: 'necromancy', label: 'Necromancia' },
  { value: 'transmutation', label: 'Transmutação' },
];

const itemRarityOptions = [
  { value: 'all', label: 'Todas as raridades' },
  { value: 'common', label: 'Comum' },
  { value: 'uncommon', label: 'Incomum' },
  { value: 'rare', label: 'Raro' },
  { value: 'very_rare', label: 'Muito Raro' },
  { value: 'legendary', label: 'Lendário' },
  { value: 'artifact', label: 'Artefato' },
];

// Helper function to get singular form of content type labels
const getSingularLabel = (label: string | undefined): string => {
  if (!label) return 'item';
  const singularMap: Record<string, string> = {
    'Magias': 'magia',
    'Itens': 'item',
    'Raças': 'raça',
    'Classes': 'classe',
    'Subclasses': 'subclasse',
    'Monstros': 'monstro',
    'Antecedentes': 'antecedente',
    'Talentos': 'talento',
  };
  return singularMap[label] || label.toLowerCase().slice(0, -1);
};

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
  const [duplicatingItem, setDuplicatingItem] = useState<HomebrewContent | null>(null);
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [spellLevelFilter, setSpellLevelFilter] = useState('all');
  const [spellSchoolFilter, setSpellSchoolFilter] = useState('all');
  const [itemRarityFilter, setItemRarityFilter] = useState('all');
  
  const { 
    homebrewContent, 
    homebrewCount, 
    canCreate, 
    isLoading,
    deleteHomebrew,
    createHomebrew,
    isDeleting,
    isCreating
  } = useHomebrew(selectedType);

  // Apply filters
  const filteredContent = homebrewContent.filter(item => {
    // Text search
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // Type-specific filters
    if (selectedType === 'spell' && item.data) {
      const spellData = item.data as HomebrewSpellData;
      if (spellLevelFilter !== 'all' && spellData.level?.toString() !== spellLevelFilter) {
        return false;
      }
      if (spellSchoolFilter !== 'all' && spellData.school !== spellSchoolFilter) {
        return false;
      }
    }
    
    if (selectedType === 'item' && item.data) {
      const itemData = item.data as HomebrewItemData;
      if (itemRarityFilter !== 'all' && itemData.rarity !== itemRarityFilter) {
        return false;
      }
    }
    
    return true;
  });

  const hasActiveFilters = spellLevelFilter !== 'all' || spellSchoolFilter !== 'all' || itemRarityFilter !== 'all';

  const clearFilters = () => {
    setSpellLevelFilter('all');
    setSpellSchoolFilter('all');
    setItemRarityFilter('all');
  };

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
    setShowCreateClass(false);
    setShowCreateSubclass(false);
    setEditingItem(null);
    setDuplicatingItem(null);
  };

  const handleShareSheetClose = () => {
    setShowShareSheet(false);
    setSharingItem(null);
  };

  // Duplicate functionality
  const handleDuplicate = (item: HomebrewContent) => {
    const duplicatedItem = {
      ...item,
      name: `${item.name} (Cópia)`,
    };
    setDuplicatingItem(duplicatedItem);
    setEditingItem(duplicatedItem);
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

  // Export functionality
  const handleExport = (item: HomebrewContent) => {
    const exportData = {
      name: item.name,
      type: item.type,
      description: item.description,
      icon: item.icon,
      data: item.data,
      version: item.version,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name.toLowerCase().replace(/\s+/g, '-')}.homebrew.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Conteúdo exportado!');
  };

  // Export all functionality
  const handleExportAll = () => {
    const exportData = {
      contents: homebrewContent.map(item => ({
        name: item.name,
        type: item.type,
        description: item.description,
        icon: item.icon,
        data: item.data,
        version: item.version,
      })),
      exportedAt: new Date().toISOString(),
      count: homebrewContent.length,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homebrew-${selectedType}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`${homebrewContent.length} itens exportados!`);
  };

  // Import functionality
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Handle single item or multiple items
        const items = data.contents || [data];
        
        for (const item of items) {
          if (!item.name || !item.type) {
            toast.error('Formato de arquivo inválido');
            return;
          }
          
          createHomebrew({
            type: item.type,
            name: item.name,
            description: item.description,
            icon: item.icon,
            data: item.data,
          });
        }
        
        toast.success(`${items.length} item(s) importado(s)!`);
      } catch (error) {
        toast.error('Erro ao importar arquivo');
      }
    };
    input.click();
  };

  const selectedTypeInfo = contentTypes.find(t => t.type === selectedType);
  const isAvailableType = true;

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
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all flex-shrink-0 min-w-fit",
                  isSelected 
                    ? `bg-gradient-to-r ${type.color} text-white shadow-lg` 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={`Buscar ${selectedTypeInfo?.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-10 w-10 flex-shrink-0",
              hasActiveFilters && "border-primary text-primary"
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleCreateClick}
            disabled={!isPremium || !isAvailableType}
            size="sm"
            className={cn(
              "h-10 px-3 gap-1.5 flex-shrink-0 whitespace-nowrap",
              isPremium 
                ? `bg-gradient-to-r ${selectedTypeInfo?.color} text-white` 
                : "bg-muted text-muted-foreground"
            )}
          >
            <Plus className="w-4 h-4" />
            <span>Criar</span>
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="glass rounded-xl p-4 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Filtros Avançados</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                  <X className="w-3 h-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
            
            {selectedType === 'spell' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nível</label>
                  <Select value={spellLevelFilter} onValueChange={setSpellLevelFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spellLevelOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Escola</label>
                  <Select value={spellSchoolFilter} onValueChange={setSpellSchoolFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spellSchoolOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {selectedType === 'item' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Raridade</label>
                <Select value={itemRarityFilter} onValueChange={setItemRarityFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemRarityOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedType !== 'spell' && selectedType !== 'item' && (
              <p className="text-xs text-muted-foreground">
                Filtros específicos disponíveis para Magias e Itens.
              </p>
            )}
          </div>
        )}

        {/* Stats & Actions */}
        {isPremium && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{homebrewCount} conteúdos criados</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                className="h-8 text-xs gap-1"
              >
                <Upload className="w-3 h-3" />
                Importar
              </Button>
              {homebrewContent.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAll}
                  className="h-8 text-xs gap-1"
                >
                  <Download className="w-3 h-3" />
                  Exportar Tudo
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg skeleton-go20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded skeleton-go20" />
                    <div className="h-3 w-48 rounded skeleton-go20" />
                  </div>
                </div>
              </div>
            ))}
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
                : `Nenhuma ${getSingularLabel(selectedTypeInfo?.label)} criada`
              }
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isPremium 
                ? `Clique em "Criar" para adicionar sua primeira ${getSingularLabel(selectedTypeInfo?.label)}` 
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
                onDuplicate={() => handleDuplicate(item)}
                onExport={() => handleExport(item)}
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
