import {
  Circle,
  CloudOff,
  Download,
  Hand,
  Highlighter,
  ImageDown,
  FileImage,
  Maximize2,
  Minus,
  MousePointer,
  Pencil,
  Redo2,
  Save,
  Square,
  StickyNote,
  Type,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { WhiteboardTool } from "../types";

const tools: { id: WhiteboardTool; icon: typeof MousePointer; label: string }[] = [
  { id: "select", icon: MousePointer, label: "Select" },
  { id: "pan", icon: Hand, label: "Pan" },
  { id: "pen", icon: Pencil, label: "Pen" },
  { id: "highlighter", icon: Highlighter, label: "Highlighter" },
  { id: "sticky", icon: StickyNote, label: "Sticky Note" },
  { id: "text", icon: Type, label: "Text label" },
  { id: "rect", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Ellipse" },
  { id: "line", icon: Minus, label: "Line" },
];

interface WhiteboardToolbarProps {
  activeTool: WhiteboardTool;
  onToolChange: (t: WhiteboardTool) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  undoDisabled: boolean;
  redoDisabled: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  savePending: boolean;
  onExportJson: () => void;
  onExportSvg: () => void;
  onCopyJson: () => void;
  onExportPng: () => void;
  isError: boolean;
  onRetry: () => void;
}

export function WhiteboardToolbar({
  activeTool,
  onToolChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  undoDisabled,
  redoDisabled,
  onUndo,
  onRedo,
  onSave,
  saveDisabled,
  savePending,
  onExportJson,
  onExportSvg,
  onCopyJson,
  onExportPng,
  isError,
  onRetry,
}: WhiteboardToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
      {isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          <CloudOff size={14} />
          Could not load whiteboard.
          <Button variant="outline" size="sm" className="h-7 text-[10px]" type="button" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-0.5 rounded-lg bg-muted/50 p-1">
        {tools.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 transition-colors",
              activeTool === id && "bg-background text-primary shadow-sm",
            )}
            title={label}
            type="button"
            onClick={() => onToolChange(id)}
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
          onClick={onZoomOut}
          title="Zoom out"
          data-testid="button-zoom-out"
        >
          -
        </button>
        <span className="w-11 text-center font-mono text-muted-foreground">{zoom}%</span>
        <button
          type="button"
          className="h-5 w-5 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onZoomIn}
          title="Zoom in"
          data-testid="button-zoom-in"
        >
          +
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          title="Reset zoom & pan"
          type="button"
          onClick={onResetZoom}
          data-testid="button-fit-screen"
        >
          <Maximize2 size={11} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-5" />

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={undoDisabled}
        type="button"
        onClick={onUndo}
        data-testid="button-undo"
      >
        <Undo2 size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={redoDisabled}
        type="button"
        onClick={onRedo}
        data-testid="button-redo"
      >
        <Redo2 size={14} />
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          data-testid="button-save-whiteboard"
        >
          <Save size={12} /> {savePending ? "Saving…" : "Save"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" type="button" data-testid="button-export-whiteboard">
              <Download size={12} /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onExportJson}>
              <ImageDown className="mr-2 size-4" />
              Download JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportSvg}>
              <FileImage className="mr-2 size-4" />
              Download SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopyJson}>Copy JSON</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void onExportPng()}>Download PNG</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
