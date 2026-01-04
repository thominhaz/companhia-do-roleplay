import { useState } from "react";
import { CampaignDB, useUpdateCampaign } from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  Palette, 
  Wand2, 
  Skull, 
  Swords, 
  Shield, 
  BookOpen, 
  Crown, 
  Castle, 
  Scroll, 
  Flame,
  Check,
  Sparkles
} from "lucide-react";

interface CampaignAppearanceSettingsProps {
  campaign: CampaignDB;
}

const THEME_COLORS = [
  { id: 'auto', label: 'Automático', description: 'Baseado no status', gradient: 'from-gray-600 to-gray-800', preview: 'bg-gradient-to-br from-gray-600 to-gray-800' },
  { id: 'emerald', label: 'Esmeralda', description: 'Verde floresta', gradient: 'from-emerald-900 to-emerald-700', preview: 'bg-gradient-to-br from-emerald-600 to-emerald-800' },
  { id: 'orange', label: 'Âmbar', description: 'Laranja fogo', gradient: 'from-orange-900 to-red-700', preview: 'bg-gradient-to-br from-orange-500 to-red-600' },
  { id: 'blue', label: 'Safira', description: 'Azul oceano', gradient: 'from-blue-900 to-blue-700', preview: 'bg-gradient-to-br from-blue-500 to-blue-700' },
  { id: 'purple', label: 'Ametista', description: 'Roxo místico', gradient: 'from-purple-900 to-purple-700', preview: 'bg-gradient-to-br from-purple-500 to-purple-700' },
  { id: 'red', label: 'Rubi', description: 'Vermelho sangue', gradient: 'from-red-900 to-red-700', preview: 'bg-gradient-to-br from-red-500 to-red-700' },
  { id: 'amber', label: 'Ouro', description: 'Dourado real', gradient: 'from-amber-800 to-yellow-700', preview: 'bg-gradient-to-br from-amber-500 to-yellow-600' },
  { id: 'teal', label: 'Jade', description: 'Verde-azulado', gradient: 'from-teal-900 to-teal-700', preview: 'bg-gradient-to-br from-teal-500 to-teal-700' },
  { id: 'rose', label: 'Rosa', description: 'Rosa encantado', gradient: 'from-rose-900 to-pink-700', preview: 'bg-gradient-to-br from-rose-500 to-pink-600' },
];

const CAMPAIGN_ICONS = [
  { id: 'wand', label: 'Varinha', Icon: Wand2 },
  { id: 'skull', label: 'Caveira', Icon: Skull },
  { id: 'swords', label: 'Espadas', Icon: Swords },
  { id: 'shield', label: 'Escudo', Icon: Shield },
  { id: 'book', label: 'Livro', Icon: BookOpen },
  { id: 'crown', label: 'Coroa', Icon: Crown },
  { id: 'castle', label: 'Castelo', Icon: Castle },
  { id: 'scroll', label: 'Pergaminho', Icon: Scroll },
  { id: 'fire', label: 'Fogo', Icon: Flame },
  { id: 'sparkles', label: 'Magia', Icon: Sparkles },
];

export function CampaignAppearanceSettings({ campaign }: CampaignAppearanceSettingsProps) {
  const [selectedColor, setSelectedColor] = useState(campaign.theme_color || 'auto');
  const [selectedIcon, setSelectedIcon] = useState(campaign.icon || 'wand');
  const updateCampaign = useUpdateCampaign();

  const handleSave = () => {
    updateCampaign.mutate({
      id: campaign.id,
      theme_color: selectedColor,
      icon: selectedIcon,
    });
  };

  const hasChanges = selectedColor !== (campaign.theme_color || 'auto') || 
                     selectedIcon !== (campaign.icon || 'wand');

  const SelectedIconComponent = CAMPAIGN_ICONS.find(i => i.id === selectedIcon)?.Icon || Wand2;
  const selectedTheme = THEME_COLORS.find(c => c.id === selectedColor) || THEME_COLORS[0];

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <Label className="text-sm text-muted-foreground mb-3 block">Prévia</Label>
        <div className={cn(
          "rounded-xl p-4 bg-gradient-to-br",
          selectedTheme.gradient
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              selectedColor === 'auto' ? 'bg-gray-500' :
              selectedColor === 'emerald' ? 'bg-emerald-500' :
              selectedColor === 'orange' ? 'bg-orange-500' :
              selectedColor === 'blue' ? 'bg-blue-500' :
              selectedColor === 'purple' ? 'bg-purple-500' :
              selectedColor === 'red' ? 'bg-red-500' :
              selectedColor === 'amber' ? 'bg-amber-500' :
              selectedColor === 'teal' ? 'bg-teal-500' :
              selectedColor === 'rose' ? 'bg-rose-500' : 'bg-gray-500'
            )}>
              <SelectedIconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white">{campaign.name}</h4>
              <p className="text-sm text-white/70">D&D 5e • Prévia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Color Selection */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <Label>Cor do Tema</Label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {THEME_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color.id)}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all text-left",
                selectedColor === color.id 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <div className={cn("w-full h-6 rounded mb-2", color.preview)} />
              <p className="text-xs font-medium">{color.label}</p>
              <p className="text-[10px] text-muted-foreground">{color.description}</p>
              {selectedColor === color.id && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Icon Selection */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-4 h-4 text-muted-foreground" />
          <Label>Ícone da Campanha</Label>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {CAMPAIGN_ICONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedIcon(id)}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                selectedIcon === id 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                selectedIcon === id ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={updateCampaign.isPending}
        >
          {updateCampaign.isPending ? "Salvando..." : "Salvar Aparência"}
        </Button>
      )}
    </div>
  );
}