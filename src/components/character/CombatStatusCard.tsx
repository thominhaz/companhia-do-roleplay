import { useState } from "react";
import { Swords, Clock, Heart, Shield, Users, Zap, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { useCharacterActiveCombat } from "@/hooks/useCharacterCombat";
import { useUpdateCombatant } from "@/hooks/useCombat";
import { useUpdateCharacter } from "@/hooks/useCharacters";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CombatStatusCardProps {
  characterId: string;
}

export function CombatStatusCard({ characterId }: CombatStatusCardProps) {
  const { data: combatInfo, isLoading } = useCharacterActiveCombat(characterId);
  const updateCombatant = useUpdateCombatant();
  const updateCharacter = useUpdateCharacter();
  const [hpModifier, setHpModifier] = useState('');
  const [showInitiative, setShowInitiative] = useState(false);

  if (isLoading || !combatInfo) return null;

  const { encounter, combatant, allCombatants, campaignName, isMyTurn, turnPosition } = combatInfo;

  // Calculate party stats (only players)
  const playerCombatants = allCombatants.filter(c => c.is_player);
  const totalPartyHp = playerCombatants.reduce((sum, c) => sum + c.current_hp, 0);
  const totalPartyMaxHp = playerCombatants.reduce((sum, c) => sum + c.max_hp, 0);
  const partyHpPercent = totalPartyMaxHp > 0 ? Math.round((totalPartyHp / totalPartyMaxHp) * 100) : 0;

  // Get current turn combatant
  const currentCombatant = allCombatants[encounter.current_turn];

  // My HP percent
  const myHpPercent = combatant.max_hp > 0 ? Math.round((combatant.current_hp / combatant.max_hp) * 100) : 0;

  // Handle HP change - updates both combatant AND character to keep them synced
  const handleHpChange = async (delta: number) => {
    const value = hpModifier ? parseInt(hpModifier, 10) : 0;
    if (delta !== 0 && hpModifier && (isNaN(value) || value <= 0)) {
      toast.error('Digite um valor válido');
      return;
    }

    const change = delta * (value || 1);
    const newHp = Math.max(0, Math.min(combatant.max_hp, combatant.current_hp + change));

    try {
      // Update combatant HP in combat
      await updateCombatant.mutateAsync({
        id: combatant.id,
        encounterId: encounter.id,
        current_hp: newHp,
      });

      // Also update the character's HP to keep them synced
      await updateCharacter.mutateAsync({
        id: characterId,
        current_hp: newHp,
      });

      toast.success(change > 0 ? `+${change} HP` : `${change} HP`);
      setHpModifier('');
    } catch (error) {
      toast.error('Erro ao atualizar HP');
    }
  };

  // Quick HP buttons
  const quickHpValues = [1, 5, 10];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${
        isMyTurn 
          ? 'from-yellow-500/20 via-orange-500/10 to-red-500/5 border-yellow-500/50' 
          : 'from-red-500/10 via-card to-card border-red-500/30'
      } border-2 rounded-2xl p-4 mb-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${isMyTurn ? 'bg-yellow-500/30' : 'bg-red-500/20'}`}>
            <Swords className={`w-5 h-5 ${isMyTurn ? 'text-yellow-400' : 'text-red-400'}`} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Combate Ativo</h3>
            <p className="text-[10px] text-muted-foreground">{campaignName}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Rodada</span>
          <p className="text-xl font-bold text-primary">{encounter.round}</p>
        </div>
      </div>

      {/* Turn Status */}
      {isMyTurn ? (
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 mb-3"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-yellow-300">É o seu turno!</span>
          </div>
        </motion.div>
      ) : (
        <div className="bg-muted/30 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Turno atual: <span className="font-medium text-foreground">{currentCombatant?.name || '—'}</span>
              </span>
            </div>
            {turnPosition > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                {turnPosition} turno{turnPosition > 1 ? 's' : ''} até você
              </span>
            )}
          </div>
        </div>
      )}

      {/* HP Display with Quick Actions */}
      <div className="bg-card/50 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className={`w-5 h-5 ${myHpPercent <= 25 ? 'text-red-400' : myHpPercent <= 50 ? 'text-yellow-400' : 'text-green-400'}`} />
            <span className="text-sm font-medium">Pontos de Vida</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{combatant.current_hp}</span>
            <span className="text-muted-foreground">/{combatant.max_hp}</span>
          </div>
        </div>

        {/* HP Bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
          <motion.div
            className={`h-full rounded-full ${
              myHpPercent <= 25 ? 'bg-red-500' : myHpPercent <= 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${myHpPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Valor"
              value={hpModifier}
              onChange={(e) => setHpModifier(e.target.value)}
              className="h-9 text-center flex-1"
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleHpChange(-1)}
              disabled={updateCombatant.isPending}
              className="gap-1"
            >
              <Minus className="w-4 h-4" />
              Dano
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleHpChange(1)}
              disabled={updateCombatant.isPending}
              className="gap-1 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Cura
            </Button>
          </div>

          {/* Quick HP Buttons */}
          <div className="flex gap-1">
            {quickHpValues.map((val) => (
              <Button
                key={`damage-${val}`}
                variant="outline"
                size="sm"
                className="flex-1 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                onClick={async () => {
                  const newHp = Math.max(0, combatant.current_hp - val);
                  await updateCombatant.mutateAsync({
                    id: combatant.id,
                    encounterId: encounter.id,
                    current_hp: newHp,
                  });
                  await updateCharacter.mutateAsync({ id: characterId, current_hp: newHp });
                  toast.success(`-${val} HP`);
                }}
              >
                -{val}
              </Button>
            ))}
            {quickHpValues.map((val) => (
              <Button
                key={`heal-${val}`}
                variant="outline"
                size="sm"
                className="flex-1 text-xs text-green-400 border-green-500/30 hover:bg-green-500/10"
                onClick={async () => {
                  const newHp = Math.min(combatant.max_hp, combatant.current_hp + val);
                  await updateCombatant.mutateAsync({
                    id: combatant.id,
                    encounterId: encounter.id,
                    current_hp: newHp,
                  });
                  await updateCharacter.mutateAsync({ id: characterId, current_hp: newHp });
                  toast.success(`+${val} HP`);
                }}
              >
                +{val}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* My AC */}
        <div className="bg-card/50 rounded-xl p-3 text-center">
          <Shield className="w-4 h-4 mx-auto mb-1 text-blue-400" />
          <p className="text-lg font-bold">{combatant.armor_class}</p>
          <p className="text-[10px] text-muted-foreground">Minha CA</p>
        </div>

        {/* Initiative */}
        <div className="bg-card/50 rounded-xl p-3 text-center">
          <Zap className="w-4 h-4 mx-auto mb-1 text-purple-400" />
          <p className="text-lg font-bold">{combatant.initiative}</p>
          <p className="text-[10px] text-muted-foreground">Iniciativa</p>
        </div>

        {/* Party HP */}
        <div className="bg-card/50 rounded-xl p-3 text-center">
          <Users className={`w-4 h-4 mx-auto mb-1 ${partyHpPercent <= 25 ? 'text-red-400' : partyHpPercent <= 50 ? 'text-yellow-400' : 'text-green-400'}`} />
          <p className="text-lg font-bold">{partyHpPercent}%</p>
          <p className="text-[10px] text-muted-foreground">HP do Grupo</p>
        </div>
      </div>

      {/* Conditions */}
      {combatant.conditions && combatant.conditions.length > 0 && (
        <div className="mb-3 bg-card/30 rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-2">Condições ativas:</p>
          <div className="flex flex-wrap gap-1">
            {combatant.conditions.map((condition, idx) => (
              <span 
                key={idx}
                className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Initiative Order Toggle */}
      <button
        onClick={() => setShowInitiative(!showInitiative)}
        className="w-full flex items-center justify-between bg-card/30 hover:bg-card/50 transition-colors rounded-xl p-3"
      >
        <span className="text-sm font-medium">Ordem de Iniciativa</span>
        {showInitiative ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Initiative Order List */}
      <AnimatePresence>
        {showInitiative && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ScrollArea className="max-h-48 mt-2">
              <div className="space-y-1">
                {allCombatants.map((c, index) => {
                  const isCurrentTurn = index === encounter.current_turn;
                  const isMe = c.id === combatant.id;
                  const hpPercent = c.max_hp > 0 ? Math.round((c.current_hp / c.max_hp) * 100) : 0;

                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        isCurrentTurn 
                          ? 'bg-yellow-500/20 border border-yellow-500/50' 
                          : isMe 
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-card/30'
                      }`}
                    >
                      {/* Turn Indicator */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrentTurn ? 'bg-yellow-500 text-yellow-950' : 'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Name & Type */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isMe ? 'text-primary' : ''}`}>
                          {c.name}
                          {isMe && <span className="text-xs text-muted-foreground ml-1">(você)</span>}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>Iniciativa: {c.initiative}</span>
                          {c.is_player && <span className="text-blue-400">• Jogador</span>}
                        </div>
                      </div>

                      {/* HP Bar (only for players or if visible) */}
                      {c.is_player && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                hpPercent <= 25 ? 'bg-red-500' : hpPercent <= 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {c.current_hp}/{c.max_hp}
                          </span>
                        </div>
                      )}

                      {/* AC Badge */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="w-3 h-3" />
                        {c.armor_class}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
