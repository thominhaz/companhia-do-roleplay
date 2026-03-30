import { cn } from '@/lib/utils';
import { useBuilderContext, BUILDER_STEPS } from './BuilderContext';
import { CLASSES } from '@/data/srd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Users, Sword, BarChart3, Brain, Globe, Package,
  Wand2, ScrollText, Feather, ClipboardCheck,
  ChevronUp, Plus, Check,
} from 'lucide-react';

const STEP_ICONS = [Users, Sword, BarChart3, Brain, Globe, Package, Wand2, ScrollText, Feather, ClipboardCheck];

export function BuilderSidebar() {
  const {
    mode, currentStep, goToStep,
    levelChoices, currentLevel,
    builderData, addLevel,
  } = useBuilderContext();

  const classId = builderData.class_id || '';
  const className = CLASSES.find(c => c.id === classId)?.name || classId;

  return (
    <div className="flex flex-col h-full w-56 border-r border-border bg-card/50 backdrop-blur-sm">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">
          {mode === 'create' ? 'Novo Personagem' : 'Editar Personagem'}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* Base steps */}
          <div className="px-2 mb-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1 font-semibold">
              Construção
            </p>
          </div>
          {BUILDER_STEPS.map((step, idx) => {
            const Icon = STEP_ICONS[idx];
            const isActive = currentStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => goToStep(idx)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-left',
                  isActive
                    ? 'bg-primary/15 text-primary border-r-2 border-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{step.title}</span>
              </button>
            );
          })}

          {/* Level timeline — shown when there are level choices beyond level 1 */}
          {(() => {
            const levelSteps = levelChoices.filter(lc => lc.level > 1);
            if (levelSteps.length === 0 && currentLevel >= 20) return null;
            return (
              <>
                <div className="px-2 mt-4 mb-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1 font-semibold">
                    Níveis
                  </p>
                </div>
                {levelSteps.map((lc, idx) => {
                  const lcClassName = CLASSES.find(c => c.id === lc.class_id)?.name || lc.class_id;
                  const stepIdx = BUILDER_STEPS.length + idx;
                  const isActive = currentStep === stepIdx;
                  const isLast = idx === levelSteps.length - 1;
                  return (
                    <button
                      key={lc.level}
                      onClick={() => goToStep(stepIdx)}
                      className={cn(
                        'w-full flex items-center gap-2 px-4 py-1.5 text-xs transition-colors text-left',
                        isActive
                          ? 'bg-primary/15 text-primary border-r-2 border-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        isLast && 'font-semibold'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        {lc.level}
                      </div>
                      <span className="truncate">{lcClassName}</span>
                      {lc.subclass_id && (
                        <Check className="w-3 h-3 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Add level button */}
                {currentLevel < 20 && (
                  <div className="px-3 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1"
                      onClick={addLevel}
                    >
                      <Plus className="w-3 h-3" />
                      Subir para Nível {currentLevel + 1}
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </ScrollArea>
    </div>
  );
}
