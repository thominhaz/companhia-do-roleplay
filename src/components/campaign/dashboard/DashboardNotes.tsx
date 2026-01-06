import { useState, useEffect } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { CampaignNotesSheet } from "../CampaignNotesSheet";
import { Button } from "@/components/ui/button";
import { StickyNote, LayoutDashboard, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignWhiteboard } from "../whiteboard/CampaignWhiteboard";

interface DashboardNotesProps {
  campaign: CampaignDB;
  isMaster: boolean;
}

export function DashboardNotes({ campaign, isMaster }: DashboardNotesProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'whiteboard'>('notes');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Notas & Whiteboard</h2>
          <p className="text-sm text-muted-foreground">
            Notas da campanha e quadro interativo para planejamento
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'notes' | 'whiteboard')}>
        <TabsList className="mb-4">
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="w-4 h-4" />
            Notas
          </TabsTrigger>
          {isMaster && (
            <TabsTrigger value="whiteboard" className="gap-2" disabled={isMobile}>
              <LayoutDashboard className="w-4 h-4" />
              Whiteboard
              {isMobile && <span className="text-xs text-muted-foreground ml-1">(Desktop)</span>}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="notes" className="mt-0">
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <StickyNote className="w-12 h-12 mx-auto mb-4 text-amber-500 opacity-50" />
            <h3 className="font-semibold mb-2">Sistema de Notas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie notas privadas ou compartilhe informações com todos os jogadores da campanha.
            </p>
            <Button onClick={() => setShowNotes(true)} variant="outline" className="gap-2">
              <StickyNote className="w-4 h-4" />
              Abrir Notas
            </Button>
          </div>
        </TabsContent>

        {isMaster && (
          <TabsContent value="whiteboard" className="mt-0">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <CampaignWhiteboard campaignId={campaign.id} />
            </div>
          </TabsContent>
        )}
      </Tabs>

      <CampaignNotesSheet
        campaignId={campaign.id}
        open={showNotes}
        onOpenChange={setShowNotes}
      />
    </div>
  );
}
