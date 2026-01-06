import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MousePointer2,
  StickyNote,
  Type,
  Image,
  Link2,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";

type Tool = 'select' | 'sticky_note' | 'text' | 'image' | 'connection';

interface WhiteboardToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  onClear: () => void;
  onSave: () => void;
  onImageUpload: (file: File) => void;
  isSaving?: boolean;
  isUploading?: boolean;
  connectionMode?: 'idle' | 'selecting_from' | 'selecting_to';
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
  onImageUpload,
  isSaving,
  isUploading,
  connectionMode = 'idle',
}: WhiteboardToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (tool: Tool) => {
    if (tool === 'image') {
      fileInputRef.current?.click();
    } else {
      onToolChange(tool);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg shadow-lg">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Tools */}
      <div className="flex items-center gap-1 border-r border-border pr-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleToolClick(tool.id)}
            title={tool.label}
            disabled={tool.id === 'image' && isUploading}
            className={cn(
              "h-9 w-9",
              activeTool === tool.id && "bg-primary text-primary-foreground",
              tool.id === 'connection' && connectionMode !== 'idle' && "ring-2 ring-primary animate-pulse"
            )}
          >
            {tool.id === 'image' && isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <tool.icon className="h-4 w-4" />
            )}
          </Button>
        ))}
      </div>

      {/* Connection mode indicator */}
      {connectionMode !== 'idle' && (
        <div className="text-xs text-muted-foreground px-2 border-r border-border">
          {connectionMode === 'selecting_from' ? 'Selecione origem' : 'Selecione destino'}
        </div>
      )}

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
