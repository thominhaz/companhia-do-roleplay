import { Bell, Settings } from "lucide-react";
import { QuickActions } from "@/components/home/QuickActions";
import { HeroCard } from "@/components/home/HeroCard";
import { RecentCharacters } from "@/components/home/RecentCharacters";
import { RecentCampaigns } from "@/components/home/RecentCampaigns";

// Mock data - será substituído por dados reais do Supabase
const mockActiveCharacter = {
  name: "Thorin Escudo-de-Ferro",
  class: "Guerreiro",
  level: 5,
  race: "Anão",
  currentHp: 38,
  maxHp: 45,
  armorClass: 18,
};

const mockNextSession = {
  campaignName: "A Maldição de Strahd",
  date: "Sáb, 21 Dez",
  time: "19:00",
};

const mockCharacters = [
  {
    id: "1",
    name: "Thorin",
    class: "Guerreiro",
    level: 5,
    isLocal: false,
  },
  {
    id: "2",
    name: "Elara",
    class: "Maga",
    level: 3,
    isLocal: true,
  },
  {
    id: "3",
    name: "Kael",
    class: "Ladino",
    level: 4,
    isLocal: false,
  },
];

const mockCampaigns = [
  {
    id: "1",
    name: "A Maldição de Strahd",
    masterName: "João",
    playerCount: 5,
    nextSession: "21/12",
    isUserMaster: false,
  },
  {
    id: "2",
    name: "Minas Perdidas de Phandelver",
    masterName: "Você",
    playerCount: 4,
    nextSession: "28/12",
    isUserMaster: true,
  },
];

export function HomeScreen() {
  const handleQuickAction = (actionId: string) => {
    console.log("Quick action:", actionId);
    // TODO: Implementar navegação/ações
  };

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Ward RPG
            </h1>
            <p className="text-xs text-muted-foreground">
              Olá, Aventureiro! 👋
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-muted/50 transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
            </button>
            <button className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-5 space-y-6 max-w-lg mx-auto">
        {/* Quick Actions */}
        <QuickActions onAction={handleQuickAction} />

        {/* Hero Card - Active Character + Next Session */}
        <HeroCard
          character={mockActiveCharacter}
          nextSession={mockNextSession}
        />

        {/* Recent Characters */}
        <RecentCharacters
          characters={mockCharacters}
          onCharacterClick={(id) => console.log("Character:", id)}
          onViewAll={() => console.log("View all characters")}
          onCreateNew={() => console.log("Create new character")}
        />

        {/* Recent Campaigns */}
        <RecentCampaigns
          campaigns={mockCampaigns}
          onCampaignClick={(id) => console.log("Campaign:", id)}
          onViewAll={() => console.log("View all campaigns")}
          isPremium={true}
        />
      </main>
    </div>
  );
}
