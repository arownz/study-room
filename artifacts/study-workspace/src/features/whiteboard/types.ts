export interface StickyItem {
  id: string;
  x: number;
  y: number;
  text: string;
  colorIdx: number;
  rotation: number;
}

export interface StrokeItem {
  id: string;
  points: [number, number][];
  color: string;
  width: number;
  opacity: number;
}

export type BoardShapeKind = "rect" | "ellipse" | "line" | "label";

export interface RectShape {
  kind: "rect";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
}

export interface EllipseShape {
  kind: "ellipse";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
}

export interface LineShape {
  kind: "line";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  stroke: string;
  strokeWidth: number;
}

export interface LabelShape {
  kind: "label";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
}

export type BoardShape = RectShape | EllipseShape | LineShape | LabelShape;

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface BoardState {
  version: 2;
  viewport: Viewport;
  stickies: StickyItem[];
  strokes: StrokeItem[];
  shapes: BoardShape[];
}

export type WhiteboardTool =
  | "select"
  | "pan"
  | "erase"
  | "sticky"
  | "text"
  | "rect"
  | "circle"
  | "line"
  | "pen"
  | "highlighter";

export type Selection =
  | { kind: "shape"; id: string }
  | { kind: "stroke"; id: string }
  | { kind: "sticky"; id: string }
  | null;

export const STICKY_PALETTE = [
  { bg: "bg-amber-300/90", text: "text-amber-950" },
  { bg: "bg-sky-300/90", text: "text-sky-950" },
  { bg: "bg-rose-300/90", text: "text-rose-950" },
  { bg: "bg-emerald-300/90", text: "text-emerald-950" },
  { bg: "bg-violet-300/90", text: "text-violet-950" },
] as const;

export const DEFAULT_PEN_COLOR = "#0f172a";
export const DEFAULT_HIGHLIGHTER_COLOR = "#eab308";
