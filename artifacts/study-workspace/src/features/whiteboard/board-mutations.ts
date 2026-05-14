import { emptyBoardState } from "./snapshot";
import { minDistanceToPolyline } from "./stroke-utils";
import type { BoardShape, BoardState, Selection, StrokeItem } from "./types";

const STICKY_W = 176;
const STICKY_H = 100;

export function cloneBoard(b: BoardState): BoardState {
  return structuredClone(b);
}

export function applyDragFromSnapshot(
  snap: BoardState,
  kind: "shape" | "stroke",
  id: string,
  dx: number,
  dy: number,
): BoardState {
  const next = cloneBoard(snap);
  if (kind === "stroke") {
    const st0 = next.strokes.find((s) => s.id === id);
    if (!st0) return next;
    next.strokes = next.strokes.map((st) =>
      st.id === id
        ? {
            ...st0,
            points: st0.points.map(([px, py]) => [px + dx, py + dy] as [number, number]),
          }
        : st,
    );
    return next;
  }
  const sh0 = next.shapes.find((s) => s.id === id);
  if (!sh0) return next;
  next.shapes = next.shapes.map((sh) =>
    sh.id === id ? { ...sh0, x: sh0.x + dx, y: sh0.y + dy } : sh,
  );
  return next;
}

export function deleteSelectionFromBoard(state: BoardState, selection: Exclude<Selection, null>): BoardState {
  if (selection.kind === "sticky") {
    return {
      ...state,
      stickies: state.stickies.filter((sticky) => sticky.id !== selection.id),
    };
  }
  if (selection.kind === "stroke") {
    return {
      ...state,
      strokes: state.strokes.filter((stroke) => stroke.id !== selection.id),
    };
  }
  return {
    ...state,
    shapes: state.shapes.filter((shape) => shape.id !== selection.id),
  };
}

export function clearBoardObjects(state: BoardState, options?: { resetViewport?: boolean }): BoardState {
  return {
    ...(options?.resetViewport ? emptyBoardState() : state),
    stickies: [],
    strokes: [],
    shapes: [],
    viewport: options?.resetViewport ? emptyBoardState().viewport : state.viewport,
  };
}

function splitStrokeByEraser(
  stroke: StrokeItem,
  bx: number,
  by: number,
  radius: number,
): StrokeItem[] {
  if (stroke.points.length < 2) {
    return minDistanceToPolyline(bx, by, stroke.points) <= radius ? [] : [stroke];
  }

  const nextSegments: [number, number][][] = [];
  let current: [number, number][] = [];

  for (let index = 0; index < stroke.points.length - 1; index += 1) {
    const a = stroke.points[index]!;
    const b = stroke.points[index + 1]!;
    const hit = minDistanceToPolyline(bx, by, [a, b]) <= radius;

    if (hit) {
      if (current.length >= 2) {
        nextSegments.push(current);
      }
      current = [];
      continue;
    }

    if (current.length === 0) {
      current.push(a);
    }
    current.push(b);
  }

  if (current.length >= 2) {
    nextSegments.push(current);
  }

  if (nextSegments.length === 1 && nextSegments[0]!.length === stroke.points.length) {
    return [stroke];
  }

  return nextSegments.map((points, index) => ({
    ...stroke,
    id: index === 0 ? stroke.id : `${stroke.id}-erase-${index}`,
    points,
  }));
}

export function eraseStrokeSegmentsFromBoard(
  state: BoardState,
  bx: number,
  by: number,
  radius: number,
): BoardState {
  let changed = false;
  const strokes = state.strokes.flatMap((stroke) => {
    const next = splitStrokeByEraser(stroke, bx, by, radius);
    if (next.length !== 1 || next[0]?.points !== stroke.points) {
      if (next.length !== 1 || next[0]?.id !== stroke.id || next[0]?.points.length !== stroke.points.length) {
        changed = true;
      }
    }
    return next;
  });

  if (!changed) {
    return state;
  }

  return {
    ...state,
    strokes,
  };
}

function normalizeRect(x: number, y: number, w: number, h: number) {
  const x2 = x + w;
  const y2 = y + h;
  return {
    minx: Math.min(x, x2),
    maxx: Math.max(x, x2),
    miny: Math.min(y, y2),
    maxy: Math.max(y, y2),
  };
}

function pointInExpandedRect(
  bx: number,
  by: number,
  minx: number,
  maxx: number,
  miny: number,
  maxy: number,
  radius: number,
): boolean {
  return (
    bx >= minx - radius &&
    bx <= maxx + radius &&
    by >= miny - radius &&
    by <= maxy + radius
  );
}

function pointInExpandedEllipse(
  bx: number,
  by: number,
  minx: number,
  maxx: number,
  miny: number,
  maxy: number,
  radius: number,
): boolean {
  const cx = (minx + maxx) / 2;
  const cy = (miny + maxy) / 2;
  const rx = Math.max(1, (maxx - minx) / 2 + radius);
  const ry = Math.max(1, (maxy - miny) / 2 + radius);
  const u = (bx - cx) / rx;
  const v = (by - cy) / ry;
  return u * u + v * v <= 1;
}

function shapeTouchedByEraser(shape: BoardShape, bx: number, by: number, radius: number): boolean {
  if (shape.kind === "line") {
    return (
      minDistanceToPolyline(bx, by, [
        [shape.x, shape.y],
        [shape.x + shape.w, shape.y + shape.h],
      ]) <= Math.max(radius, shape.strokeWidth + 2)
    );
  }

  const { minx, maxx, miny, maxy } = normalizeRect(shape.x, shape.y, shape.w, shape.h);
  if (shape.kind === "ellipse") {
    return pointInExpandedEllipse(bx, by, minx, maxx, miny, maxy, radius);
  }
  return pointInExpandedRect(bx, by, minx, maxx, miny, maxy, radius);
}

export function eraseBoardObjectsAtPoint(
  state: BoardState,
  bx: number,
  by: number,
  radius: number,
): BoardState {
  const afterStrokes = eraseStrokeSegmentsFromBoard(state, bx, by, radius);
  const stickies = afterStrokes.stickies.filter(
    (sticky) => !pointInExpandedRect(bx, by, sticky.x, sticky.x + STICKY_W, sticky.y, sticky.y + STICKY_H, radius),
  );
  const shapes = afterStrokes.shapes.filter((shape) => !shapeTouchedByEraser(shape, bx, by, radius));

  const stickiesChanged = stickies.length !== afterStrokes.stickies.length;
  const shapesChanged = shapes.length !== afterStrokes.shapes.length;

  if (!stickiesChanged && !shapesChanged) {
    return afterStrokes;
  }

  return {
    ...afterStrokes,
    stickies,
    shapes,
  };
}
