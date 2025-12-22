import { BACKGROUNDS, ALIGNMENTS, ALL_SKILLS, ALL_TOOLS, ALL_LANGUAGES } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, Sparkles, BookOpen, Wrench, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHomebrew } from '@/hooks/useHomebrew';
import { Badge } from '@/components/ui/badge';

interface BackgroundStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

export function BackgroundStep({ data, updateData }: BackgroundStepProps) {
  const { homebrewContent: homebrewBackgrounds } = useHomebrew('background');
  const selectedBackground = BACKGROUNDS.find(b => b.id === data.background);
  const isCustomBackground = data.background === 'custom';

  const toggleCustomSkill = (skillId: string) => {
    const current = data.customBackgroundSkills;
    if (current.includes(skillId)) {
      updateData({ customBackgroundSkills: current.filter(s => s !== skillId) });
    } else if (current.length < 2) {
      updateData({ customBackgroundSkills: [...current, skillId] });
    }
  };

  const toggleCustomProficiency = (profId: string) => {
    const current = data.customBackgroundProficiencies;
    if (current.includes(profId)) {
      updateData({ customBackgroundProficiencies: current.filter(p => p !== profId) });
    } else if (current.length < 2) {
      updateData({ customBackgroundProficiencies: [...current, profId] });
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">História do Personagem</h2>
        <p className="text-muted-foreground text-sm">
          Defina o nome, antecedente e personalidade do seu personagem.
        </p>
      </div>

      {/* Character Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Personagem *</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          placeholder="Ex: Thorin Escudo de Ferro"
          className="bg-card"
        />
      </div>

      {/* Background Selection */}
      <div className="space-y-3">
        <Label>Antecedente *</Label>
        <p className="text-xs text-muted-foreground">
          Baseado no SRD 5.1 - Apenas o Acólito é oficial. Use a opção customizada para criar outros conceitos.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => updateData({ 
                background: bg.id,
                // Reset custom fields when switching
                customBackgroundSkills: [],
                customBackgroundProficiencies: [],
                customBackgroundName: '',
                customBackgroundFeature: ''
              })}
              className={cn(
                "p-4 rounded-xl border text-left transition-all",
                data.background === bg.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{bg.name}</span>
                  {bg.isOfficial && (
                    <Badge variant="outline" className="text-[10px] bg-cyan-blue/10 text-cyan-blue border-cyan-blue/30">
                      SRD 5.1
                    </Badge>
                  )}
                  {bg.isCustom && (
                    <Badge variant="outline" className="text-[10px] bg-solar-orange/10 text-solar-orange border-solar-orange/30">
                      Livre
                    </Badge>
                  )}
                </div>
                {data.background === bg.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{bg.description}</p>
            </button>
          ))}
          
          {/* Homebrew Backgrounds */}
          {homebrewBackgrounds.length > 0 && homebrewBackgrounds.map((bg) => (
            <button
              key={bg.id}
              onClick={() => updateData({ background: bg.id })}
              className={cn(
                "p-4 rounded-xl border text-left transition-all",
                data.background === bg.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-border bg-card hover:border-amber-500/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{bg.icon}</span>
                  <span className="font-semibold">{bg.name}</span>
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                    Homebrew
                  </Badge>
                </div>
                {data.background === bg.id && (
                  <Check className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{bg.description}</p>
            </button>
          ))}
        </div>

        {/* Background Details */}
        {selectedBackground && !isCustomBackground && (
          <div className="p-4 rounded-xl bg-muted/30 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-medium">Perícias:</span>
              <span className="text-muted-foreground">
                {selectedBackground.skills.map(s => 
                  ALL_SKILLS.find(sk => sk.id === s)?.name || s
                ).join(', ')}
              </span>
            </div>
            {selectedBackground.languages > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Languages className="w-4 h-4 text-primary" />
                <span className="font-medium">Idiomas:</span>
                <span className="text-muted-foreground">
                  {selectedBackground.languages} à sua escolha
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground italic">
              {selectedBackground.feature}
            </p>
          </div>
        )}

        {/* Custom Background Options */}
        {isCustomBackground && (
          <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-solar-orange/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-solar-orange" />
              <h3 className="font-semibold text-solar-orange">Customizar Antecedente</h3>
            </div>

            {/* Custom Name */}
            <div className="space-y-2">
              <Label>Nome do Antecedente (opcional)</Label>
              <Input
                value={data.customBackgroundName}
                onChange={(e) => updateData({ customBackgroundName: e.target.value })}
                placeholder="Ex: Mercenário, Estudioso, Artista..."
                className="bg-card"
              />
            </div>

            {/* Skills Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Escolha 2 Perícias
                </Label>
                <span className="text-xs text-muted-foreground">
                  {data.customBackgroundSkills.length}/2
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {ALL_SKILLS.map(skill => (
                  <button
                    key={skill.id}
                    onClick={() => toggleCustomSkill(skill.id)}
                    disabled={!data.customBackgroundSkills.includes(skill.id) && data.customBackgroundSkills.length >= 2}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs text-left transition-all",
                      data.customBackgroundSkills.includes(skill.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border hover:border-primary/50 disabled:opacity-40"
                    )}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Proficiencies Selection (Tools or Languages) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Escolha 2 (Idiomas ou Ferramentas)
                </Label>
                <span className="text-xs text-muted-foreground">
                  {data.customBackgroundProficiencies.length}/2
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground">Idiomas:</p>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                {ALL_LANGUAGES.map(lang => (
                  <button
                    key={`lang-${lang.id}`}
                    onClick={() => toggleCustomProficiency(`lang:${lang.id}`)}
                    disabled={!data.customBackgroundProficiencies.includes(`lang:${lang.id}`) && data.customBackgroundProficiencies.length >= 2}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs text-left transition-all",
                      data.customBackgroundProficiencies.includes(`lang:${lang.id}`)
                        ? "bg-cyan-blue text-background"
                        : "bg-card border border-border hover:border-cyan-blue/50 disabled:opacity-40"
                    )}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-2">Ferramentas:</p>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                {ALL_TOOLS.map(tool => (
                  <button
                    key={`tool-${tool.id}`}
                    onClick={() => toggleCustomProficiency(`tool:${tool.id}`)}
                    disabled={!data.customBackgroundProficiencies.includes(`tool:${tool.id}`) && data.customBackgroundProficiencies.length >= 2}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs text-left transition-all truncate",
                      data.customBackgroundProficiencies.includes(`tool:${tool.id}`)
                        ? "bg-cosmic-purple text-white"
                        : "bg-card border border-border hover:border-cosmic-purple/50 disabled:opacity-40"
                    )}
                    title={tool.name}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Feature */}
            <div className="space-y-2">
              <Label>Característica (opcional)</Label>
              <Textarea
                value={data.customBackgroundFeature}
                onChange={(e) => updateData({ customBackgroundFeature: e.target.value })}
                placeholder="Descreva uma habilidade especial ou vantagem social do seu antecedente..."
                className="bg-card min-h-[60px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Alignment Selection */}
      <div className="space-y-3">
        <Label>Alinhamento *</Label>
        <div className="grid grid-cols-3 gap-2">
          {ALIGNMENTS.map((alignment) => (
            <button
              key={alignment.id}
              onClick={() => updateData({ alignment: alignment.id })}
              className={cn(
                "p-2 rounded-lg border text-center transition-all text-xs",
                data.alignment === alignment.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {alignment.name}
            </button>
          ))}
        </div>
      </div>

      {/* Personality */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-lg font-semibold">Personalidade</h3>
        
        <div className="space-y-2">
          <Label htmlFor="traits">Traços de Personalidade</Label>
          <Textarea
            id="traits"
            value={data.personalityTraits}
            onChange={(e) => updateData({ personalityTraits: e.target.value })}
            placeholder="O que define a personalidade do seu personagem?"
            className="bg-card min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ideals">Ideais</Label>
          <Textarea
            id="ideals"
            value={data.ideals}
            onChange={(e) => updateData({ ideals: e.target.value })}
            placeholder="Quais princípios guiam seu personagem?"
            className="bg-card min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bonds">Vínculos</Label>
          <Textarea
            id="bonds"
            value={data.bonds}
            onChange={(e) => updateData({ bonds: e.target.value })}
            placeholder="O que conecta seu personagem ao mundo?"
            className="bg-card min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="flaws">Defeitos</Label>
          <Textarea
            id="flaws"
            value={data.flaws}
            onChange={(e) => updateData({ flaws: e.target.value })}
            placeholder="Quais são as fraquezas do seu personagem?"
            className="bg-card min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}
