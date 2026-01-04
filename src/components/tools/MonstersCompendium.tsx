import { useState, useMemo } from "react";
import { 
  loadAllMonsters, 
  Monster, 
  parseChallengeRating, 
  extractMonsterType,
  extractMonsterSize,
  getUniqueChallengeRatings,
  getUniqueTypes
} from "@/data/monsters";
import { MonsterCard } from "./MonsterCard";
import { MonsterDetailSheet } from "./MonsterDetailSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Search, Filter, X, Skull } from "lucide-react";

interface MonstersCompendiumProps {
  onSelectForCombat?: (monster: Monster) => void;
}

export function MonstersCompendium({ onSelectForCombat }: MonstersCompendiumProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCR, setSelectedCR] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const allMonsters = useMemo(() => loadAllMonsters(), []);
  const challengeRatings = useMemo(() => getUniqueChallengeRatings(allMonsters), [allMonsters]);
  const monsterTypes = useMemo(() => getUniqueTypes(allMonsters), [allMonsters]);

  const sizes = ["Miúdo", "Pequeno", "Médio", "Grande", "Enorme", "Colossal"];

  const filteredMonsters = useMemo(() => {
    return allMonsters.filter(monster => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!monster.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // CR filter
      if (selectedCR) {
        const crMatch = monster.challenge.match(/^([\d\/]+)/);
        if (!crMatch || crMatch[1] !== selectedCR) {
          return false;
        }
      }

      // Type filter
      if (selectedType) {
        if (extractMonsterType(monster.meta) !== selectedType) {
          return false;
        }
      }

      // Size filter
      if (selectedSize) {
        if (extractMonsterSize(monster.meta) !== selectedSize) {
          return false;
        }
      }

      return true;
    });
  }, [allMonsters, searchQuery, selectedCR, selectedType, selectedSize]);

  const activeFiltersCount = [selectedCR, selectedType, selectedSize].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCR(null);
    setSelectedType(null);
    setSelectedSize(null);
  };

  const handleMonsterClick = (monster: Monster) => {
    setSelectedMonster(monster);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar monstro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Filtros
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* CR Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Nível de Desafio</h4>
                <div className="flex flex-wrap gap-2">
                  {challengeRatings.map(cr => (
                    <Badge
                      key={cr}
                      variant={selectedCR === cr ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCR(selectedCR === cr ? null : cr)}
                    >
                      {cr}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Tipo</h4>
                <div className="flex flex-wrap gap-2">
                  {monsterTypes.map(type => (
                    <Badge
                      key={type}
                      variant={selectedType === type ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedType(selectedType === type ? null : type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Tamanho</h4>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <Badge
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                    >
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-border/50">
          {selectedCR && (
            <Badge variant="secondary" className="gap-1">
              ND: {selectedCR}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCR(null)} />
            </Badge>
          )}
          {selectedType && (
            <Badge variant="secondary" className="gap-1">
              {selectedType}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedType(null)} />
            </Badge>
          )}
          {selectedSize && (
            <Badge variant="secondary" className="gap-1">
              {selectedSize}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSize(null)} />
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="px-4 py-2 text-sm text-muted-foreground">
        {filteredMonsters.length} monstro{filteredMonsters.length !== 1 ? 's' : ''} encontrado{filteredMonsters.length !== 1 ? 's' : ''}
      </div>

      {/* Monster List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-4">
          {filteredMonsters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Skull className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum monstro encontrado</p>
              <p className="text-sm">Tente ajustar os filtros</p>
            </div>
          ) : (
            filteredMonsters.map((monster) => (
              <MonsterCard
                key={monster.name}
                monster={monster}
                onClick={() => handleMonsterClick(monster)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Monster Detail Sheet */}
      <MonsterDetailSheet
        monster={selectedMonster}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
