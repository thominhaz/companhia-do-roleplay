import { CampaignDB } from "@/hooks/useCampaigns";
import { Gem, Loader2, Coins, Diamond, Palette, Wand2, RefreshCw, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TreasureResult {
  coins: { cp: number; sp: number; ep: number; gp: number; pp: number };
  gems: { name: string; value_gp: number; description: string }[];
  art_objects: { name: string; value_gp: number; description: string }[];
  magic_items: { name: string; rarity: string; type: string; description: string; requires_attunement: boolean }[];
  total_value_gp: number;
}

interface GeneratorTreasureProps {
  campaign: CampaignDB;
}

const CR_OPTIONS = [
  "0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
];

const RARITY_COLORS: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  uncommon: "bg-green-500/20 text-green-400 border-green-500/30",
  rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  very_rare: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  legendary: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  very_rare: "Muito Raro",
  legendary: "Lendário",
};

export function GeneratorTreasure({ campaign }: GeneratorTreasureProps) {
  const [cr, setCr] = useState("1");
  const [treasureType, setTreasureType] = useState("hoard");
  const [partyLevel, setPartyLevel] = useState([3]);
  const [partySize, setPartySize] = useState([4]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TreasureResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-treasure", {
        body: {
          cr,
          treasure_type: treasureType,
          party_level: partyLevel[0],
          party_size: partySize[0],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as TreasureResult);
    } catch (err) {
      console.error("Treasure generation error:", err);
      toast.error("Erro ao gerar tesouro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatCoins = (coins: TreasureResult["coins"]) => {
    const parts: string[] = [];
    if (coins.pp > 0) parts.push(`${coins.pp} pl`);
    if (coins.gp > 0) parts.push(`${coins.gp} po`);
    if (coins.ep > 0) parts.push(`${coins.ep} pe`);
    if (coins.sp > 0) parts.push(`${coins.sp} pp`);
    if (coins.cp > 0) parts.push(`${coins.cp} pc`);
    return parts.length > 0 ? parts.join(", ") : "Nenhuma moeda";
  };

  const copyToClipboard = () => {
    if (!result) return;
    let text = `🪙 Moedas: ${formatCoins(result.coins)}\n`;
    if (result.gems.length > 0) {
      text += `\n💎 Gemas:\n`;
      result.gems.forEach(g => { text += `- ${g.name} (${g.value_gp} po) — ${g.description}\n`; });
    }
    if (result.art_objects.length > 0) {
      text += `\n🎨 Objetos de Arte:\n`;
      result.art_objects.forEach(a => { text += `- ${a.name} (${a.value_gp} po) — ${a.description}\n`; });
    }
    if (result.magic_items.length > 0) {
      text += `\n✨ Itens Mágicos:\n`;
      result.magic_items.forEach(m => {
        text += `- ${m.name} [${RARITY_LABELS[m.rarity] || m.rarity}] — ${m.description}${m.requires_attunement ? ' (requer sintonização)' : ''}\n`;
      });
    }
    text += `\n💰 Valor Total Estimado: ${result.total_value_gp} po`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Tesouro copiado!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gem className="w-5 h-5" />
          Gerador de Tesouros
        </h2>
        <p className="text-sm text-muted-foreground">Gere loot aleatório baseado no nível de dificuldade</p>
      </div>

      {/* Form */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nível de Desafio (CR)</Label>
            <Select value={cr} onValueChange={setCr}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CR_OPTIONS.map(c => (
                  <SelectItem key={c} value={c}>CR {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Tesouro</Label>
            <Select value={treasureType} onValueChange={setTreasureType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hoard">Tesouro (Hoard)</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nível do Grupo: {partyLevel[0]}</Label>
          <Slider value={partyLevel} onValueChange={setPartyLevel} min={1} max={20} step={1} />
        </div>

        <div className="space-y-2">
          <Label>Tamanho do Grupo: {partySize[0]}</Label>
          <Slider value={partySize} onValueChange={setPartySize} min={1} max={8} step={1} />
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando tesouro...
            </>
          ) : (
            <>
              <Gem className="w-4 h-4 mr-2" />
              Gerar Tesouro
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Regerar
            </Button>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>

          {/* Coins */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              Moedas
            </h3>
            <p className="text-sm">{formatCoins(result.coins)}</p>
          </div>

          {/* Gems */}
          {result.gems.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Diamond className="w-4 h-4 text-cyan-400" />
                Gemas ({result.gems.length})
              </h3>
              <div className="space-y-2">
                {result.gems.map((gem, i) => (
                  <div key={i} className="flex justify-between items-start gap-2 text-sm">
                    <div>
                      <span className="font-medium">{gem.name}</span>
                      <p className="text-muted-foreground text-xs">{gem.description}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{gem.value_gp} po</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Art Objects */}
          {result.art_objects.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-pink-400" />
                Objetos de Arte ({result.art_objects.length})
              </h3>
              <div className="space-y-2">
                {result.art_objects.map((art, i) => (
                  <div key={i} className="flex justify-between items-start gap-2 text-sm">
                    <div>
                      <span className="font-medium">{art.name}</span>
                      <p className="text-muted-foreground text-xs">{art.description}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{art.value_gp} po</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Magic Items */}
          {result.magic_items.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Wand2 className="w-4 h-4 text-purple-400" />
                Itens Mágicos ({result.magic_items.length})
              </h3>
              <div className="space-y-3">
                {result.magic_items.map((item, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline" className={RARITY_COLORS[item.rarity] || ""}>
                        {RARITY_LABELS[item.rarity] || item.rarity}
                      </Badge>
                      {item.requires_attunement && (
                        <Badge variant="outline" className="text-xs">Sintonização</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5">{item.type} — {item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 text-center">
            <p className="text-sm text-muted-foreground">Valor Total Estimado</p>
            <p className="text-2xl font-bold text-primary">{result.total_value_gp} po</p>
          </div>
        </div>
      )}
    </div>
  );
}
