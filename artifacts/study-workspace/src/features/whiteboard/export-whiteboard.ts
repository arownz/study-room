import type { BoardState, BoardShape, StickyItem, StrokeItem } from "./types";
import { pointsToPathD } from "./stroke-utils";

const STICKY_W = 176;
const STICKY_H = 100;

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function computeBounds(state: BoardState): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = 0;
  let minY = 0;
  let maxX = 1200;
  let maxY = 800;

  const extend = (x: number, y: number, w: number, h: number) => {
    const x2 = x + w;
    const y2 = y + h;
    minX = Math.min(minX, x, x2);
    minY = Math.min(minY, y, y2);
    maxX = Math.max(maxX, x, x2);
    maxY = Math.max(maxY, y, y2);
  };

  for (const s of state.stickies) {
    extend(s.x, s.y, STICKY_W, STICKY_H);
  }
  for (const sh of state.shapes) {
    extend(sh.x, sh.y, sh.w, sh.h);
  }
  for (const st of state.strokes) {
    for (const [px, py] of st.points) {
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
  }
  return { minX, minY, maxX, maxY };
}

function shapeToSvg(sh: BoardShape, ox: number, oy: number): string {
  const x = sh.x + ox;
  const y = sh.y + oy;
  if (sh.kind === "rect") {
    const w = sh.w;
    const h = sh.h;
    const rx = Math.min(Math.abs(w), Math.abs(h)) * 0.02;
    return `<rect x="${Math.min(x, x + w)}" y="${Math.min(y, y + h)}" width="${Math.abs(w)}" height="${Math.abs(h)}" rx="${rx}" fill="${escapeAttr(sh.fill)}" stroke="${escapeAttr(sh.stroke)}" stroke-width="${sh.strokeWidth}"/>`;
  }
  if (sh.kind === "ellipse") {
    const cx = x + sh.w / 2;
    const cy = y + sh.h / 2;
    const rx = Math.abs(sh.w) / 2;
    const ry = Math.abs(sh.h) / 2;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${escapeAttr(sh.fill)}" stroke="${escapeAttr(sh.stroke)}" stroke-width="${sh.strokeWidth}"/>`;
  }
  if (sh.kind === "line") {
    return `<line x1="${x}" y1="${y}" x2="${x + sh.w}" y2="${y + sh.h}" stroke="${escapeAttr(sh.stroke)}" stroke-width="${sh.strokeWidth}" stroke-linecap="round"/>`;
  }
  return `<foreignObject x="${x}" y="${y}" width="${Math.max(80, Math.abs(sh.w))}" height="${Math.max(40, Math.abs(sh.h))}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:12px system-ui;color:${escapeAttr(sh.color)}">${escapeXml(sh.text)}</div></foreignObject>`;
}

function stickyToSvg(s: StickyItem, ox: number, oy: number): string {
  const x = s.x + ox;
  const y = s.y + oy;
  const bg = ["#fde68a", "#bae6fd", "#fecdd3", "#bbf7d0", "#ddd6fe"][s.colorIdx % 5] ?? "#fde68a";
  const text = escapeXml(s.text.replace(/\n/g, " "));
  return `<g transform="translate(${x},${y}) rotate(${s.rotation})"><rect width="${STICKY_W}" height="${STICKY_H}" fill="${bg}" stroke="#00000022" rx="4"/><text x="12" y="22" font-size="11" font-family="system-ui,sans-serif" fill="#1c1917">${text}</text></g>`;
}

function strokeToSvg(s: StrokeItem, ox: number, oy: number): string {
  const shifted: [number, number][] = s.points.map(([px, py]) => [px + ox, py + oy]);
  const d = pointsToPathD(shifted);
  if (!d) return "";
  return `<path d="${escapeAttr(d)}" stroke="${escapeAttr(s.color)}" stroke-width="${s.width}" fill="none" stroke-opacity="${s.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function boardToSvgString(state: BoardState): string {
  const pad = 48;
  const { minX, minY, maxX, maxY } = computeBounds(state);
  const width = Math.max(400, maxX - minX + pad * 2);
  const height = Math.max(300, maxY - minY + pad * 2);
  const ox = -minX + pad;
  const oy = -minY + pad;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  );
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`);
  for (const st of state.strokes) {
    parts.push(strokeToSvg(st, ox, oy));
  }
  for (const sh of state.shapes) {
    parts.push(shapeToSvg(sh, ox, oy));
  }
  for (const s of state.stickies) {
    parts.push(stickyToSvg(s, ox, oy));
  }
  parts.push(`</svg>`);
  return parts.join("");
}

export function downloadBlob(filename: string, mime: string, body: string): void {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
