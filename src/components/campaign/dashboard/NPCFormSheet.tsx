import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useCreateNPC, useUpdateNPC, CampaignNPC, CreateNPCData } from "@/hooks/useNPCs";
import { Loader2, Save, UserSquare2, X } from "lucide-react";

interface NPCFormSheetProps {
  campaignId: string;
  npc?: CampaignNPC | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NPCFormSheet({ campaignId, npc, open, onOpenChange }: NPCFormSheetProps) {
  const isEditing = !!npc;
  const createNPC = useCreateNPC();
  const updateNPC = useUpdateNPC();

  const [formData, setFormData] = useState<Partial<CreateNPCData>>({
    name: '',
    title: '',
    occupation: '',
    location: '',
    appearance: '',
    personality: '',
    motivations: '',
    secrets: '',
    notes: '',
    status: 'alive',
    is_hidden: false,
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (npc) {
      setFormData({
        name: npc.name,
        title: npc.title || '',
        occupation: npc.occupation || '',
        location: npc.location || '',
        appearance: npc.appearance || '',
        personality: npc.personality || '',
        motivations: npc.motivations || '',
        secrets: npc.secrets || '',
        notes: npc.notes || '',
        status: npc.status,
        is_hidden: npc.is_hidden,
        tags: npc.tags || [],
      });
    } else {
      setFormData({
        name: '',
        title: '',
        occupation: '',
        location: '',
        appearance: '',
        personality: '',
        motivations: '',
        secrets: '',
        notes: '',
        status: 'alive',
        is_hidden: false,
        tags: [],
      });
    }
    setTagInput('');
  }, [npc, open]);

  const handleSubmit = async () => {
    if (!formData.name?.trim()) return;

    try {
      if (isEditing && npc) {
        await updateNPC.mutateAsync({
          id: npc.id,
          ...formData,
        });
      } else {
        await createNPC.mutateAsync({
          campaign_id: campaignId,
          name: formData.name,
          title: formData.title || undefined,
          occupation: formData.occupation || undefined,
          location: formData.location || undefined,
          appearance: formData.appearance || undefined,
          personality: formData.personality || undefined,
          motivations: formData.motivations || undefined,
          secrets: formData.secrets || undefined,
          notes: formData.notes || undefined,
          status: formData.status,
          is_hidden: formData.is_hidden,
          tags: formData.tags,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove) || []
    }));
  };

  const isLoading = createNPC.isPending || updateNPC.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <UserSquare2 className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar NPC' : 'Novo NPC'}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-10rem)] py-4">
          <div className="space-y-6 pr-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Nome do NPC"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título/Epíteto</Label>
                <Input
                  id="title"
                  placeholder='Ex: "O Sábio", "Capitão"'
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">Ocupação</Label>
                <Input
                  id="occupation"
                  placeholder="Ex: Ferreiro, Comerciante, Guarda"
                  value={formData.occupation}
                  onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  placeholder="Ex: Taverna do Porto, Castelo"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            {/* Status & Visibility */}
            <div className="flex gap-4 items-center">
              <div className="flex-1 space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alive">Vivo</SelectItem>
                    <SelectItem value="dead">Morto</SelectItem>
                    <SelectItem value="unknown">Desconhecido</SelectItem>
                    <SelectItem value="missing">Desaparecido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="is_hidden"
                  checked={formData.is_hidden}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_hidden: checked }))}
                />
                <Label htmlFor="is_hidden" className="text-sm">
                  Ocultar dos jogadores
                </Label>
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-2">
              <Label htmlFor="appearance">Aparência</Label>
              <Textarea
                id="appearance"
                placeholder="Descreva a aparência física do NPC..."
                value={formData.appearance}
                onChange={(e) => setFormData(prev => ({ ...prev, appearance: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Personality */}
            <div className="space-y-2">
              <Label htmlFor="personality">Personalidade</Label>
              <Textarea
                id="personality"
                placeholder="Traços de personalidade, maneirismos, forma de falar..."
                value={formData.personality}
                onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Motivations */}
            <div className="space-y-2">
              <Label htmlFor="motivations">Motivações</Label>
              <Textarea
                id="motivations"
                placeholder="O que motiva este NPC? Quais são seus objetivos?"
                value={formData.motivations}
                onChange={(e) => setFormData(prev => ({ ...prev, motivations: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Secrets */}
            <div className="space-y-2">
              <Label htmlFor="secrets">Segredos</Label>
              <Textarea
                id="secrets"
                placeholder="Segredos que o NPC esconde (apenas o mestre vê)..."
                value={formData.secrets}
                onChange={(e) => setFormData(prev => ({ ...prev, secrets: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas do Mestre</Label>
              <Textarea
                id="notes"
                placeholder="Anotações adicionais, ideias para o NPC..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Adicionar
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1"
                    >
                      {tag}
                      <button 
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name?.trim() || isLoading}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditing ? 'Salvar' : 'Criar NPC'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
