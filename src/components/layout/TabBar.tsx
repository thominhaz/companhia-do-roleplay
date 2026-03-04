import { Home, Users, Map, Wrench, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabRoute } from "@/types";
import { motion } from "framer-motion";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useHaptics } from "@/hooks/useHaptics";

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
  const { lightTap } = useHaptics();

  const handleTabChange = (tabId: TabRoute) => {
    if (tabId !== activeTab) {
      playClick();
      lightTap();
      onTabChange(tabId);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)] px-4 pb-3">
      <div
        className={cn(
          "flex items-center justify-around gap-1 px-3 py-2 rounded-[28px] max-w-md w-full",
          "bg-surface-2/60 backdrop-blur-2xl",
          "border border-white/[0.08]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl transition-colors duration-200 min-w-[52px] py-1.5 px-2"
              )}
            >
              {/* Active pill background */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className={cn(
                    "absolute inset-0 rounded-2xl",
                    "bg-primary/20 backdrop-blur-sm",
                    "border border-primary/30",
                    "shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                  )}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}

              <div className="relative z-10">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </motion.div>
              </div>

              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.5,
                }}
                className={cn(
                  "relative z-10 text-[10px] mt-0.5 transition-colors duration-200",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground font-medium"
                )}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
