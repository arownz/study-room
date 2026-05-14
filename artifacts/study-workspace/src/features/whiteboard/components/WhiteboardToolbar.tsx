import {
  Circle,
  CloudOff,
  Download,
  Eraser,
  Hand,
  Highlighter,
  ImageDown,
  FileImage,
  Maximize2,
  Minus,
  MousePointer,
  Pencil,
  Plus,
  Redo2,
  Save,
  SlidersHorizontal,
  Square,
  StickyNote,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { WhiteboardTool } from "../types";

const tools: { id: WhiteboardTool; icon: typeof MousePointer; label: string }[] = [
  { id: "select", icon: MousePointer, label: "Select" },
  { id: "pan", icon: Hand, label: "Pan" },
  { id: "pen", icon: Pencil, label: "Pen" },
  { id: "highlighter", icon: Highlighter, label: "Highlighter" },
  { id: "erase", icon: Eraser, label: "Erase" },
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
  onClear: () => void;
  onNew: () => void;
  toolSizeControl?: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
  } | null;
  onToolSizeChange?: (next: number) => void;
  saveDisabled: boolean;
  clearDisabled: boolean;
  newDisabled: boolean;
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
  onClear,
  onNew,
  toolSizeControl,
  onToolSizeChange,
  saveDisabled,
  clearDisabled,
  newDisabled,
  savePending,
  onExportJson,
  onExportSvg,
  onCopyJson,
  onExportPng,
  isError,
  onRetry,
}: WhiteboardToolbarProps) {
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto border-b border-border/60 px-4 py-2">
      {isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          <CloudOff size={14} />
          Could not load whiteboard.
          <Button variant="outline" size="sm" className="h-7 text-[10px]" type="button" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="flex shrink-0 flex-wrap items-center gap-0.5 rounded-lg bg-muted/50 p-1">
        {tools.map(({ id, icon: Icon, label }) => (
          <HoverTooltip key={id} content={label}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 transition-colors",
                activeTool === id && "bg-background text-primary shadow-sm",
              )}
              type="button"
              onClick={() => onToolChange(id)}
              data-testid={`tool-${id}`}
            >
              <Icon size={14} />
            </Button>
          </HoverTooltip>
        ))}
      </div>

      {toolSizeControl && onToolSizeChange ? (
        <>
          <Popover>
            <HoverTooltip content={`${toolSizeControl.label} size`}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  type="button"
                  data-testid="button-whiteboard-tool-size"
                >
                  <SlidersHorizontal size={14} />
                </Button>
              </PopoverTrigger>
            </HoverTooltip>
            <PopoverContent align="start" className="w-60 space-y-3 p-3">
              <div className="space-y-1">
                <p className="text-xs font-medium">{toolSizeControl.label} size</p>
                <p className="text-[11px] text-muted-foreground">
                  {Math.round(toolSizeControl.value)} px
                </p>
              </div>
              <Slider
                min={toolSizeControl.min}
                max={toolSizeControl.max}
                step={toolSizeControl.step}
                value={[toolSizeControl.value]}
                onValueChange={(value) => {
                  const next = value[0];
                  if (typeof next === "number") onToolSizeChange(next);
                }}
              />
            </PopoverContent>
          </Popover>
        </>
      ) : null}

      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-[11px]">
        <HoverTooltip content="Zoom out">
          <button
            type="button"
            className="h-5 w-5 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onZoomOut}
            data-testid="button-zoom-out"
          >
            -
          </button>
        </HoverTooltip>
        <span className="w-11 text-center font-mono text-muted-foreground">{zoom}%</span>
        <HoverTooltip content="Zoom in">
          <button
            type="button"
            className="h-5 w-5 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onZoomIn}
            data-testid="button-zoom-in"
          >
            +
          </button>
        </HoverTooltip>
        <HoverTooltip content="Reset zoom & pan">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            type="button"
            onClick={onResetZoom}
            data-testid="button-fit-screen"
          >
            <Maximize2 size={11} />
          </Button>
        </HoverTooltip>
      </div>

      <Separator orientation="vertical" className="h-5" />

      <HoverTooltip content="Undo" disabled={undoDisabled}>
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
      </HoverTooltip>
      <HoverTooltip content="Redo" disabled={redoDisabled}>
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
      </HoverTooltip>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          type="button"
          onClick={onNew}
          disabled={newDisabled}
          data-testid="button-new-whiteboard"
        >
          <Plus size={12} /> New
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          type="button"
          onClick={onClear}
          disabled={clearDisabled}
          data-testid="button-clear-whiteboard"
        >
          <Trash2 size={12} /> Clear
        </Button>
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
