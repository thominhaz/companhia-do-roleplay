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
import { useSubscription } from "@/hooks/useSubscription";
import { CombatLogPanel } from "./CombatLogPanel";
import { RealTimeStatusIndicator } from "./CombatTrackerPro";
import { CombatantCard } from "./combat/CombatantCard";
import { CompactCombatantCard } from "./combat/CompactCombatantCard";
import { CombatantDetailSheet } from "./combat/CombatantDetailSheet";
import { CombatantStatBlock } from "./combat/CombatantStatBlock";
import { InitiativeListCard } from "./combat/InitiativeListCard";
import { CombatDiceRoller, useDiceRoller } from "./combat/CombatDiceRoller";
import { loadAllMonsters, Monster } from "@/data/monsters/index";
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
  Gem,
  Crown,
  LayoutGrid,
  LayoutList,
  Dices,
  BookOpen
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
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
  const { data: subscription } = useSubscription();
  const [showAddCombatant, setShowAddCombatant] = useState(false);
  const [hpDialog, setHpDialog] = useState<HpDialogState>({ open: false, combatant: null, mode: 'damage' });
  const [hpAmount, setHpAmount] = useState("");
  const [combatantType, setCombatantType] = useState<'monster' | 'npc' | 'player' | 'homebrew' | 'srd'>('monster');
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedHomebrewMonster, setSelectedHomebrewMonster] = useState("");
  const [selectedSrdMonster, setSelectedSrdMonster] = useState("");
  const [srdMonsterSearch, setSrdMonsterSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'combatants' | 'log' | 'dice'>('combatants');
  const [realtimeConnected, setRealtimeConnected] = useState(true);
  const [selectedCombatant, setSelectedCombatant] = useState<Combatant | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { rollDice, lastResult } = useDiceRoller();
  const [newCombatant, setNewCombatant] = useState({
    name: "",
    initiative: 10,
    current_hp: 10,
    max_hp: 10,
    armor_class: 10,
    is_player: false,
    character_id: null as string | null,
  });

  // Check if user has Pro features
  const hasProFeatures = subscription?.limits.hasCombatTracker ?? false;

  // Load SRD monsters
  const srdMonsters = useMemo(() => loadAllMonsters(), []);
  const filteredSrdMonsters = useMemo(() => {
    if (!srdMonsterSearch) return srdMonsters.slice(0, 50); // Show first 50 by default
    return srdMonsters.filter(m => 
      m.name.toLowerCase().includes(srdMonsterSearch.toLowerCase())
    ).slice(0, 50);
  }, [srdMonsters, srdMonsterSearch]);

  // Fetch campaign players for the player selection
  const { data: campaignPlayers } = useCampaignPlayers(campaignId);
  
  // Fetch homebrew monsters shared with this campaign
  const { sharedContent: campaignHomebrew } = useCampaignHomebrew(campaignId);
  const homebrewMonsters = useMemo(() => 
    campaignHomebrew?.filter(h => h.content.type === 'monster').map(h => h.content) || [], 
    [campaignHomebrew]
  );
  
  // Filter only players with characters (not master)
  const playersWithCharacters = campaignPlayers?.filter(
    p => p.role === 'player' && p.character_id && p.character
  ) || [];

  // Find current user's combatant (for players to edit their own HP)
  const userCharacterId = campaignPlayers?.find(p => p.user_id === user?.id)?.character_id;

  const { data: encounter, isLoading: loadingEncounter } = useActiveEncounter(campaignId);
  const { data: combatants, isLoading: loadingCombatants } = useCombatants(encounter?.id || "");

  // Get character IDs that are already in combat
  const characterIdsInCombat = useMemo(() => 
    new Set(combatants?.filter(c => c.character_id).map(c => c.character_id) || []),
    [combatants]
  );

  // Filter players available to add (not already in combat)
  const availablePlayersToAdd = playersWithCharacters.filter(
    p => !characterIdsInCombat.has(p.character_id)
  );
  
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
      syncToCharacter: true, // Sync HP to character sheet
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
      syncToCharacter: true, // Sync conditions to character sheet
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
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                hasProFeatures 
                  ? "bg-gradient-to-br from-gold/30 to-red-500/20" 
                  : "bg-red-500/20"
              )}>
                <Swords className={cn("w-6 h-6", hasProFeatures ? "text-gold" : "text-red-500")} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl">Combat Tracker</SheetTitle>
                  {hasProFeatures && (
                    <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px]">
                      <Crown className="w-3 h-3 mr-1" />
                      PRO
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {encounter && (
                    <p className="text-sm text-muted-foreground">
                      Rodada {encounter.round} • Turno {(encounter.current_turn || 0) + 1}
                    </p>
                  )}
                  {hasProFeatures && encounter && (
                    <RealTimeStatusIndicator isConnected={realtimeConnected} />
                  )}
                </div>
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
            {/* Action Bar - Only show for masters - Add combatant button only */}
            {isMaster && (
              <div className="p-3 border-b border-border flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddCombatant(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Combatente
                </Button>
              </div>
            )}

            {/* Tabs for Combatants, Log and Dice */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'combatants' | 'log' | 'dice')} className="flex-1 flex flex-col">
              <div className="px-4 pt-2 flex items-center gap-2">
                <TabsList className="flex-1">
                  <TabsTrigger value="combatants" className="flex-1">
                    <Swords className="w-4 h-4 mr-1" />
                    Combatentes
                  </TabsTrigger>
                  <TabsTrigger value="dice" className="flex-1">
                    <Dices className="w-4 h-4 mr-1" />
                    Dados
                  </TabsTrigger>
                  <TabsTrigger value="log" className="flex-1">
                    <ScrollText className="w-4 h-4 mr-1" />
                    Log
                  </TabsTrigger>
                </TabsList>
                {activeTab === 'combatants' && sortedCombatants.length > 4 && (
                  <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'list' | 'grid')}>
                    <ToggleGroupItem value="list" size="sm"><LayoutList className="w-4 h-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="grid" size="sm"><LayoutGrid className="w-4 h-4" /></ToggleGroupItem>
                  </ToggleGroup>
                )}
              </div>

              <TabsContent value="combatants" className="flex-1 mt-0 flex flex-col">
                {/* Side-by-side layout: Initiative List + Stat Block */}
                <div className="flex flex-1 h-[calc(90vh-340px)]">
                  {/* Left: Initiative List */}
                  <div className="flex-1 border-r border-border">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2">
                        {sortedCombatants.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Adicione combatentes para iniciar
                          </div>
                        ) : (
                          <AnimatePresence mode="popLayout">
                            {sortedCombatants.map((combatant, index) => (
                              <InitiativeListCard
                                key={combatant.id}
                                combatant={combatant}
                                index={index}
                                isCurrentTurn={index === encounter.current_turn}
                                isSelected={selectedCombatant?.id === combatant.id}
                                isMaster={isMaster}
                                isOwnCombatant={combatant.character_id === userCharacterId}
                                onSelect={(c) => setSelectedCombatant(c)}
                                onHpChange={(c, mode) => setHpDialog({ open: true, combatant: c, mode })}
                                onRemove={(c) => removeCombatant.mutate({ id: c.id, encounterId: encounter.id })}
                              />
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right: Stat Block Panel */}
                  <div className="w-[360px] hidden md:block overflow-hidden">
                    <CombatantStatBlock
                      combatant={selectedCombatant}
                      campaignId={campaignId}
                      onClose={() => setSelectedCombatant(null)}
                      onRollDice={rollDice}
                    />
                  </div>
                </div>

                {/* D&D Beyond Style Control Bar - Fixed at bottom */}
                {isMaster && (
                  <div className="border-t border-border bg-card/95 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-1 p-3">
                      {/* Undo Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePreviousTurn}
                        disabled={!combatants?.length || (encounter.round === 1 && encounter.current_turn === 0)}
                        className="h-10 px-4 text-xs font-medium uppercase tracking-wide hover:bg-muted/80"
                      >
                        <RotateCcw className="w-4 h-4 mr-1.5" />
                        Desfazer
                      </Button>

                      <div className="w-px h-6 bg-border mx-1" />

                      {/* Round Indicator */}
                      <div className="h-10 px-4 flex items-center gap-2 bg-muted/50 rounded-md">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rodada</span>
                        <span className="text-lg font-bold text-primary">{encounter.round}</span>
                      </div>

                      <div className="w-px h-6 bg-border mx-1" />

                      {/* Turn Indicator */}
                      <div className="h-10 px-4 flex items-center gap-2 bg-muted/50 rounded-md">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Turno</span>
                        <span className="text-lg font-bold text-primary">{(encounter.current_turn || 0) + 1}</span>
                        <span className="text-xs text-muted-foreground">/ {sortedCombatants.length}</span>
                      </div>

                      <div className="w-px h-6 bg-border mx-1" />

                      {/* Next Turn Button */}
                      <Button
                        size="sm"
                        onClick={handleNextTurn}
                        disabled={!combatants?.length}
                        className="h-10 px-6 text-xs font-medium uppercase tracking-wide bg-primary hover:bg-primary/90"
                      >
                        Próximo
                        <SkipForward className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dice" className="flex-1 mt-0 p-4">
                <CombatDiceRoller />
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
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={combatantType === 'srd' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          setCombatantType('srd');
                          setSelectedPlayerId("");
                          setSelectedHomebrewMonster("");
                          setSelectedSrdMonster("");
                          setSrdMonsterSearch("");
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
                        <BookOpen className="w-4 h-4 mr-1" />
                        Bestiário
                      </Button>
                      <Button
                        variant={combatantType === 'monster' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          setCombatantType('monster');
                          setSelectedPlayerId("");
                          setSelectedHomebrewMonster("");
                          setSelectedSrdMonster("");
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
                        Manual
                      </Button>
                      <Button
                        variant={combatantType === 'homebrew' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          setCombatantType('homebrew');
                          setSelectedPlayerId("");
                          setSelectedHomebrewMonster("");
                          setSelectedSrdMonster("");
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
                          setSelectedSrdMonster("");
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
                        className="flex-1 col-span-2"
                        onClick={() => {
                          setCombatantType('player');
                          setSelectedPlayerId("");
                          setSelectedHomebrewMonster("");
                          setSelectedSrdMonster("");
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

                  {/* SRD Monster Selection */}
                  {combatantType === 'srd' && (
                    <div className="space-y-2">
                      <Label>Buscar no Bestiário SRD</Label>
                      <Input
                        placeholder="Digite o nome do monstro..."
                        value={srdMonsterSearch}
                        onChange={(e) => setSrdMonsterSearch(e.target.value)}
                        className="bg-muted/50 border-0"
                      />
                      <ScrollArea className="h-48">
                        <div className="space-y-1">
                          {filteredSrdMonsters.map(monster => {
                            const isSelected = selectedSrdMonster === monster.name;
                            return (
                              <button
                                key={monster.name}
                              onClick={() => {
                                  setSelectedSrdMonster(monster.name);
                                  // Parse HP from monster
                                  const hpMatch = monster.hitPoints?.match(/(\d+)/);
                                  const hp = hpMatch ? parseInt(hpMatch[1]) : 10;
                                  // Parse AC from monster
                                  const acMatch = monster.armorClass?.match(/(\d+)/);
                                  const ac = acMatch ? parseInt(acMatch[1]) : 10;
                                  // Get DEX modifier for initiative (stats.DEX is a string like "14")
                                  const dexScore = parseInt(monster.stats?.DEX) || 10;
                                  const dexMod = Math.floor((dexScore - 10) / 2);
                                  const initiative = Math.floor(Math.random() * 20) + 1 + dexMod;
                                  
                                  setNewCombatant({
                                    name: monster.name,
                                    initiative,
                                    current_hp: hp,
                                    max_hp: hp,
                                    armor_class: ac,
                                    is_player: false,
                                    character_id: null,
                                  });
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between",
                                  isSelected 
                                    ? "bg-primary text-primary-foreground" 
                                    : "hover:bg-muted/50"
                                )}
                              >
                                <span className="font-medium">{monster.name}</span>
                                <span className={cn(
                                  "text-xs",
                                  isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                  ND {monster.challenge?.split('(')[0].trim() || '?'}
                                </span>
                              </button>
                            );
                          })}
                          {filteredSrdMonsters.length === 0 && (
                            <p className="text-center text-muted-foreground text-sm py-4">
                              Nenhum monstro encontrado
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                      
                      {selectedSrdMonster && (
                        <div className="bg-primary/10 rounded-xl p-3 border border-primary/30">
                          <p className="font-medium mb-2">{newCombatant.name}</p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span>{newCombatant.max_hp} HP</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-500" />
                              <span>CA {newCombatant.armor_class}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-500" />
                              <span>Init {newCombatant.initiative}</span>
                            </div>
                          </div>
                          <div className="mt-2 space-y-2">
                            <Label className="text-xs">Ajustar Iniciativa</Label>
                            <Input
                              type="number"
                              value={newCombatant.initiative}
                              onChange={(e) => setNewCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                              className="h-8"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                  )}

                  {/* Player Selection */}
                  {combatantType === 'player' && (
                    <div className="space-y-2">
                      <Label>Selecionar Jogador da Campanha</Label>
                      {playersWithCharacters.length === 0 ? (
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Nenhum jogador com personagem vinculado nesta campanha.
                          </p>
                        </div>
                      ) : availablePlayersToAdd.length === 0 ? (
                        <div className="bg-amber-500/10 rounded-lg p-4 text-center border border-amber-500/30">
                          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                          <p className="text-sm text-amber-400">
                            Todos os jogadores já estão no combate.
                          </p>
                        </div>
                      ) : (
                        <Select 
                          value={selectedPlayerId} 
                          onValueChange={(value) => {
                            setSelectedPlayerId(value);
                            const player = availablePlayersToAdd.find(p => p.id === value);
                            if (player && player.character) {
                              setNewCombatant({
                                name: player.character.name,
                                initiative: 10,
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
                            {availablePlayersToAdd.map(player => (
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

        {/* Combatant Detail Sheet - Only for mobile when stat block panel is hidden */}
        <CombatantDetailSheet
          combatant={selectedCombatant}
          campaignId={campaignId}
          open={!!selectedCombatant && typeof window !== 'undefined' && window.innerWidth < 768}
          onOpenChange={(open) => !open && setSelectedCombatant(null)}
        />
      </SheetContent>
    </Sheet>
  );
}
