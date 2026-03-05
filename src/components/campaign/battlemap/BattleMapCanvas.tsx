import { useRef, useState, useCallback, useEffect } from "react";
import { TokenPosition, TOKEN_SIZE_CELLS } from "@/hooks/useBattleMaps";

interface BattleMapCanvasProps {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  imageUrl: string | null;
  tokens: TokenPosition[];
  onTokenMove: (tokenId: string, x: number, y: number) => void;
  readOnly?: boolean;
  allowedCharacterId?: string;
}

export function BattleMapCanvas({
  gridWidth,
  gridHeight,
  cellSize,
  imageUrl,
  tokens,
  onTokenMove,
  readOnly = false,
  allowedCharacterId,
}: BattleMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  const canvasWidth = gridWidth * cellSize;
  const canvasHeight = gridHeight * cellSize;

  // Load background image
  useEffect(() => {
    if (!imageUrl) { setBgImage(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setBgImage(img);
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Background
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.fillStyle = "hsl(222, 20%, 12%)";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvasWidth, y * cellSize);
      ctx.stroke();
    }

    // Tokens
    tokens.forEach(token => {
      const sizeCells = TOKEN_SIZE_CELLS[token.size || 'medium'];
      const tokenPixelSize = sizeCells * cellSize;
      const cx = token.x * cellSize + tokenPixelSize / 2;
      const cy = token.y * cellSize + tokenPixelSize / 2;
      const radius = tokenPixelSize * 0.42;

      // Shadow
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      // Circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = token.color;
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Border ring
      ctx.strokeStyle = dragging === token.id ? "#fff" : "rgba(255,255,255,0.5)";
      ctx.lineWidth = dragging === token.id ? 3 : 1.5;
      ctx.stroke();

      // Inner highlight ring for larger tokens
      if (sizeCells >= 2) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Icon/Label
      const icon = token.icon;
      const fontSize = Math.max(10, tokenPixelSize * 0.35);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (icon) {
        ctx.fillText(icon, cx, cy);
      } else {
        const label = token.name.length > 3 ? token.name.substring(0, 3) : token.name;
        ctx.fillText(label, cx, cy);
      }

      // Name below for large+ tokens
      if (sizeCells >= 2) {
        ctx.font = `${Math.max(9, cellSize * 0.22)}px sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(
          token.name.length > 8 ? token.name.substring(0, 7) + "…" : token.name,
          cx,
          cy + radius + cellSize * 0.2
        );
      }
    });

    ctx.restore();
  }, [bgImage, tokens, gridWidth, gridHeight, cellSize, canvasWidth, canvasHeight, offset, scale, dragging]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Fit to container on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const fitScale = Math.min(cw / canvasWidth, ch / canvasHeight, 1);
    setScale(fitScale);
    setOffset({
      x: (cw - canvasWidth * fitScale) / 2,
      y: (ch - canvasHeight * fitScale) / 2,
    });
  }, [canvasWidth, canvasHeight]);

  const getGridPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { gx: 0, gy: 0 };
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left - offset.x) / scale;
    const my = (clientY - rect.top - offset.y) / scale;
    return {
      gx: Math.floor(mx / cellSize),
      gy: Math.floor(my / cellSize),
    };
  };

  const canMoveToken = (token: TokenPosition) => {
    if (readOnly) return false;
    if (!allowedCharacterId) return true;
    return token.characterId === allowedCharacterId;
  };

  const findTokenAt = (gx: number, gy: number) => {
    // Check all tokens, considering their size
    return tokens.find(t => {
      const sizeCells = TOKEN_SIZE_CELLS[t.size || 'medium'];
      const cells = Math.max(1, Math.floor(sizeCells));
      return gx >= t.x && gx < t.x + cells && gy >= t.y && gy < t.y + cells;
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const { gx, gy } = getGridPos(e.clientX, e.clientY);
    const token = findTokenAt(gx, gy);
    if (token && canMoveToken(token)) {
      setDragging(token.id);
      setDragStart({ x: token.x, y: token.y });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    // Pan
    setPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (panning) {
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      const { gx, gy } = getGridPos(e.clientX, e.clientY);
      const clampedX = Math.max(0, Math.min(gx, gridWidth - 1));
      const clampedY = Math.max(0, Math.min(gy, gridHeight - 1));
      if (clampedX !== dragStart.x || clampedY !== dragStart.y) {
        onTokenMove(dragging, clampedX, clampedY);
      }
      setDragging(null);
    }
    setPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(3, scale * delta));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setOffset(prev => ({
        x: mx - (mx - prev.x) * (newScale / scale),
        y: my - (my - prev.y) * (newScale / scale),
      }));
    }
    setScale(newScale);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-background rounded-lg border border-border">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
        style={{ display: "block" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />
      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button
          onClick={() => setScale(s => Math.min(3, s * 1.2))}
          className="w-8 h-8 rounded-lg bg-card/90 border border-border text-foreground flex items-center justify-center text-lg font-bold hover:bg-muted"
        >+</button>
        <button
          onClick={() => setScale(s => Math.max(0.2, s / 1.2))}
          className="w-8 h-8 rounded-lg bg-card/90 border border-border text-foreground flex items-center justify-center text-lg font-bold hover:bg-muted"
        >−</button>
      </div>
      <div className="absolute top-3 left-3 text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
