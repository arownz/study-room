import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { WhiteboardList } from "@/features/whiteboard/components/WhiteboardList";
import { WhiteboardWorkbench } from "@/features/whiteboard/components/WhiteboardWorkbench";
import { useWhiteboards } from "@/features/whiteboard/hooks/use-whiteboards";

const LAST_WHITEBOARD_ID_KEY = "studyroom.whiteboards.lastId";

export default function Whiteboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [routeMatch, routeParams] = useRoute<{ whiteboardId: string }>("/whiteboard/:whiteboardId");
  const routeWhiteboardId = routeMatch && routeParams ? routeParams.whiteboardId : null;

  const { boards, isLoading, isError, isCreating, isDeleting, createBoard, deleteBoard } =
    useWhiteboards();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(routeWhiteboardId ?? "");
  const [selectedBoardDirty, setSelectedBoardDirty] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const attemptedLastRestore = useRef(false);

  useEffect(() => {
    if (routeWhiteboardId) setSelectedId(routeWhiteboardId);
  }, [routeWhiteboardId]);

  useEffect(() => {
    if (routeWhiteboardId) {
      try {
        sessionStorage.setItem(LAST_WHITEBOARD_ID_KEY, routeWhiteboardId);
      } catch {
        /* ignore */
      }
      return;
    }
    if (attemptedLastRestore.current || isLoading || isError) return;
    let last: string | null = null;
    try {
      last = sessionStorage.getItem(LAST_WHITEBOARD_ID_KEY);
    } catch {
      return;
    }
    if (!last) return;
    attemptedLastRestore.current = true;
    if (boards.some((board) => board.id === last)) {
      setLocation(`/whiteboard/${last}`);
    }
  }, [boards, isError, isLoading, routeWhiteboardId, setLocation]);

  const visibleBoards = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    if (!lowered) return boards;
    return boards.filter((board) => board.title.toLowerCase().includes(lowered));
  }, [boards, search]);

  useEffect(() => {
    if (visibleBoards.length === 0) {
      if (selectedId) setSelectedId("");
      return;
    }
    if (!visibleBoards.some((board) => board.id === selectedId)) {
      const next = visibleBoards[0];
      setSelectedId(next.id);
      if (routeWhiteboardId && routeWhiteboardId !== next.id) {
        setLocation(`/whiteboard/${next.id}`);
      }
    }
  }, [routeWhiteboardId, selectedId, setLocation, visibleBoards]);

  const selected = visibleBoards.find((board) => board.id === selectedId) ?? null;

  const handleSelect = (whiteboardId: string) => {
    setSelectedId(whiteboardId);
    setLocation(`/whiteboard/${whiteboardId}`);
  };

  const handleCreate = async () => {
    if (
      selectedBoardDirty &&
      !window.confirm(
        "This whiteboard has unsaved changes. A local draft will be kept, but create a new board anyway?",
      )
    ) {
      return;
    }

    try {
      const created = await createBoard();
      setSelectedBoardDirty(false);
      setSelectedId(created.id);
      setLocation(`/whiteboard/${created.id}`);
      toast({ title: "Whiteboard created" });
    } catch {
      toast({ title: "Failed to create whiteboard", variant: "destructive" });
    }
  };

  const handleDelete = async (whiteboardId: string) => {
    const target = boards.find((board) => board.id === whiteboardId);
    if (!target) return;

    const deletingSelectedBoard = selected?.id === whiteboardId;
    const needsUnsavedConfirm = deletingSelectedBoard && selectedBoardDirty;
    const confirmed = window.confirm(
      needsUnsavedConfirm
        ? `Delete "${target.title.trim() || "Untitled Whiteboard"}"? Unsaved local changes for this board will be lost.`
        : `Delete "${target.title.trim() || "Untitled Whiteboard"}"?`,
    );
    if (!confirmed) return;

    setDeletingBoardId(whiteboardId);
    try {
      await deleteBoard(whiteboardId);
      const remaining = boards.filter((board) => board.id !== whiteboardId);
      const next = remaining[0] ?? null;
      try {
        window.localStorage.removeItem(`studyroom.whiteboard.draft:${whiteboardId}`);
        if (window.sessionStorage.getItem(LAST_WHITEBOARD_ID_KEY) === whiteboardId) {
          if (next) {
            window.sessionStorage.setItem(LAST_WHITEBOARD_ID_KEY, next.id);
          } else {
            window.sessionStorage.removeItem(LAST_WHITEBOARD_ID_KEY);
          }
        }
      } catch {
        /* ignore */
      }
      if (deletingSelectedBoard) {
        setSelectedBoardDirty(false);
      }
      setSelectedId(next?.id ?? "");
      setLocation(next ? `/whiteboard/${next.id}` : "/whiteboard");
      toast({ title: "Whiteboard deleted" });
    } catch {
      toast({ title: "Failed to delete whiteboard", variant: "destructive" });
    } finally {
      setDeletingBoardId(null);
    }
  };

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem-3rem)] min-h-0 min-w-0 overflow-hidden rounded-xl border border-border/40">
      <WhiteboardList
        boards={visibleBoards}
        search={search}
        onSearchChange={setSearch}
        selectedId={selected?.id ?? null}
        onSelect={(board) => handleSelect(board.id)}
        onDelete={(board) => void handleDelete(board.id)}
        onCreate={() => void handleCreate()}
        isCreating={isCreating}
        isLoading={isLoading}
        deletingId={isDeleting ? deletingBoardId : null}
      />

      {selected ? (
        <div className="flex min-h-0 min-w-0 flex-1">
          <WhiteboardWorkbench
            whiteboardId={selected.id}
            onDirtyChange={setSelectedBoardDirty}
            onCreateRequested={() => void handleCreate()}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-background p-6">
          <Card className="w-full max-w-md border-border/60">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              {isLoading ? <Spinner className="size-5" /> : null}
              <p className="text-sm text-muted-foreground">
                {isError
                  ? "Failed to load whiteboards. Please refresh."
                  : isLoading
                    ? "Loading your whiteboards…"
                    : "Pick a whiteboard from the list or create a new one to begin."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
