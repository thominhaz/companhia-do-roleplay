import { CampaignDB } from "@/hooks/useCampaigns";
import { Gem, Loader2, Coins, Diamond, Palette, Wand2, RefreshCw, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";
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

function coinValueInGold(coins: TreasureResult["coins"]): number {
  return (
    (coins.cp || 0) / 100 +
    (coins.sp || 0) / 10 +
    (coins.ep || 0) / 2 +
    (coins.gp || 0) +
    (coins.pp || 0) * 10
  );
}

export function GeneratorTreasure({ campaign }: GeneratorTreasureProps) {
  const [cr, setCr] = useState("1");
  const [treasureType, setTreasureType] = useState("hoard");
  const [partyLevel, setPartyLevel] = useState([3]);
  const [partySize, setPartySize] = useState([4]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TreasureResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // Auto-calculated values
  const calculatedValues = useMemo(() => {
    if (!result) return null;
    const coinsGp = coinValueInGold(result.coins);
    const gemsGp = result.gems.reduce((sum, g) => sum + (g.value_gp || 0), 0);
    const artGp = result.art_objects.reduce((sum, a) => sum + (a.value_gp || 0), 0);
    const totalGp = Math.round(coinsGp + gemsGp + artGp);
    const perPlayer = partySize[0] > 0 ? Math.round(totalGp / partySize[0]) : totalGp;
    return { coinsGp: Math.round(coinsGp), gemsGp, artGp, totalGp, perPlayer };
  }, [result, partySize]);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-treasure", {
        body: { cr, treasure_type: treasureType, party_level: partyLevel[0], party_size: partySize[0] },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as TreasureResult);
      setShowForm(false);
    } catch (err) {
      console.error("Treasure generation error:", err);
      toast.error("Erro ao gerar tesouro. Verifique o endpoint da Digital Ocean.");
    } finally {
      setLoading(false);
    }
  };

  const formatCoinLine = (label: string, abbr: string, amount: number) => {
    if (amount <= 0) return null;
    return { label, abbr, amount };
  };

  const coinLines = result ? [
    formatCoinLine("Platina", "pl", result.coins.pp),
    formatCoinLine("Ouro", "po", result.coins.gp),
    formatCoinLine("Electrum", "pe", result.coins.ep),
    formatCoinLine("Prata", "pp", result.coins.sp),
    formatCoinLine("Cobre", "pc", result.coins.cp),
  ].filter(Boolean) as { label: string; abbr: string; amount: number }[] : [];

  const copyToClipboard = () => {
    if (!result || !calculatedValues) return;
    let text = `🪙 Moedas (${calculatedValues.coinsGp} po equiv.):\n`;
    coinLines.forEach(c => { text += `  ${c.amount} ${c.abbr}\n`; });
    if (result.gems.length > 0) {
      text += `\n💎 Gemas (${calculatedValues.gemsGp} po):\n`;
      result.gems.forEach(g => { text += `- ${g.name} — ${g.value_gp} po — ${g.description}\n`; });
    }
    if (result.art_objects.length > 0) {
      text += `\n🎨 Objetos de Arte (${calculatedValues.artGp} po):\n`;
      result.art_objects.forEach(a => { text += `- ${a.name} — ${a.value_gp} po — ${a.description}\n`; });
    }
    if (result.magic_items.length > 0) {
      text += `\n✨ Itens Mágicos:\n`;
      result.magic_items.forEach(m => {
        text += `- ${m.name} [${RARITY_LABELS[m.rarity] || m.rarity}] — ${m.description}${m.requires_attunement ? ' (sintonização)' : ''}\n`;
      });
    }
    text += `\n💰 Total: ${calculatedValues.totalGp} po (~${calculatedValues.perPlayer} po/jogador)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Tesouro copiado!");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gem className="w-5 h-5" />
          Gerador de Tesouros
        </h2>
        <p className="text-sm text-muted-foreground">Gere loot baseado no CR e tipo de encontro</p>
      </div>

      {/* Collapsible Form */}
      {result && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showForm ? "Ocultar parâmetros" : "Alterar parâmetros"}
        </button>
      )}

      {showForm && (
        <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">CR</Label>
              <Select value={cr} onValueChange={setCr}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CR_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={treasureType} onValueChange={setTreasureType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoard">Tesouro</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nível: {partyLevel[0]}</Label>
              <Slider value={partyLevel} onValueChange={setPartyLevel} min={1} max={20} step={1} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Jogadores: {partySize[0]}</Label>
              <Slider value={partySize} onValueChange={setPartySize} min={1} max={8} step={1} />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full" size="sm">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
            ) : (
              <><Gem className="w-4 h-4 mr-2" />Gerar Tesouro</>
            )}
          </Button>
        </div>
      )}

      {/* Results */}
      {result && calculatedValues && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Summary Bar */}
          <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Valor Total</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleGenerate} disabled={loading}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <p className="text-2xl font-bold text-primary">{calculatedValues.totalGp} po</p>
            <p className="text-xs text-muted-foreground">
              ~{calculatedValues.perPlayer} po por jogador · Moedas {calculatedValues.coinsGp} po
              {calculatedValues.gemsGp > 0 && ` · Gemas ${calculatedValues.gemsGp} po`}
              {calculatedValues.artGp > 0 && ` · Arte ${calculatedValues.artGp} po`}
            </p>
          </div>

          {/* Coins */}
          {coinLines.length > 0 && (
            <div className="bg-card rounded-2xl p-3 border border-border">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                Moedas
              </h3>
              <div className="flex flex-wrap gap-2">
                {coinLines.map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {c.amount.toLocaleString("pt-BR")} {c.abbr}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Gems */}
          {result.gems.length > 0 && (
            <div className="bg-card rounded-2xl p-3 border border-border">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <Diamond className="w-4 h-4 text-cyan-400" />
                Gemas · {calculatedValues.gemsGp} po
              </h3>
              <div className="space-y-1.5">
                {result.gems.map((gem, i) => (
                  <div key={i} className="flex justify-between items-start gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-medium">{gem.name}</span>
                      <span className="text-muted-foreground ml-1">— {gem.description}</span>
                    </div>
                    <span className="shrink-0 text-muted-foreground">{gem.value_gp} po</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Art Objects */}
          {result.art_objects.length > 0 && (
            <div className="bg-card rounded-2xl p-3 border border-border">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <Palette className="w-4 h-4 text-pink-400" />
                Objetos de Arte · {calculatedValues.artGp} po
              </h3>
              <div className="space-y-1.5">
                {result.art_objects.map((art, i) => (
                  <div key={i} className="flex justify-between items-start gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-medium">{art.name}</span>
                      <span className="text-muted-foreground ml-1">— {art.description}</span>
                    </div>
                    <span className="shrink-0 text-muted-foreground">{art.value_gp} po</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Magic Items */}
          {result.magic_items.length > 0 && (
            <div className="bg-card rounded-2xl p-3 border border-border">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                Itens Mágicos
              </h3>
              <div className="space-y-2">
                {result.magic_items.map((item, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${RARITY_COLORS[item.rarity] || ""}`}>
                        {RARITY_LABELS[item.rarity] || item.rarity}
                      </Badge>
                      {item.requires_attunement && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Sint.</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5">{item.type} — {item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
