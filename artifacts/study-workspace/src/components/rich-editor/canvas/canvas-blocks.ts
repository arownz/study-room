import { htmlToPlainText } from "../html-plain-text";

export type CanvasBlockType = "text" | "image" | "ink";

export type TextCanvasBlock = {
  id: string;
  type: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  html?: string;
};

export type ImageCanvasBlock = {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  z: number;
  src?: string;
};

export type InkCanvasBlock = {
  id: string;
  type: "ink";
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  points: [number, number][];
  color: string;
  strokeWidth: number;
  opacity: number;
};

export type CanvasBlock = TextCanvasBlock | ImageCanvasBlock | InkCanvasBlock;

export const CANVAS_MARKER = "data-note-canvas";

export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDeterministicTextBlock(id: string, x: number, y: number, html = ""): TextCanvasBlock {
  return { id, type: "text", x, y, width: 680, height: 260, z: 1, html };
}

export function createTextBlock(x: number, y: number, html = ""): TextCanvasBlock {
  return { id: uid("text"), type: "text", x, y, width: 680, height: 260, z: 1, html };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttr(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export interface InkPayload {
  points: [number, number][];
  color: string;
  strokeWidth: number;
  opacity: number;
}

function pointsToPathD(points: [number, number][]): string {
  if (points.length === 0) return "";
  const [x0, y0] = points[0];
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  return d;
}

export function serializeCanvas(blocks: CanvasBlock[]): string {
  const parts = blocks.map((block) => {
    const style = `left:${Math.round(block.x)}px;top:${Math.round(block.y)}px;width:${Math.round(block.width)}px;z-index:${block.z};position:absolute;`;
    if (block.type === "image") {
      return `<div data-note-block="image" data-id="${block.id}" style="${style}"><img src="${escapeHtml(block.src ?? "")}" alt="" /></div>`;
    }
    if (block.type === "ink") {
      const bw = Math.max(8, Math.round(block.width));
      const bh = Math.max(8, Math.round(block.height));
      const payload: InkPayload = {
        points: block.points,
        color: block.color,
        strokeWidth: block.strokeWidth,
        opacity: block.opacity,
      };
      const enc = escapeHtmlAttr(JSON.stringify(payload));
      const d = escapeHtmlAttr(pointsToPathD(block.points));
      return `<div data-note-block="ink" data-id="${block.id}" data-ink="${enc}" style="${style}height:${bh}px;"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${bw} ${bh}" preserveAspectRatio="none" style="display:block;overflow:visible"><path d="${d}" fill="none" stroke="${escapeHtmlAttr(block.color)}" stroke-width="${block.strokeWidth}" stroke-opacity="${block.opacity}" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
    }
    return `<div data-note-block="text" data-id="${block.id}" style="${style}height:${Math.round(block.height)}px;">${block.html || "<p></p>"}</div>`;
  });
  return `<div ${CANVAS_MARKER}="1" style="position:relative;min-height:100%;">${parts.join("")}</div>`;
}

export function parseCanvas(html: string): CanvasBlock[] {
  if (!html.trim()) return [];
  if (typeof window === "undefined") {
    return [createDeterministicTextBlock("legacy-text-0", 48, 48, `<p>${escapeHtml(htmlToPlainText(html))}</p>`)];
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.querySelector(`[${CANVAS_MARKER}]`);
  if (!root) return [createDeterministicTextBlock("legacy-text-0", 48, 48, html)];
  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-note-block]"));
  return els.map((el, idx) => {
    const type = (el.getAttribute("data-note-block") ?? "text") as CanvasBlockType;
    const x = Number.parseFloat(el.style.left || "48") || 48;
    const y = Number.parseFloat(el.style.top || "48") || 48;
    const width = Number.parseFloat(el.style.width || "520") || 520;
    const height = Number.parseFloat(el.style.height || "260") || 260;
    const z = Number.parseInt(el.style.zIndex || `${idx + 1}`, 10) || idx + 1;
    const id = el.getAttribute("data-id") ?? uid("block");
    if (type === "image") {
      const img = el.querySelector("img");
      return { id, type: "image", x, y, width, z, src: img?.getAttribute("src") ?? "" };
    }
    if (type === "ink") {
      const raw = el.getAttribute("data-ink");
      let points: [number, number][] = [];
      let color = "#0f172a";
      let strokeWidth = 2;
      let opacity = 1;
      try {
        if (raw) {
          const p = JSON.parse(raw) as Partial<InkPayload>;
          if (Array.isArray(p.points)) {
            points = p.points.filter(
              (pt): pt is [number, number] =>
                Array.isArray(pt) && pt.length === 2 && typeof pt[0] === "number" && typeof pt[1] === "number",
            );
          }
          if (typeof p.color === "string") color = p.color;
          if (typeof p.strokeWidth === "number") strokeWidth = p.strokeWidth;
          if (typeof p.opacity === "number") opacity = p.opacity;
        }
      } catch {
        /* ignore */
      }
      const height = Number.parseFloat(el.style.height || "48") || 48;
      return { id, type: "ink", x, y, width, height, z, points, color, strokeWidth, opacity };
    }
    return { id, type: "text", x, y, width, height, z, html: el.innerHTML };
  });
}
