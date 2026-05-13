import { emptyBoardState } from "./snapshot";
import { minDistanceToPolyline } from "./stroke-utils";
import type { BoardState, Selection, StrokeItem } from "./types";

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
