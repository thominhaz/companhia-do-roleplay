import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  CampaignNPC, 
  useNPCWithRelationships, 
  useCampaignNPCs,
  useCreateNPCRelationship,
  useDeleteNPCRelationship,
  NPCRelationship
} from "@/hooks/useNPCs";
import { 
  UserSquare2, Edit, MapPin, Briefcase, Eye, EyeOff, 
  Skull, HelpCircle, Users, Plus, Link2, Trash2, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface NPCDetailSheetProps {
  npc: CampaignNPC | null;
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

const statusConfig = {
  alive: { label: 'Vivo', icon: UserSquare2, color: 'text-secondary', bg: 'bg-secondary/10' },
  dead: { label: 'Morto', icon: Skull, color: 'text-destructive', bg: 'bg-destructive/10' },
  unknown: { label: 'Desconhecido', icon: HelpCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
  missing: { label: 'Desaparecido', icon: HelpCircle, color: 'text-gold', bg: 'bg-gold/10' },
};

const relationshipTypes = [
  'Aliado', 'Inimigo', 'Família', 'Amigo', 'Rival', 'Mestre', 'Aprendiz',
  'Empregador', 'Empregado', 'Parceiro', 'Amante', 'Conhecido', 'Desconfiança'
];

export function NPCDetailSheet({ npc, campaignId, open, onOpenChange, onEdit }: NPCDetailSheetProps) {
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [newRelationship, setNewRelationship] = useState({ npcId: '', type: '', description: '' });
  const [deletingRelationship, setDeletingRelationship] = useState<NPCRelationship | null>(null);

  const { data: npcDetails, isLoading } = useNPCWithRelationships(npc?.id || '', campaignId);
  const { data: allNPCs } = useCampaignNPCs(campaignId);
  const createRelationship = useCreateNPCRelationship();
  const deleteRelationship = useDeleteNPCRelationship();

  if (!npc) return null;

  const status = statusConfig[npc.status];
  const StatusIcon = status.icon;

  // Filter out NPCs that already have relationships and the current NPC
  const availableNPCs = allNPCs?.filter(n => 
    n.id !== npc.id && 
    !npcDetails?.relationships.some(r => r.related_npc_id === n.id || r.npc_id === n.id)
  ) || [];

  const handleAddRelationship = async () => {
    if (!newRelationship.npcId || !newRelationship.type) return;

    await createRelationship.mutateAsync({
      campaign_id: campaignId,
      npc_id: npc.id,
      related_npc_id: newRelationship.npcId,
      relationship_type: newRelationship.type,
      description: newRelationship.description || undefined,
      is_mutual: true,
    });

    setNewRelationship({ npcId: '', type: '', description: '' });
    setShowAddRelationship(false);
  };

  const handleDeleteRelationship = async () => {
    if (!deletingRelationship) return;
    await deleteRelationship.mutateAsync({
      id: deletingRelationship.id,
      npcId: deletingRelationship.npc_id,
      relatedNpcId: deletingRelationship.related_npc_id,
    });
    setDeletingRelationship(null);
  };

  const InfoSection = ({ title, content, icon }: { title: string; content?: string | null; icon?: React.ReactNode }) => {
    if (!content) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <UserSquare2 className="w-5 h-5 text-primary" />
                Detalhes do NPC
              </SheetTitle>
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(90vh-8rem)] py-4">
            <div className="space-y-6 pr-4">
              {/* Header Card */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
                    npc.image_url ? "" : "bg-primary/10"
                  )}>
                    {npc.image_url ? (
                      <img src={npc.image_url} alt={npc.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserSquare2 className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">{npc.name}</h3>
                      {npc.is_hidden && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Oculto
                        </span>
                      )}
                    </div>
                    {npc.title && (
                      <p className="text-sm text-muted-foreground italic">"{npc.title}"</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {npc.occupation && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {npc.occupation}
                        </span>
                      )}
                      {npc.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {npc.location}
                        </span>
                      )}
                      <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", status.bg, status.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {npc.tags && npc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-border">
                    {npc.tags.map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Sections */}
              <div className="space-y-6">
                <InfoSection title="Aparência" content={npc.appearance} icon={<Eye className="w-4 h-4" />} />
                <InfoSection title="Personalidade" content={npc.personality} />
                <InfoSection title="Motivações" content={npc.motivations} />
                <InfoSection title="Segredos" content={npc.secrets} />
                <InfoSection title="Notas" content={npc.notes} />
              </div>

              {/* Relationships */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Relacionamentos
                  </h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAddRelationship(true)}
                    disabled={availableNPCs.length === 0}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : npcDetails?.relationships && npcDetails.relationships.length > 0 ? (
                  <div className="space-y-2">
                    {npcDetails.relationships.map(rel => (
                      <div key={rel.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Link2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{rel.related_npc?.name || 'NPC Desconhecido'}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {rel.relationship_type}
                            </span>
                          </div>
                          {rel.description && (
                            <p className="text-xs text-muted-foreground truncate">{rel.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => setDeletingRelationship(rel)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-card rounded-lg border border-dashed border-border">
                    Nenhum relacionamento definido
                  </p>
                )}

                {/* Add Relationship Form */}
                {showAddRelationship && (
                  <div className="bg-card rounded-lg p-4 border border-primary/30 space-y-3">
                    <div className="space-y-2">
                      <Label>NPC Relacionado</Label>
                      <Select
                        value={newRelationship.npcId}
                        onValueChange={(value) => setNewRelationship(prev => ({ ...prev, npcId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um NPC" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableNPCs.map(n => (
                            <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Relacionamento</Label>
                      <Select
                        value={newRelationship.type}
                        onValueChange={(value) => setNewRelationship(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Input
                        placeholder="Ex: Amigos de infância"
                        value={newRelationship.description}
                        onChange={(e) => setNewRelationship(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowAddRelationship(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleAddRelationship}
                        disabled={!newRelationship.npcId || !newRelationship.type || createRelationship.isPending}
                        className="flex-1"
                      >
                        {createRelationship.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Adicionar'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete Relationship Dialog */}
      <AlertDialog open={!!deletingRelationship} onOpenChange={(open) => !open && setDeletingRelationship(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover relacionamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este relacionamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRelationship} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
