import { WizardData } from '../types';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { BookOpen, User, Sparkles, Target } from 'lucide-react';

interface BackstoryStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

export function BackstoryStep({ data, updateData }: BackstoryStepProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <BookOpen className="w-12 h-12 mx-auto text-primary mb-3" />
        <h2 className="text-xl font-bold text-foreground">História do Personagem</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Dê vida ao seu personagem com detalhes únicos
        </p>
      </div>

      {/* Appearance */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Aparência Física</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Idade</label>
            <Input
              value={data.age || ''}
              onChange={(e) => updateData({ age: e.target.value })}
              placeholder="Ex: 25 anos"
              className="bg-muted border-0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Altura</label>
            <Input
              value={data.height || ''}
              onChange={(e) => updateData({ height: e.target.value })}
              placeholder="Ex: 1,80m"
              className="bg-muted border-0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Peso</label>
            <Input
              value={data.weight || ''}
              onChange={(e) => updateData({ weight: e.target.value })}
              placeholder="Ex: 75kg"
              className="bg-muted border-0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Olhos</label>
            <Input
              value={data.eyes || ''}
              onChange={(e) => updateData({ eyes: e.target.value })}
              placeholder="Ex: Azuis"
              className="bg-muted border-0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cabelo</label>
            <Input
              value={data.hair || ''}
              onChange={(e) => updateData({ hair: e.target.value })}
              placeholder="Ex: Castanho"
              className="bg-muted border-0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Pele</label>
            <Input
              value={data.skin || ''}
              onChange={(e) => updateData({ skin: e.target.value })}
              placeholder="Ex: Morena"
              className="bg-muted border-0"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Características Distintivas</label>
          <Textarea
            value={data.distinctiveFeatures || ''}
            onChange={(e) => updateData({ distinctiveFeatures: e.target.value })}
            placeholder="Cicatrizes, tatuagens, marcas especiais..."
            className="bg-muted border-0 min-h-[60px]"
          />
        </div>
      </div>

      {/* Backstory */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">História de Vida</h3>
        </div>
        
        <Textarea
          value={data.backstory || ''}
          onChange={(e) => updateData({ backstory: e.target.value })}
          placeholder="Onde você nasceu? Como foi sua infância? O que o levou a se tornar um aventureiro? Que eventos importantes moldaram quem você é?"
          className="bg-muted border-0 min-h-[120px]"
        />
      </div>

      {/* Goals & Motivations */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Objetivos & Motivações</h3>
        </div>
        
        <Textarea
          value={data.goals || ''}
          onChange={(e) => updateData({ goals: e.target.value })}
          placeholder="O que você busca? Por que se aventura? Qual é seu maior objetivo de vida?"
          className="bg-muted border-0 min-h-[80px]"
        />
      </div>

      {/* Allies & Organizations */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Aliados & Organizações</h3>
        
        <Textarea
          value={data.alliesOrganizations || ''}
          onChange={(e) => updateData({ alliesOrganizations: e.target.value })}
          placeholder="Guildas, ordens, famílias ou grupos aos quais pertence ou tem conexão..."
          className="bg-muted border-0 min-h-[60px]"
        />
      </div>
    </div>
  );
}
