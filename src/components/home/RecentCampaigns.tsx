import { ChevronRight, Users, Calendar, Crown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignPreview {
  id: string;
  name: string;
  masterName: string;
  playerCount: number;
  nextSession?: string;
  imageUrl?: string;
  isUserMaster: boolean;
}

interface RecentCampaignsProps {
  campaigns: CampaignPreview[];
  onCampaignClick?: (id: string) => void;
  onViewAll?: () => void;
  isPremium?: boolean;
}

export function RecentCampaigns({
  campaigns,
  onCampaignClick,
  onViewAll,
  isPremium = false,
}: RecentCampaignsProps) {
  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Campanhas
          </h2>
          {!isPremium && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-secondary/20 text-secondary text-[10px] font-semibold rounded-full">
              <Crown className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
        >
          Ver Todas
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div
            className={cn(
              "glass rounded-2xl p-6 text-center relative overflow-hidden",
              !isPremium && "cursor-pointer hover:border-secondary/50"
            )}
            onClick={!isPremium ? onViewAll : undefined}
          >
            {!isPremium && (
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />
            )}
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Nenhuma campanha
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {isPremium
                ? "Crie sua primeira mesa de RPG!"
                : "Desbloqueie recursos de mestre com Premium"}
            </p>
            <button
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all",
                isPremium
                  ? "bg-primary text-foreground hover:bg-primary/80"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {isPremium ? "Criar Campanha" : "Ver Planos"}
            </button>
          </div>
        ) : (
          campaigns.slice(0, 2).map((campaign, index) => (
            <button
              key={campaign.id}
              onClick={() => onCampaignClick?.(campaign.id)}
              className="w-full glass rounded-2xl p-4 flex gap-4 items-center hover:border-primary/50 transition-all text-left"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              {/* Campaign Image */}
              <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                {campaign.imageUrl ? (
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30">
                    <span className="text-xl font-bold text-foreground">
                      {campaign.name[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Campaign Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {campaign.name}
                  </h3>
                  {campaign.isUserMaster && (
                    <Crown className="w-3 h-3 text-gold flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Mestre: {campaign.masterName}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {campaign.playerCount}
                  </span>
                  {campaign.nextSession && (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <Calendar className="w-3 h-3" />
                      {campaign.nextSession}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </section>
  );
}
