import { useState } from 'react';
import { Package, Sword, Shield, ChevronDown, ChevronUp, Check, Sparkles, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardData } from '../CharacterWizard';
import { CLASSES } from '@/data/srd';
import { useHomebrew } from '@/hooks/useHomebrew';
import { Badge } from '@/components/ui/badge';
import pacotesData from '@/data/equipment/pacotes-iniciais.json';
import armasData from '@/data/equipment/armas.json';
import armadurasData from '@/data/equipment/armaduras.json';

interface EquipmentStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

type EquipmentPack = {
  id: string;
  name: string;
  description: string;
  items: { item_pt: string; quantity: number; unit?: string }[];
};

const PACKS = pacotesData.equipment_packs.packs as EquipmentPack[];

// Map class to available packs
const CLASS_PACKS: Record<string, string[]> = {
  barbaro: ['explorers_pack'],
  bardo: ['diplomats_pack', 'entertainers_pack'],
  bruxo: ['dungeoneers_pack', 'scholars_pack'],
  clerigo: ['priests_pack', 'explorers_pack'],
  druida: ['explorers_pack'],
  feiticeiro: ['dungeoneers_pack', 'explorers_pack'],
  guerreiro: ['dungeoneers_pack', 'explorers_pack'],
  ladino: ['burglars_pack', 'dungeoneers_pack', 'explorers_pack'],
  mago: ['scholars_pack', 'explorers_pack'],
  monge: ['dungeoneers_pack', 'explorers_pack'],
  paladino: ['priests_pack', 'explorers_pack'],
  patrulheiro: ['dungeoneers_pack', 'explorers_pack'],
};

// Simple weapon and armor choices based on class proficiencies
const CLASS_WEAPONS: Record<string, { primary: string[]; secondary: string[] }> = {
  barbaro: { 
    primary: ['Grande Machado', 'Alabarda', 'Montante'], 
    secondary: ['Machadinha', 'Azagaia'] 
  },
  bardo: { 
    primary: ['Rapieira', 'Espada Longa', 'Espada Curta'], 
    secondary: ['Adaga'] 
  },
  bruxo: { 
    primary: ['Espada Curta', 'Maça'], 
    secondary: ['Adaga', 'Besta Leve'] 
  },
  clerigo: { 
    primary: ['Maça', 'Martelo de Guerra'], 
    secondary: ['Besta Leve'] 
  },
  druida: { 
    primary: ['Cimitarra', 'Bordão'], 
    secondary: ['Adaga'] 
  },
  feiticeiro: { 
    primary: ['Besta Leve', 'Bordão'], 
    secondary: ['Adaga'] 
  },
  guerreiro: { 
    primary: ['Espada Longa', 'Machado de Batalha', 'Montante', 'Alabarda'], 
    secondary: ['Arco Longo', 'Besta Leve', 'Escudo'] 
  },
  ladino: { 
    primary: ['Rapieira', 'Espada Curta'], 
    secondary: ['Arco Curto', 'Adaga'] 
  },
  mago: { 
    primary: ['Bordão', 'Adaga'], 
    secondary: ['Adaga'] 
  },
  monge: { 
    primary: ['Espada Curta', 'Bordão'], 
    secondary: ['Dardo'] 
  },
  paladino: { 
    primary: ['Espada Longa', 'Machado de Batalha', 'Martelo de Guerra'], 
    secondary: ['Azagaia', 'Escudo'] 
  },
  patrulheiro: { 
    primary: ['Espada Longa', 'Espada Curta'], 
    secondary: ['Arco Longo'] 
  },
};

const CLASS_ARMOR: Record<string, string[]> = {
  barbaro: [],
  bardo: ['Couro'],
  bruxo: ['Couro'],
  clerigo: ['Cota de Malha', 'Brunea', 'Couro'],
  druida: ['Couro', 'Gibão de Peles'],
  feiticeiro: [],
  guerreiro: ['Cota de Malha', 'Brunea', 'Couro', 'Couro Batido'],
  ladino: ['Couro'],
  mago: [],
  monge: [],
  paladino: ['Cota de Malha', 'Brunea'],
  patrulheiro: ['Brunea', 'Couro'],
};

export function EquipmentStep({ data, updateData }: EquipmentStepProps) {
  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const { homebrewContent, isLoading: homebrewLoading } = useHomebrew('item');
  
  const availablePacks = CLASS_PACKS[data.class] || ['explorers_pack'];
  const filteredPacks = PACKS.filter(p => availablePacks.includes(p.id));
  
  const weapons = CLASS_WEAPONS[data.class] || { primary: [], secondary: [] };
  const armors = CLASS_ARMOR[data.class] || [];

  // Get homebrew items categorized by type
  const homebrewWeapons = homebrewContent.filter(item => {
    const itemData = item.data as any;
    return itemData?.type === 'weapon' || itemData?.tipo === 'arma';
  });
  
  const homebrewArmors = homebrewContent.filter(item => {
    const itemData = item.data as any;
    return itemData?.type === 'armor' || itemData?.tipo === 'armadura';
  });

  const handlePackSelect = (packId: string) => {
    updateData({ 
      equipmentPack: packId,
    });
  };

  const handleWeaponSelect = (weapon: string, type: 'primary' | 'secondary', isHomebrew: boolean = false) => {
    if (type === 'primary') {
      updateData({ primaryWeapon: weapon });
    } else {
      updateData({ secondaryWeapon: weapon });
    }
  };

  const handleArmorSelect = (armor: string) => {
    updateData({ armor });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Equipamento Inicial</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha o equipamento inicial para sua classe.
        </p>
      </div>

      {/* Pack Selection */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Pacote de Equipamento
        </h3>
        
        <div className="space-y-2">
          {filteredPacks.map((pack) => (
            <div 
              key={pack.id}
              className={cn(
                "glass rounded-xl border transition-all",
                data.equipmentPack === pack.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border/50'
              )}
            >
              <button
                onClick={() => handlePackSelect(pack.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      data.equipmentPack === pack.id ? 'bg-primary' : 'bg-muted'
                    }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{pack.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pack.items.length} itens
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {data.equipmentPack === pack.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPack(expandedPack === pack.id ? null : pack.id);
                      }}
                      className="p-1"
                    >
                      {expandedPack === pack.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </button>
              
              {expandedPack === pack.id && (
                <div className="px-4 pb-4 pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">{pack.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {pack.items.map((item, i) => (
                      <span 
                        key={i}
                        className="text-xs bg-muted/50 px-2 py-1 rounded"
                      >
                        {item.item_pt} {item.quantity > 1 ? `(${item.quantity}${item.unit ? ' ' + item.unit : ''})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Primary Weapon */}
      {(weapons.primary.length > 0 || homebrewWeapons.length > 0) && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Sword className="w-4 h-4 text-primary" />
            Arma Principal
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {weapons.primary.map((weapon) => (
              <button
                key={weapon}
                onClick={() => handleWeaponSelect(weapon, 'primary')}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all glass",
                  data.primaryWeapon === weapon
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{weapon}</span>
                  {data.primaryWeapon === weapon && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
            {homebrewWeapons.map((weapon) => (
              <button
                key={weapon.id}
                onClick={() => handleWeaponSelect(weapon.name, 'primary', true)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all glass",
                  data.primaryWeapon === weapon.name
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-amber-500/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gem className="w-3 h-3 text-amber-500" />
                    <span className="text-sm font-medium">{weapon.name}</span>
                  </div>
                  {data.primaryWeapon === weapon.name && (
                    <Check className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <Badge variant="outline" className="mt-1 text-[10px] border-amber-500/50 text-amber-500">
                  Homebrew
                </Badge>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Secondary Weapon */}
      {(weapons.secondary.length > 0 || homebrewWeapons.length > 0) && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Sword className="w-4 h-4 text-muted-foreground" />
            Arma Secundária
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {weapons.secondary.map((weapon) => (
              <button
                key={weapon}
                onClick={() => handleWeaponSelect(weapon, 'secondary')}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all glass",
                  data.secondaryWeapon === weapon
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{weapon}</span>
                  {data.secondaryWeapon === weapon && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
            {homebrewWeapons.map((weapon) => (
              <button
                key={`secondary-${weapon.id}`}
                onClick={() => handleWeaponSelect(weapon.name, 'secondary', true)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all glass",
                  data.secondaryWeapon === weapon.name
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-amber-500/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gem className="w-3 h-3 text-amber-500" />
                    <span className="text-sm font-medium">{weapon.name}</span>
                  </div>
                  {data.secondaryWeapon === weapon.name && (
                    <Check className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <Badge variant="outline" className="mt-1 text-[10px] border-amber-500/50 text-amber-500">
                  Homebrew
                </Badge>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Armor */}
      {(armors.length > 0 || homebrewArmors.length > 0) && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Armadura
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {armors.map((armor) => (
              <button
                key={armor}
                onClick={() => handleArmorSelect(armor)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all glass",
                  data.armor === armor
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{armor}</span>
                  {data.armor === armor && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
            {homebrewArmors.map((armor) => (
              <button
                key={armor.id}
                onClick={() => handleArmorSelect(armor.name)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all glass",
                  data.armor === armor.name
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-amber-500/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gem className="w-3 h-3 text-amber-500" />
                    <span className="text-sm font-medium">{armor.name}</span>
                  </div>
                  {data.armor === armor.name && (
                    <Check className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <Badge variant="outline" className="mt-1 text-[10px] border-amber-500/50 text-amber-500">
                  Homebrew
                </Badge>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* No armor classes message */}
      {armors.length === 0 && homebrewArmors.length === 0 && (
        <section className="bg-muted/30 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Sua classe não possui proficiência em armaduras ou prefere não usar armadura.
          </p>
        </section>
      )}
    </div>
  );
}
