import { useState, useCallback } from "react";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { WhiteboardToolbar } from "./WhiteboardToolbar";
import {
  useWhiteboardElements,
  useCreateWhiteboardElement,
  useUpdateWhiteboardElement,
  useDeleteWhiteboardElement,
  useClearWhiteboard,
  WhiteboardElement,
} from "@/hooks/useWhiteboard";
import { Loader2, MonitorX } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CampaignWhiteboardProps {
  campaignId: string;
}

type Tool = 'select' | 'sticky_note' | 'text' | 'image' | 'connection';

export function CampaignWhiteboard({ campaignId }: CampaignWhiteboardProps) {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [activeColor, setActiveColor] = useState('#fef08a');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount
  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  const { data: elements = [], isLoading } = useWhiteboardElements(campaignId);
  const createElement = useCreateWhiteboardElement();
  const updateElement = useUpdateWhiteboardElement();
  const deleteElement = useDeleteWhiteboardElement();
  const clearWhiteboard = useClearWhiteboard();

  const handleElementCreate = useCallback((element: Omit<WhiteboardElement, 'id' | 'created_at' | 'updated_at'>) => {
    createElement.mutate(element);
    setActiveTool('select'); // Switch back to select after creating
  }, [createElement]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<WhiteboardElement>) => {
    updateElement.mutate({ id, campaignId, ...updates });
  }, [updateElement, campaignId]);

  const handleElementDelete = useCallback((id: string) => {
    deleteElement.mutate({ id, campaignId });
  }, [deleteElement, campaignId]);

  const handleClear = () => {
    setShowClearDialog(true);
  };

  const confirmClear = () => {
    clearWhiteboard.mutate(campaignId);
    setShowClearDialog(false);
  };

  const handleSave = () => {
    toast.success('Alterações salvas automaticamente!');
  };

  // Show mobile message
  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
        <MonitorX className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Disponível apenas no Desktop</h3>
        <p className="text-muted-foreground text-sm">
          O Whiteboard interativo requer uma tela maior para uma experiência adequada.
          Acesse pelo computador para usar esta funcionalidade.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex justify-center">
        <WhiteboardToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          onClear={handleClear}
          onSave={handleSave}
          isSaving={createElement.isPending || updateElement.isPending}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <WhiteboardCanvas
          elements={elements}
          onElementCreate={handleElementCreate}
          onElementUpdate={handleElementUpdate}
          onElementDelete={handleElementDelete}
          campaignId={campaignId}
          activeTool={activeTool}
          activeColor={activeColor}
        />
      </div>

      {/* Help text */}
      <div className="text-center text-xs text-muted-foreground">
        <span className="bg-muted px-2 py-1 rounded">Delete</span> para remover • 
        Clique duas vezes no texto para editar • 
        Arraste para mover elementos
      </div>

      {/* Clear confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Whiteboard?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá remover todos os elementos do whiteboard. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
