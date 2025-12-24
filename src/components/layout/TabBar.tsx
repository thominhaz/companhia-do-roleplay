import { Home, Users, Map, Wrench, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabRoute } from "@/types";
import { motion } from "framer-motion";
import { useSoundEffects } from "@/hooks/useSoundEffects";

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
  const { playClick } = useSoundEffects();

  const handleTabChange = (tabId: TabRoute) => {
    if (tabId !== activeTab) {
      playClick();
      onTabChange(tabId);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCampaigns = tab.id === "campaigns";

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "relative flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-colors duration-200 min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active background indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/15 rounded-xl"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className="relative z-10">
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                
                {isCampaigns && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full"
                  >
                    <span className="absolute inset-0 bg-secondary rounded-full animate-ping opacity-75" />
                  </motion.span>
                )}
              </div>
              
              <motion.span
                animate={{ 
                  opacity: isActive ? 1 : 0.6,
                  fontWeight: isActive ? 600 : 500,
                }}
                className="relative z-10 text-[10px] mt-1"
              >
                {tab.label}
              </motion.span>
              
              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-transparent" />
    </nav>
  );
}
