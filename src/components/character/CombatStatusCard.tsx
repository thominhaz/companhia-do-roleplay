import { Swords, Clock, Heart, Shield, Users, Zap } from "lucide-react";
import { useCharacterActiveCombat } from "@/hooks/useCharacterCombat";
import { motion } from "framer-motion";

interface CombatStatusCardProps {
  characterId: string;
}

export function CombatStatusCard({ characterId }: CombatStatusCardProps) {
  const { data: combatInfo, isLoading } = useCharacterActiveCombat(characterId);

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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* My HP */}
        <div className="bg-card/50 rounded-xl p-3 text-center">
          <Heart className={`w-4 h-4 mx-auto mb-1 ${myHpPercent <= 25 ? 'text-red-400' : myHpPercent <= 50 ? 'text-yellow-400' : 'text-green-400'}`} />
          <p className="text-lg font-bold">{combatant.current_hp}/{combatant.max_hp}</p>
          <p className="text-[10px] text-muted-foreground">Meu HP</p>
        </div>

        {/* My AC */}
        <div className="bg-card/50 rounded-xl p-3 text-center">
          <Shield className="w-4 h-4 mx-auto mb-1 text-blue-400" />
          <p className="text-lg font-bold">{combatant.armor_class}</p>
          <p className="text-[10px] text-muted-foreground">Minha CA</p>
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
        <div className="mt-3 pt-3 border-t border-border/30">
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
    </motion.div>
  );
}
