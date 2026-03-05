import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  useCreateDraftEncounter,
  useAddDraftCombatant,
  useDraftCombatants,
  useRemoveDraftCombatant,
  useUpdateDraftEncounter,
  PreparedEncounter,
} from "@/hooks/usePreparedEncounters";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { useCampaignHomebrew } from "@/hooks/useHomebrew";
import { loadAllMonsters } from "@/data/monsters/index";
import { 
  Plus, Trash2, Shield, Heart, Swords, User, Skull, Search, Users
} from "lucide-react";

interface PreparedEncounterSheetProps {
  campaignId: string;
  encounter?: PreparedEncounter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseHP(hitPoints: string): { current: number; max: number } {
  const match = hitPoints.match(/^(\d+)/);
  const hp = match ? parseInt(match[1]) : 10;
  return { current: hp, max: hp };
}

function parseAC(armorClass: string): number {
  const match = armorClass.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 10;
}

function getDexModifier(dexStat: string): number {
  const match = dexStat.match(/\(([+-]?\d+)\)/);
  return match ? parseInt(match[1]) : 0;
}

function rollInitiative(dexMod: number): number {
  return Math.floor(Math.random() * 20) + 1 + dexMod;
}

export function PreparedEncounterSheet({ campaignId, encounter, open, onOpenChange }: PreparedEncounterSheetProps) {
  const [name, setName] = useState(encounter?.name || "");
  const [isCreating, setIsCreating] = useState(false);
  const [combatantType, setCombatantType] = useState<'monster' | 'npc' | 'player' | 'srd'>('srd');
  const [srdSearch, setSrdSearch] = useState("");
  const [selectedSrdMonster, setSelectedSrdMonster] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(encounter?.pre_selected_player_ids || []);
  const [newCombatant, setNewCombatant] = useState({
    name: "", initiative: 10, current_hp: 10, max_hp: 10, armor_class: 10,
  });

  const createDraft = useCreateDraftEncounter();
  const updateDraft = useUpdateDraftEncounter();
  const addCombatant = useAddDraftCombatant();
  const removeCombatant = useRemoveDraftCombatant();
  const { data: combatants } = useDraftCombatants(encounter?.id || "");
  const { data: campaignPlayers } = useCampaignPlayers(campaignId);

  const playersWithCharacters = campaignPlayers?.filter(
    p => p.role === 'player' && p.character_id && p.character
  ) || [];

  const srdMonsters = useMemo(() => loadAllMonsters(), []);
  const filteredSrdMonsters = useMemo(() => {
    if (!srdSearch) return srdMonsters.slice(0, 30);
    return srdMonsters.filter(m =>
      m.name.toLowerCase().includes(srdSearch.toLowerCase())
    ).slice(0, 30);
  }, [srdMonsters, srdSearch]);

  const { sharedContent: campaignHomebrew } = useCampaignHomebrew(campaignId);
  const homebrewMonsters = useMemo(() =>
    campaignHomebrew?.filter(h => h.content.type === 'monster').map(h => h.content) || [],
    [campaignHomebrew]
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await createDraft.mutateAsync({
        campaignId,
        name: name.trim(),
        preSelectedPlayerIds: selectedPlayerIds,
      });
      onOpenChange(false);
      setName("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddMonster = async () => {
    if (!encounter) return;

    if (combatantType === 'srd' && selectedSrdMonster) {
      const monster = srdMonsters.find(m => m.name === selectedSrdMonster);
      if (!monster) return;
      const hp = parseHP(monster.hitPoints);
      const ac = parseAC(monster.armorClass);
      const dexMod = getDexModifier(monster.stats?.DEX || "10 (+0)");
      await addCombatant.mutateAsync({
        encounter_id: encounter.id,
        name: monster.name,
        initiative: rollInitiative(dexMod),
        current_hp: hp.current,
        max_hp: hp.max,
        armor_class: ac,
        is_player: false,
        character_id: null,
        conditions: [],
        notes: null,
        sort_order: 0,
      });
      setSelectedSrdMonster("");
    } else if (combatantType === 'npc' && newCombatant.name) {
      await addCombatant.mutateAsync({
        encounter_id: encounter.id,
        name: newCombatant.name,
        initiative: newCombatant.initiative,
        current_hp: newCombatant.current_hp,
        max_hp: newCombatant.max_hp,
        armor_class: newCombatant.armor_class,
        is_player: false,
        character_id: null,
        conditions: [],
        notes: null,
        sort_order: 0,
      });
      setNewCombatant({ name: "", initiative: 10, current_hp: 10, max_hp: 10, armor_class: 10 });
    }
  };

  const handleTogglePlayer = (playerId: string) => {
    const updated = selectedPlayerIds.includes(playerId)
      ? selectedPlayerIds.filter(id => id !== playerId)
      : [...selectedPlayerIds, playerId];
    setSelectedPlayerIds(updated);
    if (encounter) {
      updateDraft.mutate({ id: encounter.id, campaignId, pre_selected_player_ids: updated });
    }
  };

  const isEditing = !!encounter;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            {isEditing ? "Editar Encontro" : "Preparar Encontro"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-2">
          <div className="space-y-6">
            {/* Name */}
            {!isEditing && (
              <div className="space-y-2">
                <Label>Nome do Encontro</Label>
                <Input
                  placeholder="Ex: Emboscada na Floresta"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            {/* Player Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Jogadores Participantes
              </Label>
              <div className="space-y-2">
                {playersWithCharacters.map(p => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-2 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedPlayerIds.includes(p.character_id!)}
                      onCheckedChange={() => handleTogglePlayer(p.character_id!)}
                    />
                    <User className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.character?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.character?.class} Nv.{p.character?.level} — {p.profile?.display_name}
                      </p>
                    </div>
                  </label>
                ))}
                {playersWithCharacters.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum jogador com ficha vinculada
                  </p>
                )}
              </div>
            </div>

            {!isEditing && (
              <Button onClick={handleCreate} disabled={!name.trim() || isCreating} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Criar Encontro
              </Button>
            )}

            {/* Combatants (only in edit mode) */}
            {isEditing && (
              <>
                <div className="border-t border-border pt-4 space-y-3">
                  <Label className="flex items-center gap-2">
                    <Skull className="w-4 h-4" />
                    Combatentes ({combatants?.length || 0})
                  </Label>

                  {/* Existing combatants */}
                  <div className="space-y-2">
                    {combatants?.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                        <div className={`w-2 h-2 rounded-full ${c.is_player ? 'bg-primary' : 'bg-destructive'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {c.current_hp}/{c.max_hp}
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" /> CA {c.armor_class}
                            </span>
                            <span>Init: {c.initiative}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeCombatant.mutate({ id: c.id, encounterId: encounter!.id })}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add combatant */}
                  <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
                    <div className="flex gap-2">
                      <Button
                        variant={combatantType === 'srd' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCombatantType('srd')}
                      >
                        Bestiário
                      </Button>
                      <Button
                        variant={combatantType === 'npc' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCombatantType('npc')}
                      >
                        Manual
                      </Button>
                    </div>

                    {combatantType === 'srd' && (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Buscar monstro..."
                            value={srdSearch}
                            onChange={e => setSrdSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Select value={selectedSrdMonster} onValueChange={setSelectedSrdMonster}>
                          <SelectTrigger><SelectValue placeholder="Selecionar monstro" /></SelectTrigger>
                          <SelectContent>
                            {filteredSrdMonsters.map(m => (
                              <SelectItem key={m.name} value={m.name}>
                                {m.name} — ND {m.challenge}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddMonster} disabled={!selectedSrdMonster} className="w-full gap-2" size="sm">
                          <Plus className="w-4 h-4" /> Adicionar
                        </Button>
                      </div>
                    )}

                    {combatantType === 'npc' && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Nome"
                          value={newCombatant.name}
                          onChange={e => setNewCombatant(p => ({ ...p, name: e.target.value }))}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">HP</Label>
                            <Input
                              type="number"
                              value={newCombatant.max_hp}
                              onChange={e => {
                                const v = parseInt(e.target.value) || 1;
                                setNewCombatant(p => ({ ...p, max_hp: v, current_hp: v }));
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">CA</Label>
                            <Input
                              type="number"
                              value={newCombatant.armor_class}
                              onChange={e => setNewCombatant(p => ({ ...p, armor_class: parseInt(e.target.value) || 10 }))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Iniciativa</Label>
                            <Input
                              type="number"
                              value={newCombatant.initiative}
                              onChange={e => setNewCombatant(p => ({ ...p, initiative: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                        <Button onClick={handleAddMonster} disabled={!newCombatant.name} className="w-full gap-2" size="sm">
                          <Plus className="w-4 h-4" /> Adicionar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
