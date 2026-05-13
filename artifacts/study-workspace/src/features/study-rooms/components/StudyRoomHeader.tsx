import { useEffect, useState } from "react";
import { Mic, MicOff, Pencil, Save, Settings, Timer, Trash2, Video, VideoOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { StudyRoomViewModel } from "../hooks/use-study-rooms";

interface StudyRoomHeaderProps {
  room: StudyRoomViewModel;
  onSave: (payload: { name: string; description: string | null; isPublic: boolean }) => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

export function StudyRoomHeader({
  room,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: StudyRoomHeaderProps) {
  const headerDraftKey = `studyroom.room-header-draft:${room.id}`;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(room.name);
  const [isPublic, setIsPublic] = useState(room.isPublic);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);

  useEffect(() => {
    if (editing) return;
    setName(room.name);
    setIsPublic(room.isPublic);
  }, [editing, room.name, room.isPublic]);

  const isDirty = editing && (name !== room.name || isPublic !== room.isPublic);

  useEffect(() => {
    if (!editing) return;
    try {
      window.sessionStorage.setItem(headerDraftKey, JSON.stringify({ name, isPublic }));
    } catch {
      /* ignore */
    }
  }, [editing, headerDraftKey, name, isPublic]);

  const beginEdit = () => {
    try {
      const raw = window.sessionStorage.getItem(headerDraftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { name?: unknown; isPublic?: unknown };
        if (typeof parsed.name === "string") setName(parsed.name);
        if (typeof parsed.isPublic === "boolean") setIsPublic(parsed.isPublic);
      } else {
        setName(room.name);
        setIsPublic(room.isPublic);
      }
    } catch {
      setName(room.name);
      setIsPublic(room.isPublic);
    }
    setEditing(true);
  };

  const handleSave = async () => {
    await onSave({ name: name.trim() || room.name, description: room.description, isPublic });
    try {
      window.sessionStorage.removeItem(headerDraftKey);
    } catch {
      /* ignore */
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    try {
      window.sessionStorage.removeItem(headerDraftKey);
    } catch {
      /* ignore */
    }
    setName(room.name);
    setIsPublic(room.isPublic);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {editing ? (
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-7 max-w-xs text-sm font-semibold"
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-semibold">{room.name}</h3>
          )}
          <Badge variant="secondary" className="text-[10px]">
            {room.isPublic ? "Public" : "Private"}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {room.description?.length ? room.description : "No description yet"}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {editing ? (
          <>
            <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <span className="text-[11px] text-muted-foreground">Public</span>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
              {isSaving ? <Spinner className="size-3" /> : <Save size={13} />}
              Save
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
              <Timer size={12} className="text-primary" />
              <span className="font-mono font-semibold">00:00:00</span>
            </div>
            <Button
              variant={micOn ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setMicOn((v) => !v)}
              data-testid="button-toggle-mic"
            >
              {micOn ? <Mic size={14} /> : <MicOff size={14} />}
            </Button>
            <Button
              variant={camOn ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setCamOn((v) => !v)}
              data-testid="button-toggle-cam"
            >
              {camOn ? <Video size={14} /> : <VideoOff size={14} />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" data-testid="button-room-menu">
                  <Settings size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={beginEdit}>
                  <Pencil size={13} /> Edit room
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={13} /> Delete room
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the room. Members will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                await onDelete();
                setConfirmDelete(false);
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
