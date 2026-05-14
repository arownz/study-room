import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, Node as TiptapNode, mergeAttributes, useEditor, type Editor } from "@tiptap/react";
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
  Minus,
  MoveDiagonal2,
  SquarePen,
  Trash2,
} from "lucide-react";
import { ApiError, customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { shortcutModLabel } from "@/lib/platform";
import {
  createImageTextBlock,
  createTextBlock,
  parseCanvas,
  serializeCanvas,
  uid,
  type CanvasBlock,
} from "./canvas/canvas-blocks";
import { pointsToPathD } from "./canvas/ink-geometry";
/** Prose + marker styles so nested ordered/unordered lists stay readable (OneNote-style mixing). */
const NESTED_LIST_PROSE =
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:pl-1 [&_li>ul]:mt-1 [&_li>ol]:mt-1 [&_li>ul]:pl-6 [&_li>ol]:pl-6 [&_li]:marker:text-foreground";
const TABLE_PROSE =
  "[&_table]:w-max [&_table]:min-w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-border/70 [&_th]:bg-muted/70 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border/70 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:break-words [&_th]:break-words";
const EDITABLE_TARGET_SELECTOR = ".ProseMirror,[contenteditable='true'],textarea,input";
const CANVAS_BLOCK_PADDING = 96;
const DEFAULT_CANVAS_INSERT_POINT = { x: 56, y: 120 } as const;
const DEFAULT_TABLE_BLOCK_WIDTH = 760;
const DEFAULT_TABLE_BLOCK_HEIGHT = 240;
const MIN_TEXT_BLOCK_WIDTH = 280;
const MIN_TEXT_BLOCK_HEIGHT = 140;

function parseSpanAttribute(element: HTMLElement, attribute: "colspan" | "rowspan"): number {
  const raw = element.getAttribute(attribute);
  const parsed = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

const CANVAS_TABLE = TiptapNode.create({
  name: "table",
  group: "block",
  content: "tableRow+",
  isolating: true,
  selectable: true,
  parseHTML() {
    return [{ tag: "table" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["table", mergeAttributes(HTMLAttributes), 0];
  },
});

const CANVAS_TABLE_ROW = TiptapNode.create({
  name: "tableRow",
  content: "(tableHeader|tableCell)*",
  parseHTML() {
    return [{ tag: "tr" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["tr", mergeAttributes(HTMLAttributes), 0];
  },
});

const CANVAS_TABLE_CELL = TiptapNode.create({
  name: "tableCell",
  content: "block+",
  isolating: true,
  addAttributes() {
    return {
      colspan: {
        default: 1,
        parseHTML: (element: HTMLElement) => parseSpanAttribute(element, "colspan"),
        renderHTML: (attributes: { colspan?: number }) =>
          attributes.colspan && attributes.colspan > 1 ? { colspan: attributes.colspan } : {},
      },
      rowspan: {
        default: 1,
        parseHTML: (element: HTMLElement) => parseSpanAttribute(element, "rowspan"),
        renderHTML: (attributes: { rowspan?: number }) =>
          attributes.rowspan && attributes.rowspan > 1 ? { rowspan: attributes.rowspan } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "td" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes(HTMLAttributes), 0];
  },
});

const CANVAS_TABLE_HEADER = TiptapNode.create({
  name: "tableHeader",
  content: "block+",
  isolating: true,
  addAttributes() {
    return {
      colspan: {
        default: 1,
        parseHTML: (element: HTMLElement) => parseSpanAttribute(element, "colspan"),
        renderHTML: (attributes: { colspan?: number }) =>
          attributes.colspan && attributes.colspan > 1 ? { colspan: attributes.colspan } : {},
      },
      rowspan: {
        default: 1,
        parseHTML: (element: HTMLElement) => parseSpanAttribute(element, "rowspan"),
        renderHTML: (attributes: { rowspan?: number }) =>
          attributes.rowspan && attributes.rowspan > 1 ? { rowspan: attributes.rowspan } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "th" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["th", mergeAttributes(HTMLAttributes), 0];
  },
});

function handleListTab(editor: Editor | null, event: KeyboardEvent): boolean {
  if (!editor || event.key !== "Tab") return false;
  const ok = event.shiftKey
    ? editor.chain().focus().liftListItem("listItem").run()
    : editor.chain().focus().sinkListItem("listItem").run();
  if (ok) {
    event.preventDefault();
    return true;
  }
  return false;
}

/** Inline images keep text flow so users can keep typing after paste/upload (block images trap the caret). */
const RICH_IMAGE = Image.configure({
  inline: true,
  allowBase64: true,
  HTMLAttributes: {
    class: "max-w-full max-h-[min(480px,55vh)] rounded-md align-text-bottom",
  },
});

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
  onDraftSnapshot?: (value: string) => void;
  placeholder?: string;
  className?: string;
  toolbarRight?: React.ReactNode;
  readOnly?: boolean;
  testId?: string;
  enableRichMedia?: boolean;
  minHeightClass?: string;
  showMediaHint?: boolean;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Escape attribute values for safe `insertContent` HTML (URLs may contain `&`). */
function escapeHtmlAttr(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/** After paste/upload, always leave an empty paragraph below the image so the caret has room. */
function insertUploadedImageIntoEditor(editor: Editor, url: string): void {
  const safe = escapeHtmlAttr(url);
  editor.chain().focus().insertContent(`<p><img src="${safe}" alt="" /></p><p></p>`).focus("end").run();
}

function normalizeClipboardHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || typeof window === "undefined") return trimmed;
  const doc = new DOMParser().parseFromString(trimmed, "text/html");
  return doc.body.innerHTML
    .replaceAll("<!--StartFragment-->", "")
    .replaceAll("<!--EndFragment-->", "")
    .trim();
}

function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "";
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function clipboardToRichHtml(clipboard: DataTransfer | null): string {
  if (!clipboard) return "";
  const richHtml = normalizeClipboardHtml(clipboard.getData("text/html"));
  if (richHtml) return richHtml;
  return plainTextToHtml(clipboard.getData("text/plain"));
}

function isStructuredTableHtml(html: string): boolean {
  return /<table\b/i.test(html);
}

type ResizeAxis = "x" | "y" | "both";

function isEditableTarget(target: HTMLElement | null): boolean {
  return Boolean(target?.closest(EDITABLE_TARGET_SELECTOR));
}

/** Drop canvas text blocks only when there is no text and no images. */
function isCanvasTextStructuralEmpty(html: string): boolean {
  const trimmed = html.trim();
  if (trimmed === "" || trimmed === "<p></p>") return true;
  if (/<img\b/i.test(html)) return false;
  if (typeof window === "undefined") {
    return !trimmed.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  if (
    body.querySelector(
      "ul,ol,li,blockquote,pre,code,h1,h2,h3,h4,h5,h6,[data-type='taskList'],[data-type='taskItem'],input[type='checkbox']",
    )
  ) {
    return false;
  }
  return (body.textContent ?? "").replace(/\s+/g, " ").trim().length === 0;
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
  onDraftSnapshot,
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
      .then((url) => {
        insertUploadedImageIntoEditor(editorInstance, url);
      })
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
      ...(enableRichMedia ? [RICH_IMAGE] : []),
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
          NESTED_LIST_PROSE,
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
      handleKeyDown: (_view, event) => (handleListTab(editorRef.current, event) ? true : false),
    },
    onUpdate: ({ editor }) => {
      const next = editor.getHTML();
      const normalized = next === "<p></p>" ? "" : next;
      onChange(normalized);
      onDraftSnapshot?.(normalized);
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

  useEffect(() => {
    return () => {
      if (!editor) return;
      const next = editor.getHTML();
      onDraftSnapshot?.(next === "<p></p>" ? "" : next);
    };
  }, [editor, onDraftSnapshot]);

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
                <HoverTooltip key={button.id} content={button.label} disabled={isDisabled}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", isActive && "bg-muted text-foreground")}
                    disabled={isDisabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => editor && button.command(editor)}
                    data-testid={`rte-${button.id}`}
                  >
                    <Icon size={13} />
                  </Button>
                </HoverTooltip>
              );
            })}
          </div>
        ))}
        {enableRichMedia ? (
          <div className="flex items-center gap-0.5">
            <Separator orientation="vertical" className="mx-1 h-5" />
            <HoverTooltip content="Upload image" disabled={readOnly || imageBusy}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={readOnly || imageBusy}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => imageInputRef.current?.click()}
                data-testid="rte-image-upload"
              >
                {imageBusy ? <Spinner className="size-3" /> : <ImagePlus size={13} />}
              </Button>
            </HoverTooltip>
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
  const editorRef = useRef<Editor | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      CANVAS_TABLE,
      CANVAS_TABLE_ROW,
      CANVAS_TABLE_HEADER,
      CANVAS_TABLE_CELL,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      RICH_IMAGE,
    ],
    content: html || "",
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm max-w-none text-sm leading-relaxed text-foreground focus:outline-none dark:prose-invert",
          NESTED_LIST_PROSE,
          TABLE_PROSE,
          "[&_li[data-checked]]:list-none",
          "[&_.ProseMirror_img]:inline-block [&_.ProseMirror_img]:align-text-bottom",
          "[&_.ProseMirror]:pb-16",
        ),
      },
      handleKeyDown: (_view, event) => {
        if (handleListTab(editorRef.current, event)) return true;
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
    editorRef.current = editor ?? null;
  }, [editor]);

  useEffect(() => {
    if (!active || !editor) return;
    editor.commands.focus("end");
  }, [active, editor]);

  return (
    <div
      data-block-body={blockId}
      className="h-full min-h-20 w-full [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none"
    >
      <EditorContent editor={editor} className="block h-full w-full overflow-auto" />
    </div>
  );
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    {
      documentKey,
      layoutMode = "linear",
      value,
      onChange,
      onDraftSnapshot,
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
          onDraftSnapshot={onDraftSnapshot}
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
    const viewportRef = useRef<HTMLDivElement>(null);
    const [imageBusy, setImageBusy] = useState(false);
    const [blocks, setBlocks] = useState<CanvasBlock[]>(() => parseCanvas(value || ""));
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 760 });
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const [zoom, setZoom] = useState(1);
    const [pendingInsertPoint, setPendingInsertPoint] = useState<{ x: number; y: number } | null>({
      x: 28,
      y: 28,
    });
    const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const activeEditorRef = useRef<Editor | null>(null);
    const blocksRef = useRef(blocks);
    const hydratedRef = useRef(false);
    const zRef = useRef(Math.max(1, ...blocks.map((b) => b.z)));
    const activeDocumentKeyRef = useRef(documentKey ?? "default");
    const pinchRef = useRef<{ initialDistance: number; initialZoom: number } | null>(null);
    const clipboardBlockRef = useRef<CanvasBlock | null>(null);
    const resizeStateRef = useRef<{
      id: string;
      startClientX: number;
      startClientY: number;
      startWidth: number;
      startHeight: number;
      axis: ResizeAxis;
    } | null>(null);

    const emitChange = useCallback(
      (nextBlocks: CanvasBlock[]) => {
        const html = nextBlocks.length === 0 ? "" : serializeCanvas(nextBlocks);
        onDraftSnapshot?.(html);
        if (html !== value) onChange(html);
      },
      [onChange, onDraftSnapshot, value],
    );

    useEffect(() => {
      blocksRef.current = blocks;
    }, [blocks]);

    useEffect(() => {
      return () => {
        const next = blocksRef.current.length === 0 ? "" : serializeCanvas(blocksRef.current);
        onDraftSnapshot?.(next);
      };
    }, [onDraftSnapshot]);
    const ensureStructuredBlockCapacity = useCallback(
      (block: CanvasBlock, nextHtml: string): CanvasBlock => {
        if (block.type !== "text") return block;
        if (/<img\b/i.test(nextHtml)) {
          return {
            ...block,
            width: Math.max(block.width, 640),
            height: Math.max(block.height, 360),
          };
        }
        if (isStructuredTableHtml(nextHtml)) {
          return {
            ...block,
            width: Math.max(block.width, DEFAULT_TABLE_BLOCK_WIDTH),
            height: Math.max(block.height, DEFAULT_TABLE_BLOCK_HEIGHT),
          };
        }
        return block;
      },
      [],
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
      if (!hydratedRef.current) {
        hydratedRef.current = true;
        return;
      }
      if (serializedCurrent !== serializedIncoming) {
        setBlocks(parsed);
        zRef.current = Math.max(1, ...parsed.map((b) => b.z));
      }
    }, [value]); // keep external updates in sync

    useEffect(() => {
      const view = viewportRef.current;
      if (!view) return;
      const update = () => {
        setViewportSize({
          width: Math.max(0, view.clientWidth),
          height: Math.max(0, view.clientHeight),
        });
      };
      const observer = new ResizeObserver(update);
      observer.observe(view);
      window.visualViewport?.addEventListener("resize", update);
      window.visualViewport?.addEventListener("scroll", update);
      update();
      return () => {
        observer.disconnect();
        window.visualViewport?.removeEventListener("resize", update);
        window.visualViewport?.removeEventListener("scroll", update);
      };
    }, []);

    useEffect(() => {
      const vw = viewportSize.width;
      const vh = viewportSize.height;
      const minW = vw > 0 ? vw / zoom : 400;
      const minH = vh > 0 ? vh / zoom : 360;
      const blockMaxW = blocks.reduce((acc, b) => Math.max(acc, b.x + b.width + CANVAS_BLOCK_PADDING), 0);
      const blockMaxH = blocks.reduce((acc, b) => {
        if (b.type === "image") return Math.max(acc, b.y + 360 + CANVAS_BLOCK_PADDING);
        if (b.type === "ink") return Math.max(acc, b.y + b.height + CANVAS_BLOCK_PADDING);
        return Math.max(acc, b.y + b.height + CANVAS_BLOCK_PADDING);
      }, 0);
      setCanvasSize({
        width: Math.max(blockMaxW, minW),
        height: Math.max(blockMaxH, minH),
      });
    }, [blocks, viewportSize.height, viewportSize.width, zoom]);

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
        const editable = isEditableTarget(active);
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

    useEffect(() => {
      const el = canvasRef.current;
      if (!el) return;
      const preventBrowserZoom = (event: WheelEvent) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
        }
      };
      el.addEventListener("wheel", preventBrowserZoom, { passive: false });
      return () => {
        el.removeEventListener("wheel", preventBrowserZoom);
      };
    }, []);

    useEffect(() => {
      const onGlobalWheel = (event: WheelEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (!(event.ctrlKey || event.metaKey)) return;
        const target = event.target as Node | null;
        if (!target || !canvas.contains(target)) return;
        // Hard-stop browser zoom for Ctrl/Cmd+wheel within notes canvas area.
        event.preventDefault();
      };
      window.addEventListener("wheel", onGlobalWheel, { passive: false, capture: true });
      return () => window.removeEventListener("wheel", onGlobalWheel, true);
    }, []);

    const nextZ = () => {
      zRef.current += 1;
      return zRef.current;
    };

    const getInsertionPoint = useCallback(
      () => pendingInsertPoint ?? DEFAULT_CANVAS_INSERT_POINT,
      [pendingInsertPoint],
    );

    const focusTextBlock = useCallback((blockId: string) => {
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(`[data-block-body="${blockId}"] .ProseMirror`)
          ?.focus();
      });
    }, []);

    const createClipboardTextBlock = useCallback(
      (clipboard: DataTransfer | null) => {
        const html = clipboardToRichHtml(clipboard);
        if (!html) return false;
        const point = getInsertionPoint();
        const block = ensureStructuredBlockCapacity(
          { ...createTextBlock(point.x, point.y, html), z: nextZ() },
          html,
        );
        updateBlocks((prev) => [...prev, block]);
        setActiveBlockId(block.id);
        setPendingInsertPoint(null);
        focusTextBlock(block.id);
        return true;
      },
      [ensureStructuredBlockCapacity, focusTextBlock, getInsertionPoint, updateBlocks],
    );

    const insertClipboardIntoActiveTextBlock = useCallback((clipboard: DataTransfer | null) => {
      const editor = activeEditorRef.current;
      const html = clipboardToRichHtml(clipboard);
      if (!editor || !html) return false;
      editor.chain().focus("end").insertContent(html).run();
      setPendingInsertPoint(null);
      return true;
    }, []);

    const appendTextAt = useCallback((x: number, y: number) => {
      const block = { ...createTextBlock(x, y), z: nextZ() };
      updateBlocks((prev) => [...prev, block]);
      setActiveBlockId(block.id);
      focusTextBlock(block.id);
    }, [focusTextBlock, updateBlocks]);

    const appendTextBlockWithImageAt = useCallback((x: number, y: number, src: string) => {
      zRef.current += 1;
      const z = zRef.current;
      const safe = escapeHtmlAttr(src);
      const html = `<p><img src="${safe}" alt="" /></p><p></p>`;
      const block: CanvasBlock = { ...createImageTextBlock(x, y, html), z };
      updateBlocks((prev) => [...prev, block]);
      setActiveBlockId(block.id);
      focusTextBlock(block.id);
    }, [focusTextBlock, updateBlocks]);

    const uploadAndPlaceImage = useCallback((file: File, x: number, y: number) => {
      if (!enableRichMedia) return;
      const opDocKey = activeDocumentKeyRef.current;
      setImageBusy(true);
      void uploadNoteImageAsset(file)
        .then((url) => {
          if (activeDocumentKeyRef.current !== opDocKey) return;
          appendTextBlockWithImageAt(x, y, url);
          setPendingInsertPoint(null);
        })
        .catch((err: unknown) => {
          const message = err instanceof ApiError ? err.message : "Image upload failed.";
          window.alert(message);
        })
        .finally(() => setImageBusy(false));
    }, [appendTextBlockWithImageAt, enableRichMedia]);

    const uploadImageIntoActiveTextBlock = useCallback(
      async (file: File) => {
        if (!enableRichMedia) return;
        const opDocKey = activeDocumentKeyRef.current;
        const ed = activeEditorRef.current;
        if (!ed) return;
        setImageBusy(true);
        try {
          const url = await uploadNoteImageAsset(file);
          if (activeDocumentKeyRef.current !== opDocKey) return;
          insertUploadedImageIntoEditor(ed, url);
          setPendingInsertPoint(null);
        } catch (err: unknown) {
          const message = err instanceof ApiError ? err.message : "Image upload failed.";
          window.alert(message);
        } finally {
          setImageBusy(false);
        }
      },
      [enableRichMedia],
    );

    const onPickImageFiles = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !isLikelyImageFile(file)) return;
        const activeText = blocks.find((b) => b.id === activeBlockId && b.type === "text");
        if (activeText && activeEditorRef.current) {
          void uploadImageIntoActiveTextBlock(file);
          return;
        }
        const point = getInsertionPoint();
        uploadAndPlaceImage(file, point.x, point.y);
      },
      [activeBlockId, blocks, getInsertionPoint, uploadAndPlaceImage, uploadImageIntoActiveTextBlock],
    );

    const beginDrag = useCallback((event: React.PointerEvent, block: CanvasBlock) => {
      if (readOnly) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dragStateRef.current = {
        id: block.id,
        offsetX: (event.clientX - rect.left) / zoom - block.x,
        offsetY: (event.clientY - rect.top) / zoom - block.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setActiveBlockId(block.id);
      updateBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, z: nextZ() } : b)));
    }, [readOnly, updateBlocks, zoom]);

    const onCanvasPointerMove = useCallback((event: React.PointerEvent) => {
      const resize = resizeStateRef.current;
      if (resize) {
        const deltaX = (event.clientX - resize.startClientX) / zoom;
        const deltaY = (event.clientY - resize.startClientY) / zoom;
        const nextWidth =
          resize.axis === "y" ? resize.startWidth : Math.max(MIN_TEXT_BLOCK_WIDTH, resize.startWidth + deltaX);
        const nextHeight =
          resize.axis === "x" ? resize.startHeight : Math.max(MIN_TEXT_BLOCK_HEIGHT, resize.startHeight + deltaY);
        updateBlocks((prev) =>
          prev.map((block) =>
            block.id === resize.id && block.type === "text"
              ? { ...block, width: nextWidth, height: nextHeight }
              : block,
          ),
        );
        return;
      }

      const drag = dragStateRef.current;
      if (!drag) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(8, (event.clientX - rect.left) / zoom - drag.offsetX);
      const y = Math.max(8, (event.clientY - rect.top) / zoom - drag.offsetY);
      updateBlocks((prev) => prev.map((b) => (b.id === drag.id ? { ...b, x, y } : b)));
    }, [updateBlocks, zoom]);
    const endDrag = () => {
      dragStateRef.current = null;
    };

    const beginResize = (event: React.PointerEvent, block: CanvasBlock, axis: ResizeAxis = "both") => {
      if (readOnly || block.type !== "text") return;
      event.preventDefault();
      event.stopPropagation();
      resizeStateRef.current = {
        id: block.id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startWidth: block.width,
        startHeight: block.height,
        axis,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setActiveBlockId(block.id);
    };

    const onCanvasDrawPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (readOnly) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-note-block-wrap]")) return;
      event.currentTarget.focus({ preventScroll: true });
    };

    const onCanvasDrawPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      onCanvasPointerMove(event);
    };

    const onCanvasDrawPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
      endDrag();
      if (resizeStateRef.current) {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* noop */
        }
        resizeStateRef.current = null;
      }
    };

    const plainHint =
      "Click to place a caret, double-click to add a block, drag handles to move or resize, and use Ctrl/Cmd + scroll to zoom.";
    const zoomOut = () => setZoom((z) => Math.max(0.5, z - 0.1));
    const zoomIn = () => setZoom((z) => Math.min(2.5, z + 0.1));

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
                <HoverTooltip key={button.id} content={button.label} disabled={isDisabled}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", isActive && "bg-muted text-foreground")}
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
                </HoverTooltip>
                );
              })}
            </div>
          ))}
          <Separator orientation="vertical" className="mx-1 h-5" />
          <HoverTooltip content="Add text block" disabled={readOnly}>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={readOnly} onClick={() => appendTextAt(56, 120)} data-testid="rte-add-text"><SquarePen size={13} /></Button>
          </HoverTooltip>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <HoverTooltip content="Upload image block" disabled={readOnly || imageBusy || !enableRichMedia}>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={readOnly || imageBusy || !enableRichMedia} onClick={() => imageInputRef.current?.click()} data-testid="rte-image-upload">
              {imageBusy ? <Spinner className="size-3" /> : <ImagePlus size={13} />}
            </Button>
          </HoverTooltip>
          <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onPickImageFiles} />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <div className="flex items-center rounded-md border border-border/60 px-1.5 py-0.5 text-[11px]">
            <HoverTooltip content="Zoom out">
              <button
                type="button"
                className="h-5 w-5 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={zoomOut}
                data-testid="rte-zoom-out"
              >
                -
              </button>
            </HoverTooltip>
            <input
              type="number"
              min={50}
              max={250}
              step={5}
              value={Math.round(zoom * 100)}
              onChange={(event) => {
                const n = Number(event.target.value);
                if (!Number.isFinite(n)) return;
                setZoom(Math.max(0.5, Math.min(2.5, n / 100)));
              }}
              className="h-5 w-12 bg-transparent text-center font-mono text-muted-foreground outline-none [-moz-appearance:textfield] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Canvas zoom percent"
            />
            <HoverTooltip content="Zoom in">
              <button
                type="button"
                className="h-5 w-5 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={zoomIn}
                data-testid="rte-zoom-in"
              >
                +
              </button>
            </HoverTooltip>
          </div>
          {toolbarRight ? (
            <div className="ml-auto flex items-center gap-0.5">{toolbarRight}</div>
          ) : null}
        </div>
        {showMediaHint ? (
          <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:px-4">
            {enableRichMedia ? "Paste rich text, tables, or images into the canvas. " : "Paste rich text into the canvas. "}{plainHint}
          </p>
        ) : null}
        <div
          ref={viewportRef}
          className="flex min-h-[min(28rem,calc(100vh-15rem))] flex-1 flex-col overflow-auto px-1 pb-3 sm:px-3 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground))/transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 dark:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
        >
          <div
            ref={canvasRef}
            tabIndex={readOnly ? -1 : 0}
            className="relative mt-0 w-full min-w-0 rounded-lg border border-border bg-card text-card-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            style={{
              width: canvasSize.width * zoom,
              minWidth: canvasSize.width * zoom,
              height: canvasSize.height * zoom,
              minHeight: canvasSize.height * zoom,
              transformOrigin: "top left",
            }}
            data-testid={testId ?? "rte-editor"}
            onPointerDown={onCanvasDrawPointerDown}
            onPointerMove={onCanvasDrawPointerMove}
            onPointerUp={onCanvasDrawPointerUp}
            onPointerCancel={onCanvasDrawPointerUp}
            onClick={(event) => {
              if (readOnly) return;
              const target = event.target as HTMLElement;
              if (target.closest("[data-note-block-wrap]")) return;
              event.currentTarget.focus({ preventScroll: true });
              const rect = event.currentTarget.getBoundingClientRect();
              setPendingInsertPoint({
                x: (event.clientX - rect.left) / zoom,
                y: (event.clientY - rect.top) / zoom,
              });
            }}
            onDoubleClick={(event) => {
              if (readOnly) return;
              const target = event.target as HTMLElement;
              if (target.closest("[data-note-block-wrap]")) return;
              event.preventDefault();
              event.currentTarget.focus({ preventScroll: true });
              const rect = event.currentTarget.getBoundingClientRect();
              const x = Math.max(8, (event.clientX - rect.left) / zoom - 4);
              const y = Math.max(8, (event.clientY - rect.top) / zoom - 4);
              const block = { ...createTextBlock(x, y), z: nextZ() };
              updateBlocks((prev) => [...prev, block]);
              setActiveBlockId(block.id);
              setPendingInsertPoint(null);
              focusTextBlock(block.id);
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
              if (!event.ctrlKey && !event.metaKey) return;
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
              if (readOnly) return;
              const target = event.target as HTMLElement;
              if (isEditableTarget(target)) return;
              const activeText = blocks.find((b) => b.id === activeBlockId && b.type === "text");
              const fileItem = enableRichMedia
                ? Array.from(event.clipboardData.items).find(clipboardItemIsImage)
                : undefined;
              const file = fileItem?.getAsFile();
              if (file) {
                event.preventDefault();
                if (activeText && activeEditorRef.current && !pendingInsertPoint) {
                  void uploadImageIntoActiveTextBlock(file);
                  return;
                }
                const point = getInsertionPoint();
                uploadAndPlaceImage(file, point.x, point.y);
                return;
              }
              if (activeText && activeEditorRef.current && !pendingInsertPoint) {
                if (insertClipboardIntoActiveTextBlock(event.clipboardData)) {
                  event.preventDefault();
                }
                return;
              }
              if (createClipboardTextBlock(event.clipboardData)) {
                event.preventDefault();
              }
            }}
          >
            {blocks.length === 0 && !readOnly ? (
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-6 text-center">
                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground/85">
                  {placeholder ??
                    "Nothing here yet — click once to place a caret and type to open a text block right away."}
                </p>
              </div>
            ) : null}
            {blocks.map((block) => (
              (() => {
                const blockHasTable = block.type === "text" && isStructuredTableHtml(block.html ?? "");
                return (
              <div
                key={block.id}
                data-note-block-wrap={block.id}
                className={cn(
                  "absolute z-1 rounded-md border bg-background/95 shadow-sm",
                  activeBlockId === block.id ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60",
                )}
                style={{
                  left: block.x * zoom,
                  top: block.y * zoom,
                  width: block.width * zoom,
                  ...(block.type === "ink" || block.type === "text" ? { height: block.height * zoom } : {}),
                  zIndex: block.z,
                }}
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
                      <HoverTooltip content="Delete block">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive/80 hover:text-destructive"
                          onClick={() => updateBlocks((prev) => prev.filter((b) => b.id !== block.id))}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </HoverTooltip>
                    </div>
                  </div>
                ) : null}
                <div
                  className={cn(
                    "relative p-3",
                    block.type === "ink" && "p-1 pt-0",
                    block.type === "text" && "h-[calc(100%-2.25rem)]",
                  )}
                >
                  {block.type === "image" ? (
                    <img src={block.src} alt="" className="max-h-[520px] w-full rounded-md object-contain" />
                  ) : null}
                  {block.type === "ink" ? (
                    <svg
                      className="block max-h-[520px] w-full"
                      viewBox={`0 0 ${block.width} ${block.height}`}
                      preserveAspectRatio="xMinYMin meet"
                      aria-hidden
                    >
                      <path
                        d={pointsToPathD(block.points)}
                        fill="none"
                        stroke={block.color}
                        strokeWidth={block.strokeWidth}
                        strokeOpacity={block.opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
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
                          if (isCanvasTextStructuralEmpty(nextHtml)) {
                            return prev.filter((b) => b.id !== block.id);
                          }
                          return prev.map((b) =>
                            b.id === block.id
                              ? { ...ensureStructuredBlockCapacity(b, nextHtml), html: nextHtml }
                              : b,
                          );
                        })
                      }
                    />
                  ) : null}
                  {block.type === "text" && !readOnly ? (
                    <>
                      {blockHasTable ? (
                        <>
                          <button
                            type="button"
                            className="absolute right-0 top-1/2 z-10 flex h-10 w-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border/70 bg-background/95 text-muted-foreground/80 shadow-sm transition-colors hover:text-foreground"
                            onPointerDown={(event) => beginResize(event, block, "x")}
                            data-testid={`note-resize-x-${block.id}`}
                            aria-label="Resize table width"
                          >
                            <Minus size={12} className="rotate-90" />
                          </button>
                          <button
                            type="button"
                            className="absolute bottom-0 left-1/2 z-10 flex h-4 w-10 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/95 text-muted-foreground/80 shadow-sm transition-colors hover:text-foreground"
                            onPointerDown={(event) => beginResize(event, block, "y")}
                            data-testid={`note-resize-y-${block.id}`}
                            aria-label="Resize table height"
                          >
                            <Minus size={12} />
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="absolute bottom-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                        onPointerDown={(event) => beginResize(event, block)}
                        data-testid={`note-resize-${block.id}`}
                        aria-label={blockHasTable ? "Resize table block" : "Resize note block"}
                      >
                        <MoveDiagonal2 size={12} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
                );
              })()
            ))}
            {pendingInsertPoint && !readOnly ? (
              <div
                className="pointer-events-none absolute h-5 w-[2px] rounded-full bg-foreground/35 animate-pulse dark:bg-foreground/45"
                style={{ left: pendingInsertPoint.x * zoom + 1, top: pendingInsertPoint.y * zoom + 2 }}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);

export { htmlToPlainText, richTextHasPlainContent } from "./html-plain-text";
