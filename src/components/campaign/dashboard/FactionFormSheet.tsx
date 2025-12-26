import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save } from "lucide-react";
import { Faction } from "@/hooks/useFactions";

interface FactionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faction?: Faction | null;
  onSave: (data: Partial<Faction>) => void;
  isLoading?: boolean;
}

const ALIGNMENTS = [
  "Leal e Bom", "Neutro e Bom", "Caótico e Bom",
  "Leal e Neutro", "Neutro", "Caótico e Neutro",
  "Leal e Mau", "Neutro e Mau", "Caótico e Mau"
];

const INFLUENCE_LEVELS = [
  { value: "local", label: "Local" },
  { value: "regional", label: "Regional" },
  { value: "national", label: "Nacional" },
  { value: "continental", label: "Continental" },
  { value: "global", label: "Global" },
];

export function FactionFormSheet({ open, onOpenChange, faction, onSave, isLoading }: FactionFormSheetProps) {
  const [formData, setFormData] = useState<Partial<Faction>>({
    name: "",
    description: "",
    alignment: "",
    influence_level: "local",
    headquarters: "",
    goals: "",
    secrets: "",
    is_hidden: false,
    show_reputation_to_players: false,
    tags: [],
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (faction) {
      setFormData({
        name: faction.name,
        description: faction.description || "",
        alignment: faction.alignment || "",
        influence_level: faction.influence_level || "local",
        headquarters: faction.headquarters || "",
        goals: faction.goals || "",
        secrets: faction.secrets || "",
        is_hidden: faction.is_hidden,
        show_reputation_to_players: faction.show_reputation_to_players ?? false,
        tags: faction.tags || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        alignment: "",
        influence_level: "local",
        headquarters: "",
        goals: "",
        secrets: "",
        is_hidden: false,
        show_reputation_to_players: false,
        tags: [],
      });
    }
  }, [faction, open]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tag)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{faction ? "Editar Facção" : "Nova Facção"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome da facção"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição da facção..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <Select
                value={formData.alignment || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, alignment: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {ALIGNMENTS.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Influência</Label>
              <Select
                value={formData.influence_level || "local"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, influence_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INFLUENCE_LEVELS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headquarters">Sede</Label>
            <Input
              id="headquarters"
              value={formData.headquarters || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, headquarters: e.target.value }))}
              placeholder="Localização da sede"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Objetivos</Label>
            <Textarea
              id="goals"
              value={formData.goals || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
              placeholder="Quais são os objetivos desta facção?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secrets">Segredos (apenas mestre)</Label>
            <Textarea
              id="secrets"
              value={formData.secrets || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, secrets: e.target.value }))}
              placeholder="Segredos ocultos da facção..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Adicionar tag"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" size="icon" variant="outline" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="is_hidden">Ocultar dos jogadores</Label>
              <p className="text-xs text-muted-foreground">Jogadores não verão esta facção</p>
            </div>
            <Switch
              id="is_hidden"
              checked={formData.is_hidden}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_hidden: checked }))}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="show_rep">Mostrar reputação</Label>
              <p className="text-xs text-muted-foreground">Jogadores verão sua reputação na ficha</p>
            </div>
            <Switch
              id="show_rep"
              checked={formData.show_reputation_to_players}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_reputation_to_players: checked }))}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !formData.name?.trim()}>
            <Save className="w-4 h-4 mr-2" />
            {faction ? "Salvar Alterações" : "Criar Facção"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
