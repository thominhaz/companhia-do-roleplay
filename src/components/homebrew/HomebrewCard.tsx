import { Edit, Trash2, Share2, Sparkles, Gem, Users, Copy, Download, Sword, Star, Skull, BookOpen, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HomebrewContent, HomebrewSpellData, HomebrewItemData } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HomebrewCardProps {
  item: HomebrewContent;
  onEdit: () => void;
  onDelete: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
}

const rarityColors: Record<string, string> = {
  common: "text-muted-foreground border-muted-foreground/30",
  uncommon: "text-green-500 border-green-500/30",
  rare: "text-blue-500 border-blue-500/30",
  very_rare: "text-purple-500 border-purple-500/30",
  legendary: "text-orange-500 border-orange-500/30",
  artifact: "text-red-500 border-red-500/30",
};

const rarityLabels: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  very_rare: "Muito Raro",
  legendary: "Lendário",
  artifact: "Artefato",
};

const schoolLabels: Record<string, string> = {
  abjuration: "Abjuração",
  conjuration: "Conjuração",
  divination: "Adivinhação",
  enchantment: "Encantamento",
  evocation: "Evocação",
  illusion: "Ilusão",
  necromancy: "Necromancia",
  transmutation: "Transmutação",
};

export function HomebrewCard({ item, onEdit, onDelete, onShare, onDuplicate, onExport }: HomebrewCardProps) {
  const isSpell = item.type === 'spell';
  const isItem = item.type === 'item';
  const isRace = item.type === 'race';
  const isClass = item.type === 'class';
  const isSubclass = item.type === 'subclass';
  const isMonster = item.type === 'monster';
  const isBackground = item.type === 'background';
  const isFeat = item.type === 'feat';
  
  const spellData = isSpell ? (item.data as HomebrewSpellData) : null;
  const itemData = isItem ? (item.data as HomebrewItemData) : null;

  // Fetch share count for this item
  const { data: shareCount = 0 } = useQuery({
    queryKey: ['homebrew-share-count', item.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('homebrew_shares')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', item.id);
      
      if (error) return 0;
      return count || 0;
    },
  });

  const getTypeIcon = () => {
    if (isSpell) return <Sparkles className="w-4 h-4" />;
    if (isItem) return <Gem className="w-4 h-4" />;
    if (isRace) return <Users className="w-4 h-4" />;
    if (isClass) return <Sword className="w-4 h-4" />;
    if (isSubclass) return <Star className="w-4 h-4" />;
    if (isMonster) return <Skull className="w-4 h-4" />;
    if (isBackground) return <BookOpen className="w-4 h-4" />;
    if (isFeat) return <Crown className="w-4 h-4" />;
    return null;
  };

  const getTypeColor = () => {
    if (isSpell) return "from-purple-500/20 to-purple-700/20 border-purple-500/30";
    if (isItem) return "from-amber-500/20 to-amber-700/20 border-amber-500/30";
    if (isRace) return "from-blue-500/20 to-blue-700/20 border-blue-500/30";
    if (isClass) return "from-red-500/20 to-red-700/20 border-red-500/30";
    if (isSubclass) return "from-pink-500/20 to-pink-700/20 border-pink-500/30";
    if (isMonster) return "from-gray-500/20 to-gray-700/20 border-gray-500/30";
    if (isBackground) return "from-green-500/20 to-green-700/20 border-green-500/30";
    if (isFeat) return "from-orange-500/20 to-orange-700/20 border-orange-500/30";
    return "from-muted to-muted border-border";
  };

  const getSubtitle = () => {
    if (isSpell && spellData) {
      const level = spellData.level === 0 ? "Truque" : `${spellData.level}º Nível`;
      const school = schoolLabels[spellData.school] || spellData.school;
      return `${level} • ${school}`;
    }
    if (isItem && itemData) {
      return rarityLabels[itemData.rarity] || itemData.rarity;
    }
    if (isRace) {
      const raceData = item.data as any;
      return raceData?.size ? `${raceData.size} • ${raceData.speed || 30}ft` : 'Raça';
    }
    if (isClass) {
      const classData = item.data as any;
      return classData?.hit_die ? `d${classData.hit_die}` : 'Classe';
    }
    if (isSubclass) {
      const subclassData = item.data as any;
      return subclassData?.parent_class || 'Subclasse';
    }
    if (isMonster) {
      const monsterData = item.data as any;
      return monsterData?.challenge_rating ? `ND ${monsterData.challenge_rating}` : 'Monstro';
    }
    if (isBackground) return 'Antecedente';
    if (isFeat) return 'Talento';
    return "";
  };

  return (
    <div 
      className={cn(
        "glass rounded-xl p-4 border bg-gradient-to-br",
        getTypeColor()
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-2xl">
          {item.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">
              {item.name}
            </h3>
            {isItem && itemData && (
              <Badge 
                variant="outline" 
                className={cn("text-[10px]", rarityColors[itemData.rarity])}
              >
                {rarityLabels[itemData.rarity]}
              </Badge>
            )}
            {shareCount > 0 && (
              <Badge 
                variant="outline" 
                className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"
              >
                <Users className="w-2.5 h-2.5 mr-0.5" />
                {shareCount}
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            {getTypeIcon()}
            {getSubtitle()}
          </p>

          {item.description && (
            <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Spell specific info */}
          {isSpell && spellData && (
            <div className="flex flex-wrap gap-2 mt-2">
              {spellData.casting_time && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {spellData.casting_time}
                </span>
              )}
              {spellData.range && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {spellData.range}
                </span>
              )}
              {spellData.duration && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {spellData.duration}
                </span>
              )}
            </div>
          )}

          {/* Item specific info */}
          {isItem && itemData && (
            <div className="flex flex-wrap gap-2 mt-2">
              {itemData.requires_attunement && (
                <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                  Sintonização
                </span>
              )}
              {itemData.damage && (
                <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                  {itemData.damage} {itemData.damage_type}
                </span>
              )}
              {itemData.ac_bonus && (
                <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                  +{itemData.ac_bonus} CA
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={onEdit}
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={onDuplicate}
              title="Duplicar"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
          {onExport && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={onExport}
              title="Exportar"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          {onShare && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-8 h-8",
                shareCount > 0 && "text-green-400"
              )}
              onClick={onShare}
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
