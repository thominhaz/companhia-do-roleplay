import { useState } from 'react';
import { BACKGROUNDS, ALIGNMENTS, ALL_SKILLS, ALL_TOOLS, ALL_LANGUAGES } from '@/data/srd';
import { WizardData } from '../types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, Sparkles, BookOpen, Wrench, Languages, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHomebrew } from '@/hooks/useHomebrew';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BackgroundStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

export function BackgroundStep({ data, updateData }: BackgroundStepProps) {
  const { homebrewContent: homebrewBackgrounds } = useHomebrew('background');
  const selectedBackground = BACKGROUNDS.find(b => b.id === data.background);
  const isCustomBackground = data.background === 'custom';
  const [showCustomSheet, setShowCustomSheet] = useState(false);

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

  const handleSelectCustom = () => {
    updateData({ 
      background: 'custom',
      customBackgroundSkills: data.customBackgroundSkills || [],
      customBackgroundProficiencies: data.customBackgroundProficiencies || [],
      customBackgroundName: data.customBackgroundName || '',
      customBackgroundFeature: data.customBackgroundFeature || ''
    });
    setShowCustomSheet(true);
  };

  const getCustomSummary = () => {
    const parts: string[] = [];
    if (data.customBackgroundName) {
      parts.push(data.customBackgroundName);
    }
    if (data.customBackgroundSkills.length > 0) {
      const skillNames = data.customBackgroundSkills.map(s => 
        ALL_SKILLS.find(sk => sk.id === s)?.name || s
      );
      parts.push(`Perícias: ${skillNames.join(', ')}`);
    }
    if (data.customBackgroundProficiencies.length > 0) {
      const profNames = data.customBackgroundProficiencies.map(p => {
        if (p.startsWith('lang:')) {
          return ALL_LANGUAGES.find(l => l.id === p.replace('lang:', ''))?.name || p;
        }
        if (p.startsWith('tool:')) {
          return ALL_TOOLS.find(t => t.id === p.replace('tool:', ''))?.name || p;
        }
        return p;
      });
      parts.push(`Proficiências: ${profNames.join(', ')}`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Clique para configurar';
  };

  return (
    <div className="px-4 py-6 pb-24 space-y-6">
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
          {BACKGROUNDS.filter(bg => !bg.isCustom).map((bg) => (
            <button
              key={bg.id}
              onClick={() => updateData({ 
                background: bg.id,
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
                </div>
                {data.background === bg.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{bg.description}</p>
            </button>
          ))}
          
          {/* Custom Background - Opens Sheet */}
          <button
            onClick={handleSelectCustom}
            className={cn(
              "p-4 rounded-xl border text-left transition-all",
              isCustomBackground
                ? "border-solar-orange bg-solar-orange/10"
                : "border-border bg-card hover:border-solar-orange/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-solar-orange" />
                <span className="font-semibold">Customizado</span>
                <Badge variant="outline" className="text-[10px] bg-solar-orange/10 text-solar-orange border-solar-orange/30">
                  Livre
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {isCustomBackground && (
                  <Check className="w-4 h-4 text-solar-orange" />
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isCustomBackground ? getCustomSummary() : 'Crie seu próprio antecedente com perícias e proficiências à sua escolha.'}
            </p>
          </button>
          
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

        {/* Background Details for non-custom */}
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

        {/* Custom Background Summary (when selected but sheet closed) */}
        {isCustomBackground && (
          <div className="p-4 rounded-xl bg-solar-orange/10 border border-solar-orange/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-solar-orange" />
                <span className="font-medium text-solar-orange">
                  {data.customBackgroundName || 'Antecedente Customizado'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCustomSheet(true)}
                className="text-solar-orange hover:text-solar-orange hover:bg-solar-orange/20"
              >
                Editar
              </Button>
            </div>
            {data.customBackgroundSkills.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-solar-orange" />
                <span className="font-medium">Perícias:</span>
                <span className="text-muted-foreground">
                  {data.customBackgroundSkills.map(s => 
                    ALL_SKILLS.find(sk => sk.id === s)?.name || s
                  ).join(', ')}
                </span>
              </div>
            )}
            {data.customBackgroundProficiencies.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="w-4 h-4 text-solar-orange" />
                <span className="font-medium">Proficiências:</span>
                <span className="text-muted-foreground">
                  {data.customBackgroundProficiencies.map(p => {
                    if (p.startsWith('lang:')) {
                      return ALL_LANGUAGES.find(l => l.id === p.replace('lang:', ''))?.name || p;
                    }
                    if (p.startsWith('tool:')) {
                      return ALL_TOOLS.find(t => t.id === p.replace('tool:', ''))?.name || p;
                    }
                    return p;
                  }).join(', ')}
                </span>
              </div>
            )}
            {data.customBackgroundFeature && (
              <p className="text-sm text-muted-foreground italic">
                {data.customBackgroundFeature}
              </p>
            )}
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

      {/* Custom Background Sheet */}
      <Sheet open={showCustomSheet} onOpenChange={setShowCustomSheet}>
        <SheetContent side="bottom" className="h-[85vh] bg-background">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-solar-orange">
              <Sparkles className="w-5 h-5" />
              Customizar Antecedente
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(85vh-120px)] pr-4">
            <div className="space-y-6 pb-6">
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
                  <Badge variant={data.customBackgroundSkills.length >= 2 ? "default" : "outline"}>
                    {data.customBackgroundSkills.length}/2
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_SKILLS.map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => toggleCustomSkill(skill.id)}
                      disabled={!data.customBackgroundSkills.includes(skill.id) && data.customBackgroundSkills.length >= 2}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm text-left transition-all",
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

              {/* Languages Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Idiomas ou Ferramentas (2 total)
                  </Label>
                  <Badge variant={data.customBackgroundProficiencies.length >= 2 ? "default" : "outline"}>
                    {data.customBackgroundProficiencies.length}/2
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground font-medium">Idiomas:</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_LANGUAGES.map(lang => (
                    <button
                      key={`lang-${lang.id}`}
                      onClick={() => toggleCustomProficiency(`lang:${lang.id}`)}
                      disabled={!data.customBackgroundProficiencies.includes(`lang:${lang.id}`) && data.customBackgroundProficiencies.length >= 2}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm text-left transition-all",
                        data.customBackgroundProficiencies.includes(`lang:${lang.id}`)
                          ? "bg-cyan-blue text-background"
                          : "bg-card border border-border hover:border-cyan-blue/50 disabled:opacity-40"
                      )}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground font-medium mt-3">Ferramentas:</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_TOOLS.map(tool => (
                    <button
                      key={`tool-${tool.id}`}
                      onClick={() => toggleCustomProficiency(`tool:${tool.id}`)}
                      disabled={!data.customBackgroundProficiencies.includes(`tool:${tool.id}`) && data.customBackgroundProficiencies.length >= 2}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm text-left transition-all truncate",
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
                  className="bg-card min-h-[100px]"
                />
              </div>
            </div>
          </ScrollArea>

          <div className="pt-4 border-t">
            <Button 
              onClick={() => setShowCustomSheet(false)} 
              className="w-full bg-solar-orange hover:bg-solar-orange/90"
            >
              Confirmar Antecedente
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
