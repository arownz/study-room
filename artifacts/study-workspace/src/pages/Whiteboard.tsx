import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Square,
  Circle,
  Minus,
  Type,
  StickyNote,
  MousePointer,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Undo2,
  Redo2,
  Download,
  CloudOff,
  Save,
} from "lucide-react";
import { usePutWhiteboard, useWhiteboard } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const tools = [
  { id: "select", icon: MousePointer, label: "Select" },
  { id: "pan", icon: Hand, label: "Pan" },
  { id: "sticky", icon: StickyNote, label: "Sticky Note" },
  { id: "text", icon: Type, label: "Text" },
  { id: "rect", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Ellipse" },
  { id: "line", icon: Minus, label: "Line" },
];

const stickyColors = [
  { bg: "bg-amber-300/90 dark:bg-amber-400/80", text: "text-amber-950" },
  { bg: "bg-sky-300/90 dark:bg-sky-400/80", text: "text-sky-950" },
  { bg: "bg-rose-300/90 dark:bg-rose-400/80", text: "text-rose-950" },
  { bg: "bg-emerald-300/90 dark:bg-emerald-400/80", text: "text-emerald-950" },
  { bg: "bg-violet-300/90 dark:bg-violet-400/80", text: "text-violet-950" },
];

interface StickyItem {
  id: string;
  x: number;
  y: number;
  text: string;
  colorIdx: number;
  rotation: number;
}

interface SnapshotV1 {
  version: 1;
  zoom?: number;
  stickies: StickyItem[];
}

function parseSnapshot(raw: string): { zoom: number; stickies: StickyItem[] } {
  try {
    const p = JSON.parse(raw) as Partial<SnapshotV1>;
    if (p?.version !== 1 || !Array.isArray(p.stickies)) {
      return { zoom: 100, stickies: [] };
    }
    const zoom = typeof p.zoom === "number" && p.zoom >= 40 && p.zoom <= 200 ? p.zoom : 100;
    return { zoom, stickies: p.stickies };
  } catch {
    return { zoom: 100, stickies: [] };
  }
}

export default function Whiteboard() {
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(100);
  const [stickies, setStickies] = useState<StickyItem[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const LOCAL_DRAFT_KEY = "studyroom.whiteboard.draft";
  const pinchRef = useRef<{ initialDistance: number; initialZoom: number } | null>(null);

  const { data: boardEnvelope, isLoading, isError, refetch } = useWhiteboard();
  const putBoard = usePutWhiteboard();

  useEffect(() => {
    if (!boardEnvelope?.success || hydratedRef.current) return;
    const draftRaw = window.localStorage.getItem(LOCAL_DRAFT_KEY);
    if (draftRaw) {
      const { zoom: z, stickies: s } = parseSnapshot(draftRaw);
      setZoom(z);
      setStickies(s);
      setHasLocalChanges(true);
      hydratedRef.current = true;
      return;
    }
    const { zoom: z, stickies: s } = parseSnapshot(boardEnvelope.data.snapshot);
    setZoom(z);
    setStickies(s);
    hydratedRef.current = true;
  }, [boardEnvelope]);

  const markChanged = useCallback(() => {
    if (!hydratedRef.current) return;
    setHasLocalChanges(true);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || !hasLocalChanges) return;
    const snapshot = JSON.stringify({ version: 1, zoom, stickies } satisfies SnapshotV1);
    window.localStorage.setItem(LOCAL_DRAFT_KEY, snapshot);
  }, [zoom, stickies, hasLocalChanges]);

  const handleSave = useCallback(async () => {
    const snapshot = JSON.stringify({ version: 1, zoom, stickies } satisfies SnapshotV1);
    await putBoard.mutateAsync({ data: { snapshot } });
    window.localStorage.removeItem(LOCAL_DRAFT_KEY);
    setHasLocalChanges(false);
  }, [putBoard, stickies, zoom]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  const zoomIn = () => {
    setZoom((z) => Math.min(z + 10, 200));
    markChanged();
  };
  const zoomOut = () => {
    setZoom((z) => Math.max(z - 10, 40));
    markChanged();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool !== "sticky") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) * (100 / zoom) - 80;
    const y = (e.clientY - rect.top) * (100 / zoom) - 60;
    const newSticky: StickyItem = {
      id: String(Date.now()),
      x,
      y,
      text: "New note",
      colorIdx: Math.floor(Math.random() * stickyColors.length),
      rotation: (Math.random() - 0.5) * 4,
    };
    setStickies((prev) => [...prev, newSticky]);
    markChanged();
    setActiveTool("select");
  };

  const startDrag = (e: React.MouseEvent, id: string) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    const sticky = stickies.find((s) => s.id === id);
    if (!sticky) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging(id);
    setDragOffset({
      x: e.clientX - rect.left - sticky.x * (zoom / 100),
      y: e.clientY - rect.top - sticky.y * (zoom / 100),
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - dragOffset.x) * (100 / zoom);
    const y = (e.clientY - rect.top - dragOffset.y) * (100 / zoom);
    setStickies((prev) => prev.map((s) => (s.id === dragging ? { ...s, x, y } : s)));
    markChanged();
  };

  const deleteSticky = (id: string) => {
    setStickies((prev) => prev.filter((s) => s.id !== id));
    markChanged();
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ version: 1, zoom, stickies }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whiteboard.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const serverUpdated =
    boardEnvelope?.success && new Date(boardEnvelope.data.updatedAt).getTime() > 0
      ? new Date(boardEnvelope.data.updatedAt).toLocaleString()
      : null;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)] -m-6 overflow-hidden border border-border/40 rounded-xl bg-background relative">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      )}
      {isError && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          <CloudOff size={14} />
          Could not load whiteboard.
          <Button variant="outline" size="sm" className="h-7 text-[10px]" type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}
      {/* Toolbar */}
      <div className="border-b border-border/60 px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-1">
          {tools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 transition-colors",
                activeTool === id && "bg-background shadow-sm text-primary",
              )}
              title={label}
              onClick={() => setActiveTool(id)}
              data-testid={`tool-${id}`}
            >
              <Icon size={14} />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-[11px]">
          <button
            type="button"
            className="h-5 w-5 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={zoomOut}
            title="Zoom out"
            data-testid="button-zoom-out"
          >
            -
          </button>
          <span className="w-11 text-center font-mono text-muted-foreground">{zoom}%</span>
          <button
            type="button"
            className="h-5 w-5 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={zoomIn}
            title="Zoom in"
            data-testid="button-zoom-in"
          >
            +
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            title="Reset zoom"
            type="button"
            onClick={() => setZoom(100)}
            data-testid="button-fit-screen"
          >
            <Maximize2 size={11} />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-5" />

        <Button variant="ghost" size="icon" className="h-7 w-7" disabled data-testid="button-undo">
          <Undo2 size={14} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled data-testid="button-redo">
          <Redo2 size={14} />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            type="button"
            onClick={() => void handleSave()}
            disabled={!hasLocalChanges || putBoard.isPending}
            data-testid="button-save-whiteboard"
          >
            <Save size={12} /> Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            type="button"
            onClick={exportJson}
            data-testid="button-export-whiteboard"
          >
            <Download size={12} /> Export
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className={cn(
          "flex-1 relative overflow-hidden",
          activeTool === "sticky" && "cursor-crosshair",
          activeTool === "pan" && "cursor-grab",
          activeTool === "select" && "cursor-default",
        )}
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={onMouseMove}
        onMouseUp={() => setDragging(null)}
        onWheel={(event) => {
          event.preventDefault();
          const next = Math.max(40, Math.min(200, zoom - event.deltaY * 0.05));
          if (Math.round(next) !== zoom) {
            setZoom(Math.round(next));
            markChanged();
          }
        }}
        onTouchStart={(event) => {
          if (event.touches.length !== 2) return;
          const [a, b] = [event.touches[0], event.touches[1]];
          const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          pinchRef.current = { initialDistance: distance, initialZoom: zoom };
        }}
        onTouchMove={(event) => {
          if (event.touches.length !== 2 || !pinchRef.current) return;
          const [a, b] = [event.touches[0], event.touches[1]];
          const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          const next = pinchRef.current.initialZoom * (distance / pinchRef.current.initialDistance);
          const clamped = Math.max(40, Math.min(200, Math.round(next)));
          if (clamped !== zoom) {
            setZoom(clamped);
            markChanged();
          }
        }}
        onTouchEnd={() => {
          pinchRef.current = null;
        }}
        data-testid="whiteboard-canvas"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: `${(24 * zoom) / 100}px ${(24 * zoom) / 100}px`,
          }}
        />

        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "0 0", position: "absolute", inset: 0 }}
        >
          {stickies.map((sticky) => {
            const color = stickyColors[sticky.colorIdx % stickyColors.length];
            return (
              <motion.div
                key={sticky.id}
                className={cn("absolute w-44 min-h-24 rounded-sm shadow-lg p-3 group", color.bg)}
                style={{
                  left: sticky.x,
                  top: sticky.y,
                  rotate: sticky.rotation,
                  cursor: activeTool === "select" ? "grab" : "default",
                }}
                whileHover={{ scale: 1.02, zIndex: 10 }}
                onMouseDown={(e) => startDrag(e, sticky.id)}
                data-testid={`sticky-note-${sticky.id}`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-700 hover:text-rose-900 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSticky(sticky.id);
                  }}
                  data-testid={`button-delete-sticky-${sticky.id}`}
                >
                  <Trash2 size={10} />
                </Button>
                <textarea
                  value={sticky.text}
                  onChange={(e) =>
                    setStickies((prev) => {
                      markChanged();
                      return prev.map((s) => (s.id === sticky.id ? { ...s, text: e.target.value } : s));
                    })
                  }
                  className={cn(
                    "w-full h-full bg-transparent border-none outline-none resize-none text-xs font-medium leading-snug",
                    color.text,
                  )}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`sticky-textarea-${sticky.id}`}
                />
              </motion.div>
            );
          })}
        </div>

        {stickies.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <StickyNote size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Select the sticky note tool and click anywhere to add notes</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border/60 px-4 py-1.5 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>Tool: {tools.find((t) => t.id === activeTool)?.label}</span>
        <span>{stickies.length} objects</span>
        <span className="ml-auto tabular-nums">
          {putBoard.isPending ? "Saving…" : hasLocalChanges ? "Unsaved changes" : serverUpdated ? `Saved · ${serverUpdated}` : "Manual save"}
        </span>
      </div>
    </div>
  );
}
