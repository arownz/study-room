import { Globe, Lock, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { StudyRoomViewModel } from "../hooks/use-study-rooms";

interface StudyRoomListProps {
  rooms: StudyRoomViewModel[];
  selectedId: string | null;
  onSelect: (room: StudyRoomViewModel) => void;
  onCreate: () => void;
  isLoading: boolean;
}

export function StudyRoomList({
  rooms,
  selectedId,
  onSelect,
  onCreate,
  isLoading,
}: StudyRoomListProps) {
  return (
    <div className="flex w-56 shrink-0 flex-col border-r border-border/60 bg-sidebar">
      <div className="flex items-center justify-between border-b border-border/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Study Rooms
        </p>
        <Button
          size="icon"
          className="h-6 w-6"
          onClick={onCreate}
          data-testid="button-create-room"
        >
          <Plus size={12} />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {isLoading && rooms.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-4" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">No rooms yet.</p>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelect(room)}
                className={cn(
                  "w-full rounded-md p-2.5 text-left transition-colors",
                  room.id === selectedId ? "bg-sidebar-accent" : "hover:bg-muted/50",
                )}
                data-testid={`room-list-item-${room.id}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-xs font-medium">{room.name}</p>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <Users size={10} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{room.relativeUpdatedAt}</span>
                  {room.isPublic ? (
                    <Globe size={9} className="ml-auto text-muted-foreground" />
                  ) : (
                    <Lock size={9} className="ml-auto text-muted-foreground" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
