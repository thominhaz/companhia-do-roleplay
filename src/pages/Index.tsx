import { useState } from "react";
import { TabBar } from "@/components/layout/TabBar";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { CharactersScreen } from "@/components/screens/CharactersScreen";
import { CampaignsScreen } from "@/components/screens/CampaignsScreen";
import { ToolsScreen } from "@/components/screens/ToolsScreen";
import { MenuScreen } from "@/components/screens/MenuScreen";
import type { TabRoute } from "@/types";
import { Helmet } from "react-helmet";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabRoute>("home");

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen onNavigate={setActiveTab} />;
      case "characters":
        return <CharactersScreen />;
      case "campaigns":
        return <CampaignsScreen />;
      case "tools":
        return <ToolsScreen />;
      case "menu":
        return <MenuScreen />;
      default:
        return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Ward RPG - Companheiro D&D 5e</title>
        <meta
          name="description"
          content="Gerencie seus personagens de D&D 5e, campanhas e ferramentas de RPG em um só lugar."
        />
        <meta name="theme-color" content="#111827" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>

      <div className="min-h-screen bg-darker">
        {renderScreen()}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </>
  );
};

export default Index;
