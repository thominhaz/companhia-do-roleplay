import { Plus, Crown, Users, Calendar, ChevronRight, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mockCampaigns = [
  {
    id: "1",
    name: "A Maldição de Strahd",
    description: "Uma aventura sombria nas terras de Barovia",
    masterName: "João Silva",
    playerCount: 5,
    nextSession: "21 Dez, 19:00",
    isUserMaster: false,
  },
  {
    id: "2",
    name: "Minas Perdidas de Phandelver",
    description: "Explore as antigas minas dos anões",
    masterName: "Você",
    playerCount: 4,
    nextSession: "28 Dez, 20:00",
    isUserMaster: true,
  },
];

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-darker/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-dark rounded-t-3xl p-6 animate-slide-up">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-6" />

        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
            <Crown className="w-10 h-10 text-foreground" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            Desbloqueie o Modo Mestre
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Crie campanhas, gerencie sessões, use o Combat Tracker e muito mais
            com a assinatura Premium!
          </p>

          <div className="space-y-3 mb-6 text-left">
            {[
              "Criar e gerenciar campanhas ilimitadas",
              "Combat Tracker com iniciativa automática",
              "Notas e histórico de sessões",
              "Agendamento e notificações",
              "Chat integrado com o grupo",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <button className="w-full py-3.5 bg-gradient-to-r from-secondary to-primary rounded-2xl text-sm font-bold text-foreground shadow-neon hover:opacity-90 transition-opacity mb-3">
            Assinar Premium - R$9,90/mês
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Talvez depois
          </button>
        </div>
      </div>
    </div>
  );
}

export function CampaignsScreen() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const isPremium = true; // Mock - será substituído por estado real

  const handleCreateCampaign = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    console.log("Create campaign");
  };

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Campanhas</h1>
            {!isPremium && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-secondary/20 text-secondary text-[10px] font-semibold rounded-full">
                <Crown className="w-3 h-3" />
                Premium
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {mockCampaigns.length} campanhas ativas
          </p>
        </div>
      </header>

      {/* Campaign List */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        {mockCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma campanha
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isPremium
                ? "Crie sua primeira mesa de RPG!"
                : "Assine Premium para criar campanhas"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mockCampaigns.map((campaign, index) => (
              <button
                key={campaign.id}
                className={cn(
                  "w-full glass rounded-2xl p-4 text-left animate-fade-in",
                  "hover:border-primary/50 transition-all"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex gap-4 items-start">
                  {/* Campaign Avatar */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-foreground">
                      {campaign.name[0]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {campaign.name}
                      </h3>
                      {campaign.isUserMaster && (
                        <Crown className="w-3 h-3 text-gold flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {campaign.description}
                    </p>

                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {campaign.playerCount} jogadores
                      </span>
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Calendar className="w-3 h-3" />
                        {campaign.nextSession}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* FAB - Create New */}
      <button
        onClick={handleCreateCampaign}
        className={cn(
          "fixed right-4 bottom-24 w-14 h-14 rounded-full flex items-center justify-center shadow-neon hover:scale-110 active:scale-95 transition-transform z-40",
          isPremium ? "bg-gradient-primary" : "bg-secondary glow-pink"
        )}
      >
        {isPremium ? (
          <Plus className="w-6 h-6 text-foreground" />
        ) : (
          <Crown className="w-6 h-6 text-foreground" />
        )}
      </button>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
}
