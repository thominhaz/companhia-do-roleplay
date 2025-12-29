import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupporterNPCs, useSupporterItems, SupporterNPC, SupporterItem } from "@/hooks/useSupporterContent";
import { SupporterNPCCard } from "./SupporterNPCCard";
import { SupporterItemCard } from "./SupporterItemCard";
import { SupporterNPCDetailSheet } from "./SupporterNPCDetailSheet";
import { SupporterItemDetailSheet } from "./SupporterItemDetailSheet";
import { Search, Users, Sparkles, Crown } from "lucide-react";

export function SupporterGallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNPC, setSelectedNPC] = useState<SupporterNPC | null>(null);
  const [selectedItem, setSelectedItem] = useState<SupporterItem | null>(null);

  const { data: npcs, isLoading: loadingNPCs } = useSupporterNPCs();
  const { data: items, isLoading: loadingItems } = useSupporterItems();

  const filteredNPCs = npcs?.filter(
    (npc) =>
      npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      npc.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      npc.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredItems = items?.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalContent = (npcs?.length || 0) + (items?.length || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Crown className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">
            Galeria de Apoiadores
          </h2>
          <Crown className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-muted-foreground">
          Conteúdo exclusivo criado pelos apoiadores do Catarse
        </p>
        {totalContent > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            {totalContent} criações da comunidade
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, criador ou tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="npcs" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="npcs" className="gap-2">
            <Users className="w-4 h-4" />
            NPCs ({npcs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Itens ({items?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="npcs" className="mt-6">
          {loadingNPCs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : filteredNPCs && filteredNPCs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNPCs.map((npc) => (
                <SupporterNPCCard
                  key={npc.id}
                  npc={npc}
                  onClick={() => setSelectedNPC(npc)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum NPC encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Tente uma busca diferente"
                  : "Em breve teremos NPCs criados pelos apoiadores Lendários!"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          {loadingItems ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <SupporterItemCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum item encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Tente uma busca diferente"
                  : "Em breve teremos itens criados pelos apoiadores Mestres Épicos!"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Sheets */}
      <SupporterNPCDetailSheet
        npc={selectedNPC}
        open={!!selectedNPC}
        onOpenChange={(open) => !open && setSelectedNPC(null)}
      />
      <SupporterItemDetailSheet
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      />
    </div>
  );
}
