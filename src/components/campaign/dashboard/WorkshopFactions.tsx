import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useFactions, useFactionRelationships, Faction } from "@/hooks/useFactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Flag, Plus, Search, Eye, EyeOff, MapPin, 
  Handshake, Shield, ChevronRight
} from "lucide-react";
import { FactionFormSheet } from "./FactionFormSheet";
import { FactionDetailSheet } from "./FactionDetailSheet";
import { FactionRelationshipList } from "./FactionRelationshipList";

interface WorkshopFactionsProps {
  campaign: CampaignDB;
}

const INFLUENCE_COLORS: Record<string, string> = {
  local: "bg-blue-500/20 text-blue-400",
  regional: "bg-purple-500/20 text-purple-400",
  national: "bg-orange-500/20 text-orange-400",
  continental: "bg-red-500/20 text-red-400",
  global: "bg-yellow-500/20 text-yellow-400",
};

export function WorkshopFactions({ campaign }: WorkshopFactionsProps) {
  const { factions, isLoading, createFaction, updateFaction, deleteFaction } = useFactions(campaign.id);
  const { relationships } = useFactionRelationships(campaign.id);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  const filteredFactions = factions.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreate = () => {
    setSelectedFaction(null);
    setShowForm(true);
  };

  const handleEdit = (faction: Faction) => {
    setSelectedFaction(faction);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleView = (faction: Faction) => {
    setSelectedFaction(faction);
    setShowDetail(true);
  };

  const handleSave = (data: Partial<Faction>) => {
    if (selectedFaction) {
      updateFaction.mutate({ id: selectedFaction.id, ...data }, {
        onSuccess: () => setShowForm(false)
      });
    } else {
      createFaction.mutate(data, {
        onSuccess: () => setShowForm(false)
      });
    }
  };

  const handleDelete = () => {
    if (selectedFaction) {
      deleteFaction.mutate(selectedFaction.id, {
        onSuccess: () => {
          setShowDetail(false);
          setSelectedFaction(null);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary" />
            Facções
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie facções, guildas e organizações
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Facção
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="list" className="flex-1">
            <Shield className="w-4 h-4 mr-1" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex-1">
            <Handshake className="w-4 h-4 mr-1" />
            Relações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facções..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredFactions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
              <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Nenhuma facção</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ? "Nenhuma facção encontrada" : "Crie sua primeira facção"}
              </p>
              {!searchTerm && (
                <Button variant="outline" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Facção
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="grid gap-3">
                {filteredFactions.map(faction => (
                  <button
                    key={faction.id}
                    onClick={() => handleView(faction)}
                    className="w-full text-left p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{faction.name}</h3>
                          {faction.is_hidden && (
                            <EyeOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        
                        {faction.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {faction.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          {faction.influence_level && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs capitalize ${INFLUENCE_COLORS[faction.influence_level] || ""}`}
                            >
                              {faction.influence_level}
                            </Badge>
                          )}
                          {faction.headquarters && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {faction.headquarters}
                            </div>
                          )}
                          {faction.tags?.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {faction.tags && faction.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{faction.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="relationships" className="mt-4">
          <div className="bg-card rounded-2xl border p-4">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Handshake className="w-4 h-4" />
              Relacionamentos entre Facções
            </h3>
            <FactionRelationshipList
              factions={factions}
              relationships={relationships}
              onFactionClick={handleView}
            />
          </div>
        </TabsContent>
      </Tabs>

      <FactionFormSheet
        open={showForm}
        onOpenChange={setShowForm}
        faction={selectedFaction}
        onSave={handleSave}
        isLoading={createFaction.isPending || updateFaction.isPending}
      />

      <FactionDetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        faction={selectedFaction}
        campaign={campaign}
        allFactions={factions}
        onEdit={() => selectedFaction && handleEdit(selectedFaction)}
        onDelete={handleDelete}
      />
    </div>
  );
}
