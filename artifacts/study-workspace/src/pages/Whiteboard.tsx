import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Square, Circle, Minus, Type, StickyNote, MousePointer, Hand, ZoomIn, ZoomOut, Maximize2, Trash2, Undo2, Redo2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

const initialStickies: StickyItem[] = [
  { id: "1", x: 80, y: 80, text: "SN2 reactions require a strong nucleophile and an unhindered substrate", colorIdx: 0, rotation: -2 },
  { id: "2", x: 300, y: 120, text: "Remember: entropy always increases in isolated systems (2nd law)", colorIdx: 1, rotation: 1.5 },
  { id: "3", x: 180, y: 300, text: "Chain Rule: d/dx[f(g(x))] = f'(g(x)) · g'(x)", colorIdx: 2, rotation: -1 },
  { id: "4", x: 520, y: 90, text: "DNA replication is semi-conservative — Watson & Crick, 1953", colorIdx: 3, rotation: 2 },
  { id: "5", x: 440, y: 280, text: "IS curve: higher interest rates → lower investment → lower output", colorIdx: 4, rotation: -1.5 },
];

export default function Whiteboard() {
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(100);
  const [stickies, setStickies] = useState<StickyItem[]>(initialStickies);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom((z) => Math.min(z + 10, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 10, 40));

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
    setStickies((prev) => prev.map((s) => s.id === dragging ? { ...s, x, y } : s));
  };

  const deleteSticky = (id: string) => {
    setStickies((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)] -m-6 overflow-hidden border border-border/40 rounded-xl bg-background">
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
                activeTool === id && "bg-background shadow-sm text-primary"
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

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} data-testid="button-zoom-out">
            <ZoomOut size={14} />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center font-mono">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} data-testid="button-zoom-in">
            <ZoomIn size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Fit to screen" data-testid="button-fit-screen">
            <Maximize2 size={13} />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-5" />

        <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-undo">
          <Undo2 size={14} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-redo">
          <Redo2 size={14} />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-2">
            {["AC", "MP", "JL"].map((av) => (
              <div key={av} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[8px] font-bold text-primary">
                {av}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" data-testid="button-export-whiteboard">
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
        data-testid="whiteboard-canvas"
      >
        {/* Grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: `${24 * zoom / 100}px ${24 * zoom / 100}px`,
          }}
        />

        {/* Stickies */}
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
                  onClick={(e) => { e.stopPropagation(); deleteSticky(sticky.id); }}
                  data-testid={`button-delete-sticky-${sticky.id}`}
                >
                  <Trash2 size={10} />
                </Button>
                <textarea
                  value={sticky.text}
                  onChange={(e) => setStickies((prev) => prev.map((s) => s.id === sticky.id ? { ...s, text: e.target.value } : s))}
                  className={cn("w-full h-full bg-transparent border-none outline-none resize-none text-xs font-medium leading-snug", color.text)}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`sticky-textarea-${sticky.id}`}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Empty state hint */}
        {stickies.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <StickyNote size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Select the sticky note tool and click anywhere to add notes</p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t border-border/60 px-4 py-1.5 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>Tool: {tools.find(t => t.id === activeTool)?.label}</span>
        <span>{stickies.length} objects</span>
        <span className="ml-auto">Collaborative — 3 users viewing</span>
      </div>
    </div>
  );
}
