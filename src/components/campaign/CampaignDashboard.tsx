import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignSessions, useCampaignPlayers } from "@/hooks/useSessions";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  Crown, Users, Calendar, Settings, ChevronLeft,
  Swords, StickyNote, MessageCircle, Library,
  UserSquare2, Store, FileText, Flag, Clock, Sparkles, Gem,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dashboard sections
import { DashboardOverview } from "./dashboard/DashboardOverview";
import { DashboardSessions } from "./dashboard/DashboardSessions";
import { DashboardPlayers } from "./dashboard/DashboardPlayers";
import { DashboardCombat } from "./dashboard/DashboardCombat";
import { DashboardNotes } from "./dashboard/DashboardNotes";
import { DashboardChat } from "./dashboard/DashboardChat";
import { DashboardCompendium } from "./dashboard/DashboardCompendium";
import { DashboardSettings } from "./dashboard/DashboardSettings";

// Future Workshops (placeholders)
import { WorkshopNPCs } from "./dashboard/WorkshopNPCs";
import { WorkshopShops } from "./dashboard/WorkshopShops";
import { WorkshopDocuments } from "./dashboard/WorkshopDocuments";
import { WorkshopFactions } from "./dashboard/WorkshopFactions";
import { WorkshopTimeline } from "./dashboard/WorkshopTimeline";
import { GeneratorEncounters } from "./dashboard/GeneratorEncounters";
import { GeneratorTreasure } from "./dashboard/GeneratorTreasure";

type DashboardSection = 
  | 'overview' 
  | 'sessions' 
  | 'players' 
  | 'combat' 
  | 'notes' 
  | 'chat' 
  | 'compendium'
  | 'npcs'
  | 'shops'
  | 'documents'
  | 'factions'
  | 'timeline'
  | 'encounters'
  | 'treasure'
  | 'settings';

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ElementType;
  masterOnly?: boolean;
  comingSoon?: boolean;
  category?: 'main' | 'workshops' | 'generators' | 'config';
}

const navItems: NavItem[] = [
  // Main
  { id: 'overview', label: 'Visão Geral', icon: Crown, category: 'main' },
  { id: 'sessions', label: 'Sessões', icon: Calendar, category: 'main' },
  { id: 'players', label: 'Jogadores', icon: Users, category: 'main' },
  { id: 'combat', label: 'Combate', icon: Swords, category: 'main' },
  { id: 'notes', label: 'Notas', icon: StickyNote, category: 'main' },
  { id: 'chat', label: 'Chat', icon: MessageCircle, category: 'main' },
  { id: 'compendium', label: 'Compêndio', icon: Library, category: 'main' },
  
  // Workshops (Master only)
  { id: 'npcs', label: 'NPCs', icon: UserSquare2, masterOnly: true, category: 'workshops' },
  { id: 'shops', label: 'Lojas', icon: Store, masterOnly: true, category: 'workshops' },
  { id: 'documents', label: 'Documentos', icon: FileText, masterOnly: true, category: 'workshops' },
  { id: 'factions', label: 'Facções', icon: Flag, masterOnly: true, category: 'workshops' },
  { id: 'timeline', label: 'Timeline', icon: Clock, masterOnly: true, category: 'workshops' },
  
  // Generators
  { id: 'encounters', label: 'Encontros', icon: Sparkles, masterOnly: true, comingSoon: true, category: 'generators' },
  { id: 'treasure', label: 'Tesouros', icon: Gem, masterOnly: true, comingSoon: true, category: 'generators' },
  
  // Config
  { id: 'settings', label: 'Configurações', icon: Settings, masterOnly: true, category: 'config' },
];

interface CampaignDashboardProps {
  campaign: (CampaignDB & { discord_webhook_url?: string | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMaster: boolean;
}

export function CampaignDashboard({ campaign, open, onOpenChange, isMaster }: CampaignDashboardProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [showMobileNav, setShowMobileNav] = useState(false);
  
  const { data: sessions } = useCampaignSessions(campaign?.id || '');
  const { data: players } = useCampaignPlayers(campaign?.id || '');
  const { data: subscription } = useSubscription();

  if (!campaign) return null;

  const filteredNavItems = navItems.filter(item => {
    if (item.masterOnly && !isMaster) return false;
    return true;
  });

  const mainItems = filteredNavItems.filter(i => i.category === 'main');
  const workshopItems = filteredNavItems.filter(i => i.category === 'workshops');
  const generatorItems = filteredNavItems.filter(i => i.category === 'generators');
  const configItems = filteredNavItems.filter(i => i.category === 'config');

  const currentNavItem = navItems.find(i => i.id === activeSection);

  const handleNavClick = (section: DashboardSection, comingSoon?: boolean) => {
    if (comingSoon) return;
    setActiveSection(section);
    setShowMobileNav(false);
  };

  const renderNavGroup = (items: NavItem[], title?: string) => (
    <div className="space-y-1">
      {title && (
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      )}
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        
        const buttonContent = (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id, item.comingSoon)}
            disabled={item.comingSoon}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive && !item.comingSoon
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : item.comingSoon
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.comingSoon && (
              <Lock className="w-3 h-3 text-muted-foreground/50" />
            )}
          </button>
        );

        if (item.comingSoon) {
          return (
            <TooltipProvider key={item.id} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border">
                  <p className="text-xs font-medium">Em desenvolvimento</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return buttonContent;
      })}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview campaign={campaign} isMaster={isMaster} sessions={sessions} players={players} onNavigate={setActiveSection} />;
      case 'sessions':
        return <DashboardSessions campaign={campaign} isMaster={isMaster} />;
      case 'players':
        return <DashboardPlayers campaign={campaign} isMaster={isMaster} />;
      case 'combat':
        return <DashboardCombat campaign={campaign} isMaster={isMaster} />;
      case 'notes':
        return <DashboardNotes campaign={campaign} isMaster={isMaster} />;
      case 'chat':
        return <DashboardChat campaign={campaign} />;
      case 'compendium':
        return <DashboardCompendium campaign={campaign} />;
      case 'npcs':
        return <WorkshopNPCs campaign={campaign} />;
      case 'shops':
        return <WorkshopShops campaign={campaign} players={players} />;
      case 'documents':
        return <WorkshopDocuments campaign={campaign} />;
      case 'factions':
        return <WorkshopFactions campaign={campaign} />;
      case 'timeline':
        return <WorkshopTimeline campaign={campaign} />;
      case 'encounters':
        return <GeneratorEncounters campaign={campaign} />;
      case 'treasure':
        return <GeneratorTreasure campaign={campaign} />;
      case 'settings':
        return <DashboardSettings campaign={campaign} onClose={() => onOpenChange(false)} />;
      default:
        return <DashboardOverview campaign={campaign} isMaster={isMaster} sessions={sessions} players={players} onNavigate={setActiveSection} />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-border bg-card/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0",
              campaign.image_url ? "" : "bg-primary/20"
            )}>
              {campaign.image_url ? (
                <img src={campaign.image_url} alt={campaign.name} className="w-full h-full object-cover" />
              ) : (
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-foreground truncate">{campaign.name}</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {isMaster ? "Mestre" : "Jogador"} • {currentNavItem?.label}
              </p>
            </div>
          </div>

          {/* Mobile nav toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="md:hidden h-8 px-2 text-xs"
          >
            Menu
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card/30 p-3">
            <ScrollArea className="flex-1">
              <div className="space-y-6">
                {renderNavGroup(mainItems)}
                {isMaster && workshopItems.length > 0 && renderNavGroup(workshopItems, 'Oficinas')}
                {isMaster && generatorItems.length > 0 && renderNavGroup(generatorItems, 'Geradores')}
                {configItems.length > 0 && renderNavGroup(configItems)}
              </div>
            </ScrollArea>
          </aside>

          {/* Mobile Nav Overlay */}
          {showMobileNav && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileNav(false)} />
              <aside className="absolute left-0 top-0 bottom-0 w-64 bg-darker p-4 overflow-y-auto">
                <div className="space-y-6">
                  {renderNavGroup(mainItems)}
                  {isMaster && workshopItems.length > 0 && renderNavGroup(workshopItems, 'Oficinas')}
                  {isMaster && generatorItems.length > 0 && renderNavGroup(generatorItems, 'Geradores')}
                  {configItems.length > 0 && renderNavGroup(configItems)}
                </div>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 sm:p-4 md:p-6">
                {renderContent()}
              </div>
            </ScrollArea>
          </main>
        </div>
      </SheetContent>
    </Sheet>
  );
}
