import { WizardData } from '../CharacterWizard';
import { RACES } from '@/data/srd';
import { cn } from '@/lib/utils';
import { Check, Globe, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import languagesData from '@/data/rules/idiomas.json';

interface LanguagesStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

interface Language {
  id: string;
  name: string;
  typical_speakers: string;
  script: string;
}

export function LanguagesStep({ data, updateData }: LanguagesStepProps) {
  const selectedRace = RACES.find(r => r.id === data.race);
  
  // Get base languages from race
  const baseLanguages = selectedRace?.languages || [];
  
  // Check if race has extra language trait (like Human)
  const extraLanguageTrait = selectedRace?.traits?.find(t => t.mechanical?.extra_languages);
  const extraLanguagesCount: number = (extraLanguageTrait?.mechanical?.extra_languages as number) || 0;
  
  const selectedExtraLanguages = data.extraLanguages || [];

  // Combine all available languages
  const standardLanguages: Language[] = languagesData.languages.standard_languages.languages;
  const exoticLanguages: Language[] = languagesData.languages.exotic_languages.languages;
  const allLanguages = [...standardLanguages, ...exoticLanguages];

  // Filter out languages the character already knows
  const availableLanguages = allLanguages.filter(
    lang => !baseLanguages.some(bl => bl.toLowerCase() === lang.name.toLowerCase())
  );

  const handleToggleLanguage = (langId: string) => {
    const current = [...selectedExtraLanguages];
    const index = current.indexOf(langId);
    
    if (index > -1) {
      current.splice(index, 1);
    } else if (current.length < extraLanguagesCount) {
      current.push(langId);
    }
    
    updateData({ extraLanguages: current });
  };

  if (extraLanguagesCount === 0) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <Globe className="w-12 h-12 mx-auto text-primary mb-3" />
          <h2 className="text-xl font-bold text-foreground">Idiomas</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Sua raça já define seus idiomas conhecidos
          </p>
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Idiomas Conhecidos
          </h3>
          <div className="flex flex-wrap gap-2">
            {baseLanguages.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Idiomas Extras</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha <span className="text-primary font-semibold">{extraLanguagesCount}</span> idioma{extraLanguagesCount > 1 ? 's' : ''} adicional{extraLanguagesCount > 1 ? 'is' : ''}
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
          <span className="text-sm">
            {selectedExtraLanguages.length} / {extraLanguagesCount} selecionado{extraLanguagesCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Base Languages */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Idiomas da Raça
        </h3>
        <div className="flex flex-wrap gap-2">
          {baseLanguages.map((lang) => (
            <span
              key={lang}
              className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm font-medium"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Standard Languages */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Idiomas Padrão
        </h3>
        <div className="space-y-2">
          {availableLanguages
            .filter(l => standardLanguages.some(sl => sl.id === l.id))
            .map((lang) => {
              const isSelected = selectedExtraLanguages.includes(lang.id);
              const isDisabled = !isSelected && selectedExtraLanguages.length >= extraLanguagesCount;

              return (
                <button
                  key={lang.id}
                  onClick={() => handleToggleLanguage(lang.id)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full glass rounded-xl p-3 text-left transition-all flex items-center gap-3",
                    isSelected && "border-primary bg-primary/10",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    !isSelected && !isDisabled && "hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">
                      {lang.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Falantes: {lang.typical_speakers} • Escrita: {lang.script}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Exotic Languages */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          Idiomas Exóticos
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">Idiomas raros, normalmente requerem permissão do Mestre</p>
            </TooltipContent>
          </Tooltip>
        </h3>
        <div className="space-y-2">
          {availableLanguages
            .filter(l => exoticLanguages.some(el => el.id === l.id))
            .map((lang) => {
              const isSelected = selectedExtraLanguages.includes(lang.id);
              const isDisabled = !isSelected && selectedExtraLanguages.length >= extraLanguagesCount;

              return (
                <button
                  key={lang.id}
                  onClick={() => handleToggleLanguage(lang.id)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full glass rounded-xl p-3 text-left transition-all flex items-center gap-3",
                    isSelected && "border-primary bg-primary/10",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    !isSelected && !isDisabled && "hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">
                      {lang.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Falantes: {lang.typical_speakers} • Escrita: {lang.script}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
