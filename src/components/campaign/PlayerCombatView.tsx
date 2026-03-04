import { useState } from "react";
import { 
  useActiveEncounter, 
  useCombatants, 
  useUpdateCombatant,
  Combatant 
} from "@/hooks/useCombat";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { 
  Swords, 
  Heart, 
  Shield, 
  Skull, 
  Sparkles,
  Users,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PlayerCombatViewProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HpDialogState {
  open: boolean;
  combatant: Combatant | null;
  mode: 'damage' | 'heal';
}

export function PlayerCombatView({ campaignId, open, onOpenChange }: PlayerCombatViewProps) {
  const { user } = useAuth();
  const [hpDialog, setHpDialog] = useState<HpDialogState>({ open: false, combatant: null, mode: 'damage' });
  const [hpAmount, setHpAmount] = useState("");

  const { data: encounter, isLoading: loadingEncounter } = useActiveEncounter(campaignId);
  const { data: combatants, isLoading: loadingCombatants } = useCombatants(encounter?.id || "");
  const { data: campaignPlayers } = useCampaignPlayers(campaignId);
  const updateCombatant = useUpdateCombatant();

  const isLoading = loadingEncounter || loadingCombatants;
  const sortedCombatants = [...(combatants || [])].sort((a, b) => b.initiative - a.initiative);
  const currentCombatant = sortedCombatants[encounter?.current_turn || 0];

  // Find current user's character
  const userCharacterId = campaignPlayers?.find(p => p.user_id === user?.id)?.character_id;
  const userCombatant = sortedCombatants.find(c => c.character_id === userCharacterId);

  // Calculate party stats
  const playerCombatants = sortedCombatants.filter(c => c.is_player);
  const totalPartyHp = playerCombatants.reduce((sum, c) => sum + c.current_hp, 0);
  const totalPartyMaxHp = playerCombatants.reduce((sum, c) => sum + c.max_hp, 0);
  const partyHpPercent = totalPartyMaxHp > 0 ? (totalPartyHp / totalPartyMaxHp) * 100 : 0;
  const deadCount = playerCombatants.filter(c => c.current_hp === 0).length;

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
    
    setHpDialog({ open: false, combatant: null, mode: 'damage' });
    setHpAmount("");
  };

  const getHpColor = (percent: number) => {
    if (percent <= 25) return "bg-destructive";
    if (percent <= 50) return "bg-gold";
    return "bg-secondary";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Swords className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Combate em Andamento</SheetTitle>
              {encounter && (
                <p className="text-sm text-muted-foreground">
                  Rodada {encounter.round} • Turno {(encounter.current_turn || 0) + 1}
                </p>
              )}
            </div>
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
            <p className="text-sm text-muted-foreground">
              O mestre ainda não iniciou um combate
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Current Turn Banner */}
            {currentCombatant && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-xl p-4 border-2",
                  currentCombatant.character_id === userCharacterId
                    ? "bg-gradient-to-r from-primary/30 to-primary/10 border-primary"
                    : "bg-gradient-to-r from-muted/50 to-muted/20 border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    currentCombatant.is_player ? "bg-primary/20" : "bg-destructive/20"
                  )}>
                    <Sparkles className={cn(
                      "w-5 h-5",
                      currentCombatant.is_player ? "text-primary" : "text-destructive"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Turno Atual</p>
                    <h3 className="font-bold text-lg">{currentCombatant.name}</h3>
                  </div>
                  {currentCombatant.character_id === userCharacterId && (
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full">
                      Sua Vez!
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Party HP Summary */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-semibold">HP do Grupo</h4>
                {deadCount > 0 && (
                  <span className="ml-auto text-xs text-destructive flex items-center gap-1">
                    <Skull className="w-3 h-3" />
                    {deadCount} caído{deadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {/* Party HP Bar */}
              <div className="relative h-8 rounded-full overflow-hidden bg-muted/50 mb-2">
                <motion.div
                  className={cn("h-full", getHpColor(partyHpPercent))}
                  initial={{ width: 0 }}
                  animate={{ width: `${partyHpPercent}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground drop-shadow-lg">
                    {totalPartyHp} / {totalPartyMaxHp}
                  </span>
                </div>
              </div>

              {/* Individual Party Members */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {playerCombatants.map((combatant) => {
                  const hpPercent = (combatant.current_hp / combatant.max_hp) * 100;
                  const isDead = combatant.current_hp === 0;
                  const isMe = combatant.character_id === userCharacterId;
                  
                  return (
                    <div 
                      key={combatant.id}
                      className={cn(
                        "rounded-lg p-2 border",
                        isMe ? "border-primary bg-primary/10" : "border-border bg-muted/30",
                        isDead && "opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-xs font-medium truncate",
                          isMe && "text-primary"
                        )}>
                          {combatant.name}
                          {isMe && " (Você)"}
                        </span>
                        {isDead && <Skull className="w-3 h-3 text-destructive" />}
                      </div>
                      <div className="h-2 rounded-full overflow-hidden bg-muted">
                        <div 
                          className={cn("h-full transition-all", getHpColor(hpPercent))}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {combatant.current_hp}/{combatant.max_hp} HP
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Your Character Quick Actions */}
            {userCombatant && (
              <div className="bg-card rounded-xl p-4 border border-primary/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Seu Personagem</h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    CA {userCombatant.armor_class}
                  </div>
                </div>

                {/* Your HP Bar */}
                <div className="relative h-10 rounded-lg overflow-hidden bg-muted/50 mb-3">
                  <motion.div
                    className={cn("h-full", getHpColor((userCombatant.current_hp / userCombatant.max_hp) * 100))}
                    animate={{ width: `${(userCombatant.current_hp / userCombatant.max_hp) * 100}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-bold text-foreground drop-shadow-lg flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {userCombatant.current_hp} / {userCombatant.max_hp}
                    </span>
                  </div>
                </div>

                {/* Conditions */}
                {userCombatant.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {userCombatant.conditions.map((condition) => (
                      <span
                        key={condition}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick HP Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => setHpDialog({ open: true, combatant: userCombatant, mode: 'damage' })}
                  >
                    Receber Dano
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-secondary hover:bg-secondary/80"
                    onClick={() => setHpDialog({ open: true, combatant: userCombatant, mode: 'heal' })}
                  >
                    Curar
                  </Button>
                </div>
              </div>
            )}

            {/* Combat Order (simplified) */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h4 className="font-semibold mb-3">Ordem de Iniciativa</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <AnimatePresence>
                  {sortedCombatants.map((combatant, index) => {
                    const isCurrentTurn = index === encounter.current_turn;
                    const isMe = combatant.character_id === userCharacterId;
                    const isDead = combatant.current_hp === 0;
                    
                    return (
                      <motion.div
                        key={combatant.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all",
                          isCurrentTurn 
                            ? "border-primary bg-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background" 
                            : "border-border bg-muted/30",
                          isMe && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                          isDead && "opacity-40"
                        )}
                      >
                        <span className={cn(
                          "text-lg font-bold",
                          combatant.is_player ? "text-primary" : "text-destructive"
                        )}>
                          {combatant.initiative}
                        </span>
                        <span className="text-[8px] text-muted-foreground truncate w-full text-center px-1">
                          {combatant.name.split(' ')[0]}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* HP Change Dialog */}
        <Dialog open={hpDialog.open} onOpenChange={(open) => !open && setHpDialog({ open: false, combatant: null, mode: 'damage' })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {hpDialog.mode === 'damage' ? 'Receber Dano' : 'Curar'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                {hpDialog.combatant?.name}: {hpDialog.combatant?.current_hp}/{hpDialog.combatant?.max_hp} HP
              </p>
              <Input
                type="number"
                placeholder="Quantidade"
                value={hpAmount}
                onChange={(e) => setHpAmount(e.target.value)}
                min="0"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHpDialog({ open: false, combatant: null, mode: 'damage' })}>
                Cancelar
              </Button>
              <Button 
                onClick={handleApplyHpChange}
                className={hpDialog.mode === 'damage' ? 'bg-destructive hover:bg-destructive/80' : 'bg-secondary hover:bg-secondary/80'}
              >
                {hpDialog.mode === 'damage' ? 'Aplicar Dano' : 'Aplicar Cura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
