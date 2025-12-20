import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  useActiveEncounter, 
  useCombatants, 
  useCreateEncounter,
  useEndEncounter,
  useUpdateEncounter,
  useAddCombatant,
  useUpdateCombatant,
  useRemoveCombatant,
  Combatant
} from "@/hooks/useCombat";
import { 
  Swords, 
  Plus, 
  Play, 
  Square, 
  SkipForward, 
  Heart, 
  Shield,
  Trash2,
  Loader2,
  User,
  Skull,
  ChevronUp,
  ChevronDown,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CombatTrackerProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONDITIONS = [
  "Agarrado", "Amedrontado", "Atordoado", "Caído", "Cego",
  "Encantado", "Envenenado", "Exausto", "Incapacitado", 
  "Inconsciente", "Invisível", "Paralisado", "Petrificado", "Surdo"
];

export function CombatTracker({ campaignId, open, onOpenChange }: CombatTrackerProps) {
  const [showAddCombatant, setShowAddCombatant] = useState(false);
  const [newCombatant, setNewCombatant] = useState({
    name: "",
    initiative: 10,
    current_hp: 10,
    max_hp: 10,
    armor_class: 10,
    is_player: false,
  });

  const { data: encounter, isLoading: loadingEncounter } = useActiveEncounter(campaignId);
  const { data: combatants, isLoading: loadingCombatants } = useCombatants(encounter?.id || "");
  
  const createEncounter = useCreateEncounter();
  const endEncounter = useEndEncounter();
  const updateEncounter = useUpdateEncounter();
  const addCombatant = useAddCombatant();
  const updateCombatant = useUpdateCombatant();
  const removeCombatant = useRemoveCombatant();

  const isLoading = loadingEncounter || loadingCombatants;
  const sortedCombatants = [...(combatants || [])].sort((a, b) => b.initiative - a.initiative);
  const currentCombatant = sortedCombatants[encounter?.current_turn || 0];

  const handleStartCombat = async () => {
    await createEncounter.mutateAsync({
      campaignId,
      name: `Combate ${new Date().toLocaleDateString('pt-BR')}`,
    });
  };

  const handleEndCombat = async () => {
    if (encounter) {
      await endEncounter.mutateAsync(encounter.id);
    }
  };

  const handleNextTurn = async () => {
    if (!encounter || !combatants?.length) return;

    let nextTurn = (encounter.current_turn + 1) % combatants.length;
    let nextRound = encounter.round;

    if (nextTurn === 0) {
      nextRound += 1;
    }

    await updateEncounter.mutateAsync({
      id: encounter.id,
      current_turn: nextTurn,
      round: nextRound,
    });
  };

  const handleAddCombatant = async () => {
    if (!encounter || !newCombatant.name) return;

    await addCombatant.mutateAsync({
      encounter_id: encounter.id,
      name: newCombatant.name,
      initiative: newCombatant.initiative,
      current_hp: newCombatant.current_hp,
      max_hp: newCombatant.max_hp,
      armor_class: newCombatant.armor_class,
      is_player: newCombatant.is_player,
      conditions: [],
      character_id: null,
      notes: null,
      sort_order: 0,
    });

    setNewCombatant({
      name: "",
      initiative: 10,
      current_hp: 10,
      max_hp: 10,
      armor_class: 10,
      is_player: false,
    });
    setShowAddCombatant(false);
  };

  const handleHpChange = async (combatant: Combatant, delta: number) => {
    if (!encounter) return;
    const newHp = Math.max(0, Math.min(combatant.max_hp, combatant.current_hp + delta));
    await updateCombatant.mutateAsync({
      id: combatant.id,
      encounterId: encounter.id,
      current_hp: newHp,
    });
  };

  const toggleCondition = async (combatant: Combatant, condition: string) => {
    if (!encounter) return;
    const conditions = combatant.conditions.includes(condition)
      ? combatant.conditions.filter(c => c !== condition)
      : [...combatant.conditions, condition];
    
    await updateCombatant.mutateAsync({
      id: combatant.id,
      encounterId: encounter.id,
      conditions,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Swords className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <SheetTitle className="text-xl">Combat Tracker</SheetTitle>
                {encounter && (
                  <p className="text-sm text-muted-foreground">
                    Rodada {encounter.round} • Turno {(encounter.current_turn || 0) + 1}
                  </p>
                )}
              </div>
            </div>
            
            {encounter ? (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleEndCombat}
                disabled={endEncounter.isPending}
              >
                <Square className="w-4 h-4 mr-1" />
                Encerrar
              </Button>
            ) : (
              <Button 
                onClick={handleStartCombat}
                disabled={createEncounter.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {createEncounter.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Iniciar Combate
              </Button>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !encounter ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <Swords className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum combate ativo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Inicie um combate para rastrear iniciativa, HP e condições
            </p>
          </div>
        ) : (
          <>
            {/* Action Bar */}
            <div className="p-4 border-b border-border flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddCombatant(true)}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
              <Button 
                size="sm" 
                onClick={handleNextTurn}
                disabled={!combatants?.length}
                className="flex-1"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Próximo Turno
              </Button>
            </div>

            {/* Combatants List */}
            <ScrollArea className="h-[calc(90vh-220px)]">
              <div className="p-4 space-y-3">
                {sortedCombatants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Adicione combatentes para iniciar
                  </div>
                ) : (
                  sortedCombatants.map((combatant, index) => {
                    const isCurrentTurn = index === encounter.current_turn;
                    const isDead = combatant.current_hp === 0;
                    const hpPercent = (combatant.current_hp / combatant.max_hp) * 100;

                    return (
                      <div
                        key={combatant.id}
                        className={cn(
                          "rounded-xl p-4 border transition-all",
                          isCurrentTurn 
                            ? "bg-primary/10 border-primary" 
                            : "bg-card border-border",
                          isDead && "opacity-50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Initiative Badge */}
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
                            combatant.is_player 
                              ? "bg-blue-500/20 text-blue-500" 
                              : "bg-red-500/20 text-red-500"
                          )}>
                            {combatant.initiative}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold truncate">{combatant.name}</h4>
                              {combatant.is_player ? (
                                <User className="w-3 h-3 text-blue-500" />
                              ) : (
                                <Skull className="w-3 h-3 text-red-500" />
                              )}
                              {isCurrentTurn && (
                                <Badge variant="default" className="text-[10px] h-5">
                                  Turno Atual
                                </Badge>
                              )}
                            </div>

                            {/* HP Bar */}
                            <div className="mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Heart className="w-3 h-3 text-red-500" />
                                <span className="text-sm font-medium">
                                  {combatant.current_hp}/{combatant.max_hp}
                                </span>
                                <Shield className="w-3 h-3 text-blue-500 ml-2" />
                                <span className="text-sm">{combatant.armor_class}</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full transition-all",
                                    hpPercent > 50 ? "bg-green-500" :
                                    hpPercent > 25 ? "bg-yellow-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${hpPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Conditions */}
                            {combatant.conditions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {combatant.conditions.map(condition => (
                                  <Badge 
                                    key={condition} 
                                    variant="secondary"
                                    className="text-[10px] cursor-pointer"
                                    onClick={() => toggleCondition(combatant, condition)}
                                  >
                                    <Zap className="w-2 h-2 mr-1" />
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleHpChange(combatant, 1)}
                            >
                              <ChevronUp className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleHpChange(combatant, -1)}
                            >
                              <ChevronDown className="w-4 h-4 text-red-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeCombatant.mutate({ 
                                id: combatant.id, 
                                encounterId: encounter.id 
                              })}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Add Combatant Sheet */}
            <Sheet open={showAddCombatant} onOpenChange={setShowAddCombatant}>
              <SheetContent side="bottom" className="h-auto rounded-t-3xl">
                <SheetHeader className="mb-4">
                  <SheetTitle>Adicionar Combatente</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newCombatant.name}
                      onChange={(e) => setNewCombatant(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Goblin, Bandido..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Iniciativa</Label>
                      <Input
                        type="number"
                        value={newCombatant.initiative}
                        onChange={(e) => setNewCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CA</Label>
                      <Input
                        type="number"
                        value={newCombatant.armor_class}
                        onChange={(e) => setNewCombatant(prev => ({ ...prev, armor_class: parseInt(e.target.value) || 10 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>HP Atual</Label>
                      <Input
                        type="number"
                        value={newCombatant.current_hp}
                        onChange={(e) => {
                          const hp = parseInt(e.target.value) || 0;
                          setNewCombatant(prev => ({ 
                            ...prev, 
                            current_hp: hp,
                            max_hp: Math.max(hp, prev.max_hp)
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HP Máximo</Label>
                      <Input
                        type="number"
                        value={newCombatant.max_hp}
                        onChange={(e) => setNewCombatant(prev => ({ ...prev, max_hp: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={newCombatant.is_player ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setNewCombatant(prev => ({ ...prev, is_player: true }))}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Jogador
                    </Button>
                    <Button
                      variant={!newCombatant.is_player ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setNewCombatant(prev => ({ ...prev, is_player: false }))}
                    >
                      <Skull className="w-4 h-4 mr-2" />
                      Monstro/NPC
                    </Button>
                  </div>

                  <Button 
                    onClick={handleAddCombatant} 
                    className="w-full"
                    disabled={!newCombatant.name || addCombatant.isPending}
                  >
                    {addCombatant.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Adicionar
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
