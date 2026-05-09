import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Star, StarOff, Trash2, Folder, FileText, ChevronRight, Hash, MoreHorizontal, Bold, Italic, Code, List, ListOrdered, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { mockNotes, mockFolders } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

type Note = typeof mockNotes[number];

export default function Notes() {
  const [notes, setNotes] = useState(mockNotes);
  const [selected, setSelected] = useState<Note>(mockNotes[0]);
  const [content, setContent] = useState(mockNotes[0].content);
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = notes.filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchFolder = activeFolder ? n.folder === activeFolder : true;
    return matchSearch && matchFolder;
  });

  const selectNote = (note: Note) => {
    setSelected(note);
    setContent(note.content);
  };

  const toggleFavorite = (id: string) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, favorite: !n.favorite } : n));
  };

  const createNote = () => {
    const newNote: Note = {
      id: String(Date.now()),
      title: "Untitled Note",
      folder: activeFolder || "Uncategorized",
      content: "",
      preview: "",
      updatedAt: "just now",
      favorite: false,
      tags: [],
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelected(newNote);
    setContent("");
    toast({ title: "Note created", description: "Start typing to add content." });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] -m-6 overflow-hidden border border-border/40 rounded-xl">
      {/* Folders sidebar */}
      <div className="w-44 border-r border-border/60 bg-sidebar flex flex-col shrink-0">
        <div className="p-3 border-b border-border/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            <button
              onClick={() => setActiveFolder(null)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                !activeFolder ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
              data-testid="folder-all"
            >
              <FileText size={13} />
              All Notes
              <span className="ml-auto text-[10px] text-muted-foreground">{notes.length}</span>
            </button>
            <button
              onClick={() => setActiveFolder("__favorites__")}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                activeFolder === "__favorites__" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
              data-testid="folder-favorites"
            >
              <Star size={13} className="text-amber-400" />
              Favorites
              <span className="ml-auto text-[10px] text-muted-foreground">{notes.filter(n => n.favorite).length}</span>
            </button>
            <Separator className="my-2" />
            {mockFolders.map((f) => (
              <button
                key={f.name}
                onClick={() => setActiveFolder(f.name)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                  activeFolder === f.name ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                data-testid={`folder-${f.name.toLowerCase()}`}
              >
                <Folder size={13} />
                {f.name}
                <span className="ml-auto text-[10px] text-muted-foreground">{f.count}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Note list */}
      <div className="w-64 border-r border-border/60 flex flex-col shrink-0">
        <div className="p-3 border-b border-border/60 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-7 text-xs"
                data-testid="input-search-notes"
              />
            </div>
            <Button size="icon" className="h-7 w-7 shrink-0" onClick={createNote} data-testid="button-create-note">
              <Plus size={13} />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {filtered.map((note) => (
              <motion.button
                key={note.id}
                whileHover={{ x: 2 }}
                onClick={() => selectNote(note)}
                className={cn(
                  "w-full text-left rounded-md p-2.5 transition-colors group",
                  selected.id === note.id ? "bg-sidebar-accent" : "hover:bg-muted/50"
                )}
                data-testid={`note-list-item-${note.id}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-medium truncate leading-snug">{note.title}</p>
                  {note.favorite && <Star size={10} className="text-amber-400 shrink-0 mt-0.5" />}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-snug">{note.preview}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[9px] text-muted-foreground">{note.updatedAt}</span>
                  {note.tags.slice(0, 1).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[9px] py-0 px-1 h-3.5">{tag}</Badge>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Toolbar */}
        <div className="border-b border-border/60 px-4 py-2 flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {[
              { icon: Bold, label: "Bold" },
              { icon: Italic, label: "Italic" },
              { icon: Code, label: "Code" },
              { icon: List, label: "Bullet list" },
              { icon: ListOrdered, label: "Numbered list" },
              { icon: AlignLeft, label: "Paragraph" },
            ].map(({ icon: Icon, label }) => (
              <Button key={label} variant="ghost" size="icon" className="h-7 w-7" title={label} data-testid={`toolbar-${label.toLowerCase().replace(/\s/g, "-")}`}>
                <Icon size={13} />
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <div className="flex items-center gap-0.5 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleFavorite(selected.id)}
              data-testid="button-toggle-favorite"
            >
              {selected.favorite ? <Star size={13} className="text-amber-400" /> : <StarOff size={13} />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" data-testid="button-delete-note">
              <Trash2 size={13} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-more-options">
              <MoreHorizontal size={13} />
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Folder size={11} />
          <span>{selected.folder}</span>
          <ChevronRight size={10} />
          <span className="text-foreground font-medium">{selected.title}</span>
          <div className="flex gap-1 ml-2">
            {selected.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-0.5 text-[10px]">
                <Hash size={9} />
                {tag}
              </span>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 pb-8">
            <input
              value={selected.title}
              onChange={(e) => setSelected((s) => ({ ...s, title: e.target.value }))}
              className="w-full text-2xl font-bold bg-transparent border-none outline-none mb-4 text-foreground placeholder:text-muted-foreground"
              placeholder="Untitled"
              data-testid="input-note-title"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-foreground placeholder:text-muted-foreground font-mono"
              placeholder="Start writing... (supports Markdown)"
              data-testid="textarea-note-content"
            />
          </div>
        </ScrollArea>

        <div className="border-t border-border/60 px-6 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>{content.length} characters</span>
          <span className="ml-auto">Last edited {selected.updatedAt}</span>
        </div>
      </div>
    </div>
  );
}
