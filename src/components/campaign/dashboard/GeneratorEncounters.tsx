import { CampaignDB } from "@/hooks/useCampaigns";
import { Sparkles, Loader2, Swords, Shield, Heart, RefreshCw, Copy, Check, MapPin, BookOpen, Lightbulb, Target } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MonsterEntry {
  name: string;
  cr: string;
  xp: number;
  quantity: number;
  hp: string;
  ac: number;
  key_abilities: string[];
  tactics: string;
}

interface EncounterResult {
  encounter_name: string;
  difficulty: string;
  xp_threshold: { easy: number; medium: number; hard: number; deadly: number };
  total_xp: number;
  adjusted_xp: number;
  monsters: MonsterEntry[];
  environment_suggestions: string;
  narrative_hook: string;
  tips: string;
}

interface GeneratorEncountersProps {
  campaign: CampaignDB;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-secondary/20 text-secondary border-secondary/30",
  medium: "bg-gold/20 text-gold border-gold/30",
  hard: "bg-primary/20 text-primary border-primary/30",
  deadly: "bg-destructive/20 text-destructive border-destructive/30",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  deadly: "Mortal",
};

const TERRAIN_OPTIONS = [
  { value: "", label: "Qualquer" },
  { value: "dungeon", label: "Masmorra" },
  { value: "forest", label: "Floresta" },
  { value: "mountain", label: "Montanha" },
  { value: "swamp", label: "Pântano" },
  { value: "desert", label: "Deserto" },
  { value: "urban", label: "Urbano" },
  { value: "underwater", label: "Subaquático" },
  { value: "underdark", label: "Subterrâneo" },
  { value: "arctic", label: "Ártico" },
  { value: "coast", label: "Costa" },
  { value: "grassland", label: "Planície" },
  { value: "hill", label: "Colinas" },
];

export function GeneratorEncounters({ campaign }: GeneratorEncountersProps) {
  const [partyLevel, setPartyLevel] = useState([3]);
  const [partySize, setPartySize] = useState([4]);
  const [difficulty, setDifficulty] = useState("medium");
  const [terrain, setTerrain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EncounterResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-encounter", {
        body: {
          party_level: partyLevel[0],
          party_size: partySize[0],
          difficulty,
          terrain: terrain || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as EncounterResult);
    } catch (err) {
      console.error("Encounter generation error:", err);
      toast.error("Erro ao gerar encontro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    let text = `⚔️ ${result.encounter_name}\n`;
    text += `Dificuldade: ${DIFFICULTY_LABELS[result.difficulty] || result.difficulty}\n`;
    text += `XP Total: ${result.total_xp} (Ajustado: ${result.adjusted_xp})\n\n`;
    text += `🐉 Monstros:\n`;
    result.monsters.forEach(m => {
      text += `- ${m.quantity}x ${m.name} (CR ${m.cr}, CA ${m.ac}, PV ${m.hp}, XP ${m.xp})\n`;
      text += `  Habilidades: ${m.key_abilities.join(", ")}\n`;
      text += `  Táticas: ${m.tactics}\n`;
    });
    text += `\n🗺️ Ambiente: ${result.environment_suggestions}`;
    text += `\n📖 Gancho: ${result.narrative_hook}`;
    text += `\n💡 Dicas: ${result.tips}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Encontro copiado!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Gerador de Encontros
        </h2>
        <p className="text-sm text-muted-foreground">Crie combates balanceados automaticamente</p>
      </div>

      {/* Form */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Dificuldade</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Fácil</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="hard">Difícil</SelectItem>
                <SelectItem value="deadly">Mortal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Terreno</Label>
            <Select value={terrain} onValueChange={setTerrain}>
              <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
              <SelectContent>
                {TERRAIN_OPTIONS.map(t => (
                  <SelectItem key={t.value || "any"} value={t.value || "any"}>{t.label}</SelectItem>
                ))}
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
              Gerando encontro...
            </>
          ) : (
            <>
              <Swords className="w-4 h-4 mr-2" />
              Gerar Encontro
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">{result.encounter_name}</h3>
              <Badge variant="outline" className={DIFFICULTY_COLORS[result.difficulty] || ""}>
                {DIFFICULTY_LABELS[result.difficulty] || result.difficulty}
              </Badge>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>XP: {result.total_xp}</span>
              <span>XP Ajustado: {result.adjusted_xp}</span>
            </div>
            {/* XP Threshold Bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fácil ({result.xp_threshold.easy})</span>
                <span>Médio ({result.xp_threshold.medium})</span>
                <span>Difícil ({result.xp_threshold.hard})</span>
                <span>Mortal ({result.xp_threshold.deadly})</span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (result.adjusted_xp / result.xp_threshold.deadly) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

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

          {/* Monsters */}
          <div className="space-y-3">
            {result.monsters.map((monster, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{monster.quantity > 1 ? `${monster.quantity}x ` : ""}{monster.name}</span>
                    <Badge variant="secondary">CR {monster.cr}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{monster.xp} XP</span>
                </div>
                <div className="flex gap-4 text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                    CA {monster.ac}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                    PV {monster.hp}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {monster.key_abilities.map((ability, j) => (
                    <Badge key={j} variant="outline" className="text-xs">{ability}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Target className="w-3 h-3 mt-0.5 shrink-0" />
                  {monster.tactics}
                </p>
              </div>
            ))}
          </div>

          {/* Info Cards */}
          <div className="grid gap-3">
            <div className="bg-card rounded-2xl p-3 border border-border">
              <p className="text-sm flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <span><strong>Ambiente:</strong> {result.environment_suggestions}</span>
              </p>
            </div>
            <div className="bg-card rounded-2xl p-3 border border-border">
              <p className="text-sm flex items-start gap-2">
                <BookOpen className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <span><strong>Gancho:</strong> {result.narrative_hook}</span>
              </p>
            </div>
            <div className="bg-card rounded-2xl p-3 border border-border">
              <p className="text-sm flex items-start gap-2">
                <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <span><strong>Dicas:</strong> {result.tips}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
