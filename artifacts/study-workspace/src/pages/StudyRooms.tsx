import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { StudyRoomChat } from "@/features/study-rooms/components/StudyRoomChat";
import {
  StudyRoomCreateDialog,
  type StudyRoomCreateValues,
} from "@/features/study-rooms/components/StudyRoomCreateDialog";
import { StudyRoomGoals } from "@/features/study-rooms/components/StudyRoomGoals";
import { StudyRoomHeader } from "@/features/study-rooms/components/StudyRoomHeader";
import { StudyRoomList } from "@/features/study-rooms/components/StudyRoomList";
import { useStudyRooms } from "@/features/study-rooms/hooks/use-study-rooms";

export default function StudyRooms() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [routeMatch, routeParams] = useRoute<{ roomId: string }>("/rooms/:roomId");
  // wouter recreates routeParams every render; pin to a primitive string for effect deps.
  const routeRoomId = routeMatch && routeParams ? routeParams.roomId : null;

  const {
    rooms,
    isLoading,
    isError,
    isCreating,
    isUpdating,
    isDeleting,
    createRoom,
    updateRoom,
    deleteRoom,
  } = useStudyRooms();

  const [selectedId, setSelectedId] = useState<string>(routeRoomId ?? "");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (routeRoomId) setSelectedId(routeRoomId);
  }, [routeRoomId]);

  useEffect(() => {
    if (rooms.length === 0) {
      if (selectedId) setSelectedId("");
      return;
    }
    if (!rooms.some((room) => room.id === selectedId)) {
      const next = rooms[0];
      setSelectedId(next.id);
      if (routeRoomId && next.id !== routeRoomId) {
        setLocation(`/rooms/${next.id}`);
      }
    }
  }, [rooms, selectedId, routeRoomId, setLocation]);

  const selected = rooms.find((room) => room.id === selectedId) ?? null;

  const handleCreate = async (values: StudyRoomCreateValues) => {
    try {
      const created = await createRoom(values);
      setCreateOpen(false);
      setSelectedId(created.id);
      setLocation(`/rooms/${created.id}`);
      toast({ title: "Room created" });
    } catch {
      toast({ title: "Failed to create room", variant: "destructive" });
    }
  };

  const handleSave = async (payload: {
    name: string;
    description: string | null;
    isPublic: boolean;
  }) => {
    if (!selected) return;
    try {
      await updateRoom(selected.id, payload);
      toast({ title: "Room saved" });
    } catch {
      toast({ title: "Failed to save room", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteRoom(selected.id);
      setLocation("/rooms");
      toast({ title: "Room deleted" });
    } catch {
      toast({ title: "Failed to delete room", variant: "destructive" });
    }
  };

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem-3rem)] overflow-hidden rounded-xl border border-border/40">
      <StudyRoomList
        rooms={rooms}
        selectedId={selected?.id ?? null}
        onSelect={(room) => {
          setSelectedId(room.id);
          setLocation(`/rooms/${room.id}`);
        }}
        onCreate={() => setCreateOpen(true)}
        isLoading={isLoading}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <>
            <StudyRoomHeader
              room={selected}
              onSave={handleSave}
              onDelete={handleDelete}
              isSaving={isUpdating}
              isDeleting={isDeleting}
            />
            <div className="flex min-h-0 flex-1">
              <StudyRoomChat room={selected} />
              <StudyRoomGoals />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-background p-6">
            <Card className="w-full max-w-md border-border/60">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                {isLoading ? <Spinner className="size-5" /> : null}
                <p className="text-sm text-muted-foreground">
                  {isError
                    ? "Failed to load study rooms. Please refresh."
                    : isLoading
                      ? "Loading rooms…"
                      : "Pick a room from the list or create a new one to get started."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <StudyRoomCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
      />
    </div>
  );
}
