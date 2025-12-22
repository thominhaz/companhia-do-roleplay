import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAddCombatLog } from "@/hooks/useCombatLogs";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";
import { useCampaignHomebrew } from "@/hooks/useHomebrew";
import { CombatLogPanel } from "./CombatLogPanel";
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
  Zap,
  Minus,
  AlertTriangle,
  RotateCcw,
  ScrollText,
  Gem
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CombatTrackerProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONDITIONS = [
  { name: "Agarrado", icon: "🪢", color: "bg-orange-500/20 text-orange-400" },
  { name: "Amedrontado", icon: "😨", color: "bg-purple-500/20 text-purple-400" },
  { name: "Atordoado", icon: "💫", color: "bg-yellow-500/20 text-yellow-400" },
  { name: "Caído", icon: "⬇️", color: "bg-gray-500/20 text-gray-400" },
  { name: "Cego", icon: "👁️", color: "bg-slate-500/20 text-slate-400" },
  { name: "Encantado", icon: "💕", color: "bg-pink-500/20 text-pink-400" },
  { name: "Envenenado", icon: "☠️", color: "bg-green-500/20 text-green-400" },
  { name: "Exausto", icon: "😫", color: "bg-amber-500/20 text-amber-400" },
  { name: "Incapacitado", icon: "🚫", color: "bg-red-500/20 text-red-400" },
  { name: "Inconsciente", icon: "💤", color: "bg-indigo-500/20 text-indigo-400" },
  { name: "Invisível", icon: "👻", color: "bg-cyan-500/20 text-cyan-400" },
  { name: "Paralisado", icon: "🧊", color: "bg-blue-500/20 text-blue-400" },
  { name: "Petrificado", icon: "🗿", color: "bg-stone-500/20 text-stone-400" },
  { name: "Surdo", icon: "🔇", color: "bg-rose-500/20 text-rose-400" },
];

interface HpDialogState {
  open: boolean;
  combatant: Combatant | null;
  mode: 'damage' | 'heal';
}

export function CombatTracker({ campaignId, open, onOpenChange }: CombatTrackerProps) {
  const { user } = useAuth();
  const [showAddCombatant, setShowAddCombatant] = useState(false);
  const [hpDialog, setHpDialog] = useState<HpDialogState>({ open: false, combatant: null, mode: 'damage' });
  const [hpAmount, setHpAmount] = useState("");
  const [combatantType, setCombatantType] = useState<'monster' | 'npc' | 'player' | 'homebrew'>('monster');
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedHomebrewMonster, setSelectedHomebrewMonster] = useState("");
  const [activeTab, setActiveTab] = useState<'combatants' | 'log'>('combatants');
  const [newCombatant, setNewCombatant] = useState({
    name: "",
    initiative: 10,
    current_hp: 10,
    max_hp: 10,
    armor_class: 10,
    is_player: false,
    character_id: null as string | null,
  });

  // Fetch campaign players for the player selection
  const { data: campaignPlayers } = useCampaignPlayers(campaignId);
  
  // Fetch homebrew monsters shared with this campaign
  const { data: campaignHomebrew } = useCampaignHomebrew(campaignId);
  const homebrewMonsters = useMemo(() => 
    campaignHomebrew?.filter(h => h.type === 'monster') || [], 
    [campaignHomebrew]
  );

  // Fetch campaign players for the player selection
  const { data: campaignPlayers } = useCampaignPlayers(campaignId);
  
  // Filter only players with characters (not master)
  const playersWithCharacters = campaignPlayers?.filter(
    p => p.role === 'player' && p.character_id && p.character
  ) || [];

  // Find current user's combatant (for players to edit their own HP)
  const userCharacterId = campaignPlayers?.find(p => p.user_id === user?.id)?.character_id;

  const { data: encounter, isLoading: loadingEncounter } = useActiveEncounter(campaignId);
  const { data: combatants, isLoading: loadingCombatants } = useCombatants(encounter?.id || "");
  
  const createEncounter = useCreateEncounter();
  const endEncounter = useEndEncounter();
  const updateEncounter = useUpdateEncounter();
  const addCombatant = useAddCombatant();
  const updateCombatant = useUpdateCombatant();
  const removeCombatant = useRemoveCombatant();
  const addCombatLog = useAddCombatLog();

  const isLoading = loadingEncounter || loadingCombatants;
  const sortedCombatants = [...(combatants || [])].sort((a, b) => b.initiative - a.initiative);
  const currentCombatant = sortedCombatants[encounter?.current_turn || 0];
  
  // Check if current user is the master
  const isMaster = campaignPlayers?.some(p => p.user_id === user?.id && p.role === 'master') ?? false;

  const handleStartCombat = async () => {
    const newEncounter = await createEncounter.mutateAsync({
      campaignId,
      name: `Combate ${new Date().toLocaleDateString('pt-BR')}`,
    });
    
    // Log combat start
    await addCombatLog.mutateAsync({
      encounter_id: newEncounter.id,
      combatant_id: null,
      action_type: 'combat_start',
      value: null,
      details: null,
      combatant_name: null,
    });
  };

  const handleEndCombat = async () => {
    if (encounter) {
      // Log combat end
      await addCombatLog.mutateAsync({
        encounter_id: encounter.id,
        combatant_id: null,
        action_type: 'combat_end',
        value: null,
        details: null,
        combatant_name: null,
      });
      
      await endEncounter.mutateAsync(encounter.id);
    }
  };

  const handleNextTurn = async () => {
    if (!encounter || !combatants?.length) return;

    let nextTurn = (encounter.current_turn + 1) % sortedCombatants.length;
    let nextRound = encounter.round;

    if (nextTurn === 0) {
      nextRound += 1;
    }

    await updateEncounter.mutateAsync({
      id: encounter.id,
      current_turn: nextTurn,
      round: nextRound,
    });
    
    // Log turn start for next combatant
    const nextCombatant = sortedCombatants[nextTurn];
    if (nextCombatant) {
      await addCombatLog.mutateAsync({
        encounter_id: encounter.id,
        combatant_id: nextCombatant.id,
        action_type: 'turn_start',
        value: null,
        details: `Rodada ${nextRound}`,
        combatant_name: nextCombatant.name,
      });
    }
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
      character_id: newCombatant.character_id,
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
      character_id: null,
    });
    setCombatantType('monster');
    setSelectedPlayerId("");
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

  const handleApplyHpChange = async () => {
    if (!hpDialog.combatant || !encounter || !hpAmount) return;
    const amount = parseInt(hpAmount) || 0;
    const delta = hpDialog.mode === 'damage' ? -amount : amount;
    const newHp = Math.max(0, Math.min(hpDialog.combatant.max_hp, hpDialog.combatant.current_hp + delta));
    
    await updateCombatant.mutateAsync({
      id: hpDialog.combatant.id,
      encounterId: encounter.id,
      current_hp: newHp,
    });
    
    // Log the HP change
    await addCombatLog.mutateAsync({
      encounter_id: encounter.id,
      combatant_id: hpDialog.combatant.id,
      action_type: hpDialog.mode === 'damage' ? 'damage' : 'heal',
      value: amount,
      details: null,
      combatant_name: hpDialog.combatant.name,
    });
    
    setHpDialog({ open: false, combatant: null, mode: 'damage' });
    setHpAmount("");
  };

  const toggleCondition = async (combatant: Combatant, condition: string) => {
    if (!encounter) return;
    const isAdding = !combatant.conditions.includes(condition);
    const conditions = isAdding
      ? [...combatant.conditions, condition]
      : combatant.conditions.filter(c => c !== condition);
    
    await updateCombatant.mutateAsync({
      id: combatant.id,
      encounterId: encounter.id,
      conditions,
    });
    
    // Log condition change
    await addCombatLog.mutateAsync({
      encounter_id: encounter.id,
      combatant_id: combatant.id,
      action_type: isAdding ? 'condition_add' : 'condition_remove',
      value: null,
      details: condition,
      combatant_name: combatant.name,
    });
  };

  const handlePreviousTurn = async () => {
    if (!encounter || !combatants?.length) return;

    let prevTurn = encounter.current_turn - 1;
    let prevRound = encounter.round;

    if (prevTurn < 0) {
      if (prevRound > 1) {
        prevTurn = combatants.length - 1;
        prevRound -= 1;
      } else {
        return; // Can't go back before round 1, turn 0
      }
    }

    await updateEncounter.mutateAsync({
      id: encounter.id,
      current_turn: prevTurn,
      round: prevRound,
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
            {/* Action Bar - Only show for masters */}
            {isMaster && (
              <div className="p-4 border-b border-border flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddCombatant(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={handlePreviousTurn}
                  disabled={!combatants?.length || (encounter.round === 1 && encounter.current_turn === 0)}
                >
                  <RotateCcw className="w-4 h-4" />
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
            )}

            {/* Tabs for Combatants and Log */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'combatants' | 'log')} className="flex-1 flex flex-col">
              <div className="px-4 pt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="combatants" className="flex-1">
                    <Swords className="w-4 h-4 mr-1" />
                    Combatentes
                  </TabsTrigger>
                  <TabsTrigger value="log" className="flex-1">
                    <ScrollText className="w-4 h-4 mr-1" />
                    Histórico
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="combatants" className="flex-1 mt-0">
                {/* Combatants List */}
                <ScrollArea className="h-[calc(90vh-280px)]">
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
                        // Check if this combatant belongs to the current user
                        const isOwnCombatant = combatant.character_id === userCharacterId;
                        // Allow editing if master or own combatant
                        const canEditHp = isMaster || isOwnCombatant;

                        return (
                          <div
                            key={combatant.id}
                            className={cn(
                              "rounded-xl p-4 border transition-all",
                              isCurrentTurn 
                                ? "bg-primary/10 border-primary" 
                                : "bg-card border-border",
                              isDead && "opacity-50",
                              isOwnCombatant && !isMaster && "ring-2 ring-blue-500/50"
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
                            <div className="flex flex-wrap gap-1 mt-2">
                              {combatant.conditions.map(condition => {
                                const condData = CONDITIONS.find(c => c.name === condition);
                                return (
                                  <Badge 
                                    key={condition} 
                                    variant="secondary"
                                    className={cn("text-[10px] cursor-pointer", condData?.color)}
                                    onClick={() => toggleCondition(combatant, condition)}
                                  >
                                    <span className="mr-1">{condData?.icon || "⚡"}</span>
                                    {condition}
                                  </Badge>
                                );
                              })}
                              
                              {/* Add Condition Popover */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className="text-[10px] cursor-pointer hover:bg-muted"
                                  >
                                    <Plus className="w-2 h-2 mr-1" />
                                    Condição
                                  </Badge>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-2" align="start">
                                  <div className="grid grid-cols-2 gap-1">
                                    {CONDITIONS.map(cond => (
                                      <Button
                                        key={cond.name}
                                        variant={combatant.conditions.includes(cond.name) ? "default" : "ghost"}
                                        size="sm"
                                        className="justify-start text-xs h-8"
                                        onClick={() => toggleCondition(combatant, cond.name)}
                                      >
                                        <span className="mr-1">{cond.icon}</span>
                                        {cond.name}
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>

                              {/* Actions - Only show for masters or own combatant */}
                              {canEditHp && (
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-green-500/10 hover:bg-green-500/20"
                                    onClick={() => {
                                      setHpDialog({ open: true, combatant, mode: 'heal' });
                                      setHpAmount("");
                                    }}
                                  >
                                    <Plus className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20"
                                    onClick={() => {
                                      setHpDialog({ open: true, combatant, mode: 'damage' });
                                      setHpAmount("");
                                    }}
                                  >
                                    <Minus className="w-4 h-4 text-red-500" />
                                  </Button>
                                  {isMaster && (
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
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="log" className="flex-1 mt-0 p-4">
                <CombatLogPanel encounterId={encounter.id} />
              </TabsContent>
            </Tabs>

            {/* Add Combatant Sheet */}
            <Sheet open={showAddCombatant} onOpenChange={(open) => {
              setShowAddCombatant(open);
              if (!open) {
                setCombatantType('monster');
                setSelectedPlayerId("");
                setNewCombatant({
                  name: "",
                  initiative: 10,
                  current_hp: 10,
                  max_hp: 10,
                  armor_class: 10,
                  is_player: false,
                  character_id: null,
                });
              }
            }}>
              <SheetContent side="bottom" className="h-auto rounded-t-3xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>Adicionar Combatente</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-4">
                  {/* Combatant Type Selection */}
                  <div className="space-y-2">
                    <Label>Tipo de Combatente</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={combatantType === 'monster' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          setCombatantType('monster');
                          setSelectedPlayerId("");
                          setSelectedHomebrewMonster("");
                          setNewCombatant(prev => ({ 
                            ...prev, 
                            is_player: false, 
                            character_id: null,
                            name: "",
                            initiative: 10,
                            current_hp: 10,
                            max_hp: 10,
                            armor_class: 10,
                          }));
                        }}
                      >
                        <Skull className="w-4 h-4 mr-1" />
                        Monstro
                      </Button>
                      <Button
                        variant={combatantType === 'homebrew' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          setCombatantType('homebrew');
                          setSelectedPlayerId("");
                          setSelectedHomebrewMonster("");
                        }}
                        disabled={homebrewMonsters.length === 0}
                      >
                        <Gem className="w-4 h-4 mr-1" />
                        Homebrew
                      </Button>
                      <Button
                        variant={combatantType === 'npc' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          setCombatantType('npc');
                          setSelectedPlayerId("");
                          setSelectedHomebrewMonster("");
                          setNewCombatant(prev => ({ 
                            ...prev, 
                            is_player: false, 
                            character_id: null,
                            name: "",
                          }));
                        }}
                      >
                        <User className="w-4 h-4 mr-1" />
                        NPC
                      </Button>
                      <Button
                        variant={combatantType === 'player' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          setCombatantType('player');
                          setSelectedPlayerId("");
                          setSelectedHomebrewMonster("");
                          setNewCombatant(prev => ({ 
                            ...prev, 
                            is_player: true, 
                            character_id: null,
                            name: "",
                          }));
                        }}
                      >
                        <User className="w-4 h-4 mr-1" />
                        Jogador
                      </Button>
                    </div>
                  </div>

                  {/* Homebrew Monster Selection */}
                  {combatantType === 'homebrew' && (
                    <div className="space-y-2">
                      <Label>Selecionar Monstro Homebrew</Label>
                      <Select 
                        value={selectedHomebrewMonster} 
                        onValueChange={(value) => {
                          setSelectedHomebrewMonster(value);
                          const monster = homebrewMonsters.find(m => m.id === value);
                          if (monster) {
                            const monsterData = monster.data as any;
                            setNewCombatant({
                              name: `${monster.icon || '👹'} ${monster.name}`,
                              initiative: 10,
                              current_hp: monsterData?.hp || monsterData?.hit_points || 10,
                              max_hp: monsterData?.hp || monsterData?.hit_points || 10,
                              armor_class: monsterData?.ac || monsterData?.armor_class || 10,
                              is_player: false,
                              character_id: null,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="bg-muted/50 border-0">
                          <SelectValue placeholder="Selecione um monstro" />
                        </SelectTrigger>
                        <SelectContent>
                          {homebrewMonsters.map(monster => {
                            const monsterData = monster.data as any;
                            return (
                              <SelectItem key={monster.id} value={monster.id}>
                                <div className="flex items-center gap-2">
                                  <span>{monster.icon || '👹'}</span>
                                  <span className="font-medium">{monster.name}</span>
                                  <span className="text-muted-foreground text-sm">
                                    - CR {monsterData?.cr || monsterData?.challenge_rating || '?'}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      {selectedHomebrewMonster && (
                        <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span>{newCombatant.max_hp} HP</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-500" />
                              <span>CA {newCombatant.armor_class}</span>
                            </div>
                          </div>
                          <div className="mt-2 space-y-2">
                            <Label>Iniciativa</Label>
                            <Input
                              type="number"
                              value={newCombatant.initiative}
                              onChange={(e) => setNewCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )

                  }

                  {/* Manual fields for Monster/NPC */}
                    <div className="space-y-2">
                      <Label>Selecionar Jogador da Campanha</Label>
                      {playersWithCharacters.length === 0 ? (
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Nenhum jogador com personagem vinculado nesta campanha.
                          </p>
                        </div>
                      ) : (
                        <Select 
                          value={selectedPlayerId} 
                          onValueChange={(value) => {
                            setSelectedPlayerId(value);
                            const player = playersWithCharacters.find(p => p.id === value);
                            if (player && player.character) {
                              setNewCombatant({
                                name: player.character.name,
                                initiative: 10, // Will be rolled
                                current_hp: (player.character as any).current_hp || (player.character as any).max_hp || 10,
                                max_hp: (player.character as any).max_hp || 10,
                                armor_class: (player.character as any).armor_class || 10,
                                is_player: true,
                                character_id: player.character_id,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-muted/50 border-0">
                            <SelectValue placeholder="Selecione um jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {playersWithCharacters.map(player => (
                              <SelectItem key={player.id} value={player.id}>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-blue-500" />
                                  <span className="font-medium">{player.character?.name}</span>
                                  <span className="text-muted-foreground text-sm">
                                    - {player.character?.class} Nv {player.character?.level}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Manual fields for Monster/NPC or if no player selected */}
                  {(combatantType !== 'player' || !selectedPlayerId) && combatantType !== 'player' && (
                    <>
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={newCombatant.name}
                          onChange={(e) => setNewCombatant(prev => ({ ...prev, name: e.target.value }))}
                          placeholder={combatantType === 'monster' ? "Goblin, Lobo..." : "Guarda, Mercador..."}
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
                    </>
                  )}

                  {/* Show selected player stats */}
                  {combatantType === 'player' && selectedPlayerId && (
                    <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                      <h4 className="font-semibold text-sm">Dados do Personagem</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-sm">{newCombatant.current_hp}/{newCombatant.max_hp} HP</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">CA {newCombatant.armor_class}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Iniciativa</Label>
                        <Input
                          type="number"
                          value={newCombatant.initiative}
                          onChange={(e) => setNewCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                          placeholder="Role a iniciativa..."
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleAddCombatant} 
                    className="w-full"
                    disabled={
                      !newCombatant.name || 
                      addCombatant.isPending || 
                      (combatantType === 'player' && !selectedPlayerId)
                    }
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

            {/* HP Change Dialog */}
            <Dialog open={hpDialog.open} onOpenChange={(open) => {
              if (!open) {
                setHpDialog({ open: false, combatant: null, mode: 'damage' });
                setHpAmount("");
              }
            }}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {hpDialog.mode === 'damage' ? (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Aplicar Dano
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 text-green-500" />
                        Curar
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>
                
                {hpDialog.combatant && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">{hpDialog.combatant.name}</p>
                      <p className="text-2xl font-bold">
                        {hpDialog.combatant.current_hp}/{hpDialog.combatant.max_hp} HP
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={hpAmount}
                        onChange={(e) => setHpAmount(e.target.value)}
                        placeholder="0"
                        className="text-center text-2xl h-14"
                        autoFocus
                      />
                    </div>

                    {/* Quick amount buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 5, 10, 20].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setHpAmount(amount.toString())}
                        >
                          {amount}
                        </Button>
                      ))}
                    </div>
                    
                    <DialogFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setHpDialog({ open: false, combatant: null, mode: 'damage' });
                          setHpAmount("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className={cn(
                          "flex-1",
                          hpDialog.mode === 'damage' 
                            ? "bg-red-600 hover:bg-red-700" 
                            : "bg-green-600 hover:bg-green-700"
                        )}
                        onClick={handleApplyHpChange}
                        disabled={!hpAmount || updateCombatant.isPending}
                      >
                        {updateCombatant.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          hpDialog.mode === 'damage' ? 'Aplicar Dano' : 'Curar'
                        )}
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
