import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { CampaignCompendiumSheet } from "../CampaignCompendiumSheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Library, Crown } from "lucide-react";
import { SupporterGallery } from "@/components/supporters/SupporterGallery";

interface DashboardCompendiumProps {
  campaign: CampaignDB;
}

export function DashboardCompendium({ campaign }: DashboardCompendiumProps) {
  const [showCompendium, setShowCompendium] = useState(false);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="homebrew" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="homebrew" className="gap-2">
            <Library className="w-4 h-4" />
            Compêndio
          </TabsTrigger>
          <TabsTrigger value="supporters" className="gap-2">
            <Crown className="w-4 h-4" />
            Apoiadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="homebrew" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Compêndio da Campanha</h2>
                <p className="text-sm text-muted-foreground">Conteúdo homebrew compartilhado</p>
              </div>
              <Button onClick={() => setShowCompendium(true)} className="gap-2">
                <Library className="w-4 h-4" />
                Abrir Compêndio
              </Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border text-center">
              <Library className="w-12 h-12 mx-auto mb-4 text-accent-foreground opacity-50" />
              <h3 className="font-semibold mb-2">Compêndio da Campanha</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Acesse magias, itens, raças e classes homebrew compartilhadas pelo mestre.
              </p>
              <Button onClick={() => setShowCompendium(true)} variant="outline">
                Ver Conteúdo
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="supporters" className="mt-6">
          <SupporterGallery />
        </TabsContent>
      </Tabs>

      <CampaignCompendiumSheet
        campaignId={campaign.id}
        open={showCompendium}
        onOpenChange={setShowCompendium}
      />
    </div>
  );
}
