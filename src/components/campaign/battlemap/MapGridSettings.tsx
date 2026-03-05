import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";

interface Props {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  onClose: () => void;
  onChange: (gridWidth: number, gridHeight: number, cellSize: number) => void;
}

export function MapGridSettings({ gridWidth, gridHeight, cellSize, onClose, onChange }: Props) {
  const [w, setW] = useState(gridWidth);
  const [h, setH] = useState(gridHeight);
  const [cs, setCs] = useState(cellSize);

  const handleApply = () => {
    onChange(
      Math.max(5, Math.min(50, w)),
      Math.max(5, Math.min(50, h)),
      Math.max(20, Math.min(80, cs))
    );
    onClose();
  };

  return (
    <div className="absolute top-3 right-3 z-20 w-56 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-3 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Configurar Grid</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="w-6 h-6">
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px]">Largura</Label>
          <Input
            type="number" min={5} max={50}
            value={w} onChange={e => setW(Number(e.target.value))}
            className="h-7 text-xs bg-muted/50 border-0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Altura</Label>
          <Input
            type="number" min={5} max={50}
            value={h} onChange={e => setH(Number(e.target.value))}
            className="h-7 text-xs bg-muted/50 border-0"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px]">Tamanho da célula (px)</Label>
        <Input
          type="number" min={20} max={80}
          value={cs} onChange={e => setCs(Number(e.target.value))}
          className="h-7 text-xs bg-muted/50 border-0"
        />
      </div>

      <div className="text-[10px] text-muted-foreground">
        {w}×{h} = {w * h} quadrados
      </div>

      <Button size="sm" onClick={handleApply} className="w-full h-7 text-xs gap-1">
        <Check className="w-3 h-3" /> Aplicar
      </Button>
    </div>
  );
}
