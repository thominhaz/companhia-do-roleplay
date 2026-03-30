import { useState, useMemo } from 'react';
import { Package, Sword, Shield, ChevronDown, ChevronUp, Check, Gem, Gift, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardData } from '../types';
import { CLASSES } from '@/data/srd';
import { useHomebrew } from '@/hooks/useHomebrew';
import { Badge } from '@/components/ui/badge';
import {
  getItemName,
  isCategory,
  isPack,
  describeOptionGroup,
  getCategoryWeapons,
  parseItemWithQuantity,
  pacotesData,
} from '@/lib/equipmentUtils';

interface EquipmentStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

type EquipmentPack = {
  id: string;
  name: string;
  description: string;
  items: { item_pt: string; quantity: number; unit?: string }[];
};

const PACKS = pacotesData.equipment_packs.packs as EquipmentPack[];

export function EquipmentStep({ data, updateData }: EquipmentStepProps) {
  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [expandedCategoryChoice, setExpandedCategoryChoice] = useState<string | null>(null);
  const { homebrewContent } = useHomebrew('item');

  const selectedClass = CLASSES.find(c => c.id === data.class || c.name.toLowerCase() === data.class);
  const startingEquipment = selectedClass?.starting_equipment;
  const choices = startingEquipment?.choices || [];
  const granted = startingEquipment?.granted || [];

  // Current selections
  const equipChoices = data.equipmentChoices || {};
  const categorySelections = data.equipmentCategorySelections || {};

  const handleChoiceSelect = (choiceIdx: number, optionIdx: number) => {
    const newChoices = { ...equipChoices, [choiceIdx]: optionIdx };
    updateData({ equipmentChoices: newChoices });
  };

  const handleCategorySelect = (key: string, weaponId: string) => {
    const newSelections = { ...categorySelections, [key]: weaponId };
    updateData({ equipmentCategorySelections: newSelections });
  };

  // Determine if an option contains a category that needs sub-selection
  const getOptionCategories = (items: string[]) => {
    return items.filter(item => {
      const { id } = parseItemWithQuantity(item);
      return isCategory(id);
    });
  };

  // Homebrew items
  const homebrewWeapons = homebrewContent.filter(item => {
    const itemData = item.data as any;
    return itemData?.type === 'weapon' || itemData?.tipo === 'arma';
  });

  const homebrewArmors = homebrewContent.filter(item => {
    const itemData = item.data as any;
    return itemData?.type === 'armor' || itemData?.tipo === 'armadura';
  });

  if (!startingEquipment && !selectedClass?.equipment_markdown) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Selecione uma classe primeiro para ver as opções de equipamento.</p>
      </div>
    );
  }

  // Fallback: show markdown if no structured data
  if (!startingEquipment) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Equipamento Inicial</h2>
        </div>
        <div className="glass rounded-xl p-4 border border-border/50">
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {selectedClass?.equipment_markdown}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Equipamento Inicial</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Faça suas escolhas de equipamento para {selectedClass?.name}.
        </p>
      </div>

      {/* Dynamic Choices */}
      {choices.map((choice, choiceIdx) => {
        const selectedOption = equipChoices[choiceIdx];
        
        // Detect choice type for better labeling
        const firstOptionItems = choice.from[0];
        const hasPackOption = firstOptionItems.some(item => isPack(parseItemWithQuantity(item).id));
        
        return (
          <section key={choiceIdx}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              {hasPackOption ? (
                <Package className="w-4 h-4 text-primary" />
              ) : (
                <Sword className="w-4 h-4 text-primary" />
              )}
              Escolha {choiceIdx + 1}
            </h3>

            <div className="space-y-2">
              {choice.from.map((optionItems, optionIdx) => {
                const isSelected = selectedOption === optionIdx;
                const label = describeOptionGroup(optionItems);
                const categories = getOptionCategories(optionItems);
                const packItem = optionItems.find(item => isPack(parseItemWithQuantity(item).id));
                const packData = packItem ? PACKS.find(p => p.id === parseItemWithQuantity(packItem).id) : null;

                return (
                  <div key={optionIdx}>
                    <button
                      onClick={() => handleChoiceSelect(choiceIdx, optionIdx)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all glass",
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border/50 hover:border-border'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}>
                            {String.fromCharCode(97 + optionIdx)}
                          </div>
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-5 h-5 text-primary" />}
                          {packData && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedPack(expandedPack === packData.id ? null : packData.id);
                              }}
                              className="p-1"
                            >
                              {expandedPack === packData.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded pack details */}
                    {packData && expandedPack === packData.id && (
                      <div className="ml-11 mt-2 px-4 pb-3 pt-2 border border-border/30 rounded-lg bg-muted/20">
                        <p className="text-xs text-muted-foreground mb-2">{packData.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {packData.items.map((item, i) => (
                            <span key={i} className="text-xs bg-muted/50 px-2 py-0.5 rounded">
                              {item.item_pt} {item.quantity > 1 ? `(${item.quantity}${item.unit ? ' ' + item.unit : ''})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category sub-selection (e.g., pick a specific martial weapon) */}
                    {isSelected && categories.length > 0 && categories.map(catItem => {
                      const { id: catId, quantity: catQty } = parseItemWithQuantity(catItem);
                      const catKey = `${choiceIdx}-${optionIdx}-${catId}`;
                      const weapons = getCategoryWeapons(catId);
                      const selectedWeapon = categorySelections[catKey];

                      return (
                        <div key={catKey} className="ml-11 mt-2">
                          <button
                            onClick={() => setExpandedCategoryChoice(expandedCategoryChoice === catKey ? null : catKey)}
                            className="text-xs text-primary flex items-center gap-1 mb-1"
                          >
                            <Info className="w-3 h-3" />
                            Escolher {getItemName(catId)}{catQty > 1 ? ` (×${catQty})` : ''}:
                            {selectedWeapon && (
                              <span className="text-foreground font-medium ml-1">
                                {getItemName(selectedWeapon)}
                              </span>
                            )}
                            {expandedCategoryChoice === catKey ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                          
                          {expandedCategoryChoice === catKey && (
                            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 border border-border/30 rounded-lg bg-muted/20">
                              {weapons.map(w => (
                                <button
                                  key={w.id}
                                  onClick={() => {
                                    handleCategorySelect(catKey, w.id);
                                    setExpandedCategoryChoice(null);
                                  }}
                                  className={cn(
                                    "p-2 rounded-lg border text-left text-xs transition-all",
                                    selectedWeapon === w.id
                                      ? 'border-primary bg-primary/10 font-medium'
                                      : 'border-border/30 hover:border-border'
                                  )}
                                >
                                  {w.name}
                                </button>
                              ))}
                              {/* Homebrew weapons for weapon categories */}
                              {homebrewWeapons.map(hw => (
                                <button
                                  key={hw.id}
                                  onClick={() => {
                                    handleCategorySelect(catKey, `homebrew:${hw.name}`);
                                    setExpandedCategoryChoice(null);
                                  }}
                                  className={cn(
                                    "p-2 rounded-lg border text-left text-xs transition-all",
                                    selectedWeapon === `homebrew:${hw.name}`
                                      ? 'border-amber-500 bg-amber-500/10 font-medium'
                                      : 'border-amber-500/30'
                                  )}
                                >
                                  <div className="flex items-center gap-1">
                                    <Gem className="w-3 h-3 text-amber-500 shrink-0" />
                                    {hw.name}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Granted Items (always received) */}
      {granted.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Itens Garantidos
          </h3>
          <div className="glass rounded-xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Você recebe automaticamente:
            </p>
            <div className="flex flex-wrap gap-2">
              {granted.map((item, i) => {
                const { id, quantity } = parseItemWithQuantity(item);
                const name = getItemName(id);
                return (
                  <span key={i} className="text-sm bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {name}{quantity > 1 ? ` (${quantity})` : ''}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Summary of selections */}
      {Object.keys(equipChoices).length > 0 && (
        <section className="bg-muted/20 rounded-xl border border-border/30 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Resumo das Escolhas
          </h3>
          <div className="space-y-1">
            {Object.entries(equipChoices).map(([choiceIdx, optionIdx]) => {
              const choice = choices[parseInt(choiceIdx)];
              if (!choice) return null;
              const items = choice.from[optionIdx as number];
              if (!items) return null;
              return (
                <p key={choiceIdx} className="text-sm text-foreground">
                  • {describeOptionGroup(items)}
                  {/* Show category selection if applicable */}
                  {items.map(item => {
                    const { id } = parseItemWithQuantity(item);
                    if (!isCategory(id)) return null;
                    const catKey = `${choiceIdx}-${optionIdx}-${id}`;
                    const sel = categorySelections[catKey];
                    if (!sel) return null;
                    return (
                      <span key={catKey} className="text-primary ml-1">
                        → {sel.startsWith('homebrew:') ? sel.replace('homebrew:', '') : getItemName(sel)}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
