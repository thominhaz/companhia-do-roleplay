import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter } from '@/hooks/useCharacters';
import { useAuth } from '@/hooks/useAuth';
import { BuilderProvider, useBuilderContext, BUILDER_STEPS } from './BuilderContext';
import { useBuilderWizardAdapter } from './useBuilderWizardAdapter';
import { BuilderSidebar } from './BuilderSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Lazy step components — for now reuse existing steps from the wizard
// These will be refactored in Fase 1B to use BuilderContext
import { RaceStep } from '../steps/RaceStep';
import { ClassStep } from '../steps/ClassStep';
import { AttributesStep } from '../steps/AttributesStep';
import { SkillsStep } from '../steps/SkillsStep';
import { LanguagesStep } from '../steps/LanguagesStep';
import { EquipmentStep } from '../steps/EquipmentStep';
import { SpellsStep } from '../steps/SpellsStep';
import { BackgroundStep } from '../steps/BackgroundStep';
import { BackstoryStep } from '../steps/BackstoryStep';
import { ReviewStep } from '../steps/ReviewStep';
import { LevelUpStep } from './LevelUpStep';

function BuilderContent() {
  const navigate = useNavigate();
  const { currentStep, nextStep, prevStep, totalSteps, mode } = useBuilderContext();
  const { save, isSaving } = useBuilderSave();

  return (
    <div className="flex h-[100dvh] bg-background">
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <div className="hidden md:flex">
        <BuilderSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {mode === 'create' ? 'Criar Personagem' : 'Editar Personagem'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {BUILDER_STEPS[currentStep]?.title || `Nível ${currentStep - BUILDER_STEPS.length + 1}`}
              {' · '}Passo {currentStep + 1} de {totalSteps}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="text-xs"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Anterior
            </Button>
            <Button
              size="sm"
              onClick={nextStep}
              disabled={currentStep >= totalSteps - 1}
              className="text-xs"
            >
              Próximo
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Step content — placeholder for now */}
        <div className="flex-1 overflow-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <BuilderStepContent step={currentStep} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function BuilderStepContent({ step }: { step: number }) {
  const { data, updateData } = useBuilderWizardAdapter();
  const { levelChoices } = useBuilderContext();
  const stepDef = BUILDER_STEPS[step];

  if (!stepDef) {
    // Level step — map to the correct level
    const levelSteps = levelChoices.filter(lc => lc.level > 1);
    const levelIdx = step - BUILDER_STEPS.length;
    const levelChoice = levelSteps[levelIdx];
    if (!levelChoice) return null;
    return <LevelUpStep level={levelChoice.level} />;
  }

  switch (stepDef.id) {
    case 'race':
      return <RaceStep data={data} updateData={updateData} />;
    case 'class':
      return <ClassStep data={data} updateData={updateData} />;
    case 'attributes':
      return <AttributesStep data={data} updateData={updateData} />;
    case 'skills':
      return <SkillsStep data={data} updateData={updateData} />;
    case 'languages':
      return <LanguagesStep data={data} updateData={updateData} />;
    case 'equipment':
      return <EquipmentStep data={data} updateData={updateData} />;
    case 'spells':
      return <SpellsStep data={data} updateData={updateData} />;
    case 'background':
      return <BackgroundStep data={data} updateData={updateData} />;
    case 'backstory':
      return <BackstoryStep data={data} updateData={updateData} />;
    case 'review':
      return <ReviewStep data={data} />;
    default:
      return null;
  }
}

// ===========================
// Main entry — handles route params + provider setup
// ===========================

export function CharacterBuilder() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Fetch character data if editing
  const { data: character, isLoading } = useCharacter(id || '');

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Carregando personagem...</p>
        </div>
      </div>
    );
  }

  return (
    <BuilderProvider
      mode={isEdit ? 'edit' : 'create'}
      characterId={id}
      initialCharacter={character}
    >
      <BuilderContent />
    </BuilderProvider>
  );
}
