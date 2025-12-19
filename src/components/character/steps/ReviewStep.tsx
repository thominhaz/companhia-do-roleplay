import { RACES, CLASSES, BACKGROUNDS, ALIGNMENTS, getModifier, getModifierString, calculateHP, Attribute, getAttributeName } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Heart, Shield, Zap } from 'lucide-react';

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
  const selectedRace = RACES.find(r => r.id === data.race);
  const selectedSubrace = selectedRace?.subraces?.find(s => s.id === data.subrace);
  const selectedClass = CLASSES.find(c => c.id === data.class);
  const selectedBackground = BACKGROUNDS.find(b => b.id === data.background);
  const selectedAlignment = ALIGNMENTS.find(a => a.id === data.alignment);

  // Calculate final attributes with racial bonuses
  const getFinalScore = (attr: Attribute): number => {
    let score = data.attributes[attr];
    if (selectedRace?.ability_bonuses[attr]) {
      score += (selectedRace.ability_bonuses[attr] as number) || 0;
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
  const ac = 10 + dexMod;

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
          {selectedSubrace ? `${selectedSubrace.name} ` : ''}{selectedRace?.name || ''} {selectedClass?.name || ''} • Nível 1
        </p>
        <div className="flex gap-2 mt-3">
          <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
            {selectedBackground?.name || 'Sem antecedente'}
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
          <p className="text-2xl font-bold">{selectedRace?.speed || 9}m</p>
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
      {selectedRace && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h4 className="font-semibold mb-3">Traços Raciais</h4>
          <ul className="space-y-1">
            {selectedRace.traits.map((trait) => (
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
          </ul>
          <p className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
            <strong>Idiomas:</strong> {selectedRace.languages.join(', ')}
          </p>
        </div>
      )}

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
