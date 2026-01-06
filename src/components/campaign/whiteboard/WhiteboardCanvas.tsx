import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Rect, IText, Line, FabricObject, Shadow } from "fabric";
import { WhiteboardElement } from "@/hooks/useWhiteboard";

interface WhiteboardCanvasProps {
  elements: WhiteboardElement[];
  onElementCreate: (element: Omit<WhiteboardElement, 'id' | 'created_at' | 'updated_at'>) => void;
  onElementUpdate: (id: string, updates: Partial<WhiteboardElement>) => void;
  onElementDelete: (id: string) => void;
  campaignId: string;
  activeTool: 'select' | 'sticky_note' | 'text' | 'image' | 'connection';
  activeColor: string;
}

// Extend FabricObject to include our custom data
interface CustomFabricObject extends FabricObject {
  data?: { elementId?: string; elementType?: string };
}

export function WhiteboardCanvas({
  elements,
  onElementCreate,
  onElementUpdate,
  onElementDelete,
  campaignId,
  activeTool,
  activeColor,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const elementsMapRef = useRef<Map<string, CustomFabricObject>>(new Map());
  const isLoadingRef = useRef(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#1a1a2e",
      selection: activeTool === 'select',
    });

    fabricCanvasRef.current = canvas;
    setIsReady(true);

    // Handle window resize
    const handleResize = () => {
      if (container && canvas) {
        canvas.setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
        canvas.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
      fabricCanvasRef.current = null;
      setIsReady(false);
    };
  }, []);

  // Update selection mode based on active tool
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.selection = activeTool === 'select';
    
    // Update cursor
    if (activeTool === 'select') {
      fabricCanvasRef.current.defaultCursor = 'default';
    } else {
      fabricCanvasRef.current.defaultCursor = 'crosshair';
    }
  }, [activeTool]);

  // Handle canvas click for creating elements
  useEffect(() => {
    if (!fabricCanvasRef.current || !isReady) return;

    const canvas = fabricCanvasRef.current;

    const handleMouseDown = (e: any) => {
      if (activeTool === 'select') return;
      if (e.target) return; // Clicked on existing object

      const pointer = canvas.getViewportPoint(e.e);

      if (activeTool === 'sticky_note') {
        onElementCreate({
          campaign_id: campaignId,
          element_type: 'sticky_note',
          x: pointer.x - 75,
          y: pointer.y - 50,
          width: 150,
          height: 100,
          content: 'Nova nota...',
          background_color: activeColor,
          text_color: '#1f2937',
          font_size: 14,
        });
      } else if (activeTool === 'text') {
        onElementCreate({
          campaign_id: campaignId,
          element_type: 'text',
          x: pointer.x,
          y: pointer.y,
          content: 'Texto...',
          text_color: '#ffffff',
          font_size: 18,
        });
      }
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [activeTool, activeColor, campaignId, isReady, onElementCreate]);

  // Handle object modifications
  useEffect(() => {
    if (!fabricCanvasRef.current || !isReady) return;

    const canvas = fabricCanvasRef.current;

    const handleObjectModified = (e: any) => {
      const obj = e.target as CustomFabricObject;
      if (!obj?.data?.elementId) return;

      onElementUpdate(obj.data.elementId, {
        x: obj.left || 0,
        y: obj.top || 0,
        width: obj.width ? obj.width * (obj.scaleX || 1) : undefined,
        height: obj.height ? obj.height * (obj.scaleY || 1) : undefined,
        rotation: obj.angle || 0,
      });
    };

    const handleTextChanged = (e: any) => {
      const obj = e.target as CustomFabricObject & IText;
      if (!obj?.data?.elementId) return;

      onElementUpdate(obj.data.elementId, {
        content: obj.text,
      });
    };

    canvas.on('object:modified', handleObjectModified);
    canvas.on('text:changed', handleTextChanged);

    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('text:changed', handleTextChanged);
    };
  }, [isReady, onElementUpdate]);

  // Handle keyboard delete
  useEffect(() => {
    if (!fabricCanvasRef.current || !isReady) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length === 0) return;

        // Don't delete if editing text
        const activeObject = canvas.getActiveObject();
        if (activeObject && (activeObject as any).isEditing) return;

        activeObjects.forEach((obj) => {
          const customObj = obj as CustomFabricObject;
          if (customObj.data?.elementId) {
            onElementDelete(customObj.data.elementId);
          }
        });

        canvas.discardActiveObject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, onElementDelete]);

  // Sync elements to canvas
  const syncElementsToCanvas = useCallback(() => {
    if (!fabricCanvasRef.current || !isReady || isLoadingRef.current) return;

    isLoadingRef.current = true;
    const canvas = fabricCanvasRef.current;
    const currentIds = new Set(elements.map(e => e.id));

    // Remove deleted elements
    elementsMapRef.current.forEach((obj, id) => {
      if (!currentIds.has(id)) {
        canvas.remove(obj);
        elementsMapRef.current.delete(id);
      }
    });

    // Add or update elements
    elements.forEach((element) => {
      const existingObj = elementsMapRef.current.get(element.id);

      if (existingObj) {
        // Update position if changed externally
        existingObj.set({
          left: element.x,
          top: element.y,
        });
      } else {
        // Create new object
        createFabricObject(element, canvas);
      }
    });

    canvas.renderAll();
    isLoadingRef.current = false;
  }, [elements, isReady]);

  const createFabricObject = (element: WhiteboardElement, canvas: FabricCanvas) => {
    let obj: CustomFabricObject | null = null;

    if (element.element_type === 'sticky_note') {
      // Create sticky note as rect with text overlay
      obj = new Rect({
        left: element.x,
        top: element.y,
        width: element.width || 150,
        height: element.height || 100,
        fill: element.background_color || '#fef08a',
        rx: 8,
        ry: 8,
        shadow: new Shadow({ color: 'rgba(0,0,0,0.3)', blur: 8, offsetX: 3, offsetY: 3 }),
      }) as CustomFabricObject;

      obj.data = { elementId: element.id, elementType: 'sticky_note' };

      // Add text on top
      const textObj = new IText(element.content || '', {
        left: element.x + 10,
        top: element.y + 10,
        fontSize: element.font_size || 14,
        fill: element.text_color || '#1f2937',
        fontFamily: 'sans-serif',
        editable: true,
      }) as CustomFabricObject;

      textObj.data = { elementId: element.id, elementType: 'sticky_note_text' };

      canvas.add(obj);
      canvas.add(textObj);
      elementsMapRef.current.set(element.id, obj);
      elementsMapRef.current.set(element.id + '_text', textObj);
      return;
    }

    if (element.element_type === 'text') {
      obj = new IText(element.content || '', {
        left: element.x,
        top: element.y,
        fontSize: element.font_size || 18,
        fill: element.text_color || '#ffffff',
        fontFamily: 'sans-serif',
        editable: true,
      }) as CustomFabricObject;

      obj.data = { elementId: element.id, elementType: 'text' };
    }

    if (element.element_type === 'connection' && element.connection_from && element.connection_to) {
      const fromEl = elements.find(e => e.id === element.connection_from);
      const toEl = elements.find(e => e.id === element.connection_to);

      if (fromEl && toEl) {
        obj = new Line([fromEl.x, fromEl.y, toEl.x, toEl.y], {
          stroke: '#6366f1',
          strokeWidth: 2,
          selectable: false,
        }) as CustomFabricObject;

        obj.data = { elementId: element.id, elementType: 'connection' };
      }
    }

    if (obj) {
      canvas.add(obj);
      elementsMapRef.current.set(element.id, obj);
    }
  };

  // Effect to sync elements
  useEffect(() => {
    syncElementsToCanvas();
  }, [syncElementsToCanvas]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[600px] bg-[#1a1a2e] rounded-lg overflow-hidden">
      <canvas ref={canvasRef} />
    </div>
  );
}
