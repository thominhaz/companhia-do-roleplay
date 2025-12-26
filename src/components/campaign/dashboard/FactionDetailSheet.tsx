import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Edit, Trash2, EyeOff, MapPin, Target, Lock, 
  Users, Handshake, Plus, Crown, X, Shield, Calendar, TrendingUp, TrendingDown
} from "lucide-react";
import { Faction, useFactionNPCs, useFactionRelationships, useCharacterFactionRep, useFactionEvents } from "@/hooks/useFactions";
import { useNPCs } from "@/hooks/useNPCs";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";
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

interface FactionDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faction: Faction | null;
  campaign: CampaignDB;
  allFactions: Faction[];
  onEdit: () => void;
  onDelete: () => void;
}

const RELATIONSHIP_TYPES = [
  { value: "allied", label: "Aliada", color: "text-green-500" },
  { value: "friendly", label: "Amigável", color: "text-emerald-500" },
  { value: "neutral", label: "Neutra", color: "text-muted-foreground" },
  { value: "unfriendly", label: "Hostil", color: "text-orange-500" },
  { value: "enemy", label: "Inimiga", color: "text-red-500" },
];

const REPUTATION_LEVELS = [
  { min: -100, max: -51, title: "Odiado", color: "bg-red-600" },
  { min: -50, max: -26, title: "Hostil", color: "bg-red-500" },
  { min: -25, max: -1, title: "Desconfiado", color: "bg-orange-500" },
  { min: 0, max: 0, title: "Neutro", color: "bg-muted" },
  { min: 1, max: 25, title: "Amigável", color: "bg-emerald-500" },
  { min: 26, max: 50, title: "Respeitado", color: "bg-green-500" },
  { min: 51, max: 100, title: "Venerado", color: "bg-primary" },
];

function getReputationInfo(level: number) {
  return REPUTATION_LEVELS.find(r => level >= r.min && level <= r.max) || REPUTATION_LEVELS[3];
}

export function FactionDetailSheet({ 
  open, onOpenChange, faction, campaign, allFactions, onEdit, onDelete 
}: FactionDetailSheetProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedNpcId, setSelectedNpcId] = useState<string>("");
  const [npcRole, setNpcRole] = useState("");
  const [selectedCharId, setSelectedCharId] = useState<string>("");
  const [repLevel, setRepLevel] = useState(0);
  const [selectedRelFactionId, setSelectedRelFactionId] = useState<string>("");
  const [relType, setRelType] = useState("neutral");
  
  // Event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventRepChange, setEventRepChange] = useState(0);

  const { user } = useAuth();
  const { npcs } = useNPCs(campaign.id);
  const { data: players = [] } = useCampaignPlayers(campaign.id);
  const { factionNPCs, linkNPC, unlinkNPC } = useFactionNPCs(faction?.id);
  const { relationships, createRelationship, deleteRelationship } = useFactionRelationships(campaign.id);
  const { reputations, upsertReputation } = useCharacterFactionRep(campaign.id);
  const { events, createEventAndApply, deleteEvent } = useFactionEvents(campaign.id, faction?.id);

  if (!faction) return null;

  const factionRelationships = relationships.filter(
    r => r.faction_id === faction.id || r.related_faction_id === faction.id
  );

  const factionReputations = reputations.filter(r => r.faction_id === faction.id);

  const linkedNpcIds = factionNPCs.map(fn => fn.npc_id);
  const availableNpcs = npcs.filter(n => !linkedNpcIds.includes(n.id));

  const otherFactions = allFactions.filter(f => f.id !== faction.id);
  const relatedFactionIds = factionRelationships.map(r => 
    r.faction_id === faction.id ? r.related_faction_id : r.faction_id
  );
  const availableFactions = otherFactions.filter(f => !relatedFactionIds.includes(f.id));

  const charactersInCampaign = players.map(p => p.character).filter(Boolean);

  const handleLinkNPC = () => {
    if (selectedNpcId) {
      linkNPC.mutate({ npc_id: selectedNpcId, role: npcRole || undefined });
      setSelectedNpcId("");
      setNpcRole("");
    }
  };

  const handleAddRelationship = () => {
    if (selectedRelFactionId) {
      createRelationship.mutate({
        faction_id: faction.id,
        related_faction_id: selectedRelFactionId,
        relationship_type: relType,
      });
      setSelectedRelFactionId("");
      setRelType("neutral");
    }
  };

  const handleUpdateReputation = () => {
    if (selectedCharId) {
      const info = getReputationInfo(repLevel);
      upsertReputation.mutate({
        character_id: selectedCharId,
        faction_id: faction.id,
        reputation_level: repLevel,
        reputation_title: info.title,
      });
      setSelectedCharId("");
      setRepLevel(0);
    }
  };

  const handleCreateEvent = () => {
    if (!eventTitle || !user) return;
    
    const characterIds = charactersInCampaign.map(c => c!.id);
    
    createEventAndApply.mutate({
      faction_id: faction.id,
      title: eventTitle,
      description: eventDescription || undefined,
      event_date: eventDate || undefined,
      reputation_change: eventRepChange,
      character_ids: characterIds,
      created_by: user.id,
    });
    
    // Reset form
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventRepChange(0);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {faction.name}
                {faction.is_hidden && <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </SheetTitle>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4">
              {faction.description && (
                <p className="text-sm text-muted-foreground">{faction.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {faction.alignment && (
                  <Badge variant="outline">{faction.alignment}</Badge>
                )}
                {faction.influence_level && (
                  <Badge variant="secondary" className="capitalize">{faction.influence_level}</Badge>
                )}
                {faction.tags?.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>

              {faction.headquarters && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{faction.headquarters}</span>
                </div>
              )}

              {faction.goals && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="w-4 h-4" />
                    Objetivos
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{faction.goals}</p>
                </div>
              )}

              {faction.secrets && (
                <div className="space-y-1 p-3 rounded-lg bg-muted/50 border border-dashed">
                  <div className="flex items-center gap-2 text-sm font-medium text-orange-500">
                    <Lock className="w-4 h-4" />
                    Segredos (apenas mestre)
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{faction.secrets}</p>
                </div>
              )}

              <Tabs defaultValue="members" className="mt-4">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="members">
                    <Users className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="relations">
                    <Handshake className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="reputation">
                    <Shield className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="events">
                    <Calendar className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-3 mt-4">
                  {factionNPCs.length > 0 && (
                    <div className="space-y-2">
                      {factionNPCs.map(fn => (
                        <div key={fn.id} className="flex items-center justify-between p-2 rounded-lg bg-card border">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={fn.npc?.image_url || undefined} />
                              <AvatarFallback>{fn.npc?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1 text-sm font-medium">
                                {fn.npc?.name}
                                {fn.is_leader && <Crown className="w-3 h-3 text-yellow-500" />}
                              </div>
                              {fn.role && <p className="text-xs text-muted-foreground">{fn.role}</p>}
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => unlinkNPC.mutate(fn.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {availableNpcs.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs">Vincular NPC</Label>
                      <Select value={selectedNpcId} onValueChange={setSelectedNpcId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar NPC" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableNpcs.map(npc => (
                            <SelectItem key={npc.id} value={npc.id}>{npc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedNpcId && (
                        <>
                          <Input 
                            placeholder="Cargo/Função (opcional)" 
                            value={npcRole}
                            onChange={(e) => setNpcRole(e.target.value)}
                          />
                          <Button size="sm" className="w-full" onClick={handleLinkNPC}>
                            <Plus className="w-4 h-4 mr-1" /> Vincular
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="relations" className="space-y-3 mt-4">
                  {factionRelationships.length > 0 && (
                    <div className="space-y-2">
                      {factionRelationships.map(rel => {
                        const otherFactionId = rel.faction_id === faction.id 
                          ? rel.related_faction_id 
                          : rel.faction_id;
                        const otherFaction = allFactions.find(f => f.id === otherFactionId);
                        const relInfo = RELATIONSHIP_TYPES.find(r => r.value === rel.relationship_type);

                        return (
                          <div key={rel.id} className="flex items-center justify-between p-2 rounded-lg bg-card border">
                            <div className="flex items-center gap-2">
                              <Shield className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{otherFaction?.name}</p>
                                <p className={`text-xs ${relInfo?.color}`}>{relInfo?.label}</p>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => deleteRelationship.mutate(rel.id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {availableFactions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs">Adicionar Relacionamento</Label>
                      <Select value={selectedRelFactionId} onValueChange={setSelectedRelFactionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar facção" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFactions.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedRelFactionId && (
                        <>
                          <Select value={relType} onValueChange={setRelType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_TYPES.map(r => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" className="w-full" onClick={handleAddRelationship}>
                            <Plus className="w-4 h-4 mr-1" /> Adicionar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reputation" className="space-y-3 mt-4">
                  {factionReputations.length > 0 && (
                    <div className="space-y-2">
                      {factionReputations.map(rep => {
                        const info = getReputationInfo(rep.reputation_level);
                        return (
                          <div key={rep.id} className="flex items-center justify-between p-2 rounded-lg bg-card border">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={rep.character?.image_url || undefined} />
                                <AvatarFallback>{rep.character?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{rep.character?.name}</p>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${info.color}`} />
                                  <span className="text-xs text-muted-foreground">
                                    {info.title} ({rep.reputation_level})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {charactersInCampaign.length > 0 && (
                    <div className="space-y-3 pt-2 border-t">
                      <Label className="text-xs">Alterar Reputação</Label>
                      <Select value={selectedCharId} onValueChange={setSelectedCharId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar personagem" />
                        </SelectTrigger>
                        <SelectContent>
                          {charactersInCampaign.map(char => (
                            <SelectItem key={char!.id} value={char!.id}>{char!.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCharId && (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Odiado</span>
                              <span className="font-medium">{repLevel}</span>
                              <span>Venerado</span>
                            </div>
                            <Slider
                              value={[repLevel]}
                              onValueChange={([v]) => setRepLevel(v)}
                              min={-100}
                              max={100}
                              step={5}
                            />
                            <div className="text-center">
                              <Badge className={getReputationInfo(repLevel).color}>
                                {getReputationInfo(repLevel).title}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" className="w-full" onClick={handleUpdateReputation}>
                            <Save className="w-4 h-4 mr-1" /> Salvar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="events" className="space-y-3 mt-4">
                  <div className="text-xs text-muted-foreground mb-2">
                    Eventos históricos afetam a reputação de todos os personagens da campanha com esta facção.
                  </div>
                  
                  {events.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {events.map(event => (
                        <div key={event.id} className="p-3 rounded-lg bg-card border space-y-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {event.reputation_change > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : event.reputation_change < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              ) : (
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium">{event.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={event.reputation_change > 0 ? "default" : event.reputation_change < 0 ? "destructive" : "secondary"}>
                                {event.reputation_change > 0 ? "+" : ""}{event.reputation_change}
                              </Badge>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteEvent.mutate(event.id)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {event.event_date && (
                            <p className="text-xs text-muted-foreground pl-6">{event.event_date}</p>
                          )}
                          {event.description && (
                            <p className="text-xs text-muted-foreground pl-6">{event.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-xs font-medium">Novo Evento Histórico</Label>
                    <Input 
                      placeholder="Título do evento *" 
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                    />
                    <Input 
                      placeholder="Data no jogo (ex: Ano 1045, Inverno)" 
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                    <Textarea 
                      placeholder="Descrição (opcional)" 
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      rows={2}
                    />
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>-50</span>
                        <span className="font-medium">
                          Mudança: {eventRepChange > 0 ? "+" : ""}{eventRepChange}
                        </span>
                        <span>+50</span>
                      </div>
                      <Slider
                        value={[eventRepChange]}
                        onValueChange={([v]) => setEventRepChange(v)}
                        min={-50}
                        max={50}
                        step={5}
                      />
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={handleCreateEvent}
                      disabled={!eventTitle || createEventAndApply.isPending}
                    >
                      <Plus className="w-4 h-4 mr-1" /> 
                      Criar Evento e Aplicar a Todos ({charactersInCampaign.length})
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Facção?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A facção "{faction.name}" será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Save(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}
