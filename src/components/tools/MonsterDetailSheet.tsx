import { useState } from "react";
import { Monster, extractMonsterType, extractMonsterSize } from "@/data/monsters";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MonsterStatBlock } from "./MonsterStatBlock";
import { AddMonsterToCombatSheet } from "./AddMonsterToCombatSheet";
import { Star, Sword, Sparkles, Zap, Swords } from "lucide-react";

interface MonsterDetailSheetProps {
  monster: Monster | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonsterDetailSheet({ monster, open, onOpenChange }: MonsterDetailSheetProps) {
  const [showAddToCombat, setShowAddToCombat] = useState(false);

  if (!monster) return null;

  const type = extractMonsterType(monster.meta);
  const size = extractMonsterSize(monster.meta);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="p-4 pb-0">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl">{monster.name}</SheetTitle>
                <p className="text-sm text-muted-foreground italic">{monster.meta}</p>
              </div>
              <Button 
                size="sm" 
                variant="destructive" 
                className="gap-1"
                onClick={() => setShowAddToCombat(true)}
              >
                <Swords className="w-4 h-4" />
                Combate
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(90vh-80px)] px-4 pb-4">
            <div className="space-y-6 pt-4">
              {/* Stat Block */}
              <MonsterStatBlock monster={monster} />

              {/* Traits */}
              {monster.traits && monster.traits.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Características
                  </h4>
                  <div className="space-y-3">
                    {monster.traits.map((trait, index) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-3">
                        <h5 className="font-medium text-sm">{trait.name}</h5>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {trait.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              {monster.actions && monster.actions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Sword className="h-4 w-4 text-destructive" />
                    Ações
                  </h4>
                  <div className="space-y-3">
                    {monster.actions.map((action, index) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-3">
                        <h5 className="font-medium text-sm">{action.name}</h5>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {action.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reactions */}
              {monster.reactions && monster.reactions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Reações
                    </h4>
                    <div className="space-y-3">
                      {monster.reactions.map((reaction, index) => (
                        <div key={index} className="bg-muted/30 rounded-lg p-3">
                          <h5 className="font-medium text-sm">{reaction.name}</h5>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {reaction.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Legendary Actions */}
              {monster.legendaryActions && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      Ações Lendárias
                    </h4>
                    <p className="text-sm text-muted-foreground italic">
                      {monster.legendaryActions.description}
                    </p>
                    <div className="space-y-3">
                      {monster.legendaryActions.actions.map((action, index) => (
                        <div key={index} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                          <h5 className="font-medium text-sm text-amber-400">{action.name}</h5>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {action.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AddMonsterToCombatSheet
        monster={monster}
        open={showAddToCombat}
        onOpenChange={setShowAddToCombat}
      />
    </>
  );
}
