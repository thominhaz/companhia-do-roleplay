import { useState, useEffect, useRef } from "react";
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

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabRoute>("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedTab, setDisplayedTab] = useState<TabRoute>("home");
  const prevTabRef = useRef<TabRoute>("home");

  // Handle tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['home', 'characters', 'campaigns', 'tools', 'menu'].includes(tabParam)) {
      setActiveTab(tabParam as TabRoute);
      // Remove tab param but keep others like create=true
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('tab');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle tab transitions
  const handleTabChange = (newTab: TabRoute) => {
    if (newTab === activeTab) return;
    
    prevTabRef.current = activeTab;
    setIsTransitioning(true);
    
    // Short delay before changing content
    setTimeout(() => {
      setActiveTab(newTab);
      setDisplayedTab(newTab);
      // Small delay to allow content to mount before animating in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
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

      <div className="min-h-screen bg-darker">
        <div 
          className={cn(
            "transition-all duration-300 ease-out",
            isTransitioning 
              ? "opacity-0 translate-y-2" 
              : "opacity-100 translate-y-0"
          )}
        >
          {renderScreen()}
        </div>
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </>
  );
};

export default Index;
