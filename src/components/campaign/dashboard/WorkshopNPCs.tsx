import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignNPCs, useDeleteNPC, CampaignNPC } from "@/hooks/useNPCs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  UserSquare2, Plus, Search, Loader2, Eye, EyeOff, 
  Skull, HelpCircle, MapPin, Briefcase, MoreVertical, Trash2, Edit, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NPCFormSheet } from "./NPCFormSheet";
import { NPCDetailSheet } from "./NPCDetailSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkshopNPCsProps {
  campaign: CampaignDB;
}

const statusConfig = {
  alive: { label: 'Vivo', icon: UserSquare2, color: 'text-green-500', bg: 'bg-green-500/10' },
  dead: { label: 'Morto', icon: Skull, color: 'text-red-500', bg: 'bg-red-500/10' },
  unknown: { label: 'Desconhecido', icon: HelpCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
  missing: { label: 'Desaparecido', icon: HelpCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

export function WorkshopNPCs({ campaign }: WorkshopNPCsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [editingNPC, setEditingNPC] = useState<CampaignNPC | null>(null);
  const [viewingNPC, setViewingNPC] = useState<CampaignNPC | null>(null);
  const [deletingNPC, setDeletingNPC] = useState<CampaignNPC | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: npcs, isLoading } = useCampaignNPCs(campaign.id);
  const deleteNPC = useDeleteNPC();

  const filteredNPCs = npcs?.filter(npc => {
    const matchesSearch = npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || npc.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const visibleNPCs = filteredNPCs.filter(npc => !npc.is_hidden);
  const hiddenNPCs = filteredNPCs.filter(npc => npc.is_hidden);

  const handleDelete = async () => {
    if (!deletingNPC) return;
    await deleteNPC.mutateAsync({ id: deletingNPC.id, campaignId: campaign.id });
    setDeletingNPC(null);
  };

  const NPCCard = ({ npc }: { npc: CampaignNPC }) => {
    const status = statusConfig[npc.status];
    const StatusIcon = status.icon;

    return (
      <div className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all group">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
            npc.image_url ? "" : "bg-primary/10"
          )}>
            {npc.image_url ? (
              <img src={npc.image_url} alt={npc.name} className="w-full h-full object-cover" />
            ) : (
              <UserSquare2 className="w-6 h-6 text-primary" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground truncate">{npc.name}</h4>
              {npc.is_hidden && (
                <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {npc.title && (
              <p className="text-xs text-muted-foreground truncate">{npc.title}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {npc.occupation && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {npc.occupation}
                </span>
              )}
              {npc.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {npc.location}
                </span>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-2">
            <span className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1", status.bg, status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewingNPC(npc)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingNPC(npc)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeletingNPC(npc)} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tags */}
        {npc.tags && npc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {npc.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {tag}
              </span>
            ))}
            {npc.tags.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{npc.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserSquare2 className="w-5 h-5" />
            Oficina de NPCs
          </h2>
          <p className="text-sm text-muted-foreground">
            {npcs?.length || 0} NPCs criados
          </p>
        </div>
        <Button onClick={() => setShowCreateSheet(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo NPC
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar NPCs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {Object.entries(statusConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              className="gap-1"
            >
              <config.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{config.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredNPCs.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
          <UserSquare2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">
            {searchQuery || statusFilter ? "Nenhum NPC encontrado" : "Nenhum NPC criado"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || statusFilter 
              ? "Tente ajustar os filtros de busca"
              : "Crie seu primeiro NPC para dar vida à sua campanha"}
          </p>
          {!searchQuery && !statusFilter && (
            <Button onClick={() => setShowCreateSheet(true)} variant="outline">
              Criar Primeiro NPC
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Visible NPCs */}
          {visibleNPCs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visíveis para Jogadores ({visibleNPCs.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleNPCs.map(npc => (
                  <NPCCard key={npc.id} npc={npc} />
                ))}
              </div>
            </div>
          )}

          {/* Hidden NPCs */}
          {hiddenNPCs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <EyeOff className="w-4 h-4" />
                Ocultos ({hiddenNPCs.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {hiddenNPCs.map(npc => (
                  <NPCCard key={npc.id} npc={npc} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <NPCFormSheet
        campaignId={campaign.id}
        npc={editingNPC}
        open={showCreateSheet || !!editingNPC}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateSheet(false);
            setEditingNPC(null);
          }
        }}
      />

      {/* Detail Sheet */}
      <NPCDetailSheet
        npc={viewingNPC}
        campaignId={campaign.id}
        open={!!viewingNPC}
        onOpenChange={(open) => {
          if (!open) setViewingNPC(null);
        }}
        onEdit={() => {
          if (viewingNPC) {
            setEditingNPC(viewingNPC);
            setViewingNPC(null);
          }
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingNPC} onOpenChange={(open) => !open && setDeletingNPC(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir NPC?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingNPC?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
