import { useState } from 'react';
import { 
  Crown, 
  Gift, 
  Rocket, 
  Shield, 
  Scroll, 
  Map, 
  Users, 
  Trophy,
  Sparkles,
  Swords,
  BookOpen,
  Wand2,
  LucideIcon
} from 'lucide-react';
import { useStretchGoals, useCampaignFunding } from '@/hooks/useStretchGoals';

const iconMap: Record<string, LucideIcon> = {
  rocket: Rocket,
  shield: Shield,
  crown: Crown,
  users: Users,
  scroll: Scroll,
  map: Map,
  swords: Swords,
  'book-open': BookOpen,
  wand2: Wand2,
  gift: Gift
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

  // Converter stretch goals para formato da barra
  const goals = stretchGoals.slice(0, 8).map((goal, index) => {
    const colors = [theme.orange, theme.cyan, theme.purple, theme.red, theme.gold, '#48bb78', theme.purple, theme.orange];
    const IconComponent = iconMap[goal.phase_emoji || 'rocket'] || Rocket;
    
    return {
      id: goal.id,
      title: goal.title,
      icon: IconComponent,
      amountVal: goal.value,
      amount: `R$ ${goal.value.toLocaleString('pt-BR')}`,
      desc: goal.description || goal.subtitle || '',
      color: colors[index % colors.length],
      loot: goal.subtitle || 'Feature Desbloqueada',
      status: goal.status
    };
  });

  // Cálculos da Barra
  const maxGoal = Math.max(fundingGoal, ...goals.map(g => g.amountVal));
  const progressPercentage = Math.min(100, Math.max(0, (currentFunding / maxGoal) * 100));
  const nextGoal = goals.find(g => g.amountVal > currentFunding) || goals[goals.length - 1];
  const currentLevel = goals.filter(g => g.amountVal <= currentFunding).length;
  
  const getLevelTitle = () => {
    if (currentLevel === 0) return "Iniciado";
    if (currentLevel < 3) return "Aventureiro";
    if (currentLevel < 5) return "Veterano";
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

        <div className="w-full max-w-5xl mx-auto">
          {/* CONTAINER PRINCIPAL (Tech Panel) */}
          <div 
            className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            style={{ backgroundColor: theme.panelBg }}
          >
            {/* Efeitos de Fundo */}
            <div 
              className="absolute top-0 right-0 w-[500px] h-[500px] blur-[100px] rounded-full pointer-events-none transition-colors duration-700 opacity-20"
              style={{ backgroundColor: nextGoal?.color || theme.purple }}
            />
            <div 
              className="absolute inset-0 opacity-30 z-10 pointer-events-none"
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

              {/* BARRA DE PROGRESSO */}
              <div className="relative h-2 mb-16 select-none">
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
                    width: `${progressPercentage}%`,
                    background: `linear-gradient(90deg, ${theme.purple}, ${theme.orange}, ${theme.red})`,
                    boxShadow: `0 0 20px rgba(138,43,226,0.5)`
                  }}
                >
                  {/* Partícula Brilhante na ponta */}
                  {progressPercentage > 0 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_15px_white] z-30" />
                  )}
                </div>

                {/* MARCADORES (Milestones) */}
                {goals.map((goal) => {
                  const position = (goal.amountVal / maxGoal) * 100;
                  const isReached = currentFunding >= goal.amountVal || goal.status === 'completed';
                  const isNext = nextGoal?.id === goal.id && !isReached;
                  const IconComponent = goal.icon;

                  return (
                    <div 
                      key={goal.id} 
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                      style={{ left: `${position}%`, zIndex: isNext ? 40 : 20 }}
                      onMouseEnter={() => setHoveredGoal(goal.id)}
                      onMouseLeave={() => setHoveredGoal(null)}
                    >
                      {/* Ícone Minimalista */}
                      <div 
                        className={`
                          relative w-7 h-7 md:w-8 md:h-8 flex items-center justify-center transition-all duration-300 cursor-pointer
                          ${isReached ? 'scale-100' : 'scale-90 grayscale opacity-60'}
                          ${isNext ? 'scale-110 opacity-100 grayscale-0 animate-pulse' : ''}
                        `}
                      >
                        {/* Shape do Marcador */}
                        <div 
                          className="absolute inset-0 bg-[#13131a] rounded-md border transform rotate-45 transition-colors duration-300"
                          style={{ 
                            borderColor: isReached ? goal.color : 'rgba(255,255,255,0.15)',
                            boxShadow: isReached || isNext ? `0 0 10px ${goal.color}40` : 'none',
                            borderWidth: '1.5px'
                          }}
                        />

                        {/* Ícone Interno */}
                        <IconComponent 
                          size={12} 
                          className="relative z-10 transition-colors"
                          style={{ color: isReached || isNext ? goal.color : '#fff' }}
                        />
                      </div>

                      {/* Linha vertical indicadora */}
                      <div className={`absolute top-6 left-1/2 w-px h-3 bg-white/10 -translate-x-1/2 transition-colors ${isReached ? 'bg-white/30' : ''}`} />
                      
                      {/* Valor Monetário */}
                      <div className={`absolute top-9 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] font-bold tracking-wider whitespace-nowrap transition-colors ${isReached ? 'text-white' : 'text-gray-600'}`}>
                        {goal.amount}
                      </div>

                      {/* TOOLTIP */}
                      <div className={`
                        absolute bottom-[160%] left-1/2 -translate-x-1/2 w-56 md:w-64 
                        bg-[#0f0f13]/95 backdrop-blur-md border border-white/10 
                        rounded-lg shadow-2xl transition-all duration-300 pointer-events-none
                        ${hoveredGoal === goal.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                      `}>
                        {/* Borda superior colorida */}
                        <div className="h-1 w-full rounded-t-lg" style={{ backgroundColor: goal.color }} />
                        
                        <div className="p-3 md:p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400">
                              {isReached ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                            </span>
                            <IconComponent size={14} style={{ color: goal.color }} />
                          </div>
                          
                          <h4 className="font-bold text-base md:text-lg text-white mb-1">{goal.title}</h4>
                          <p className="text-xs text-gray-400 mb-3 leading-relaxed">{goal.desc}</p>
                          
                          <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                            <Trophy size={14} className="text-yellow-500" />
                            <span className="text-xs font-bold text-gray-200 uppercase tracking-wide">
                              Loot: <span style={{ color: goal.color }}>{goal.loot}</span>
                            </span>
                          </div>
                        </div>
                        
                        {/* Seta do tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0f0f13]" />
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Footer Stats */}
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
