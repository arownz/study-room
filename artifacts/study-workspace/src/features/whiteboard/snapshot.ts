import type { BoardState, StickyItem, StrokeItem, BoardShape, Viewport } from "./types";
import { capStrokePoints } from "./stroke-utils";

interface SnapshotV1 {
  version: 1;
  zoom?: number;
  stickies?: StickyItem[];
}

const ZOOM_MIN = 40;
const ZOOM_MAX = 200;

function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return 100;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z)));
}

function isStickyArray(v: unknown): v is StickyItem[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (s) =>
      s &&
      typeof s === "object" &&
      typeof (s as StickyItem).id === "string" &&
      typeof (s as StickyItem).x === "number" &&
      typeof (s as StickyItem).y === "number" &&
      typeof (s as StickyItem).text === "string" &&
      typeof (s as StickyItem).colorIdx === "number" &&
      typeof (s as StickyItem).rotation === "number",
  );
}

function isViewport(v: unknown): v is Viewport {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.zoom === "number" &&
    typeof o.panX === "number" &&
    typeof o.panY === "number"
  );
}

function isStrokeItem(v: unknown): v is StrokeItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.color !== "string") return false;
  if (typeof o.width !== "number" || typeof o.opacity !== "number") return false;
  if (!Array.isArray(o.points)) return false;
  return o.points.every(
    (p) => Array.isArray(p) && p.length === 2 && typeof p[0] === "number" && typeof p[1] === "number",
  );
}

function isBoardShape(v: unknown): v is BoardShape {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.kind !== "string" || typeof o.id !== "string") return false;
  if (o.kind === "label") {
    return (
      typeof o.x === "number" &&
      typeof o.y === "number" &&
      typeof o.w === "number" &&
      typeof o.h === "number" &&
      typeof o.text === "string" &&
      typeof o.color === "string"
    );
  }
  if (o.kind === "line") {
    return (
      typeof o.x === "number" &&
      typeof o.y === "number" &&
      typeof o.w === "number" &&
      typeof o.h === "number" &&
      typeof o.stroke === "string" &&
      typeof o.strokeWidth === "number"
    );
  }
  if (o.kind === "rect" || o.kind === "ellipse") {
    return (
      typeof o.x === "number" &&
      typeof o.y === "number" &&
      typeof o.w === "number" &&
      typeof o.h === "number" &&
      typeof o.stroke === "string" &&
      typeof o.fill === "string" &&
      typeof o.strokeWidth === "number"
    );
  }
  return false;
}

function parseShapes(raw: unknown): BoardShape[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isBoardShape);
}

function parseStrokes(raw: unknown): StrokeItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isStrokeItem);
}

export function emptyBoardState(): BoardState {
  return {
    version: 2,
    viewport: { zoom: 100, panX: 0, panY: 0 },
    stickies: [],
    strokes: [],
    shapes: [],
  };
}

export function parseSnapshot(raw: string): BoardState {
  if (!raw || typeof raw !== "string") return emptyBoardState();
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (p.version === 2 && isViewport(p.viewport) && isStickyArray(p.stickies)) {
      return {
        version: 2,
        viewport: {
          zoom: clampZoom(p.viewport.zoom),
          panX: Number.isFinite(p.viewport.panX) ? p.viewport.panX : 0,
          panY: Number.isFinite(p.viewport.panY) ? p.viewport.panY : 0,
        },
        stickies: p.stickies,
        strokes: parseStrokes(p.strokes),
        shapes: parseShapes(p.shapes),
      };
    }
    const v1 = p as Partial<SnapshotV1>;
    if (v1.version === 1 && isStickyArray(v1.stickies)) {
      const zoom = typeof v1.zoom === "number" ? clampZoom(v1.zoom) : 100;
      return {
        version: 2,
        viewport: { zoom, panX: 0, panY: 0 },
        stickies: v1.stickies,
        strokes: [],
        shapes: [],
      };
    }
  } catch {
    /* ignore */
  }
  return emptyBoardState();
}

function normalizeShapeForPersist(sh: BoardShape): BoardShape {
  const id = sh.id.slice(0, 128);
  if (sh.kind === "label") {
    return {
      ...sh,
      id,
      text: sh.text.slice(0, 4000),
      color: sh.color.slice(0, 64),
    };
  }
  if (sh.kind === "line") {
    return {
      ...sh,
      id,
      stroke: sh.stroke.slice(0, 64),
      strokeWidth: Math.min(128, Math.max(0.25, sh.strokeWidth)),
    };
  }
  return {
    ...sh,
    id,
    stroke: sh.stroke.slice(0, 64),
    fill: sh.fill.slice(0, 64),
    strokeWidth: Math.min(128, Math.max(0.25, sh.strokeWidth)),
  };
}

export function serializeBoard(state: BoardState): string {
  const safe: BoardState = {
    version: 2,
    viewport: {
      zoom: clampZoom(state.viewport.zoom),
      panX: Number.isFinite(state.viewport.panX) ? state.viewport.panX : 0,
      panY: Number.isFinite(state.viewport.panY) ? state.viewport.panY : 0,
    },
    stickies: state.stickies.map((s) => ({
      ...s,
      id: s.id.slice(0, 64),
      text: s.text.slice(0, 4000),
      colorIdx: Math.min(32, Math.max(0, Math.round(s.colorIdx))),
      rotation: Number.isFinite(s.rotation) ? s.rotation : 0,
      x: Number.isFinite(s.x) ? s.x : 0,
      y: Number.isFinite(s.y) ? s.y : 0,
    })),
    strokes: state.strokes.map((st) => ({
      ...st,
      id: st.id.slice(0, 128),
      color: st.color.slice(0, 64),
      width: Math.min(128, Math.max(0.25, st.width)),
      opacity: Math.min(1, Math.max(0, st.opacity)),
      points: capStrokePoints(st.points, 12_000),
    })),
    shapes: state.shapes.map(normalizeShapeForPersist),
  };
  return JSON.stringify(safe satisfies BoardState);
}

export const SNAPSHOT_BYTES_WARN = 480_000;
