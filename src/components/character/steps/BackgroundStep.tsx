import { BACKGROUNDS, ALIGNMENTS } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackgroundStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

export function BackgroundStep({ data, updateData }: BackgroundStepProps) {
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
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => updateData({ background: bg.id })}
              className={cn(
                "p-3 rounded-xl border text-left transition-all",
                data.background === bg.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{bg.name}</span>
                {data.background === bg.id && (
                  <Check className="w-3 h-3 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
        {data.background && (
          <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
            {BACKGROUNDS.find(b => b.id === data.background)?.description}
          </p>
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
