import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MoveDiagonal2, Trash2 } from "lucide-react";
import { useGetWhiteboard, useUpdateWhiteboard } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import {
  applyDragFromSnapshot,
  clearBoardObjects,
  cloneBoard,
  deleteSelectionFromBoard,
  eraseBoardObjectsAtPoint,
} from "../board-mutations";
import { boardToSvgString, downloadBlob } from "../export-whiteboard";
import { hitTestBoard } from "../hit-test-board";
import { emptyBoardState, parseSnapshot, serializeBoard, SNAPSHOT_BYTES_WARN } from "../snapshot";
import { capStrokePoints, simplifyRdp } from "../stroke-utils";
import {
  DEFAULT_HIGHLIGHTER_COLOR,
  DEFAULT_PEN_COLOR,
  STICKY_PALETTE,
  type BoardShape,
  type BoardState,
  type LabelShape,
  type Selection,
  type StrokeItem,
  type WhiteboardTool,
} from "../types";
import { WhiteboardToolbar } from "./WhiteboardToolbar";

const LOCAL_DRAFT_KEY_PREFIX = "studyroom.whiteboard.draft:";
const MAX_UNDO = 80;
const STICKY_W = 176;
const STICKY_H = 100;
const WHITEBOARD_AUTOSAVE_MS = 1500;

interface WhiteboardWorkbenchProps {
  whiteboardId: string;
  onDirtyChange?: (dirty: boolean) => void;
  onCreateRequested?: () => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function WhiteboardWorkbench({
  whiteboardId,
  onDirtyChange,
  onCreateRequested,
}: WhiteboardWorkbenchProps) {
  const { toast } = useToast();
  const { data: boardEnvelope, isLoading, isError, refetch } = useGetWhiteboard(whiteboardId);
  const updateBoard = useUpdateWhiteboard();

  const [board, setBoard] = useState<BoardState>(emptyBoardState);
  const [title, setTitle] = useState("Untitled Whiteboard");
  const [activeTool, setActiveTool] = useState<WhiteboardTool>("select");
  const [selection, setSelection] = useState<Selection>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [undoStack, setUndoStack] = useState<BoardState[]>([]);
  const [redoStack, setRedoStack] = useState<BoardState[]>([]);

  const [draggingSticky, setDraggingSticky] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [draftStroke, setDraftStroke] = useState<StrokeItem | null>(null);
  const [shapePreview, setShapePreview] = useState<{
    kind: "rect" | "ellipse" | "line";
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [penSize, setPenSize] = useState(2.2);
  const [highlighterSize, setHighlighterSize] = useState(14);
  const [eraserSize, setEraserSize] = useState(18);
  const [eraserPreview, setEraserPreview] = useState<[number, number] | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);
  const pinchRef = useRef<{ initialDistance: number; initialZoom: number } | null>(null);

  const panDragRef = useRef<{ sx: number; sy: number; panX: number; panY: number } | null>(null);
  const panSnapshotRef = useRef<BoardState | null>(null);

  const shapeCreateRef = useRef<{
    kind: "rect" | "ellipse" | "line";
    x0: number;
    y0: number;
  } | null>(null);

  const moveRef = useRef<{
    kind: "shape" | "stroke";
    id: string;
    startBx: number;
    startBy: number;
    snapshot: BoardState;
  } | null>(null);
  const moveChangedRef = useRef(false);

  const stickyDragSnapshotRef = useRef<BoardState | null>(null);
  const labelResizeRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startW: number;
    startH: number;
    snapshot: BoardState;
    changed: boolean;
  } | null>(null);
  const eraseSessionRef = useRef<{
    snapshot: BoardState;
    lastPoint: [number, number];
    changed: boolean;
  } | null>(null);

  const boardRef = useRef(board);
  boardRef.current = board;
  const titleRef = useRef(title);
  titleRef.current = title;
  const lastSavedKeyRef = useRef<string | null>(null);

  const draftKey = `${LOCAL_DRAFT_KEY_PREFIX}${whiteboardId}`;

  const commitBoard = useCallback((updater: (prev: BoardState) => BoardState) => {
    setBoard((prev) => {
      const next = updater(prev);
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        setUndoStack((u) => [...u.slice(-(MAX_UNDO - 1)), cloneBoard(prev)]);
        setRedoStack([]);
        if (hydratedRef.current) setHasLocalChanges(true);
      }
      return next;
    });
  }, []);

  const hydrateOnce = useCallback(() => {
    if (!boardEnvelope?.success || hydratedRef.current) return;
    try {
      const draftRaw = window.localStorage.getItem(draftKey);
      if (draftRaw) {
        const parsed = JSON.parse(draftRaw) as { title?: string; snapshot?: string; version?: number };
        const legacySnapshot =
          parsed && typeof parsed === "object" && "version" in parsed ? draftRaw : undefined;
        const nextBoard = parseSnapshot(parsed.snapshot ?? legacySnapshot ?? boardEnvelope.data.snapshot);
        const nextTitle = parsed.title ?? boardEnvelope.data.title;
        setBoard(nextBoard);
        setTitle(nextTitle);
        setHasLocalChanges(true);
        lastSavedKeyRef.current = null;
        hydratedRef.current = true;
        return;
      }
    } catch {
      /* ignore corrupted local draft */
    }
    const nextBoard = parseSnapshot(boardEnvelope.data.snapshot);
    const nextTitle = boardEnvelope.data.title;
    setBoard(nextBoard);
    setTitle(nextTitle);
    lastSavedKeyRef.current = JSON.stringify([nextTitle.trim() || "Untitled Whiteboard", boardEnvelope.data.snapshot]);
    hydratedRef.current = true;
  }, [boardEnvelope, draftKey]);

  useEffect(() => {
    hydratedRef.current = false;
    setHasLocalChanges(false);
    setSelection(null);
    setUndoStack([]);
    setRedoStack([]);
    setBoard(emptyBoardState());
    setTitle("Untitled Whiteboard");
    hydrateOnce();
  }, [hydrateOnce, whiteboardId]);

  useEffect(() => {
    if (!hasLocalChanges) {
      setTitle(boardEnvelope?.data.title ?? "Untitled Whiteboard");
    }
  }, [boardEnvelope?.data.title, hasLocalChanges]);

  useEffect(() => {
    if (activeTool !== "erase") {
      setEraserPreview(null);
    }
  }, [activeTool]);

  useEffect(() => {
    if (!hydratedRef.current || !hasLocalChanges) return;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        title,
        snapshot: serializeBoard(board),
      }),
    );
  }, [board, draftKey, hasLocalChanges, title]);

  useEffect(() => {
    return () => {
      if (!hasLocalChanges) return;
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({
          title: titleRef.current,
          snapshot: serializeBoard(boardRef.current),
        }),
      );
    };
  }, [draftKey, hasLocalChanges]);

  const saveBoardState = useCallback(async (
    nextBoard: BoardState,
    options?: { silent?: boolean; titleOverride?: string },
  ) => {
    const nextTitle = options?.titleOverride ?? titleRef.current;
    const snapshot = serializeBoard(nextBoard);
    const normalizedTitle = nextTitle.trim() || "Untitled Whiteboard";
    const saveKey = JSON.stringify([normalizedTitle, snapshot]);
    lastSavedKeyRef.current = saveKey;
    if (snapshot.length > SNAPSHOT_BYTES_WARN) {
      toast({
        title: "Snapshot very large",
        description: "Consider simplifying strokes before saving.",
        variant: "destructive",
      });
    }
    try {
      await updateBoard.mutateAsync({
        whiteboardId,
        data: {
          title: normalizedTitle,
          snapshot,
        },
      });
      window.localStorage.removeItem(draftKey);
      setHasLocalChanges(false);
    } catch (error) {
      if (lastSavedKeyRef.current === saveKey) {
        lastSavedKeyRef.current = null;
      }
      toast({
        title: options?.silent ? "Auto-save failed" : "Failed to save whiteboard",
        variant: "destructive",
      });
      throw error;
    }
  }, [draftKey, toast, updateBoard, whiteboardId]);

  const handleSave = useCallback(async (options?: { silent?: boolean }) => {
    try {
      await saveBoardState(boardRef.current, { silent: options?.silent, titleOverride: titleRef.current });
    } catch {
      /* toast already shown in saveBoardState */
    }
  }, [saveBoardState]);

  useEffect(() => {
    onDirtyChange?.(hasLocalChanges);
  }, [hasLocalChanges, onDirtyChange]);

  useEffect(() => {
    if (!hydratedRef.current || !hasLocalChanges || updateBoard.isPending) return;
    const normalizedTitle = title.trim() || "Untitled Whiteboard";
    const saveKey = JSON.stringify([normalizedTitle, serializeBoard(board)]);
    if (lastSavedKeyRef.current === saveKey) return;
    const timer = window.setTimeout(() => {
      void handleSave({ silent: true });
    }, WHITEBOARD_AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [board, handleSave, hasLocalChanges, title, updateBoard.isPending]);

  const deleteSelection = useCallback(
    (target: Exclude<Selection, null>) => {
      commitBoard((prev) => deleteSelectionFromBoard(prev, target));
      setSelection((current) =>
        current && current.kind === target.kind && current.id === target.id ? null : current,
      );
    },
    [commitBoard],
  );

  const undo = useCallback(() => {
    setUndoStack((u) => {
      if (u.length === 0) return u;
      const prev = u[u.length - 1];
      setBoard((cur) => {
        setRedoStack((r) => [...r, cloneBoard(cur)]);
        return prev;
      });
      if (hydratedRef.current) setHasLocalChanges(true);
      return u.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const nxt = r[r.length - 1];
      setBoard((cur) => {
        setUndoStack((u) => [...u.slice(-(MAX_UNDO - 1)), cloneBoard(cur)]);
        return nxt;
      });
      if (hydratedRef.current) setHasLocalChanges(true);
      return r.slice(0, -1);
    });
  }, []);

  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        redo();
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        const t = event.target as HTMLElement | null;
        if (t?.closest("textarea,input,.ProseMirror")) return;
        const sel = selectionRef.current;
        if (!sel) return;
        event.preventDefault();
        deleteSelection(sel);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelection, handleSave, redo, undo]);

  const clientToBoard = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const vp = boardRef.current.viewport;
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;
    const s = vp.zoom / 100;
    return [(lx - vp.panX) / s, (ly - vp.panY) / s];
  }, []);

  const eraseAtBoardPoint = useCallback((bx: number, by: number) => {
    const current = boardRef.current;
    const next = eraseBoardObjectsAtPoint(current, bx, by, eraserSize / 2);
    if (next === current) return false;
    boardRef.current = next;
    setBoard(next);
    const selected = selectionRef.current;
    if (selected) {
      const stillExists =
        selected.kind === "stroke"
          ? next.strokes.some((stroke) => stroke.id === selected.id)
          : selected.kind === "shape"
            ? next.shapes.some((shape) => shape.id === selected.id)
            : next.stickies.some((sticky) => sticky.id === selected.id);
      if (!stillExists) {
        setSelection(null);
      }
    }
    if (hydratedRef.current) setHasLocalChanges(true);
    if (eraseSessionRef.current) eraseSessionRef.current.changed = true;
    return true;
  }, [eraserSize]);

  const eraseBetweenPoints = useCallback(
    (from: [number, number], to: [number, number]) => {
      const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
      const steps = Math.max(1, Math.ceil(distance / 8));
      let removedAny = false;
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const px = from[0] + (to[0] - from[0]) * t;
        const py = from[1] + (to[1] - from[1]) * t;
        if (eraseAtBoardPoint(px, py)) {
          removedAny = true;
        }
      }
      return removedAny;
    },
    [eraseAtBoardPoint],
  );

  const beginLabelResize = (event: React.PointerEvent, labelId: string, width: number, height: number) => {
    if (activeTool !== "select") return;
    event.preventDefault();
    event.stopPropagation();
    labelResizeRef.current = {
      id: labelId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startW: width,
      startH: height,
      snapshot: cloneBoard(boardRef.current),
      changed: false,
    };
    setSelection({ kind: "shape", id: labelId });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const endTransientPointer = useCallback(() => {
    panDragRef.current = null;
    panSnapshotRef.current = null;
    shapeCreateRef.current = null;
    moveRef.current = null;
    labelResizeRef.current = null;
    eraseSessionRef.current = null;
    moveChangedRef.current = false;
    setEraserPreview(null);
    setDraftStroke(null);
    setShapePreview(null);
  }, []);

  useEffect(() => {
    const onUp = () => setDraggingSticky(null);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onPaperPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const b = clientToBoard(e.clientX, e.clientY);
    if (!b) return;

    if (activeTool === "pan") {
      e.currentTarget.setPointerCapture(e.pointerId);
      const vp = boardRef.current.viewport;
      panDragRef.current = {
        sx: e.clientX,
        sy: e.clientY,
        panX: vp.panX,
        panY: vp.panY,
      };
      panSnapshotRef.current = cloneBoard(boardRef.current);
      return;
    }

    if (activeTool === "pen" || activeTool === "highlighter") {
      e.currentTarget.setPointerCapture(e.pointerId);
      const stroke: StrokeItem = {
        id: uid("stroke"),
        points: [b],
        color: activeTool === "pen" ? DEFAULT_PEN_COLOR : DEFAULT_HIGHLIGHTER_COLOR,
        width: activeTool === "pen" ? penSize : highlighterSize,
        opacity: activeTool === "pen" ? 1 : 0.35,
      };
      setDraftStroke(stroke);
      return;
    }

    if (activeTool === "erase") {
      e.currentTarget.setPointerCapture(e.pointerId);
      setEraserPreview(b);
      eraseSessionRef.current = {
        snapshot: cloneBoard(boardRef.current),
        lastPoint: b,
        changed: false,
      };
      eraseAtBoardPoint(b[0], b[1]);
      return;
    }

    if (activeTool === "rect" || activeTool === "circle" || activeTool === "line") {
      e.currentTarget.setPointerCapture(e.pointerId);
      const kind = activeTool === "circle" ? "ellipse" : activeTool;
      shapeCreateRef.current = { kind, x0: b[0], y0: b[1] };
      setShapePreview({ kind, x: b[0], y: b[1], w: 0, h: 0 });
      return;
    }

    if (activeTool === "text") {
      const label: LabelShape = {
        kind: "label",
        id: uid("label"),
        x: b[0] - 4,
        y: b[1] - 4,
        w: 200,
        h: 72,
        text: "Label",
        color: "#0f172a",
      };
      commitBoard((prev) => ({ ...prev, shapes: [...prev.shapes, label] }));
      setSelection({ kind: "shape", id: label.id });
      setActiveTool("select");
      return;
    }

    if (activeTool === "select") {
      const hit = hitTestBoard(boardRef.current, b[0], b[1]);
      setSelection(hit);
      if (hit?.kind === "shape" || hit?.kind === "stroke") {
        e.currentTarget.setPointerCapture(e.pointerId);
        moveRef.current = {
          kind: hit.kind,
          id: hit.id,
          startBx: b[0],
          startBy: b[1],
          snapshot: cloneBoard(boardRef.current),
        };
        moveChangedRef.current = false;
      }
    }
  };

  const onPaperPointerMove = (e: React.PointerEvent) => {
    const pan = panDragRef.current;
    if (pan) {
      const dx = e.clientX - pan.sx;
      const dy = e.clientY - pan.sy;
      setBoard((prev) => ({
        ...prev,
        viewport: { ...prev.viewport, panX: pan.panX + dx, panY: pan.panY + dy },
      }));
      if (hydratedRef.current) setHasLocalChanges(true);
      return;
    }

    const labelResize = labelResizeRef.current;
    if (labelResize) {
      const scale = boardRef.current.viewport.zoom / 100;
      const nextW = Math.max(80, labelResize.startW + (e.clientX - labelResize.startClientX) / scale);
      const nextH = Math.max(40, labelResize.startH + (e.clientY - labelResize.startClientY) / scale);
      if (Math.abs(nextW - labelResize.startW) > 0.5 || Math.abs(nextH - labelResize.startH) > 0.5) {
        labelResize.changed = true;
      }
      setBoard((prev) => ({
        ...prev,
        shapes: prev.shapes.map((shape) =>
          shape.kind === "label" && shape.id === labelResize.id
            ? { ...shape, w: nextW, h: nextH }
            : shape,
        ),
      }));
      if (hydratedRef.current) setHasLocalChanges(true);
      return;
    }

    if (draftStroke) {
      const pt = clientToBoard(e.clientX, e.clientY);
      if (!pt) return;
      setDraftStroke((prev) => {
        if (!prev) return prev;
        const last = prev.points[prev.points.length - 1];
        if (last && Math.hypot(pt[0] - last[0], pt[1] - last[1]) < 1.2) return prev;
        const nextPts = [...prev.points, pt];
        const capped = capStrokePoints(nextPts, 900);
        return { ...prev, points: capped };
      });
      return;
    }

    const eraseSession = eraseSessionRef.current;
    if (eraseSession) {
      const pt = clientToBoard(e.clientX, e.clientY);
      if (!pt) return;
      setEraserPreview(pt);
      eraseBetweenPoints(eraseSession.lastPoint, pt);
      eraseSession.lastPoint = pt;
      return;
    }

    if (activeTool === "erase") {
      const pt = clientToBoard(e.clientX, e.clientY);
      if (pt) setEraserPreview(pt);
    } else if (eraserPreview) {
      setEraserPreview(null);
    }

    const sc = shapeCreateRef.current;
    if (sc && shapePreview) {
      const pt = clientToBoard(e.clientX, e.clientY);
      if (!pt) return;
      setShapePreview({
        kind: shapePreview.kind,
        x: sc.x0,
        y: sc.y0,
        w: pt[0] - sc.x0,
        h: pt[1] - sc.y0,
      });
      return;
    }

    const mv = moveRef.current;
    if (mv) {
      const pt = clientToBoard(e.clientX, e.clientY);
      if (!pt) return;
      const dx = pt[0] - mv.startBx;
      const dy = pt[1] - mv.startBy;
      if (dx * dx + dy * dy > 0.25) moveChangedRef.current = true;
      setBoard(applyDragFromSnapshot(mv.snapshot, mv.kind, mv.id, dx, dy));
      if (hydratedRef.current) setHasLocalChanges(true);
    }
  };

  const onPaperPointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }

    if (panSnapshotRef.current && panDragRef.current) {
      const snap = panSnapshotRef.current;
      const cur = boardRef.current;
      if (JSON.stringify(snap.viewport) !== JSON.stringify(cur.viewport)) {
        setUndoStack((u) => [...u.slice(-(MAX_UNDO - 1)), snap]);
        setRedoStack([]);
      }
      panSnapshotRef.current = null;
    }

    if (draftStroke && draftStroke.points.length >= 2) {
      let pts = simplifyRdp(draftStroke.points, 2.4);
      pts = capStrokePoints(pts, 600);
      const finalStroke: StrokeItem = { ...draftStroke, points: pts };
      commitBoard((prev) => ({ ...prev, strokes: [...prev.strokes, finalStroke] }));
    }

    if (shapeCreateRef.current && shapePreview) {
      const { x, y, w, h, kind } = shapePreview;
      if (Math.abs(w) > 4 || Math.abs(h) > 4) {
        const stroke = "#1e293b";
        const fill = "transparent";
        const id = uid("shape");
        if (kind === "line") {
          const lineShape: BoardShape = {
            kind: "line",
            id,
            x,
            y,
            w,
            h,
            stroke,
            strokeWidth: 2,
          };
          commitBoard((prev) => ({ ...prev, shapes: [...prev.shapes, lineShape] }));
        } else if (kind === "rect") {
          const rectShape: BoardShape = {
            kind: "rect",
            id,
            x,
            y,
            w,
            h,
            stroke,
            fill,
            strokeWidth: 2,
          };
          commitBoard((prev) => ({ ...prev, shapes: [...prev.shapes, rectShape] }));
        } else {
          const ell: BoardShape = {
            kind: "ellipse",
            id,
            x,
            y,
            w,
            h,
            stroke,
            fill,
            strokeWidth: 2,
          };
          commitBoard((prev) => ({ ...prev, shapes: [...prev.shapes, ell] }));
        }
      }
    }

    if (moveRef.current && moveChangedRef.current) {
      const snap = moveRef.current.snapshot;
      setUndoStack((u) => [...u.slice(-(MAX_UNDO - 1)), snap]);
      setRedoStack([]);
    }

    if (labelResizeRef.current?.changed) {
      const snap = labelResizeRef.current.snapshot;
      setUndoStack((u) => [...u.slice(-(MAX_UNDO - 1)), snap]);
      setRedoStack([]);
    }

    if (eraseSessionRef.current?.changed) {
      const snap = eraseSessionRef.current.snapshot;
      setUndoStack((u) => [...u.slice(-(MAX_UNDO - 1)), snap]);
      setRedoStack([]);
    }

    endTransientPointer();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool !== "sticky") return;
    const b = clientToBoard(e.clientX, e.clientY);
    if (!b) return;
    const newSticky = {
      id: uid("sticky"),
      x: b[0] - STICKY_W / 2,
      y: b[1] - STICKY_H / 2,
      text: "New note",
      colorIdx: Math.floor(Math.random() * STICKY_PALETTE.length),
      rotation: (Math.random() - 0.5) * 4,
    };
    commitBoard((prev) => ({ ...prev, stickies: [...prev.stickies, newSticky] }));
    setActiveTool("select");
  };

  const startStickyDrag = (ev: React.MouseEvent, id: string) => {
    if (activeTool !== "select") return;
    ev.stopPropagation();
    const sticky = boardRef.current.stickies.find((s) => s.id === id);
    if (!sticky) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vp = boardRef.current.viewport;
    const s = vp.zoom / 100;
    stickyDragSnapshotRef.current = cloneBoard(boardRef.current);
    setDraggingSticky(id);
    setDragOffset({
      x: ev.clientX - rect.left - vp.panX - sticky.x * s,
      y: ev.clientY - rect.top - vp.panY - sticky.y * s,
    });
  };

  const onMouseMoveSticky = (e: React.MouseEvent) => {
    if (!draggingSticky) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vp = boardRef.current.viewport;
    const sc = vp.zoom / 100;
    const x = (e.clientX - rect.left - dragOffset.x - vp.panX) / sc;
    const y = (e.clientY - rect.top - dragOffset.y - vp.panY) / sc;
    setBoard((prev) => ({
      ...prev,
      stickies: prev.stickies.map((st) => (st.id === draggingSticky ? { ...st, x, y } : st)),
    }));
    if (hydratedRef.current) setHasLocalChanges(true);
  };

  const endStickyDrag = () => {
    if (draggingSticky && stickyDragSnapshotRef.current) {
      const snap = stickyDragSnapshotRef.current;
      if (JSON.stringify(snap.stickies) !== JSON.stringify(boardRef.current.stickies)) {
        setUndoStack((u) => [...u.slice(-(MAX_UNDO - 1)), snap]);
        setRedoStack([]);
      }
    }
    stickyDragSnapshotRef.current = null;
    setDraggingSticky(null);
  };

  const deleteSticky = (id: string) => {
    deleteSelection({ kind: "sticky", id });
  };

  const updateLabel = (id: string, text: string) => {
    setBoard((prev) => ({
      ...prev,
      shapes: prev.shapes.map((sh) => (sh.kind === "label" && sh.id === id ? { ...sh, text } : sh)),
    }));
    if (hydratedRef.current) setHasLocalChanges(true);
  };

  const zoomIn = () => {
    commitBoard((prev) => ({
      ...prev,
      viewport: { ...prev.viewport, zoom: Math.min(200, prev.viewport.zoom + 10) },
    }));
  };
  const zoomOut = () => {
    commitBoard((prev) => ({
      ...prev,
      viewport: { ...prev.viewport, zoom: Math.max(40, prev.viewport.zoom - 10) },
    }));
  };
  const resetZoom = () => {
    commitBoard((prev) => ({ ...prev, viewport: { ...prev.viewport, zoom: 100, panX: 0, panY: 0 } }));
  };

  const clearBoard = useCallback(() => {
    endTransientPointer();
    commitBoard((prev) => clearBoardObjects(prev, { resetViewport: false }));
    setSelection(null);
    setDraftStroke(null);
    setShapePreview(null);
  }, [commitBoard, endTransientPointer]);

  const exportJsonFile = () => {
    downloadBlob("whiteboard.json", "application/json", JSON.stringify(boardRef.current, null, 2));
  };

  const exportSvgFile = () => {
    downloadBlob("whiteboard.svg", "image/svg+xml", boardToSvgString(boardRef.current));
  };

  const copyJsonClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(boardRef.current, null, 2));
      toast({ title: "Copied", description: "Whiteboard JSON copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const exportPng = async () => {
    const el = canvasRef.current?.querySelector<HTMLElement>("[data-whiteboard-export-root]");
    if (!el) {
      toast({ title: "Export failed", description: "Canvas not ready.", variant: "destructive" });
      return;
    }
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "whiteboard.png";
      a.click();
    } catch (err) {
      toast({
        title: "PNG export failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const vp = board.viewport;
  const transform = `translate(${vp.panX}px, ${vp.panY}px) scale(${vp.zoom / 100})`;

  const serverUpdated =
    boardEnvelope?.success && new Date(boardEnvelope.data.updatedAt).getTime() > 0
      ? new Date(boardEnvelope.data.updatedAt).toLocaleString()
      : null;

  const objectCount = board.stickies.length + board.strokes.length + board.shapes.length;
  const boardHasContent = objectCount > 0;
  const vectorShapes = board.shapes.filter((s) => s.kind !== "label") as Exclude<BoardShape, LabelShape>[];
  const labels = board.shapes.filter((s): s is LabelShape => s.kind === "label");
  const activeToolSizeControl =
    activeTool === "pen"
      ? { label: "Pen", value: penSize, min: 1, max: 24, step: 0.5, onChange: setPenSize }
      : activeTool === "highlighter"
        ? {
            label: "Highlighter",
            value: highlighterSize,
            min: 6,
            max: 40,
            step: 1,
            onChange: setHighlighterSize,
          }
        : activeTool === "erase"
          ? { label: "Eraser", value: eraserSize, min: 8, max: 48, step: 1, onChange: setEraserSize }
          : null;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      {isLoading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : null}

      <div className="min-w-0 shrink-0 px-4 pt-3">
        <Input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setHasLocalChanges(true);
          }}
          className="h-auto min-w-0 border-none bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
          placeholder="Untitled Whiteboard"
          data-testid="input-whiteboard-title"
        />
      </div>

      <WhiteboardToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        zoom={vp.zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        undoDisabled={undoStack.length === 0}
        redoDisabled={redoStack.length === 0}
        onUndo={undo}
        onRedo={redo}
        onNew={() => setNewDialogOpen(true)}
        onClear={() => setClearDialogOpen(true)}
        onSave={() => void handleSave()}
        toolSizeControl={
          activeToolSizeControl
            ? {
                label: activeToolSizeControl.label,
                value: activeToolSizeControl.value,
                min: activeToolSizeControl.min,
                max: activeToolSizeControl.max,
                step: activeToolSizeControl.step,
              }
            : null
        }
        onToolSizeChange={activeToolSizeControl?.onChange}
        clearDisabled={!boardHasContent || updateBoard.isPending}
        newDisabled={updateBoard.isPending}
        saveDisabled={!hasLocalChanges || updateBoard.isPending}
        savePending={updateBoard.isPending}
        onExportJson={exportJsonFile}
        onExportSvg={exportSvgFile}
        onCopyJson={copyJsonClipboard}
        onExportPng={exportPng}
        isError={isError}
        onRetry={() => void refetch()}
      />

      <div
        ref={canvasRef}
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-900/40"
        onMouseMove={onMouseMoveSticky}
        onMouseUp={endStickyDrag}
        onWheel={(event) => {
          event.preventDefault();
          const z = boardRef.current.viewport.zoom;
          const next = Math.max(40, Math.min(200, z - event.deltaY * 0.05));
          if (Math.round(next) !== z) {
            setBoard((prev) => ({
              ...prev,
              viewport: { ...prev.viewport, zoom: Math.round(next) },
            }));
            if (hydratedRef.current) setHasLocalChanges(true);
          }
        }}
        onTouchStart={(event) => {
          if (event.touches.length !== 2) return;
          const [a, b] = [event.touches[0], event.touches[1]];
          const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          pinchRef.current = { initialDistance: distance, initialZoom: boardRef.current.viewport.zoom };
        }}
        onTouchMove={(event) => {
          if (event.touches.length !== 2 || !pinchRef.current) return;
          const [a, b] = [event.touches[0], event.touches[1]];
          const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          const next = pinchRef.current.initialZoom * (distance / pinchRef.current.initialDistance);
          const clamped = Math.max(40, Math.min(200, Math.round(next)));
          if (clamped !== boardRef.current.viewport.zoom) {
            setBoard((prev) => ({ ...prev, viewport: { ...prev.viewport, zoom: clamped } }));
            if (hydratedRef.current) setHasLocalChanges(true);
          }
        }}
        onTouchEnd={() => {
          pinchRef.current = null;
        }}
        data-testid="whiteboard-canvas"
      >
        <div
          data-whiteboard-export-root
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
            backgroundSize: `${(24 * vp.zoom) / 100}px ${(24 * vp.zoom) / 100}px`,
            cursor:
              activeTool === "pan"
                ? "grab"
                : activeTool === "pen" || activeTool === "highlighter" || activeTool === "erase"
                  ? "crosshair"
                  : "default",
          }}
          onClick={handleCanvasClick}
          onPointerDown={onPaperPointerDown}
          onPointerMove={onPaperPointerMove}
          onPointerUp={onPaperPointerUp}
          onPointerCancel={onPaperPointerUp}
          onPointerLeave={() => setEraserPreview(null)}
        >
          <div className="absolute inset-0" style={{ transform, transformOrigin: "0 0" }}>
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              {board.strokes.map((st) => (
                <path
                  key={st.id}
                  d={strokeToPath(st)}
                  stroke={st.color}
                  strokeWidth={st.width}
                  fill="none"
                  strokeOpacity={st.opacity}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={selection?.kind === "stroke" && selection.id === st.id ? 0.85 : 1}
                  strokeDasharray={selection?.kind === "stroke" && selection.id === st.id ? "4 3" : undefined}
                />
              ))}
              {draftStroke ? (
                <path
                  d={strokeToPath(draftStroke)}
                  stroke={draftStroke.color}
                  strokeWidth={draftStroke.width}
                  fill="none"
                  strokeOpacity={draftStroke.opacity}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {eraserPreview && activeTool === "erase" ? (
                <circle
                  cx={eraserPreview[0]}
                  cy={eraserPreview[1]}
                  r={eraserSize / 2}
                  fill="rgba(59,130,246,0.08)"
                  stroke="rgba(59,130,246,0.85)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              ) : null}
              {vectorShapes.map((sh) => renderShapeSvg(sh, selection))}
              {shapePreview ? renderPreviewSvg(shapePreview, selection) : null}
            </svg>

            {labels.map((lb) => (
              <div
                key={lb.id}
                className="absolute rounded border border-zinc-300 bg-white/95 p-2 shadow-sm"
                style={{
                  left: lb.x,
                  top: lb.y,
                  width: Math.max(80, Math.abs(lb.w)),
                  height: Math.max(40, Math.abs(lb.h)),
                  color: lb.color,
                  outline:
                    selection?.kind === "shape" && selection.id === lb.id ? "2px solid rgb(59 130 246)" : undefined,
                }}
                onMouseDown={(ev) => {
                  if (activeTool !== "select") return;
                  ev.stopPropagation();
                  setSelection({ kind: "shape", id: lb.id });
                }}
              >
                <textarea
                  value={lb.text}
                  onChange={(ev) => updateLabel(lb.id, ev.target.value)}
                  className="h-full min-h-[32px] w-full resize-none border-none bg-transparent pb-4 pr-4 text-xs outline-none"
                  style={{ color: lb.color }}
                  onClick={(ev) => ev.stopPropagation()}
                />
                <HoverTooltip content="Resize label">
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                    onPointerDown={(event) =>
                      beginLabelResize(event, lb.id, Math.max(80, Math.abs(lb.w)), Math.max(40, Math.abs(lb.h)))
                    }
                  >
                    <MoveDiagonal2 size={12} />
                  </button>
                </HoverTooltip>
              </div>
            ))}

            {board.stickies.map((sticky) => {
              const color = STICKY_PALETTE[sticky.colorIdx % STICKY_PALETTE.length];
              return (
                <motion.div
                  key={sticky.id}
                  className={`absolute w-44 min-h-24 rounded-sm p-3 shadow-lg group ${color.bg}`}
                  style={{
                    left: sticky.x,
                    top: sticky.y,
                    rotate: sticky.rotation,
                    cursor: activeTool === "select" ? "grab" : "default",
                    outline:
                      selection?.kind === "sticky" && selection.id === sticky.id
                        ? "2px solid rgb(59 130 246)"
                        : undefined,
                  }}
                  whileHover={{ scale: 1.02, zIndex: 10 }}
                  onMouseDown={(ev) => startStickyDrag(ev, sticky.id)}
                  data-testid={`sticky-note-${sticky.id}`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-5 w-5 text-rose-700 opacity-0 transition-opacity hover:bg-transparent hover:text-rose-900 group-hover:opacity-100"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      deleteSticky(sticky.id);
                    }}
                    data-testid={`button-delete-sticky-${sticky.id}`}
                  >
                    <Trash2 size={10} />
                  </Button>
                  <textarea
                    value={sticky.text}
                    onChange={(ev) => {
                      setBoard((prev) => ({
                        ...prev,
                        stickies: prev.stickies.map((s) =>
                          s.id === sticky.id ? { ...s, text: ev.target.value } : s,
                        ),
                      }));
                      if (hydratedRef.current) setHasLocalChanges(true);
                    }}
                    className={`h-full w-full resize-none border-none bg-transparent text-xs font-medium leading-snug outline-none ${color.text}`}
                    onClick={(ev) => ev.stopPropagation()}
                    data-testid={`sticky-textarea-${sticky.id}`}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {objectCount === 0 && !isLoading ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <p className="text-sm">Use the toolbar: sticky notes, pen, shapes, pan, and export.</p>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Clear this whiteboard?"
        description="This removes all notes, strokes, and shapes from the current canvas. You can still undo it until you save or refresh."
        confirmLabel="Clear board"
        confirmDisabled={updateBoard.isPending || !boardHasContent}
        cancelDisabled={updateBoard.isPending}
        onConfirm={(event) => {
          event.preventDefault();
          clearBoard();
          setClearDialogOpen(false);
        }}
      />

      <ConfirmDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        title="Create a new whiteboard?"
        description="A new untitled whiteboard will be created and your current board will stay available in the sidebar. If you have unsaved changes, you may be asked to confirm first."
        confirmLabel="Create whiteboard"
        confirmDisabled={updateBoard.isPending}
        cancelDisabled={updateBoard.isPending}
        onConfirm={(event) => {
          event.preventDefault();
          onCreateRequested?.();
          setNewDialogOpen(false);
        }}
      />

      <div className="flex items-center gap-4 border-t border-border/60 px-4 py-1.5 text-[10px] text-muted-foreground">
        <span>Objects: {objectCount}</span>
        <span className="ml-auto tabular-nums">
          {updateBoard.isPending ? "Saving…" : hasLocalChanges ? "Unsaved changes" : serverUpdated ? `Saved · ${serverUpdated}` : "Manual save"}
        </span>
      </div>
    </div>
  );
}

function strokeToPath(st: StrokeItem): string {
  if (st.points.length === 0) return "";
  const [x0, y0] = st.points[0];
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < st.points.length; i++) {
    d += ` L ${st.points[i][0]} ${st.points[i][1]}`;
  }
  return d;
}

function renderShapeSvg(
  sh: Exclude<BoardShape, LabelShape>,
  selection: Selection,
) {
  const sel = selection?.kind === "shape" && selection.id === sh.id;
  const dash = sel ? { strokeDasharray: "4 3" as const } : {};
  if (sh.kind === "rect") {
    const x = Math.min(sh.x, sh.x + sh.w);
    const y = Math.min(sh.y, sh.y + sh.h);
    return (
      <rect
        key={sh.id}
        x={x}
        y={y}
        width={Math.abs(sh.w)}
        height={Math.abs(sh.h)}
        fill={sh.fill}
        stroke={sh.stroke}
        strokeWidth={sh.strokeWidth}
        rx={4}
        {...dash}
      />
    );
  }
  if (sh.kind === "ellipse") {
    const cx = sh.x + sh.w / 2;
    const cy = sh.y + sh.h / 2;
    return (
      <ellipse
        key={sh.id}
        cx={cx}
        cy={cy}
        rx={Math.abs(sh.w) / 2}
        ry={Math.abs(sh.h) / 2}
        fill={sh.fill}
        stroke={sh.stroke}
        strokeWidth={sh.strokeWidth}
        {...dash}
      />
    );
  }
  return (
    <line
      key={sh.id}
      x1={sh.x}
      y1={sh.y}
      x2={sh.x + sh.w}
      y2={sh.y + sh.h}
      stroke={sh.stroke}
      strokeWidth={sh.strokeWidth}
      strokeLinecap="round"
      {...dash}
    />
  );
}

function renderPreviewSvg(
  preview: { kind: "rect" | "ellipse" | "line"; x: number; y: number; w: number; h: number },
  _selection: Selection,
) {
  const { x, y, w, h, kind } = preview;
  if (kind === "line") {
    return (
      <line
        key="preview"
        x1={x}
        y1={y}
        x2={x + w}
        y2={y + h}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
    );
  }
  if (kind === "rect") {
    const rx = Math.min(x, x + w);
    const ry = Math.min(y, y + h);
    return (
      <rect
        key="preview"
        x={rx}
        y={ry}
        width={Math.abs(w)}
        height={Math.abs(h)}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="4 3"
        rx={4}
      />
    );
  }
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <ellipse
      key="preview"
      cx={cx}
      cy={cy}
      rx={Math.abs(w) / 2}
      ry={Math.abs(h) / 2}
      fill="none"
      stroke="#3b82f6"
      strokeWidth={2}
      strokeDasharray="4 3"
    />
  );
}
