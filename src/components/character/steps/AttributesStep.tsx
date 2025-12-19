import { RACES, getModifier, getModifierString, Attribute } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttributesStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

const ATTRIBUTE_NAMES: Record<Attribute, string> = {
  strength: 'Força',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  intelligence: 'Inteligência',
  wisdom: 'Sabedoria',
  charisma: 'Carisma',
};

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export function AttributesStep({ data, updateData }: AttributesStepProps) {
  const selectedRace = RACES.find(r => r.id === data.race);
  
  const calculatePointsUsed = () => {
    return Object.values(data.attributes).reduce((total, score) => {
      return total + (POINT_BUY_COSTS[score] || 0);
    }, 0);
  };

  const pointsUsed = calculatePointsUsed();
  const pointsRemaining = 27 - pointsUsed;

  const getRacialBonus = (attr: Attribute): number => {
    let bonus = 0;
    if (selectedRace?.ability_bonuses[attr]) {
      bonus += (selectedRace.ability_bonuses[attr] as number) || 0;
    }
    if (data.subrace && selectedRace?.subraces) {
      const subrace = selectedRace.subraces.find(s => s.id === data.subrace);
      if (subrace?.ability_bonuses[attr]) {
        bonus += (subrace.ability_bonuses[attr] as number) || 0;
      }
    }
    return bonus;
  };

  const getFinalScore = (attr: Attribute): number => {
    return data.attributes[attr] + getRacialBonus(attr);
  };

  const canIncrease = (attr: Attribute): boolean => {
    const currentScore = data.attributes[attr];
    if (currentScore >= 15) return false;
    const nextCost = POINT_BUY_COSTS[currentScore + 1] || 0;
    const currentCost = POINT_BUY_COSTS[currentScore] || 0;
    return (nextCost - currentCost) <= pointsRemaining;
  };

  const canDecrease = (attr: Attribute): boolean => {
    return data.attributes[attr] > 8;
  };

  const handleChange = (attr: Attribute, delta: number) => {
    const newScore = data.attributes[attr] + delta;
    if (newScore >= 8 && newScore <= 15) {
      updateData({
        attributes: {
          ...data.attributes,
          [attr]: newScore,
        },
      });
    }
  };

  const handleReset = () => {
    updateData({
      attributes: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
  };

  const applyStandardArray = () => {
    const attrs = Object.keys(data.attributes) as Attribute[];
    const newAttributes = { ...data.attributes };
    attrs.forEach((attr, i) => {
      newAttributes[attr] = STANDARD_ARRAY[i];
    });
    updateData({ attributes: newAttributes });
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Distribua seus Atributos</h2>
        <p className="text-muted-foreground text-sm">
          Use o sistema de compra de pontos. Você tem 27 pontos para distribuir.
        </p>
      </div>

      {/* Points Counter */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
        <div>
          <p className="text-sm text-muted-foreground">Pontos Restantes</p>
          <p className={`text-3xl font-bold ${pointsRemaining < 0 ? 'text-destructive' : 'text-primary'}`}>
            {pointsRemaining}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={applyStandardArray}>
            Array Padrão
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="space-y-3">
        {(Object.keys(data.attributes) as Attribute[]).map((attr) => {
          const baseScore = data.attributes[attr];
          const racialBonus = getRacialBonus(attr);
          const finalScore = getFinalScore(attr);
          const modifier = getModifier(finalScore);

          return (
            <div
              key={attr}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="flex-1">
                <p className="font-medium">{ATTRIBUTE_NAMES[attr]}</p>
                <p className="text-xs text-muted-foreground">
                  Custo: {POINT_BUY_COSTS[baseScore]} pts
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChange(attr, -1)}
                  disabled={!canDecrease(attr)}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <div className="w-12 text-center">
                  <span className="text-lg font-bold">{baseScore}</span>
                </div>
                
                <button
                  onClick={() => handleChange(attr, 1)}
                  disabled={!canIncrease(attr)}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Racial Bonus */}
              {racialBonus > 0 && (
                <div className="w-8 text-center">
                  <span className="text-sm text-primary font-medium">+{racialBonus}</span>
                </div>
              )}

              {/* Final Score */}
              <div className="w-16 text-right">
                <p className="text-xl font-bold">{finalScore}</p>
                <p className="text-xs text-muted-foreground">
                  ({getModifierString(finalScore)})
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Point Buy Cost Reference */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <h4 className="text-sm font-medium mb-2">Tabela de Custos</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(POINT_BUY_COSTS).map(([score, cost]) => (
            <span key={score} className="px-2 py-1 text-xs rounded bg-muted">
              {score}: {cost} pts
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
