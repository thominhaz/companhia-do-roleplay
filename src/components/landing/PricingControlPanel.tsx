import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, ArrowRight, Lock, Zap, Shield } from 'lucide-react';

// Tier data structure
interface TierFeature {
  text: string;
  sub: string;
}

interface Tier {
  id: string;
  name: string;
  price: string;
  period: string;
  color: string;
  icon: string;
  badge: string;
  desc: string;
  features: TierFeature[];
  cta: string;
}

const tiers: Record<string, Tier> = {
  apoiador: {
    id: 'apoiador',
    name: 'Apoiador',
    price: 'R$ 10',
    period: '/mês',
    color: '#9ca3af',
    icon: '🎲',
    badge: 'NÍVEL 1',
    desc: 'Para quem quer ajudar o projeto a crescer e garantir seu lugar na comunidade.',
    features: [
      { text: 'Cargo "Apoiador" no Discord', sub: 'Destaque na lista de membros' },
      { text: 'Acesso ao canal Dev-Log', sub: 'Veja o desenvolvimento' },
      { text: 'Nome nos agradecimentos', sub: 'Eternizado no site' },
      { text: 'Suporte Prioritário', sub: 'Resolvemos seus bugs primeiro' }
    ],
    cta: 'Tornar-se Apoiador'
  },
  aldeao: {
    id: 'aldeao',
    name: 'Aldeão',
    price: 'R$ 25',
    period: '/mês',
    color: '#00ced1',
    icon: '🏠',
    badge: 'AVENTUREIRO',
    desc: 'O essencial para jogar suas primeiras campanhas com fichas digitais.',
    features: [
      { text: 'Até 3 Personagens', sub: 'Fichas completas e automatizadas' },
      { text: 'Participar de Campanhas', sub: 'Entre na mesa dos seus amigos' },
      { text: 'Rolagens Públicas', sub: 'Seus dados aparecem no chat' },
      { text: 'Exportação em PDF', sub: 'Imprima sua ficha quando quiser' }
    ],
    cta: 'Escolher Aldeão'
  },
  heroi: {
    id: 'heroi',
    name: 'Herói',
    price: 'R$ 50',
    period: '/mês',
    color: '#8A2BE2',
    icon: '⚔️',
    badge: 'MAIS POPULAR',
    desc: 'O kit completo para jogadores experientes e criadores de conteúdo.',
    features: [
      { text: '20 Personagens', sub: 'Espaço de sobra para suas ideias' },
      { text: 'Forja de Homebrew', sub: 'Crie itens, magias e monstros' },
      { text: 'Acesso Beta', sub: 'Teste novidades antes de todos' },
      { text: 'Compêndio Completo', sub: 'Todas as regras SRD 5.1' },
      { text: 'Customização de Tema', sub: 'Mude as cores do app' },
      { text: 'Inventário Expandido', sub: 'Gerencie peso e containers' }
    ],
    cta: 'Tornar-se Herói'
  },
  mestre: {
    id: 'mestre',
    name: 'Mestre',
    price: 'R$ 80',
    period: '/mês',
    color: '#FF9F55',
    icon: '👑',
    badge: 'PARA MESTRES',
    desc: 'Ferramentas poderosas para narrar histórias épicas e gerenciar combates.',
    features: [
      { text: 'Campanhas Ilimitadas', sub: 'Crie quantos mundos quiser' },
      { text: 'Combat Tracker Pro', sub: 'Iniciativa, HP e Condições' },
      { text: 'Tudo do Plano Herói', sub: 'Todas as features de jogador' },
      { text: 'Escudo do Mestre Digital', sub: 'Referência rápida de regras' },
      { text: 'Importador de Monstros', sub: 'Traga fichas de outros lugares' },
      { text: 'Compartilhar Homebrew', sub: 'Seus itens para seus jogadores' }
    ],
    cta: 'Assinar Mestre'
  },
  epico: {
    id: 'epico',
    name: 'Mestre Épico',
    price: 'R$ 200',
    period: 'pagamento único',
    color: '#FFD700',
    icon: '🌟',
    badge: 'VITALÍCIO',
    desc: 'Apoie o desenvolvimento e ganhe acesso eterno ao nível Mestre.',
    features: [
      { text: 'Acesso VITALÍCIO', sub: 'Pague uma vez, use para sempre' },
      { text: 'NPC com seu Nome', sub: 'Entra para o lore oficial do Go20' },
      { text: 'Cargo Lendário no Discord', sub: 'Destaque máximo na comunidade' },
      { text: 'Ícone Exclusivo', sub: 'Badge dourada no seu perfil' },
      { text: 'Todas as features futuras', sub: 'Garantido para sempre' }
    ],
    cta: 'Eternizar-se'
  }
};

const tierOrder = ['apoiador', 'aldeao', 'heroi', 'mestre', 'epico'];

export const PricingControlPanel = () => {
  const [currentTier, setCurrentTier] = useState('heroi');
  const data = tiers[currentTier];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0a0a0f] to-cosmic-purple/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-white/50 max-w-2xl mx-auto">
            Experiência imersiva inspirada em interfaces de jogos. Selecione um nível para ver os detalhes.
          </p>
        </div>

        {/* Main Interface Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto rounded-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row min-h-[600px] shadow-2xl relative"
          style={{ 
            backgroundColor: '#13131a',
            borderColor: `${data.color}30`
          }}
        >
          {/* Background Ambient Light */}
          <motion.div 
            className="absolute top-0 right-0 w-[500px] h-[500px] blur-[100px] rounded-full pointer-events-none opacity-20"
            animate={{ backgroundColor: data.color }}
            transition={{ duration: 0.7 }}
          />
          
          {/* Scanline Effect Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: `linear-gradient(to bottom, transparent, transparent 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))`,
              backgroundSize: '100% 4px'
            }}
          />

          {/* SIDEBAR (Tier Selection) */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 bg-[#0f0f13]/90 backdrop-blur-xl z-10 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
            
            {/* Header Sidebar (Desktop Only) */}
            <div className="hidden md:block p-6 border-b border-white/5">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nível de Acesso</span>
              <h3 className="text-xl font-bold text-white mt-1">Selecione o Plano</h3>
            </div>

            {/* Tier Tabs */}
            <div className="flex flex-row md:flex-col p-2 gap-2">
              {tierOrder.map((tierId) => {
                const tier = tiers[tierId];
                const isActive = tier.id === currentTier;
                
                return (
                  <button
                    key={tier.id}
                    onClick={() => setCurrentTier(tier.id)}
                    className={`
                      flex items-center gap-3 p-4 w-full text-left rounded-lg border transition-all duration-300 relative overflow-hidden group min-w-[200px] md:min-w-0
                      ${isActive 
                        ? 'border-white/10' 
                        : 'border-transparent hover:bg-white/5 opacity-60 hover:opacity-100'
                      }
                    `}
                    style={{
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      borderLeftWidth: '3px',
                      borderLeftColor: isActive ? tier.color : 'transparent'
                    }}
                  >
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                      style={{ 
                        backgroundColor: `${tier.color}20`,
                        color: tier.color
                      }}
                    >
                      {tier.icon}
                    </div>
                    <div>
                      <div className={`font-bold text-white text-sm transition-transform ${isActive ? 'translate-x-1' : ''}`}>
                        {tier.name}
                      </div>
                      <div 
                        className="text-[10px] font-bold tracking-wider"
                        style={{ color: tier.color, opacity: isActive ? 1 : 0.7 }}
                      >
                        {tier.badge}
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute right-4 text-white opacity-20">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Sidebar */}
            <div className="mt-auto p-4 hidden md:block">
              <div className="bg-black/40 rounded-lg p-3 border border-white/5 text-xs text-gray-500 text-center">
                <Lock className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                Pagamento Seguro via Catarse
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTier}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 p-6 md:p-12 relative z-10 flex flex-col"
            >
              {/* Top Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                <div>
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3"
                    style={{
                      backgroundColor: `${data.color}15`,
                      borderWidth: '1px',
                      borderColor: `${data.color}40`,
                      color: data.color
                    }}
                  >
                    <span>⭐</span> {data.badge}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {data.name}
                  </h2>
                  <p className="text-gray-400 max-w-md">{data.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl md:text-4xl font-bold text-white">{data.price}</div>
                  <span className="text-sm text-gray-500">{data.period}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10 flex-grow">
                {data.features.map((feat, index) => (
                  <motion.div
                    key={feat.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <div 
                      className="mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${data.color}20` }}
                    >
                      <Check className="h-3 w-3" style={{ color: data.color }} />
                    </div>
                    <div>
                      <span className="block text-white font-medium text-sm">{feat.text}</span>
                      <span className="block text-gray-500 text-xs">{feat.sub}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action Area */}
              <div className="mt-auto pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Cancelamento a qualquer momento
                </div>
                <Button
                  className="w-full md:w-auto px-8 py-4 text-white font-bold shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 group"
                  style={{
                    backgroundColor: data.color,
                    boxShadow: `0 10px 20px -5px ${data.color}40`
                  }}
                  onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
                >
                  <span>{data.cta}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Stats/Trust Bar */}
        <div className="max-w-5xl mx-auto mt-8 flex flex-wrap justify-center gap-8 md:gap-16 text-gray-500 text-sm font-medium opacity-60">
          <div className="flex items-center gap-2">
            <span>💬</span> Comunidade Ativa
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Dados Criptografados
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Acesso Imediato
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingControlPanel;
