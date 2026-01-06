import { useEffect, useMemo, useState, useCallback, useLayoutEffect } from "react";
import {
  Tldraw,
  createTLStore,
  getSnapshot,
  loadSnapshot,
  DefaultSpinner,
  TLEditorSnapshot,
  Editor,
} from "tldraw";
import "tldraw/tldraw.css";
import { throttle } from "lodash";
import { MonitorX, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

type LoadingState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; error: string };

export function CampaignWhiteboard({ campaignId }: CampaignWhiteboardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: "loading",
  });
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  // Create the store
  const store = useMemo(() => createTLStore(), []);

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load and save whiteboard data
  useLayoutEffect(() => {
    if (isMobile) return;

    setLoadingState({ status: "loading" });

    // Load from database
    const loadFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from("campaign_whiteboard_elements")
          .select("*")
          .eq("campaign_id", campaignId)
          .eq("element_type", "tldraw_snapshot")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows
          throw error;
        }

        if (data?.content) {
          try {
            const snapshot = JSON.parse(data.content) as TLEditorSnapshot;
            loadSnapshot(store, snapshot);
          } catch (parseError) {
            console.error("Error parsing snapshot:", parseError);
          }
        }

        setLoadingState({ status: "ready" });
      } catch (error: any) {
        console.error("Error loading whiteboard:", error);
        setLoadingState({ status: "error", error: error.message });
      }
    };

    loadFromDb();

    // Save to database on changes (throttled)
    const saveToDb = throttle(async () => {
      try {
        const snapshot = getSnapshot(store);
        const content = JSON.stringify(snapshot);

        // Upsert the snapshot
        const { data: existingData } = await supabase
          .from("campaign_whiteboard_elements")
          .select("id")
          .eq("campaign_id", campaignId)
          .eq("element_type", "tldraw_snapshot")
          .limit(1)
          .single();

        if (existingData) {
          await supabase
            .from("campaign_whiteboard_elements")
            .update({
              content,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingData.id);
        } else {
          await supabase.from("campaign_whiteboard_elements").insert({
            campaign_id: campaignId,
            element_type: "tldraw_snapshot",
            x: 0,
            y: 0,
            content,
          });
        }
      } catch (error) {
        console.error("Error saving whiteboard:", error);
      }
    }, 2000);

    const cleanupFn = store.listen(saveToDb);

    return () => {
      cleanupFn();
      saveToDb.cancel();
    };
  }, [store, campaignId, isMobile]);

  const handleEditorMount = useCallback((editor: Editor) => {
    setEditorInstance(editor);
  }, []);

  const handleClear = () => {
    setShowClearDialog(true);
  };

  const confirmClear = async () => {
    if (editorInstance) {
      // Select all and delete
      editorInstance.selectAll();
      editorInstance.deleteShapes(editorInstance.getSelectedShapeIds());
      
      // Also clear from database
      try {
        await supabase
          .from("campaign_whiteboard_elements")
          .delete()
          .eq("campaign_id", campaignId)
          .eq("element_type", "tldraw_snapshot");
        
        toast.success("Whiteboard limpo!");
      } catch (error) {
        console.error("Error clearing whiteboard:", error);
        toast.error("Erro ao limpar whiteboard");
      }
    }
    setShowClearDialog(false);
  };

  const handleManualSave = () => {
    toast.success("Alterações salvas automaticamente!");
  };

  // Show mobile message
  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
        <MonitorX className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Disponível apenas no Desktop
        </h3>
        <p className="text-muted-foreground text-sm">
          O Whiteboard interativo requer uma tela maior para uma experiência
          adequada. Acesse pelo computador para usar esta funcionalidade.
        </p>
      </div>
    );
  }

  if (loadingState.status === "loading") {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadingState.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center p-6">
        <div className="text-destructive text-lg font-semibold mb-2">
          Erro ao carregar Whiteboard
        </div>
        <p className="text-muted-foreground text-sm">{loadingState.error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Custom toolbar */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Whiteboard interativo • Salva automaticamente
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleManualSave}>
            <Save className="w-4 h-4 mr-1" />
            Salvar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      {/* tldraw canvas */}
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
        <Tldraw
          store={store}
          onMount={handleEditorMount}
          inferDarkMode
        />
      </div>

      {/* Help text */}
      <div className="text-center text-xs text-muted-foreground py-1">
        Use as ferramentas para desenhar, criar formas, adicionar texto e
        imagens • Arraste para mover • Scroll para zoom
      </div>

      {/* Clear confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Whiteboard?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá remover todos os elementos do whiteboard. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
