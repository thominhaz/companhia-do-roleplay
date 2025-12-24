import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Search, Sparkles, Clock, Target, BookOpen, Focus, Scroll, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// New unified spell interface based on magias.json
interface Spell {
  name: string;
  originalName: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string;
  };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels: string | null;
  classes: string[];
}

const SCHOOLS: Record<string, { name: string; color: string }> = {
  "Abjuração": { name: "Abjuração", color: "bg-blue-500/20 text-blue-400" },
  "Conjuração": { name: "Conjuração", color: "bg-yellow-500/20 text-yellow-400" },
  "Adivinhação": { name: "Adivinhação", color: "bg-cyan-500/20 text-cyan-400" },
  "Encantamento": { name: "Encantamento", color: "bg-pink-500/20 text-pink-400" },
  "Evocação": { name: "Evocação", color: "bg-red-500/20 text-red-400" },
  "Ilusão": { name: "Ilusão", color: "bg-purple-500/20 text-purple-400" },
  "Necromancia": { name: "Necromancia", color: "bg-green-500/20 text-green-400" },
  "Transmutação": { name: "Transmutação", color: "bg-orange-500/20 text-orange-400" },
};

const LEVELS = [
  { value: 0, label: "Truque" },
  { value: 1, label: "1º Círculo" },
  { value: 2, label: "2º Círculo" },
  { value: 3, label: "3º Círculo" },
  { value: 4, label: "4º Círculo" },
  { value: 5, label: "5º Círculo" },
  { value: 6, label: "6º Círculo" },
  { value: 7, label: "7º Círculo" },
  { value: 8, label: "8º Círculo" },
  { value: 9, label: "9º Círculo" },
];

// Spellcaster classes with their spell lists
const SPELLCASTER_CLASSES = [
  { id: 'Mago', name: 'Mago' },
  { id: 'Clérigo', name: 'Clérigo' },
  { id: 'Druida', name: 'Druida' },
  { id: 'Bardo', name: 'Bardo' },
  { id: 'Paladino', name: 'Paladino' },
  { id: 'Patrulheiro', name: 'Patrulheiro' },
  { id: 'Feiticeiro', name: 'Feiticeiro' },
  { id: 'Bruxo', name: 'Bruxo' },
];

export function SpellGrimoire() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showConcentration, setShowConcentration] = useState<boolean | null>(null);
  const [showRitual, setShowRitual] = useState<boolean | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [allSpells, setAllSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpells = async () => {
      try {
        const mod = await import("@/data/spells/magias.json");
        const spells = mod.default as Spell[];
        setAllSpells(spells);
      } catch (error) {
        console.error("Error loading spells:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSpells();
  }, []);

  const filteredSpells = useMemo(() => {
    return allSpells.filter((spell) => {
      const matchesSearch =
        search === "" ||
        spell.name.toLowerCase().includes(search.toLowerCase()) ||
        spell.originalName.toLowerCase().includes(search.toLowerCase());

      const matchesLevel = selectedLevel === null || spell.level === selectedLevel;
      const matchesSchool = selectedSchool === null || spell.school === selectedSchool;
      const matchesConcentration = showConcentration === null || spell.concentration === showConcentration;
      const matchesRitual = showRitual === null || spell.ritual === showRitual;
      
      // Filter by class - check if spell's classes array includes selected class
      const matchesClass = selectedClass === null || 
        (spell.classes && spell.classes.some(c => c === selectedClass));

      return matchesSearch && matchesLevel && matchesSchool && matchesConcentration && matchesRitual && matchesClass;
    }).sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }, [search, selectedLevel, selectedSchool, showConcentration, showRitual, selectedClass, allSpells]);

  const getComponentsString = (components: Spell["components"]) => {
    const parts = [];
    if (components.verbal) parts.push("V");
    if (components.somatic) parts.push("S");
    if (components.material) parts.push("M");
    return parts.join(", ");
  };

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Grimório</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? "Carregando..." : `${allSpells.length} magias disponíveis`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar magia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Level Filter */}
        <div className="px-4 pb-3">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2">
              <Button
                variant={selectedLevel === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(null)}
              >
                Todos
              </Button>
              {LEVELS.map((level) => (
                <Button
                  key={level.value}
                  variant={selectedLevel === level.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLevel(selectedLevel === level.value ? null : level.value)}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* School Filter */}
        <div className="px-4 pb-3">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2">
              {Object.entries(SCHOOLS).map(([key, school]) => (
                <Button
                  key={key}
                  variant={selectedSchool === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSchool(selectedSchool === key ? null : key)}
                >
                  {school.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Class Filter */}
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2">Classe Conjuradora</p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2">
              <Button
                variant={selectedClass === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedClass(null)}
              >
                Todas
              </Button>
              {SPELLCASTER_CLASSES.map((cls) => (
                <Button
                  key={cls.id}
                  variant={selectedClass === cls.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedClass(selectedClass === cls.id ? null : cls.id)}
                >
                  {cls.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Tags Filter */}
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <Button
              variant={showConcentration === true ? "default" : "outline"}
              size="sm"
              onClick={() => setShowConcentration(showConcentration === true ? null : true)}
            >
              <Focus className="w-4 h-4 mr-1" />
              Concentração
            </Button>
            <Button
              variant={showRitual === true ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRitual(showRitual === true ? null : true)}
            >
              <Scroll className="w-4 h-4 mr-1" />
              Ritual
            </Button>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        <p className="text-xs text-muted-foreground mb-3">
          {filteredSpells.length} magia{filteredSpells.length !== 1 ? "s" : ""} encontrada{filteredSpells.length !== 1 ? "s" : ""}
        </p>

        <div className="space-y-2">
          {filteredSpells.map((spell, index) => (
            <button
              key={`${spell.name}-${index}`}
              onClick={() => setSelectedSpell(spell)}
              className={cn(
                "w-full glass rounded-xl p-3 text-left",
                "hover:border-primary/50 transition-all animate-fade-in"
              )}
              style={{ animationDelay: `${Math.min(index * 0.02, 0.3)}s` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {spell.name}
                    </h3>
                    {spell.concentration && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        C
                      </span>
                    )}
                    {spell.ritual && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                        R
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {spell.level === 0 ? "Truque" : `${spell.level}º Círculo`} •{" "}
                    {spell.school}
                  </p>
                </div>
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
              </div>
            </button>
          ))}
        </div>

        {filteredSpells.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhuma magia encontrada</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Tente ajustar os filtros
            </p>
          </div>
        )}
      </main>

      {/* Spell Detail Sheet */}
      <Sheet open={!!selectedSpell} onOpenChange={() => setSelectedSpell(null)}>
        <SheetContent side="bottom" className="bg-dark border-border h-[85vh]">
          {selectedSpell && (
            <ScrollArea className="h-full pr-4">
              <SheetHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-left text-lg">{selectedSpell.name}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{selectedSpell.originalName}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedSpell.level === 0 ? "Truque" : `${selectedSpell.level}º Círculo`}
                      </Badge>
                      <Badge className={cn("text-xs", SCHOOLS[selectedSpell.school]?.color)}>
                        {selectedSpell.school}
                      </Badge>
                      {selectedSpell.concentration && (
                        <Badge className="text-xs bg-yellow-500/20 text-yellow-400">
                          Concentração
                        </Badge>
                      )}
                      {selectedSpell.ritual && (
                        <Badge className="text-xs bg-blue-500/20 text-blue-400">
                          Ritual
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Spell Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">Tempo</span>
                  </div>
                  <p className="text-sm font-medium">{selectedSpell.castingTime}</p>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-xs">Alcance</span>
                  </div>
                  <p className="text-sm font-medium">{selectedSpell.range}</p>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs">Componentes</span>
                  </div>
                  <p className="text-sm font-medium">
                    {getComponentsString(selectedSpell.components)}
                  </p>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">Duração</span>
                  </div>
                  <p className="text-sm font-medium">{selectedSpell.duration}</p>
                </div>
              </div>

              {/* Material Components */}
              {selectedSpell.components.material && selectedSpell.components.materialDescription && (
                <div className="glass rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Componente Material</p>
                  <p className="text-sm">{selectedSpell.components.materialDescription}</p>
                </div>
              )}

              {/* Classes */}
              {selectedSpell.classes && selectedSpell.classes.length > 0 && (
                <div className="glass rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs">Classes</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedSpell.classes.map((cls) => (
                      <Badge key={cls} variant="outline" className="text-xs">
                        {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Descrição</h3>
                </div>
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedSpell.description}
                  </p>
                </div>
              </div>

              {/* At Higher Levels */}
              {selectedSpell.higherLevels && (
                <div className="glass rounded-lg p-3 mb-6">
                  <p className="text-xs text-primary font-medium mb-1">Em Níveis Superiores</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSpell.higherLevels}
                  </p>
                </div>
              )}
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
