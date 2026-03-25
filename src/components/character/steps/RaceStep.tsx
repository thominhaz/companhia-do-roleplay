import { RACES, getAttributeAbbr } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHomebrew } from '@/hooks/useHomebrew';
import { Badge } from '@/components/ui/badge';

interface RaceStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

export function RaceStep({ data, updateData }: RaceStepProps) {
  const { homebrewContent: homebrewRaces } = useHomebrew('race');
  const selectedRace = RACES.find(r => r.id === data.race);
  const selectedHomebrewRace = homebrewRaces.filter(r => !(r.data as any)?.parent_race_id).find(r => r.id === data.race);

  const parseList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  };

  const normalizeHomebrewTraits = (value: unknown) => {
    if (!Array.isArray(value)) return [];
    return value.map((trait, index) => {
      if (typeof trait === 'string') {
        return { id: `homebrew-trait-${index}`, name: trait, description: trait };
      }
      if (trait && typeof trait === 'object') {
        const normalizedTrait = trait as any;
        return {
          id: normalizedTrait.id || `homebrew-trait-${index}`,
          name: normalizedTrait.name || `Traço ${index + 1}`,
          description: normalizedTrait.description,
          description_markdown: normalizedTrait.description_markdown,
        };
      }
      return { id: `homebrew-trait-${index}`, name: `Traço ${index + 1}`, description: '' };
    });
  };

  // Get homebrew subraces that target the selected race
  const homebrewSubracesForSelected = homebrewRaces
    .filter(r => !!(r.data as any)?.parent_race_id && (r.data as any).parent_race_id === data.race)
    .map(r => {
      const rData = r.data as any;
      return {
        id: r.id,
        name: r.name,
        name_en: r.name,
        description: r.description || '',
        ability_bonuses: rData.ability_bonuses || {},
        traits: normalizeHomebrewTraits(rData.traits || []),
        isHomebrew: true,
      };
    });

  const homebrewSubraces = selectedHomebrewRace 
    ? ((selectedHomebrewRace.data as any)?.subraces || []).map((sr: any) => ({
        id: sr.id,
        name: sr.name,
        description: sr.description || '',
        ability_bonuses: sr.ability_bonuses || {},
        traits: normalizeHomebrewTraits(sr.traits),
      }))
    : [];

  const selectedRaceData = selectedRace || (selectedHomebrewRace ? {
    ...selectedHomebrewRace,
    id: selectedHomebrewRace.id,
    name: selectedHomebrewRace.name,
    traits: normalizeHomebrewTraits((selectedHomebrewRace.data as any)?.traits),
    languages: parseList((selectedHomebrewRace.data as any)?.languages),
    subraces: homebrewSubraces,
  } : null);

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Escolha sua Raça</h2>
        <p className="text-muted-foreground text-sm">
          Sua raça define traços inatos, habilidades e bônus de atributos.
        </p>
      </div>

      <div className="grid gap-3">
        {/* SRD Races */}
        {RACES.map((race) => (
          <button
            key={race.id}
            onClick={() => updateData({ race: race.id, subrace: null, abilityBonusChoices: [] })}
            className={cn(
              "w-full p-4 rounded-xl border text-left transition-all",
              data.race === race.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{race.name}</h3>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                    SRD 5.1
                  </Badge>
                  {data.race === race.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {race.size_description}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(race.ability_bonuses).map(([attr, bonus]) => (
                    <span
                      key={attr}
                      className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary"
                    >
                      +{bonus} {getAttributeAbbr(attr)}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                    {race.speed}m velocidade
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground capitalize">
                    {race.size === 'medium' ? 'Médio' : 'Pequeno'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Homebrew Races */}
        {homebrewRaces.length > 0 && (
          <>
            <div className="col-span-full pt-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Raças Homebrew
              </p>
            </div>
            {homebrewRaces.map((race) => {
              const raceData = race.data as any;
              const abilityBonuses = raceData?.ability_bonuses || {};
              return (
                <button
                  key={race.id}
                  onClick={() => updateData({ race: race.id, subrace: null, abilityBonusChoices: [] })}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    data.race === race.id
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-border bg-card hover:border-amber-500/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{race.icon}</span>
                        <h3 className="font-semibold">{race.name}</h3>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                          Homebrew
                        </Badge>
                        {data.race === race.id && (
                          <Check className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {race.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(abilityBonuses).map(([attr, bonus]) => (
                          <span
                            key={attr}
                            className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-500"
                          >
                            +{bonus as number} {getAttributeAbbr(attr)}
                          </span>
                        ))}
                        <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                          {raceData?.speed || 9}m velocidade
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground capitalize">
                          {String(raceData?.size || '').toLowerCase() === 'small' ? 'Pequeno' : 'Médio'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Subrace Selection */}
      {selectedRace?.subraces && selectedRace.subraces.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-3">Escolha uma Sub-raça</h3>
          <div className="grid gap-3">
            {selectedRace.subraces.map((subrace) => (
              <button
                key={subrace.id}
                onClick={() => updateData({ subrace: subrace.id })}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all",
                  data.subrace === subrace.id
                    ? "border-secondary bg-secondary/10"
                    : "border-border bg-card hover:border-secondary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{subrace.name}</h4>
                      {data.subrace === subrace.id && (
                        <Check className="w-4 h-4 text-secondary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {subrace.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(subrace.ability_bonuses).map(([attr, bonus]) => (
                        <span
                          key={attr}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary/20 text-secondary"
                        >
                          +{bonus} {getAttributeAbbr(attr)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Race Details */}
      {selectedRaceData && (
        <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
          <h3 className="font-semibold mb-3">Traços de {selectedRaceData.name}</h3>
          <ul className="space-y-3">
            {selectedRaceData.traits.map((trait: any, idx: number) => (
              <li key={trait.id || idx} className="text-sm">
                <span className="font-medium text-foreground">{trait.name}:</span>{' '}
                <span className="text-muted-foreground">
                  {(trait.description_markdown || trait.description || '').slice(0, 150)}
                  {(trait.description_markdown || trait.description || '').length > 150 && '...'}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Idiomas:</strong> {selectedRaceData.languages.join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
