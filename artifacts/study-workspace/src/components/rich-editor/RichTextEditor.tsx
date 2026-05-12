import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  UnlinkIcon,
  UnderlineIcon,
  Code as CodeIcon,
  CheckSquare,
  GripVertical,
  SquarePen,
  Trash2,
} from "lucide-react";
import { ApiError, customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { shortcutModLabel } from "@/lib/platform";

function isLikelyImageFile(file: File): boolean {
  return file.type === "" || file.type.startsWith("image/");
}

function clipboardItemIsImage(item: DataTransferItem): boolean {
  return item.kind === "file" && (item.type === "" || item.type.startsWith("image/"));
}

async function uploadNoteImageAsset(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const body = await customFetch<unknown>("/api/v1/note-images", {
    method: "POST",
    body: form,
  });
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    body.data &&
    typeof body.data === "object" &&
    "url" in body.data &&
    typeof (body.data as { url: unknown }).url === "string"
  ) {
    return (body.data as { url: string }).url;
  }
  throw new Error("Unexpected response from server.");
}

export interface RichTextEditorHandle { focus: () => void; }

interface RichTextEditorProps {
  documentKey?: string;
  layoutMode?: "linear" | "canvas";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  toolbarRight?: React.ReactNode;
  readOnly?: boolean;
  testId?: string;
  enableRichMedia?: boolean;
  minHeightClass?: string;
  showMediaHint?: boolean;
}

type BlockType = "text" | "image";
type CanvasBlock = {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  z: number;
  html?: string;
  src?: string;
};

const CANVAS_MARKER = "data-note-canvas";
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTextBlock(x: number, y: number, html = ""): CanvasBlock {
  return { id: uid("text"), type: "text", x, y, width: 560, z: 1, html };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializeCanvas(blocks: CanvasBlock[]): string {
  const parts = blocks.map((block) => {
    const style = `left:${Math.round(block.x)}px;top:${Math.round(block.y)}px;width:${Math.round(block.width)}px;z-index:${block.z};position:absolute;`;
    if (block.type === "image") {
      return `<div data-note-block="image" data-id="${block.id}" style="${style}"><img src="${escapeHtml(block.src ?? "")}" alt="" /></div>`;
    }
    return `<div data-note-block="text" data-id="${block.id}" style="${style}">${block.html || "<p></p>"}</div>`;
  });
  return `<div ${CANVAS_MARKER}="1" style="position:relative;min-height:720px;">${parts.join("")}</div>`;
}

function parseCanvas(html: string): CanvasBlock[] {
  if (!html.trim()) return [];
  if (typeof window === "undefined") return [createTextBlock(48, 48, `<p>${escapeHtml(htmlToPlainText(html))}</p>`)];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.querySelector(`[${CANVAS_MARKER}]`);
  if (!root) return [createTextBlock(48, 48, html)];
  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-note-block]"));
  return els.map((el, idx) => {
    const type = (el.getAttribute("data-note-block") ?? "text") as BlockType;
    const x = Number.parseFloat(el.style.left || "48") || 48;
    const y = Number.parseFloat(el.style.top || "48") || 48;
    const width = Number.parseFloat(el.style.width || "520") || 520;
    const z = Number.parseInt(el.style.zIndex || `${idx + 1}`, 10) || idx + 1;
    const id = el.getAttribute("data-id") ?? uid("block");
    if (type === "image") {
      const img = el.querySelector("img");
      return { id, type, x, y, width, z, src: img?.getAttribute("src") ?? "" };
    }
    return { id, type: "text", x, y, width, z, html: el.innerHTML };
  });
}

interface ToolbarButton {
  id: string;
  icon: typeof Bold;
  label: string;
  isActive: (editor: Editor) => boolean;
  command: (editor: Editor) => void;
  isDisabled?: (editor: Editor) => boolean;
}

function buildToolbarGroups(): ToolbarButton[][] {
  return [
    [
      {
        id: "h1",
        icon: Heading1,
        label: "Heading 1",
        isActive: (editor) => editor.isActive("heading", { level: 1 }),
        command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: "h2",
        icon: Heading2,
        label: "Heading 2",
        isActive: (editor) => editor.isActive("heading", { level: 2 }),
        command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: "h3",
        icon: Heading3,
        label: "Heading 3",
        isActive: (editor) => editor.isActive("heading", { level: 3 }),
        command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
    ],
    [
      {
        id: "bold",
        icon: Bold,
        label: "Bold",
        isActive: (editor) => editor.isActive("bold"),
        command: (editor) => editor.chain().focus().toggleBold().run(),
      },
      {
        id: "italic",
        icon: Italic,
        label: "Italic",
        isActive: (editor) => editor.isActive("italic"),
        command: (editor) => editor.chain().focus().toggleItalic().run(),
      },
      {
        id: "underline",
        icon: UnderlineIcon,
        label: "Underline",
        isActive: (editor) => editor.isActive("underline"),
        command: (editor) => editor.chain().focus().toggleUnderline().run(),
      },
      {
        id: "strike",
        icon: Strikethrough,
        label: "Strikethrough",
        isActive: (editor) => editor.isActive("strike"),
        command: (editor) => editor.chain().focus().toggleStrike().run(),
      },
      {
        id: "code",
        icon: CodeIcon,
        label: "Inline code",
        isActive: (editor) => editor.isActive("code"),
        command: (editor) => editor.chain().focus().toggleCode().run(),
      },
    ],
    [
      {
        id: "ul",
        icon: List,
        label: "Bullet list",
        isActive: (editor) => editor.isActive("bulletList"),
        command: (editor) => editor.chain().focus().toggleBulletList().run(),
      },
      {
        id: "ol",
        icon: ListOrdered,
        label: "Numbered list",
        isActive: (editor) => editor.isActive("orderedList"),
        command: (editor) => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "task",
        icon: CheckSquare,
        label: "Checkbox",
        isActive: (editor) => editor.isActive("taskList"),
        command: (editor) => editor.chain().focus().toggleList("taskList", "taskItem").run(),
      },
      {
        id: "quote",
        icon: Quote,
        label: "Blockquote",
        isActive: (editor) => editor.isActive("blockquote"),
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
      },
    ],
    [
      {
        id: "link",
        icon: LinkIcon,
        label: "Link",
        isActive: (editor) => editor.isActive("link"),
        command: (editor) => {
          const previousUrl = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Enter URL", previousUrl ?? "https://");
          if (url === null) return;
          if (url.trim() === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url, target: "_blank", rel: "noopener noreferrer" })
            .run();
        },
      },
      {
        id: "unlink",
        icon: UnlinkIcon,
        label: "Remove link",
        isActive: () => false,
        isDisabled: (editor) => !editor.isActive("link"),
        command: (editor) => editor.chain().focus().unsetLink().run(),
      },
    ],
    [
      {
        id: "undo",
        icon: Undo2,
        label: "Undo",
        isActive: () => false,
        isDisabled: (editor) => !editor.can().undo(),
        command: (editor) => editor.chain().focus().undo().run(),
      },
      {
        id: "redo",
        icon: Redo2,
        label: "Redo",
        isActive: () => false,
        isDisabled: (editor) => !editor.can().redo(),
        command: (editor) => editor.chain().focus().redo().run(),
      },
    ],
  ];
}

const TOOLBAR_GROUPS = buildToolbarGroups();

interface TextBlockEditorProps {
  blockId: string;
  html: string;
  placeholder: string;
  readOnly: boolean;
  active: boolean;
  onFocus: (blockId: string, editor: Editor) => void;
  onChange: (nextHtml: string) => void;
}

interface LinearEditorProps extends RichTextEditorProps {
  editorRef: React.MutableRefObject<Editor | null>;
}

function LinearRichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  toolbarRight,
  readOnly = false,
  testId,
  enableRichMedia = true,
  minHeightClass = "min-h-[18rem]",
  showMediaHint = true,
  editorRef,
}: LinearEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const uploadingRef = useRef(false);

  const insertUploadedImage = useCallback((editorInstance: Editor, file: File) => {
    if (!enableRichMedia || uploadingRef.current) return;
    uploadingRef.current = true;
    setImageBusy(true);
    void uploadNoteImageAsset(file)
      .then((url) => editorInstance.chain().focus().setImage({ src: url }).run())
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : "Image upload failed.";
        window.alert(message);
      })
      .finally(() => {
        uploadingRef.current = false;
        setImageBusy(false);
      });
  }, [enableRichMedia]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      ...(enableRichMedia ? [Image.configure({ inline: false, allowBase64: true })] : []),
    ],
    content: value || "",
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm dark:prose-invert max-w-none",
          minHeightClass,
          "flex-1 px-6 py-4 text-sm leading-relaxed text-foreground",
          "focus:outline-none",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_li[data-checked]]:list-none",
        ),
        "data-testid": testId ?? "rte-editor",
      },
      handleDrop:
        enableRichMedia && !readOnly
          ? (_view, event, _slice, moved) => {
              if (moved || !editorRef.current) return false;
              const file = Array.from(event.dataTransfer?.files ?? []).find(isLikelyImageFile);
              if (!file) return false;
              event.preventDefault();
              insertUploadedImage(editorRef.current, file);
              return true;
            }
          : undefined,
      handlePaste:
        enableRichMedia && !readOnly
          ? (_view, event) => {
              if (!editorRef.current) return false;
              const fileItem = Array.from(event.clipboardData?.items ?? []).find(clipboardItemIsImage);
              const file = fileItem?.getAsFile();
              if (!file) return false;
              event.preventDefault();
              insertUploadedImage(editorRef.current, file);
              return true;
            }
          : undefined,
    },
    onUpdate: ({ editor }) => {
      const next = editor.getHTML();
      onChange(next === "<p></p>" ? "" : next);
    },
  });

  useEffect(() => {
    editorRef.current = editor ?? null;
  }, [editor, editorRef]);

  useEffect(() => {
    if (!editor) return;
    const normalized = value || "";
    const current = editor.getHTML();
    if (current !== normalized && !(current === "<p></p>" && normalized === "")) {
      editor.commands.setContent(normalized, false);
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border/60 px-3 py-1.5">
        {TOOLBAR_GROUPS.map((group, idx) => (
          <div key={idx} className="flex items-center gap-0.5">
            {idx > 0 && <Separator orientation="vertical" className="mx-1 h-5" />}
            {group.map((button) => {
              const isActive = editor ? button.isActive(editor) : false;
              const isDisabled = readOnly || !editor || (button.isDisabled?.(editor) ?? false);
              const Icon = button.icon;
              return (
                <Button
                  key={button.id}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", isActive && "bg-muted text-foreground")}
                  title={button.label}
                  disabled={isDisabled}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor && button.command(editor)}
                  data-testid={`rte-${button.id}`}
                >
                  <Icon size={13} />
                </Button>
              );
            })}
          </div>
        ))}
        {enableRichMedia ? (
          <div className="flex items-center gap-0.5">
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Upload image"
              disabled={readOnly || imageBusy}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => imageInputRef.current?.click()}
              data-testid="rte-image-upload"
            >
              {imageBusy ? <Spinner className="size-3" /> : <ImagePlus size={13} />}
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file || !editor) return;
                insertUploadedImage(editor, file);
              }}
            />
          </div>
        ) : null}
        {toolbarRight ? <div className="ml-auto flex items-center gap-0.5">{toolbarRight}</div> : null}
      </div>
      {showMediaHint ? (
        <p className="px-6 pt-2 text-[11px] text-muted-foreground">
          {enableRichMedia ? "Paste or drop images into the editor. " : ""}
          Hold {shortcutModLabel()} and click a link to open it in a new tab.
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <EditorContent editor={editor} className="flex flex-1" />
      </div>
    </div>
  );
}

function TextBlockEditor({
  blockId,
  html,
  placeholder,
  readOnly,
  active,
  onFocus,
  onChange,
}: TextBlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: html || "",
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed focus:outline-none",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_li[data-checked]]:list-none",
        ),
      },
      handleKeyDown: (_view, event) => {
        // If user backspaces through an empty list item, let TipTap lift/outdent
        // naturally. We only avoid hard failures by always returning false.
        if (event.key === "Backspace") return false;
        return false;
      },
    },
    onFocus: ({ editor }) => onFocus(blockId, editor),
    onUpdate: ({ editor }) => {
      const next = editor.getHTML();
      onChange(next === "<p></p>" ? "" : next);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== (html || "")) {
      editor.commands.setContent(html || "", false);
    }
  }, [editor, html]);

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!active || !editor) return;
    editor.commands.focus("end");
  }, [active, editor]);

  return <EditorContent editor={editor} />;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    {
      documentKey,
      layoutMode = "linear",
      value,
      onChange,
      placeholder,
      className,
      toolbarRight,
      readOnly = false,
      testId,
      enableRichMedia = true,
      minHeightClass = "min-h-[18rem]",
      showMediaHint = true,
    },
    ref,
  ) {
    const sharedEditorRef = useRef<Editor | null>(null);
    const focus = useCallback(() => {
      sharedEditorRef.current?.chain().focus().run();
    }, []);
    useImperativeHandle(ref, () => ({ focus }));

    if (layoutMode === "linear") {
      return (
        <LinearRichTextEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
          toolbarRight={toolbarRight}
          readOnly={readOnly}
          testId={testId}
          enableRichMedia={enableRichMedia}
          minHeightClass={minHeightClass}
          showMediaHint={showMediaHint}
          editorRef={sharedEditorRef}
        />
      );
    }

    const imageInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [imageBusy, setImageBusy] = useState(false);
    const [blocks, setBlocks] = useState<CanvasBlock[]>(() => parseCanvas(value || ""));
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 760 });
    const [zoom, setZoom] = useState(1);
    const [pendingInsertPoint, setPendingInsertPoint] = useState<{ x: number; y: number } | null>(null);
    const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const activeEditorRef = useRef<Editor | null>(null);
    const hydratedRef = useRef(false);
    const zRef = useRef(Math.max(1, ...blocks.map((b) => b.z)));
    const activeDocumentKeyRef = useRef(documentKey ?? "default");
    const pinchRef = useRef<{ initialDistance: number; initialZoom: number } | null>(null);
    const clipboardBlockRef = useRef<CanvasBlock | null>(null);

    const emitChange = useCallback(
      (nextBlocks: CanvasBlock[]) => {
        const html = nextBlocks.length === 0 ? "" : serializeCanvas(nextBlocks);
        if (html !== value) onChange(html);
      },
      [onChange, value],
    );

    const updateBlocks = useCallback(
      (fn: (prev: CanvasBlock[]) => CanvasBlock[]) => {
        setBlocks((prev) => {
          const next = fn(prev);
          emitChange(next);
          return next;
        });
      },
      [emitChange],
    );

    useEffect(() => {
      sharedEditorRef.current = activeEditorRef.current;
    }, [activeBlockId]);

    useEffect(() => {
      activeDocumentKeyRef.current = documentKey ?? "default";
    }, [documentKey]);

    useEffect(() => {
      const parsed = parseCanvas(value || "");
      const serializedCurrent = serializeCanvas(blocks);
      const serializedIncoming = parsed.length ? serializeCanvas(parsed) : "";
      if (!hydratedRef.current || serializedCurrent !== serializedIncoming) {
        setBlocks(parsed);
        zRef.current = Math.max(1, ...parsed.map((b) => b.z));
      }
      hydratedRef.current = true;
    }, [value]); // keep external updates in sync

    useEffect(() => {
      const maxWidth = Math.max(1200, ...blocks.map((b) => b.x + b.width + 80));
      const maxHeight = Math.max(760, ...blocks.map((b) => b.y + (b.type === "image" ? 360 : 260) + 80));
      setCanvasSize({ width: maxWidth, height: maxHeight });
    }, [blocks]);

    useEffect(() => {
      const onKey = (event: KeyboardEvent) => {
        if (readOnly || !activeBlockId || (!event.ctrlKey && !event.metaKey)) return;
        const key = event.key.toLowerCase();
        const active = document.activeElement as HTMLElement | null;
        const editable = Boolean(active?.closest(".ProseMirror,[contenteditable='true'],textarea,input"));
        if (key === "c" && !editable) {
          const block = blocks.find((b) => b.id === activeBlockId);
          if (!block) return;
          clipboardBlockRef.current = { ...block };
          event.preventDefault();
        }
        if (key === "v" && !editable) {
          const copied = clipboardBlockRef.current;
          if (!copied) return;
          const pasted: CanvasBlock = {
            ...copied,
            id: uid(copied.type),
            x: copied.x + 24,
            y: copied.y + 24,
            z: nextZ(),
          };
          updateBlocks((prev) => [...prev, pasted]);
          setActiveBlockId(pasted.id);
          event.preventDefault();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [activeBlockId, blocks, readOnly, updateBlocks]);

    useEffect(() => {
      const onTypeToCreate = (event: KeyboardEvent) => {
        if (readOnly || !pendingInsertPoint) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const active = document.activeElement as HTMLElement | null;
        const editable = Boolean(active?.closest(".ProseMirror,[contenteditable='true'],textarea,input"));
        if (editable) return;
        const printable = event.key.length === 1 && !event.isComposing;
        const shouldCreate = printable || event.key === "Enter";
        if (!shouldCreate) return;
        event.preventDefault();
        const seed = printable ? `<p>${escapeHtml(event.key)}</p>` : "<p></p>";
        const block = { ...createTextBlock(pendingInsertPoint.x, pendingInsertPoint.y, seed), z: nextZ() };
        updateBlocks((prev) => [...prev, block]);
        setActiveBlockId(block.id);
        setPendingInsertPoint(null);
      };
      window.addEventListener("keydown", onTypeToCreate);
      return () => window.removeEventListener("keydown", onTypeToCreate);
    }, [pendingInsertPoint, readOnly, updateBlocks]);

    const nextZ = () => {
      zRef.current += 1;
      return zRef.current;
    };

    const appendTextAt = useCallback((x: number, y: number) => {
      const block = { ...createTextBlock(x, y), z: nextZ() };
      updateBlocks((prev) => [...prev, block]);
      setActiveBlockId(block.id);
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-block-body="${block.id}"]`)?.focus();
      });
    }, [updateBlocks]);

    const appendImageAt = useCallback((x: number, y: number, src: string) => {
      const block: CanvasBlock = {
        id: uid("img"),
        type: "image",
        x,
        y,
        width: 380,
        z: nextZ(),
        src,
      };
      updateBlocks((prev) => [...prev, block]);
      setActiveBlockId(block.id);
    }, [updateBlocks]);

    const uploadAndPlaceImage = useCallback((file: File, x: number, y: number) => {
      if (!enableRichMedia) return;
      const opDocKey = activeDocumentKeyRef.current;
      setImageBusy(true);
      void uploadNoteImageAsset(file)
        .then((url) => {
          if (activeDocumentKeyRef.current !== opDocKey) return;
          appendImageAt(x, y, url);
        })
        .catch((err: unknown) => {
          const message = err instanceof ApiError ? err.message : "Image upload failed.";
          window.alert(message);
        })
        .finally(() => setImageBusy(false));
    }, [appendImageAt, enableRichMedia]);

    const onPickImageFiles = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !isLikelyImageFile(file)) return;
      uploadAndPlaceImage(file, 56, 120);
    }, [uploadAndPlaceImage]);

    const beginDrag = (event: React.PointerEvent, block: CanvasBlock) => {
      if (readOnly) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dragStateRef.current = {
        id: block.id,
        offsetX: event.clientX - rect.left - block.x,
        offsetY: event.clientY - rect.top - block.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setActiveBlockId(block.id);
      updateBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, z: nextZ() } : b)));
    };

    const onCanvasPointerMove = (event: React.PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(8, event.clientX - rect.left - drag.offsetX);
      const y = Math.max(8, event.clientY - rect.top - drag.offsetY);
      updateBlocks((prev) => prev.map((b) => (b.id === drag.id ? { ...b, x, y } : b)));
    };
    const endDrag = () => {
      dragStateRef.current = null;
    };

    const plainHint = `Click anywhere in the canvas to add a text block.`;
    const zoomOut = () => setZoom((z) => Math.max(0.5, z - 0.1));
    const zoomIn = () => setZoom((z) => Math.min(2.5, z + 0.1));
    const zoomLabel = `${Math.round(zoom * 100)}%`;

    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <div className="flex flex-wrap items-center gap-1 border-b border-border/60 px-3 py-1.5">
          {TOOLBAR_GROUPS.map((group, idx) => (
            <div key={idx} className="flex items-center gap-0.5">
              {idx > 0 && <Separator orientation="vertical" className="mx-1 h-5" />}
              {group.map((button) => {
                const editor = activeEditorRef.current;
                const isActive = editor ? button.isActive(editor) : false;
                const isDisabled = readOnly || !editor || (button.isDisabled?.(editor) ?? false);
                const Icon = button.icon;
                return (
                  <Button
                    key={button.id}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", isActive && "bg-muted text-foreground")}
                    title={button.label}
                    disabled={isDisabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (!editor) return;
                      button.command(editor);
                    }}
                    data-testid={`rte-${button.id}`}
                  >
                    <Icon size={13} />
                  </Button>
                );
              })}
            </div>
          ))}
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={readOnly} title="Add text block" onClick={() => appendTextAt(56, 120)} data-testid="rte-add-text"><SquarePen size={13} /></Button>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={readOnly || imageBusy || !enableRichMedia} title="Upload image block" onClick={() => imageInputRef.current?.click()} data-testid="rte-image-upload">
            {imageBusy ? <Spinner className="size-3" /> : <ImagePlus size={13} />}
          </Button>
          <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onPickImageFiles} />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <div className="flex items-center rounded-md border border-border/60 px-1.5 py-0.5 text-[11px]">
            <button
              type="button"
              className="h-5 w-5 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={zoomOut}
              title="Zoom out"
              data-testid="rte-zoom-out"
            >
              -
            </button>
            <span className="w-11 text-center font-mono text-muted-foreground">{zoomLabel}</span>
            <button
              type="button"
              className="h-5 w-5 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={zoomIn}
              title="Zoom in"
              data-testid="rte-zoom-in"
            >
              +
            </button>
          </div>
          {toolbarRight ? (
            <div className="ml-auto flex items-center gap-0.5">{toolbarRight}</div>
          ) : null}
        </div>
        {showMediaHint ? (
          <p className="px-6 pt-2 text-[11px] text-muted-foreground">
            {enableRichMedia ? "Paste or drop images into the canvas. " : ""}{plainHint}
          </p>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-auto px-6 pb-4">
          <div
            ref={canvasRef}
            className={cn("relative mt-2 rounded-xl border border-border/60 bg-muted/15", minHeightClass)}
            style={{
              width: canvasSize.width * zoom,
              minWidth: canvasSize.width * zoom,
              height: canvasSize.height * zoom,
              minHeight: canvasSize.height * zoom,
              transformOrigin: "top left",
            }}
            data-testid={testId ?? "rte-editor"}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={(event) => {
              if (readOnly) return;
              const target = event.target as HTMLElement;
              if (target.closest("[data-note-block-wrap]")) return;
              const rect = event.currentTarget.getBoundingClientRect();
              setPendingInsertPoint({
                x: (event.clientX - rect.left) / zoom,
                y: (event.clientY - rect.top) / zoom,
              });
            }}
            onDrop={(event) => {
              if (readOnly || !enableRichMedia) return;
              const file = Array.from(event.dataTransfer.files).find(isLikelyImageFile);
              if (!file) return;
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              uploadAndPlaceImage(file, (event.clientX - rect.left) / zoom, (event.clientY - rect.top) / zoom);
            }}
            onDragOver={(event) => {
              if (!readOnly && enableRichMedia) event.preventDefault();
            }}
            onWheel={(event) => {
              event.preventDefault();
              setZoom((z) => Math.max(0.5, Math.min(2.5, z - event.deltaY * 0.001)));
            }}
            onTouchStart={(event) => {
              if (event.touches.length !== 2) return;
              const [a, b] = [event.touches[0], event.touches[1]];
              const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
              pinchRef.current = { initialDistance: distance, initialZoom: zoom };
            }}
            onTouchMove={(event) => {
              if (event.touches.length !== 2 || !pinchRef.current) return;
              const [a, b] = [event.touches[0], event.touches[1]];
              const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
              const next = pinchRef.current.initialZoom * (distance / pinchRef.current.initialDistance);
              setZoom(Math.max(0.5, Math.min(2.5, next)));
            }}
            onTouchEnd={() => {
              pinchRef.current = null;
            }}
            onPaste={(event) => {
              if (readOnly || !enableRichMedia) return;
              const fileItem = Array.from(event.clipboardData.items).find(clipboardItemIsImage);
              const file = fileItem?.getAsFile();
              if (!file) return;
              event.preventDefault();
              uploadAndPlaceImage(file, 56, 120);
            }}
          >
            {blocks.map((block) => (
              <div
                key={block.id}
                data-note-block-wrap={block.id}
                className={cn(
                  "absolute rounded-md border bg-background/95 shadow-sm",
                  activeBlockId === block.id ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60",
                )}
                style={{ left: block.x * zoom, top: block.y * zoom, width: block.width * zoom, zIndex: block.z }}
                onMouseDown={() => {
                  setActiveBlockId(block.id);
                  setPendingInsertPoint(null);
                }}
              >
                {!readOnly ? (
                  <div className="flex items-center justify-between border-b border-border/60 px-2 py-1">
                    <button
                      type="button"
                      className="cursor-grab text-muted-foreground hover:text-foreground"
                      onPointerDown={(e) => beginDrag(e, block)}
                    >
                      <GripVertical size={13} />
                    </button>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive/80 hover:text-destructive" title="Delete block" onClick={() => updateBlocks((prev) => prev.filter((b) => b.id !== block.id))}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                ) : null}
                <div className="p-3">
                  {block.type === "image" ? (
                    <img src={block.src} alt="" className="max-h-[520px] w-full rounded-md object-contain" />
                  ) : null}
                  {block.type === "text" ? (
                    <TextBlockEditor
                      blockId={block.id}
                      html={block.html ?? ""}
                      placeholder={placeholder ?? "Start writing…"}
                      readOnly={readOnly}
                      active={activeBlockId === block.id}
                      onFocus={(id, editor) => {
                        setActiveBlockId(id);
                        activeEditorRef.current = editor;
                      }}
                      onChange={(nextHtml) =>
                        updateBlocks((prev) => {
                          if (nextHtml.trim() === "") {
                            return prev.filter((b) => b.id !== block.id);
                          }
                          return prev.map((b) => (b.id === block.id ? { ...b, html: nextHtml } : b));
                        })
                      }
                    />
                  ) : null}
                </div>
              </div>
            ))}
            {pendingInsertPoint && !readOnly ? (
              <div
                className="pointer-events-none absolute h-6 w-6 rounded-sm border border-primary/40 bg-primary/5"
                style={{ left: pendingInsertPoint.x * zoom, top: pendingInsertPoint.y * zoom }}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);

/** Strip HTML tags for use in list previews / search snippets. */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** True if pasted HTML contributes visible text beyond empty paragraphs. */
export function richTextHasPlainContent(html: string): boolean {
  return htmlToPlainText(html).trim().length > 0;
}
