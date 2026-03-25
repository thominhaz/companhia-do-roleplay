import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  FileJson,
  Sparkles,
  Gem,
  Skull,
  Sword,
  Shield,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parse5eToolsJSON, getTypeLabel, getTypeIcon, ImportedItem, ImportResult } from "@/lib/fiveEToolsImporter";
import { useHomebrew } from "@/hooks/useHomebrew";
import { toast } from "sonner";
import type { HomebrewContentType } from "@/types";

interface Import5eToolsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIconMap: Record<string, any> = {
  spell: Sparkles,
  item: Gem,
  monster: Skull,
  class: Sword,
  subclass: Shield,
};

export function Import5eToolsSheet({ open, onOpenChange }: Import5eToolsSheetProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [parseResult, setParseResult] = useState<ImportResult | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const { createHomebrew, isCreating } = useHomebrew();

  const handleParse = useCallback(() => {
    if (!jsonInput.trim()) {
      toast.error("Cole o JSON do 5e.tools primeiro");
      return;
    }
    const result = parse5eToolsJSON(jsonInput);
    setParseResult(result);
    // Select all by default
    setSelectedIndices(new Set(result.items.map((_, i) => i)));
    setImportedCount(0);
  }, [jsonInput]);

  const toggleItem = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (!parseResult) return;
    if (selectedIndices.size === parseResult.items.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parseResult.items.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (!parseResult) return;
    const items = parseResult.items.filter((_, i) => selectedIndices.has(i));
    if (items.length === 0) {
      toast.error("Selecione pelo menos um item para importar");
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        await new Promise<void>((resolve, reject) => {
          createHomebrew(
            {
              type: item.type,
              name: item.name,
              description: item.description,
              icon: item.icon,
              data: item.data,
            },
            {
              onSuccess: () => { successCount++; resolve(); },
              onError: (err) => { errorCount++; resolve(); },
            }
          );
        });
      } catch {
        errorCount++;
      }
    }

    setImporting(false);
    setImportedCount(successCount);

    if (errorCount > 0) {
      toast.warning(`${successCount} importados, ${errorCount} falharam`);
    } else {
      toast.success(`${successCount} conteúdo(s) importado(s) com sucesso!`);
    }
  };

  const handleReset = () => {
    setJsonInput("");
    setParseResult(null);
    setSelectedIndices(new Set());
    setImportedCount(0);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            Importar do 5e.tools
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 pt-2">
          {/* Step 1: Paste JSON */}
          {!parseResult && (
            <div className="flex-1 flex flex-col gap-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Cole o JSON do 5e.tools abaixo. Aceita os formatos: <code className="text-xs bg-muted px-1 py-0.5 rounded">spell</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">item</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">monster</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">class</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">subclass</code>.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  No 5e.tools, use o botão "Copy JSON" ou exporte via Homebrew Builder.
                </p>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"spell": [{"name": "Fireball", ...}]}'
                className="flex-1 min-h-[200px] w-full rounded-xl border border-border/50 bg-surface-1 p-4 text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <Button 
                onClick={handleParse} 
                disabled={!jsonInput.trim()} 
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                Analisar JSON
              </Button>
            </div>
          )}

          {/* Step 2: Review parsed items */}
          {parseResult && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
                  {parseResult.errors.map((err, i) => (
                    <p key={i} className="text-sm text-destructive flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 space-y-1">
                  {parseResult.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Success summary */}
              {parseResult.items.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">
                        {parseResult.items.length} item(ns) encontrado(s)
                      </span>
                      {importedCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {importedCount} importado(s)
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={toggleAll}>
                        {selectedIndices.size === parseResult.items.length ? 'Desmarcar tudo' : 'Selecionar tudo'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleReset}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Type summary badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(parseResult.items.map(i => i.type))).map(type => {
                      const count = parseResult.items.filter(i => i.type === type).length;
                      return (
                        <Badge key={type} variant="outline" className="gap-1 text-xs">
                          <span>{getTypeIcon(type)}</span>
                          {count} {getTypeLabel(type)}{count > 1 ? 's' : ''}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Items list */}
                  <ScrollArea className="flex-1">
                    <div className="space-y-1.5 pr-3">
                      {parseResult.items.map((item, index) => {
                        const Icon = typeIconMap[item.type] || Sparkles;
                        const isSelected = selectedIndices.has(index);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleItem(index)}
                            className={cn(
                              "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                              isSelected
                                ? "bg-primary/5 border-primary/30"
                                : "bg-surface-1 border-border/30 opacity-50"
                            )}
                          >
                            <Checkbox checked={isSelected} className="pointer-events-none" />
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected ? "bg-primary/10" : "bg-muted"
                            )}>
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {getTypeLabel(item.type)}
                                {item.type === 'spell' && ` • Nível ${(item.data as any).level}`}
                                {item.type === 'monster' && ` • ND ${(item.data as any).challenge_rating}`}
                                {item.type === 'item' && ` • ${(item.data as any).rarity}`}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Import button */}
                  <Button
                    onClick={handleImport}
                    disabled={importing || selectedIndices.size === 0}
                    className="w-full gap-2"
                  >
                    {importing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Importar {selectedIndices.size} selecionado(s) como Homebrew
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
