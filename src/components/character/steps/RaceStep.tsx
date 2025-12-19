import { RACES, getAttributeAbbr } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RaceStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

export function RaceStep({ data, updateData }: RaceStepProps) {
  const selectedRace = RACES.find(r => r.id === data.race);

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Escolha sua Raça</h2>
        <p className="text-muted-foreground text-sm">
          Sua raça define traços inatos, habilidades e bônus de atributos.
        </p>
      </div>

      <div className="grid gap-3">
        {RACES.map((race) => (
          <button
            key={race.id}
            onClick={() => updateData({ race: race.id, subrace: null })}
            className={cn(
              "w-full p-4 rounded-xl border text-left transition-all",
              data.race === race.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{race.name}</h3>
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
      {selectedRace && (
        <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
          <h3 className="font-semibold mb-3">Traços de {selectedRace.name}</h3>
          <ul className="space-y-3">
            {selectedRace.traits.map((trait) => (
              <li key={trait.id} className="text-sm">
                <span className="font-medium text-foreground">{trait.name}:</span>{' '}
                <span className="text-muted-foreground">
                  {trait.description_markdown.slice(0, 150)}
                  {trait.description_markdown.length > 150 && '...'}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Idiomas:</strong> {selectedRace.languages.join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
