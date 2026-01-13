import { useState } from 'react';
import { 
  Crown, 
  Gift, 
  Rocket, 
  Trophy,
  Sparkles,
  Swords,
  Dice5,
  FileText,
  Calendar,
  MessageSquare,
  Store,
  Scale,
  Hammer,
  Image,
  Palette,
  Bot,
  Heart,
  Users,
  BookOpen,
  Scroll,
  MapPin,
  LucideIcon
} from 'lucide-react';
import { useStretchGoals, useCampaignFunding } from '@/hooks/useStretchGoals';

// Mapa de feature_key para ícone
const featureIconMap: Record<string, LucideIcon> = {
  dice_roller: Dice5,
  character_sheet: FileText,
  campaigns: Users,
  combat_tracker: Calendar,
  forge: Hammer,
  supporter_gallery: Image,
  advanced_combat: Scale,
  stress_sanity: Heart,
  discord_bot: Bot,
  custom_themes: Palette,
  compendium: BookOpen,
  documents: Scroll,
  factions: MapPin,
};

// Cores por fase
const phaseColors: Record<string, string> = {
  'FUNDAÇÃO': '#FF9F55',
  'EXPANSÃO': '#8A2BE2',
  'ALÉM': '#00ced1',
};

export const FundingProgressBar = () => {
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null);
  const { data: stretchGoals = [] } = useStretchGoals();
  const { data: fundingData } = useCampaignFunding();

  const currentFunding = fundingData?.current_amount || 0;
  const fundingGoal = fundingData?.goal_amount || 50000;

  // Cores do tema
  const theme = {
    bg: '#0a0a0f',
    panelBg: '#13131a',
    purple: '#8A2BE2',
    orange: '#FF9F55',
    red: '#ff0055',
    cyan: '#00ced1',
    gold: '#FFD700',
  };

  // Paleta de cores para rotação
  const colorPalette = [theme.orange, theme.cyan, theme.purple, theme.red, theme.gold, '#48bb78', '#f687b3', '#4fd1c5'];

  // Converter TODAS stretch goals para formato da barra
  const goals = stretchGoals.map((goal, index) => {
    const IconComponent = featureIconMap[goal.feature_key || ''] || Rocket;
    const phaseColor = phaseColors[goal.phase] || colorPalette[index % colorPalette.length];
    
    return {
      id: goal.id,
      title: goal.title,
      icon: IconComponent,
      amountVal: goal.value,
      amount: `R$ ${goal.value.toLocaleString('pt-BR')}`,
      desc: goal.description || goal.subtitle || '',
      color: phaseColor,
      loot: goal.subtitle || 'Feature Desbloqueada',
      status: goal.status,
      phase: goal.phase,
      phaseEmoji: goal.phase_emoji,
      goalNumber: goal.goal_number
    };
  });

  // Cálculos da Barra
  const maxGoal = goals.length > 0 ? Math.max(...goals.map(g => g.amountVal)) : fundingGoal;
  const nextGoal = goals.find(g => g.amountVal > currentFunding && g.status !== 'completed' && g.status !== 'released') || goals[goals.length - 1];
  const currentLevel = goals.filter(g => g.amountVal <= currentFunding || g.status === 'completed' || g.status === 'released').length;

  // Função para distribuir metas uniformemente na barra (por índice, não por valor)
  const getUniformPosition = (index: number, total: number) => {
    if (total <= 1) return 50;
    // Distribui de 2% a 98% para dar margem nas pontas
    return 2 + (index / (total - 1)) * 96;
  };

  // Progresso baseado na meta atingida (por índice)
  const progressPercentage = goals.length > 0 
    ? getUniformPosition(currentLevel - 1, goals.length) + (currentLevel === 0 ? 0 : 0)
    : 0;
  
  const getLevelTitle = () => {
    if (currentLevel === 0) return "Iniciado";
    if (currentLevel < 4) return "Aventureiro";
    if (currentLevel < 8) return "Veterano";
    if (currentLevel < 12) return "Campeão";
    return "Lendário";
  };

  if (goals.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-b from-[#0a0a0f] to-cosmic-purple/10 border-y border-white/10">
      <div className="container mx-auto px-4">
        
        <div className="mb-6 flex items-center justify-center gap-3 opacity-80">
          <Sparkles className="text-cosmic-purple" size={20} />
          <h2 className="text-2xl font-bold text-white">Progresso da Campanha</h2>
        </div>

        <div className="w-full max-w-6xl mx-auto">
          {/* CONTAINER PRINCIPAL (Tech Panel) - overflow-visible para tooltips */}
          <div 
            className="relative rounded-2xl border border-white/10 shadow-2xl"
            style={{ backgroundColor: theme.panelBg }}
          >
            {/* Efeitos de Fundo */}
            <div 
              className="absolute top-0 right-0 w-[500px] h-[500px] blur-[100px] rounded-full pointer-events-none transition-colors duration-700 opacity-20"
              style={{ backgroundColor: nextGoal?.color || theme.purple }}
            />
            <div 
              className="absolute inset-0 opacity-30 z-10 pointer-events-none rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))',
                backgroundSize: '100% 4px'
              }}
            />

            <div className="p-6 md:p-10 relative z-20">
              
              {/* HUD SUPERIOR */}
              <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-6">
                
                {/* Info Esquerda */}
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-xl border border-white/10 flex items-center justify-center shadow-lg relative bg-[#0f0f13]"
                    style={{ borderColor: `${theme.purple}40` }}
                  >
                    <Crown size={32} style={{ color: theme.orange }} />
                    {/* Badge Level */}
                    <div 
                      className="absolute -bottom-2 bg-[#0f0f13] text-xs font-bold px-2 py-0.5 rounded border shadow-lg"
                      style={{ borderColor: theme.purple, color: theme.purple }}
                    >
                      LVL {currentLevel}
                    </div>
                  </div>
                  
                  <div className="text-center md:text-left">
                    <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Status Atual</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-none mb-1">
                      {getLevelTitle()}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: theme.cyan }}>
                      <Gift size={14} />
                      <span>Próximo: {nextGoal?.loot || 'Em breve'}</span>
                    </div>
                  </div>
                </div>

                {/* Info Direita (Valores) */}
                <div className="text-center md:text-right">
                  <div 
                    className="text-4xl md:text-5xl font-bold text-white tracking-tighter tabular-nums mb-1" 
                    style={{ textShadow: `0 0 20px ${theme.purple}60` }}
                  >
                    R$ {currentFunding.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-gray-500 flex justify-center md:justify-end gap-3">
                    <span>Arrecadado</span>
                    <span className="text-gray-700">|</span>
                    <span style={{ color: theme.orange }}>Meta Final: R$ {maxGoal.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* BARRA DE PROGRESSO - com overflow visible para tooltips */}
              <div className="relative h-3 mb-12 select-none overflow-visible">
                {/* Background da Barra */}
                <div className="absolute inset-0 bg-black/60 rounded-full border border-white/5 overflow-hidden">
                  <div 
                    className="w-full h-full opacity-10" 
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 11px)' }}
                  />
                </div>

                {/* Preenchimento (Gradiente) */}
                <div 
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${Math.max(0, progressPercentage)}%`,
                    background: `linear-gradient(90deg, ${theme.purple}, ${theme.orange}, ${theme.red})`,
                    boxShadow: `0 0 20px rgba(138,43,226,0.5)`
                  }}
                >
                  {/* Partícula Brilhante na ponta */}
                  {progressPercentage > 0 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_white] z-30" />
                  )}
                </div>

                {/* Partícula brilhante indicando posição atual */}
                {progressPercentage > 0 && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_white] z-30"
                    style={{ left: `${progressPercentage}%`, transform: 'translate(-50%, -50%)' }}
                  />
                )}
              </div>

              {/* Footer Stats - Simplificado */}
              <div className="flex justify-center gap-6 md:gap-8 text-xs font-bold text-gray-600 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Campanha Ativa
                </div>
                <div>{currentLevel} de {goals.length} Metas</div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FundingProgressBar;
