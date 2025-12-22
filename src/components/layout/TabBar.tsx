import { Home, Users, Map, Wrench, Menu, Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabRoute } from "@/types";

interface TabBarProps {
  activeTab: TabRoute;
  onTabChange: (tab: TabRoute) => void;
}

const tabs: Array<{ id: TabRoute; label: string; icon: typeof Home }> = [
  { id: "home", label: "Início", icon: Home },
  { id: "characters", label: "Fichas", icon: Users },
  { id: "campaigns", label: "Campanhas", icon: Map },
  { id: "tools", label: "Regras", icon: Wrench },
  { id: "menu", label: "Menu", icon: Menu },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav h-[72px]">
      <div className="flex items-center justify-around px-2 h-full max-w-lg mx-auto relative">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCenterButton = index === 2; // Campaigns is center

          // Render center dice button separately
          if (isCenterButton) {
            return (
              <div key={tab.id} className="relative -top-6">
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "w-14 h-14 rounded-full bg-gradient-arcane border-4 border-slate-950 flex items-center justify-center text-white shadow-arcane hover:scale-110 transition-transform",
                    isActive && "shadow-neon"
                  )}
                >
                  <Dices className="w-7 h-7" />
                </button>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "nav-item flex flex-col items-center justify-center w-full h-full gap-1 transition-colors group",
                isActive ? "active" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-transform group-hover:-translate-y-1",
                  isActive && "drop-shadow-[0_0_5px_hsl(173,74%,50%,0.6)]"
                )}
              />
              <span className="text-[10px] font-medium tracking-wide">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}