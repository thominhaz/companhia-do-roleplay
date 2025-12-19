import { useState, useEffect } from "react";
import { Edit3, Heart, Shield, Zap, Footprints, Save } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateCharacter, CharacterDB } from "@/hooks/useCharacters";
import { getAttributeAbbr } from "@/data/srd";

interface EditStatsSheetProps {
  character: CharacterDB;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ATTRIBUTES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

export function EditStatsSheet({ character, open, onOpenChange }: EditStatsSheetProps) {
  const updateCharacter = useUpdateCharacter();
  const [formData, setFormData] = useState({
    current_hp: character.current_hp,
    max_hp: character.max_hp,
    temporary_hp: character.temporary_hp,
    armor_class: character.armor_class,
    speed: character.speed,
    experience: character.experience,
    attributes: { ...(character.attributes as Record<string, number>) },
  });

  useEffect(() => {
    setFormData({
      current_hp: character.current_hp,
      max_hp: character.max_hp,
      temporary_hp: character.temporary_hp,
      armor_class: character.armor_class,
      speed: character.speed,
      experience: character.experience,
      attributes: { ...(character.attributes as Record<string, number>) },
    });
  }, [character]);

  const handleAttributeChange = (attr: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attr]: Math.min(30, Math.max(1, numValue)),
      },
    }));
  };

  const handleNumberChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, numValue),
    }));
  };

  const handleSave = async () => {
    // Recalculate initiative based on new dexterity
    const newDexMod = Math.floor((formData.attributes.dexterity - 10) / 2);
    
    await updateCharacter.mutateAsync({
      id: character.id,
      current_hp: Math.min(formData.current_hp, formData.max_hp),
      max_hp: formData.max_hp,
      temporary_hp: formData.temporary_hp,
      armor_class: formData.armor_class,
      speed: formData.speed,
      experience: formData.experience,
      initiative: newDexMod,
      attributes: formData.attributes as any,
    });

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] bg-darker">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Editar Estatísticas
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full py-4">
          <div className="space-y-6">
            {/* Combat Stats */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-4">Estatísticas de Combate</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    HP Atual
                  </Label>
                  <Input
                    type="number"
                    value={formData.current_hp}
                    onChange={(e) => handleNumberChange('current_hp', e.target.value)}
                    min={0}
                    max={formData.max_hp}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-green-500" />
                    HP Máximo
                  </Label>
                  <Input
                    type="number"
                    value={formData.max_hp}
                    onChange={(e) => handleNumberChange('max_hp', e.target.value)}
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-blue-500" />
                    HP Temporário
                  </Label>
                  <Input
                    type="number"
                    value={formData.temporary_hp}
                    onChange={(e) => handleNumberChange('temporary_hp', e.target.value)}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-500" />
                    Classe de Armadura
                  </Label>
                  <Input
                    type="number"
                    value={formData.armor_class}
                    onChange={(e) => handleNumberChange('armor_class', e.target.value)}
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-orange-500" />
                    Deslocamento (m)
                  </Label>
                  <Input
                    type="number"
                    value={formData.speed}
                    onChange={(e) => handleNumberChange('speed', e.target.value)}
                    min={0}
                    step={1.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Experiência (XP)
                  </Label>
                  <Input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => handleNumberChange('experience', e.target.value)}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-4">Atributos</h3>
              
              <div className="grid grid-cols-3 gap-3">
                {ATTRIBUTES.map((attr) => (
                  <div key={attr} className="space-y-2">
                    <Label className="text-xs text-center block uppercase">
                      {getAttributeAbbr(attr)}
                    </Label>
                    <Input
                      type="number"
                      value={formData.attributes[attr] || 10}
                      onChange={(e) => handleAttributeChange(attr, e.target.value)}
                      min={1}
                      max={30}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSave}
              disabled={updateCharacter.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateCharacter.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}