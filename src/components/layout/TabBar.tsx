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
  { id: "home" as TabRoute, label: "Início", shortLabel: "Início", icon: Home },
  { id: "characters" as TabRoute, label: "Personagens", shortLabel: "Perso.", icon: Users },
  { id: "campaigns" as TabRoute, label: "Campanhas", shortLabel: "Camp.", icon: Map },
  { id: "tools" as TabRoute, label: "Ferramentas", shortLabel: "Ferra.", icon: Wrench },
  { id: "menu" as TabRoute, label: "Menu", shortLabel: "Menu", icon: Menu },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[calc(env(safe-area-inset-bottom)+2px)] px-4">
      {/* Outer glass container — Concept 1: Base structure */}
      <div
         className={cn(
           "relative flex items-center justify-around gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-[24px] max-w-[420px] w-full overflow-hidden",
           "bg-white/[0.08]",
           "backdrop-blur-[12px] sm:backdrop-blur-[20px]",
           "border border-white/[0.15]",
           "shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
         )}
      >
        {/* Decorative glass orbs for depth */}
        <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-primary/[0.08] blur-xl pointer-events-none hidden sm:block" />
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-accent/[0.06] blur-xl pointer-events-none hidden sm:block" />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "tween", duration: 0.15 }}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl transition-all duration-200 min-w-0 flex-1 py-2 px-1 sm:px-3"
              )}
            >
              {/* Active pill — glass effect */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className={cn(
                    "absolute inset-0 rounded-2xl",
                    "bg-white/[0.12]",
                    "border border-white/[0.2]"
                  )}
                  transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                />
              )}

              {/* Concept 5: Typography & icons with depth */}
              <div className="relative z-10">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: "tween", duration: 0.15 }}
                >
                  <Icon
                    className={cn(
                      "w-7 h-7 transition-colors duration-200",
                      isActive
                        ? "text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                        : "text-muted-foreground/70"
                    )}
                  />
                </motion.div>
              </div>

            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
