import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shop, ShopFormData } from "@/hooks/useShops";
import { useNPCs } from "@/hooks/useNPCs";
import { Loader2, X, Store, MapPin, User } from "lucide-react";

interface ShopFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  shop?: Shop | null;
  onSubmit: (data: ShopFormData) => void;
  isLoading?: boolean;
}

const SHOP_TAGS = [
  "Armas",
  "Armaduras",
  "Poções",
  "Pergaminhos",
  "Itens Mágicos",
  "Suprimentos",
  "Comida",
  "Taverna",
  "Ferreiro",
  "Alquimia",
  "Joias",
  "Roupas",
  "Livros",
  "Animais",
  "Veículos",
];

export function ShopFormSheet({
  open,
  onOpenChange,
  campaignId,
  shop,
  onSubmit,
  isLoading,
}: ShopFormSheetProps) {
  const { npcs } = useNPCs(campaignId);
  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    description: "",
    location: "",
    npc_id: null,
    tags: [],
    is_hidden: false,
  });

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name,
        description: shop.description || "",
        location: shop.location || "",
        npc_id: shop.npc_id,
        tags: shop.tags || [],
        is_hidden: shop.is_hidden,
        image_url: shop.image_url || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        location: "",
        npc_id: null,
        tags: [],
        is_hidden: false,
      });
    }
  }, [shop, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...(prev.tags || []), tag],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            {shop ? "Editar Loja" : "Nova Loja"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Loja *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="A Espada Encantada"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Uma loja aconchegante com armas e armaduras de qualidade..."
              rows={3}
            />
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localização
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Distrito Comercial, Rua Principal"
            />
          </div>

          {/* NPC Lojista */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              NPC Lojista
            </Label>
            <Select
              value={formData.npc_id || "none"}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  npc_id: value === "none" ? null : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um NPC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {npcs.map((npc) => (
                  <SelectItem key={npc.id} value={npc.id}>
                    {npc.name}
                    {npc.title && ` - ${npc.title}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vincule um NPC existente como dono da loja
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Categorias</Label>
            <div className="flex flex-wrap gap-2">
              {SHOP_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.tags?.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {formData.tags?.includes(tag) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Visibilidade */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="text-sm font-medium">Ocultar dos jogadores</p>
              <p className="text-xs text-muted-foreground">
                Loja ficará visível apenas para o mestre
              </p>
            </div>
            <Switch
              checked={formData.is_hidden}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_hidden: checked }))
              }
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {shop ? "Salvar" : "Criar Loja"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
