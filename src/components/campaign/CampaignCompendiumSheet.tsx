import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCampaignHomebrew } from "@/hooks/useHomebrew";
import { 
  Sparkles, 
  Gem, 
  Users, 
  Skull, 
  BookOpen, 
  Star,
  Loader2,
  Library
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HomebrewContentType, HomebrewContent } from "@/types";

interface CampaignCompendiumSheetProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const contentTypes: { type: HomebrewContentType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'spell', label: 'Magias', icon: Sparkles, color: 'from-purple-500 to-purple-700' },
  { type: 'item', label: 'Itens', icon: Gem, color: 'from-amber-500 to-amber-700' },
  { type: 'race', label: 'Raças', icon: Users, color: 'from-blue-500 to-blue-700' },
  { type: 'monster', label: 'Monstros', icon: Skull, color: 'from-red-500 to-red-700' },
  { type: 'background', label: 'Antecedentes', icon: BookOpen, color: 'from-green-500 to-green-700' },
  { type: 'feat', label: 'Talentos', icon: Star, color: 'from-orange-500 to-orange-700' },
];

export function CampaignCompendiumSheet({ campaignId, open, onOpenChange }: CampaignCompendiumSheetProps) {
  const [selectedType, setSelectedType] = useState<HomebrewContentType>('spell');
  const { sharedContent, isLoading } = useCampaignHomebrew(campaignId);

  const homebrewContent = sharedContent.map(item => item.content);
  const filteredContent = homebrewContent.filter(item => item.type === selectedType);
  const selectedTypeInfo = contentTypes.find(t => t.type === selectedType);

  const renderContentDetails = (item: HomebrewContent) => {
    const data = item.data as Record<string, any>;
    
    switch (item.type) {
      case 'spell':
        return (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><strong>Nível:</strong> {data.level === 0 ? 'Truque' : data.level}</p>
            <p><strong>Escola:</strong> {data.school}</p>
            <p><strong>Tempo de Conjuração:</strong> {data.casting_time}</p>
            <p><strong>Alcance:</strong> {data.range}</p>
            {data.description && <p className="mt-2">{data.description}</p>}
          </div>
        );
      case 'item':
        return (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><strong>Tipo:</strong> {data.type || data.tipo}</p>
            <p><strong>Raridade:</strong> {data.rarity || data.raridade}</p>
            {data.damage && <p><strong>Dano:</strong> {data.damage}</p>}
            {data.ac && <p><strong>CA:</strong> {data.ac}</p>}
            {data.description && <p className="mt-2">{data.description}</p>}
          </div>
        );
      case 'race':
        return (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><strong>Tamanho:</strong> {data.size}</p>
            <p><strong>Velocidade:</strong> {data.speed}m</p>
            {data.darkvision && <p><strong>Visão no Escuro:</strong> {data.darkvision}m</p>}
            {data.traits && data.traits.length > 0 && (
              <div className="mt-2">
                <strong>Traços:</strong>
                <ul className="list-disc list-inside">
                  {data.traits.map((trait: any, idx: number) => (
                    <li key={idx}>{trait.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case 'monster':
        return (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><strong>ND:</strong> {data.challenge_rating || data.cr}</p>
            <p><strong>Tipo:</strong> {data.type || data.tipo}</p>
            <p><strong>PV:</strong> {data.hit_points || data.hp}</p>
            <p><strong>CA:</strong> {data.armor_class || data.ac}</p>
          </div>
        );
      case 'background':
        return (
          <div className="space-y-1 text-xs text-muted-foreground">
            {data.skill_proficiencies && (
              <p><strong>Perícias:</strong> {data.skill_proficiencies.join(', ')}</p>
            )}
            {data.tool_proficiencies && data.tool_proficiencies.length > 0 && (
              <p><strong>Ferramentas:</strong> {data.tool_proficiencies.join(', ')}</p>
            )}
            {data.languages && (
              <p><strong>Idiomas:</strong> {data.languages}</p>
            )}
            {data.feature_name && (
              <p className="mt-2"><strong>{data.feature_name}:</strong> {data.feature_description}</p>
            )}
          </div>
        );
      case 'feat':
        return (
          <div className="space-y-1 text-xs text-muted-foreground">
            {data.prerequisite && <p><strong>Pré-requisito:</strong> {data.prerequisite}</p>}
            {data.benefits && data.benefits.length > 0 && (
              <ul className="list-disc list-inside">
                {data.benefits.map((benefit: string, idx: number) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            )}
          </div>
        );
      default:
        return item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            Compêndio da Campanha
          </SheetTitle>
        </SheetHeader>

        {/* Content Type Tabs */}
        <div className="flex gap-2 overflow-x-auto p-4 pb-2 scrollbar-hide">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            const count = homebrewContent?.filter(item => item.type === type.type).length || 0;
            const isSelected = selectedType === type.type;
            return (
              <button
                key={type.type}
                onClick={() => setSelectedType(type.type)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl transition-all flex-shrink-0",
                  isSelected 
                    ? `bg-gradient-to-r ${type.color} text-white` 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{type.label}</span>
                {count > 0 && (
                  <Badge variant="secondary" className={cn(
                    "text-[10px] px-1.5",
                    isSelected ? "bg-white/20 text-white" : ""
                  )}>
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <ScrollArea className="h-[calc(85vh-140px)] px-4">
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
                Nenhum {selectedTypeInfo?.label.toLowerCase().slice(0, -1)} compartilhado
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                O mestre ainda não compartilhou conteúdo deste tipo com a campanha.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredContent.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-gradient-to-br",
                      selectedTypeInfo?.color
                    )}>
                      {item.icon || '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                          Homebrew
                        </Badge>
                      </div>
                      <div className="mt-2">
                        {renderContentDetails(item)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
