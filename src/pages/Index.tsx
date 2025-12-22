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

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabRoute>("home");
  const [displayedTab, setDisplayedTab] = useState<TabRoute>("home");
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['home', 'characters', 'campaigns', 'tools', 'menu'].includes(tabParam)) {
      setActiveTab(tabParam as TabRoute);
      setDisplayedTab(tabParam as TabRoute);
      // Keep other params like tool=notes
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('tab');
      if (newParams.toString()) {
        setSearchParams(newParams, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  // Handle tab transitions with fade animation
  const handleTabChange = (newTab: TabRoute) => {
    if (newTab === activeTab || isAnimating) return;
    
    setIsAnimating(true);
    setActiveTab(newTab);
    
    // Wait for animation to complete
    setTimeout(() => {
      setDisplayedTab(newTab);
      setIsAnimating(false);
    }, 250);
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
        <div className={cn("min-h-screen", isAnimating ? "animate-page-enter" : "")}>
          {renderScreen()}
        </div>
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </>
  );
};

export default Index;
