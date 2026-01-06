import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MousePointer2,
  StickyNote,
  Type,
  Image,
  Link2,
  Trash2,
  Palette,
  Save,
  Undo,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = 'select' | 'sticky_note' | 'text' | 'image' | 'connection';

interface WhiteboardToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  onClear: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

const STICKY_COLORS = [
  '#fef08a', // yellow
  '#fed7aa', // orange
  '#fecaca', // red
  '#d9f99d', // lime
  '#a5f3fc', // cyan
  '#ddd6fe', // violet
  '#fbcfe8', // pink
  '#e5e5e5', // gray
];

const tools: { id: Tool; icon: React.ElementType; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Selecionar' },
  { id: 'sticky_note', icon: StickyNote, label: 'Nota Adesiva' },
  { id: 'text', icon: Type, label: 'Texto' },
  { id: 'image', icon: Image, label: 'Imagem' },
  { id: 'connection', icon: Link2, label: 'Conexão' },
];

export function WhiteboardToolbar({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  onClear,
  onSave,
  isSaving,
}: WhiteboardToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg shadow-lg">
      {/* Tools */}
      <div className="flex items-center gap-1 border-r border-border pr-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
            className={cn(
              "h-9 w-9",
              activeTool === tool.id && "bg-primary text-primary-foreground"
            )}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Color picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" title="Cor">
            <div
              className="w-5 h-5 rounded-full border-2 border-border"
              style={{ backgroundColor: activeColor }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-4 gap-1">
            {STICKY_COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110",
                  activeColor === color ? "border-primary" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-1 border-l border-border pl-2">
        {/* Save */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSave}
          disabled={isSaving}
          title="Salvar"
          className="h-9 w-9"
        >
          <Save className={cn("h-4 w-4", isSaving && "animate-pulse")} />
        </Button>

        {/* Clear */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          title="Limpar Tudo"
          className="h-9 w-9 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
