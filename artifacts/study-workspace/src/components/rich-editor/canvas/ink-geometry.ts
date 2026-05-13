/** Minimal geometry for note-canvas ink (keeps rich-editor decoupled from whiteboard feature). */

export function minDistanceToPolyline(px: number, py: number, points: [number, number][]): number {
  if (points.length === 0) return Infinity;
  if (points.length === 1) return Math.hypot(px - points[0][0], py - points[0][1]);
  let min = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const d = distanceToSegment(px, py, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    if (d < min) min = d;
  }
  return min;
}

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  return Math.hypot(px - qx, py - qy);
}

export function simplifyRdp(points: [number, number][], epsilon: number): [number, number][] {
  if (points.length <= 2) return points;
  const sqEps = epsilon * epsilon;
  const distSq = (px: number, py: number, ax: number, ay: number, bx: number, by: number): number => {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) return (px - ax) ** 2 + (py - ay) ** 2;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    return (px - qx) ** 2 + (py - qy) ** 2;
  };
  const rdp = (pts: [number, number][]): [number, number][] => {
    if (pts.length <= 2) return pts;
    let maxD = 0;
    let idx = 0;
    const a = pts[0];
    const b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
      const d = distSq(pts[i][0], pts[i][1], a[0], a[1], b[0], b[1]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > sqEps) {
      const left = rdp(pts.slice(0, idx + 1));
      const right = rdp(pts.slice(idx));
      return [...left.slice(0, -1), ...right];
    }
    return [pts[0], pts[pts.length - 1]];
  };
  return rdp(points);
}

export function pointsToPathD(points: [number, number][]): string {
  if (points.length === 0) return "";
  const [x0, y0] = points[0];
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  return d;
}
