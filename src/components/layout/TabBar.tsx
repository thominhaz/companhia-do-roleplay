import { Home, Users, Map, Wrench, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabRoute } from "@/types";
import { useState, useEffect } from "react";

interface TabBarProps {
  activeTab: TabRoute;
  onTabChange: (tab: TabRoute) => void;
}

const tabs = [
  { id: "home" as TabRoute, label: "Início", icon: Home },
  { id: "characters" as TabRoute, label: "Personagens", icon: Users },
  { id: "campaigns" as TabRoute, label: "Campanhas", icon: Map },
  { id: "tools" as TabRoute, label: "Ferramentas", icon: Wrench },
  { id: "menu" as TabRoute, label: "Menu", icon: Menu },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const [animatingTab, setAnimatingTab] = useState<TabRoute | null>(null);

  const handleClick = (tabId: TabRoute) => {
    if (tabId !== activeTab) {
      setAnimatingTab(tabId);
      onTabChange(tabId);
      setTimeout(() => setAnimatingTab(null), 300);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCampaigns = tab.id === "campaigns";
          const isAnimating = animatingTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleClick(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px]",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "scale-110",
                    isAnimating && "icon-animate"
                  )}
                />
                {isCampaigns && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-pulse" />
                )}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium mt-1 transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-70"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-transparent" />
    </nav>
  );
}
