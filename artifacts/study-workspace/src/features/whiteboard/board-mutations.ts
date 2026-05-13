import type { BoardState } from "./types";

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
