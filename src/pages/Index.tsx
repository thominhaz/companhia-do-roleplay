import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { TabBar } from "@/components/layout/TabBar";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { CharactersScreen } from "@/components/screens/CharactersScreen";
import { CampaignsScreen } from "@/components/screens/CampaignsScreen";
import { ToolsScreen } from "@/components/screens/ToolsScreen";
import { MenuScreen } from "@/components/screens/MenuScreen";
import type { TabRoute } from "@/types";
import { Helmet } from "react-helmet";
import { cn } from "@/lib/utils";

const TAB_ORDER: TabRoute[] = ["home", "characters", "campaigns", "tools", "menu"];

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabRoute>("home");
  const [displayedTab, setDisplayedTab] = useState<TabRoute>("home");
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['home', 'characters', 'campaigns', 'tools', 'menu'].includes(tabParam)) {
      setActiveTab(tabParam as TabRoute);
      setDisplayedTab(tabParam as TabRoute);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('tab');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle tab transitions with slide animation
  const handleTabChange = (newTab: TabRoute) => {
    if (newTab === activeTab || isAnimating) return;
    
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const newIndex = TAB_ORDER.indexOf(newTab);
    const direction = newIndex > currentIndex ? "left" : "right";
    
    setSlideDirection(direction);
    setIsAnimating(true);
    
    // Wait for exit animation, then switch content
    setTimeout(() => {
      setActiveTab(newTab);
      setDisplayedTab(newTab);
      
      // Allow enter animation to complete
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection(null);
      }, 350);
    }, 200);
  };

  // Sync displayedTab with activeTab on initial load
  useEffect(() => {
    setDisplayedTab(activeTab);
  }, []);

  const renderScreen = () => {
    switch (displayedTab) {
      case "home":
        return <HomeScreen onNavigate={handleTabChange} />;
      case "characters":
        return <CharactersScreen />;
      case "campaigns":
        return <CampaignsScreen />;
      case "tools":
        return <ToolsScreen />;
      case "menu":
        return <MenuScreen />;
      default:
        return <HomeScreen onNavigate={handleTabChange} />;
    }
  };

  const getAnimationClass = () => {
    if (!slideDirection) return "";
    
    if (isAnimating && displayedTab !== activeTab) {
      // Exiting: slide out in opposite direction
      return slideDirection === "left" ? "slide-exit-left" : "slide-exit-right";
    }
    
    // Entering: slide in from direction
    return slideDirection === "left" ? "slide-enter-left" : "slide-enter-right";
  };

  return (
    <>
      <Helmet>
        <title>Go20 - Companheiro D&D 5e</title>
        <meta
          name="description"
          content="Gerencie seus personagens de D&D 5e, campanhas e ferramentas de RPG em um só lugar."
        />
        <meta name="theme-color" content="#111827" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>

      <div className="min-h-screen bg-darker overflow-hidden">
        <div className={cn("min-h-screen", getAnimationClass())}>
          {renderScreen()}
        </div>
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </>
  );
};

export default Index;
