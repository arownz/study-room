import type { BoardState, BoardShape, Selection } from "./types";
import { minDistanceToPolyline } from "./stroke-utils";

const STICKY_W = 176;
const STICKY_H = 100;
const LINE_HIT = 10;

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

function pointInNormalizedRect(
  bx: number,
  by: number,
  minx: number,
  maxx: number,
  miny: number,
  maxy: number,
): boolean {
  return bx >= minx && bx <= maxx && by >= miny && by <= maxy;
}

function pointInEllipse(bx: number, by: number, minx: number, maxx: number, miny: number, maxy: number): boolean {
  const cx = (minx + maxx) / 2;
  const cy = (miny + maxy) / 2;
  const rx = (maxx - minx) / 2;
  const ry = (maxy - miny) / 2;
  if (rx <= 0 || ry <= 0) return false;
  const u = (bx - cx) / rx;
  const v = (by - cy) / ry;
  return u * u + v * v <= 1.02;
}

function hitShape(sh: BoardShape, bx: number, by: number): boolean {
  if (sh.kind === "line") {
    const d = minDistanceToPolyline(bx, by, [
      [sh.x, sh.y],
      [sh.x + sh.w, sh.y + sh.h],
    ]);
    return d < LINE_HIT;
  }
  const { minx, maxx, miny, maxy } = normalizeRect(sh.x, sh.y, sh.w, sh.h);
  if (sh.kind === "ellipse") {
    return pointInEllipse(bx, by, minx, maxx, miny, maxy);
  }
  return pointInNormalizedRect(bx, by, minx, maxx, miny, maxy);
}

/** Board-space hit test; later items draw on top for shapes/strokes. */
export function hitTestBoard(state: BoardState, bx: number, by: number): Selection {
  for (let i = state.stickies.length - 1; i >= 0; i--) {
    const s = state.stickies[i];
    if (bx >= s.x && bx <= s.x + STICKY_W && by >= s.y && by <= s.y + STICKY_H) {
      return { kind: "sticky", id: s.id };
    }
  }
  for (let i = state.shapes.length - 1; i >= 0; i--) {
    const sh = state.shapes[i];
    if (hitShape(sh, bx, by)) {
      return { kind: "shape", id: sh.id };
    }
  }
  for (let i = state.strokes.length - 1; i >= 0; i--) {
    const st = state.strokes[i];
    const tol = Math.max(12, st.width * 1.5);
    if (minDistanceToPolyline(bx, by, st.points) < tol) {
      return { kind: "stroke", id: st.id };
    }
  }
  return null;
}
