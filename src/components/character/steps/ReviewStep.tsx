import { RACES, CLASSES, BACKGROUNDS, ALIGNMENTS, getModifier, getModifierString, calculateHP, Attribute, getAttributeName } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Heart, Shield, Zap } from 'lucide-react';
import armaduras from '@/data/equipment/armaduras.json';
import armasJson from '@/data/equipment/armas.json';
import pacotesData from '@/data/equipment/pacotes-iniciais.json';
import { useHomebrew } from '@/hooks/useHomebrew';
import { getItemName } from '@/lib/equipmentUtils';

interface ReviewStepProps {
  data: WizardData;
}

const ATTRIBUTE_ABBR: Record<Attribute, string> = {
  strength: 'FOR',
  dexterity: 'DES',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'SAB',
  charisma: 'CAR',
};

export function ReviewStep({ data }: ReviewStepProps) {
  const { homebrewContent: homebrewRaces } = useHomebrew('race');
  const { homebrewContent: homebrewBackgrounds } = useHomebrew('background');
  const { homebrewContent: homebrewSubclasses } = useHomebrew('subclass');

  const selectedRace = RACES.find(r => r.id === data.race);
  const selectedHomebrewRace = homebrewRaces.find(r => r.id === data.race);
  const homebrewRaceData = selectedHomebrewRace?.data as any;

  const selectedSubrace = selectedRace?.subraces?.find(s => s.id === data.subrace);
  const selectedClass = CLASSES.find(c => c.id === data.class);
  const selectedBackground = BACKGROUNDS.find(b => b.id === data.background);
  const selectedHomebrewBg = homebrewBackgrounds.find(b => b.id === data.background);
  const selectedAlignment = ALIGNMENTS.find(a => a.id === data.alignment);

  const raceName = selectedRace?.name || selectedHomebrewRace?.name || '';
  const raceSpeed = selectedRace?.speed || homebrewRaceData?.speed || 9;
  const raceAbilityBonuses: Partial<Record<Attribute, number>> = selectedRace?.ability_bonuses || homebrewRaceData?.ability_bonuses || {};
  const raceLanguages: string[] = selectedRace?.languages || (
    homebrewRaceData?.languages
      ? (typeof homebrewRaceData.languages === 'string' 
          ? homebrewRaceData.languages.split(',').map((l: string) => l.trim())
          : homebrewRaceData.languages)
      : []
  );

  // Resolve background name
  let backgroundName = selectedBackground?.name;
  if (!backgroundName) {
    if (data.background === 'custom') {
      backgroundName = data.customBackgroundName || 'Customizado';
    } else {
      backgroundName = selectedHomebrewBg?.name || 'Sem antecedente';
    }
  }

  // Calculate final attributes with racial bonuses
  const getFinalScore = (attr: Attribute): number => {
    let score = data.attributes[attr];
    if (raceAbilityBonuses[attr]) {
      score += (raceAbilityBonuses[attr] as number) || 0;
    }
    if (data.abilityBonusChoices?.includes(attr)) {
      score += 1;
    }
    if (selectedSubrace?.ability_bonuses[attr]) {
      score += (selectedSubrace.ability_bonuses[attr] as number) || 0;
    }
    return score;
  };

  const finalAttributes = Object.fromEntries(
    (Object.keys(data.attributes) as Attribute[]).map(attr => [attr, getFinalScore(attr)])
  ) as Record<Attribute, number>;

  const conMod = getModifier(finalAttributes.constitution);
  const dexMod = getModifier(finalAttributes.dexterity);
  const hp = selectedClass ? calculateHP(selectedClass.hit_die, conMod, 1) : 10;
  
  // Calculate AC from dynamic equipment choices
  let ac = 10 + dexMod;
  let hasShieldBonus = false;
  let armorForAC: string | null = null;
  
  const startEquip = selectedClass?.starting_equipment;
  if (startEquip?.choices) {
    // Find armor/shield selections
    const allItems: string[] = [];
    startEquip.choices.forEach((choice: any, choiceIdx: number) => {
      const optionIdx = data.equipmentChoices?.[choiceIdx];
      if (optionIdx === undefined) return;
      const optionItems = choice.from[optionIdx];
      if (!optionItems) return;
      optionItems.forEach((rawItem: string) => {
        const itemId = rawItem.split(':')[0];
        const catKey = `${choiceIdx}-${optionIdx}-${itemId}`;
        const specific = data.equipmentCategorySelections?.[catKey];
        allItems.push(specific || itemId);
      });
    });
    if (startEquip.granted) {
      startEquip.granted.forEach((rawItem: string) => allItems.push(rawItem.split(':')[0]));
    }
    
    allItems.forEach(itemId => {
      const armorInfo = armaduras.items.find(a => a.id === itemId);
      if (armorInfo && armorInfo.category !== 'shield') armorForAC = itemId;
      if (itemId === 'shield' || itemId === 'wooden_shield' || armorInfo?.category === 'shield') hasShieldBonus = true;
    });
  }
  
  if (armorForAC) {
    const selectedArmor = armaduras.items.find(a => a.id === armorForAC);
    if (selectedArmor) {
      if (selectedArmor.category === 'heavy') ac = selectedArmor.armor_class.base;
      else if (selectedArmor.category === 'medium') {
        const maxDex = selectedArmor.armor_class.max_dex_bonus ?? 2;
        ac = selectedArmor.armor_class.base + Math.min(dexMod, maxDex);
      } else ac = selectedArmor.armor_class.base + dexMod;
    }
  } else if (selectedClass?.id === 'monk') {
    ac = 10 + dexMod + getModifier(finalAttributes.wisdom);
  } else if (selectedClass?.id === 'barbarian' || selectedClass?.id === 'barbaro') {
    ac = 10 + dexMod + conMod;
  }
  if (hasShieldBonus) ac += 2;

  // Race traits for display
  const raceTraits = selectedRace?.traits || [];
  const homebrewTraits: string[] = homebrewRaceData?.traits || [];

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Revisar Personagem</h2>
        <p className="text-muted-foreground text-sm">
          Confira os detalhes do seu personagem antes de criar.
        </p>
      </div>

      {/* Character Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
        <h3 className="text-2xl font-bold">{data.name || 'Sem Nome'}</h3>
        <p className="text-muted-foreground mt-1">
          {selectedSubrace ? `${selectedSubrace.name} ` : ''}{raceName} {selectedClass?.name || ''} • Nível 1
        </p>
        <div className="flex gap-2 mt-3">
          <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
            {backgroundName}
          </span>
          <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
            {selectedAlignment?.name || 'Sem alinhamento'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <Heart className="w-5 h-5 mx-auto text-destructive mb-1" />
          <p className="text-2xl font-bold">{hp}</p>
          <p className="text-xs text-muted-foreground">HP</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <Shield className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{ac}</p>
          <p className="text-xs text-muted-foreground">CA</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <Zap className="w-5 h-5 mx-auto text-secondary mb-1" />
          <p className="text-2xl font-bold">{raceSpeed}m</p>
          <p className="text-xs text-muted-foreground">Velocidade</p>
        </div>
      </div>

      {/* Attributes */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <h4 className="font-semibold mb-3">Atributos</h4>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(finalAttributes) as Attribute[]).map((attr) => (
            <div key={attr} className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">{ATTRIBUTE_ABBR[attr]}</p>
              <p className="text-xl font-bold">{finalAttributes[attr]}</p>
              <p className="text-xs text-primary">{getModifierString(finalAttributes[attr])}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Class Details */}
      {selectedClass && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h4 className="font-semibold mb-3">Detalhes da Classe</h4>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Dado de Vida:</span>{' '}
              <span className="font-medium">d{selectedClass.hit_die}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Salvaguardas:</span>{' '}
              <span className="font-medium">
                {selectedClass.saving_throw_proficiencies.map(s => getAttributeName(s)).join(', ')}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Bônus de Proficiência:</span>{' '}
              <span className="font-medium">+2</span>
            </p>
          </div>
        </div>
      )}

      {/* Racial Traits */}
      {(raceTraits.length > 0 || homebrewTraits.length > 0) && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h4 className="font-semibold mb-3">Traços Raciais</h4>
          <ul className="space-y-1">
            {raceTraits.map((trait) => (
              <li key={trait.id} className="text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">{trait.name}</span>
              </li>
            ))}
            {selectedSubrace?.traits?.map((trait) => (
              <li key={trait.id} className="text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">{trait.name}</span>
              </li>
            ))}
            {homebrewTraits.map((trait, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">{typeof trait === 'string' ? trait : (trait as any).name || trait}</span>
              </li>
            ))}
          </ul>
          {raceLanguages.length > 0 && (
            <p className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
              <strong>Idiomas:</strong> {raceLanguages.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Subclass Features */}
      {data.subclass && (() => {
        const selectedSubclass = homebrewSubclasses.find(s => s.id === data.subclass);
        const subFeatures = (selectedSubclass?.data as any)?.features || [];
        if (!selectedSubclass || subFeatures.length === 0) return null;
        return (
          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="font-semibold mb-3">Subclasse: {selectedSubclass.name}</h4>
            <ul className="space-y-1">
              {subFeatures.map((f: any, idx: number) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {f.name}{f.level ? ` (Nível ${f.level})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* Personality */}
      {(data.personalityTraits || data.ideals || data.bonds || data.flaws) && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h4 className="font-semibold mb-3">Personalidade</h4>
          <div className="space-y-3 text-sm">
            {data.personalityTraits && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Traços</p>
                <p className="mt-1">{data.personalityTraits}</p>
              </div>
            )}
            {data.ideals && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ideais</p>
                <p className="mt-1">{data.ideals}</p>
              </div>
            )}
            {data.bonds && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Vínculos</p>
                <p className="mt-1">{data.bonds}</p>
              </div>
            )}
            {data.flaws && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Defeitos</p>
                <p className="mt-1">{data.flaws}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}