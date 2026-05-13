import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useGetStudyRoomTimer, usePatchStudyRoomTimer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StudyRoomTimerBar(props: { roomId: string }) {
  const { data: envelope } = useGetStudyRoomTimer(props.roomId);
  const dto = envelope?.data;
  const patch = usePatchStudyRoomTimer();

  const [displaySec, setDisplaySec] = useState(0);

  useEffect(() => {
    if (!dto) return;
    if (!dto.running || !dto.anchorEndsAt) {
      setDisplaySec(dto.remainingSec);
      return;
    }
    const tick = () => {
      const sec = Math.max(
        0,
        Math.ceil((new Date(dto.anchorEndsAt!).getTime() - Date.now()) / 1000),
      );
      setDisplaySec(sec);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [dto, dto?.running, dto?.anchorEndsAt, dto?.remainingSec]);

  if (!dto) return null;

  const mm = Math.floor(displaySec / 60)
    .toString()
    .padStart(2, "0");
  const ss = (displaySec % 60).toString().padStart(2, "0");

  const phaseLabel = dto.phase === "focus" ? "Focus" : dto.phase === "break" ? "Break" : "Idle";

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/20 px-4 py-2">
      <Badge variant="outline" className="text-[10px] font-normal">
        Shared timer · {phaseLabel}
      </Badge>
      <span className="font-mono text-sm tabular-nums">
        {mm}:{ss}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs"
          type="button"
          disabled={patch.isPending}
          onClick={() =>
            patch.mutate({
              roomId: props.roomId,
              data: { phase: "focus", durationSec: 25 * 60, remainingSec: 25 * 60, running: true },
            })
          }
        >
          25m focus
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs"
          type="button"
          disabled={patch.isPending}
          onClick={() =>
            patch.mutate({
              roomId: props.roomId,
              data: { phase: "break", durationSec: 5 * 60, remainingSec: 5 * 60, running: true },
            })
          }
        >
          5m break
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-7 w-7"
          type="button"
          disabled={patch.isPending}
          onClick={() =>
            patch.mutate({
              roomId: props.roomId,
              data: dto.running
                ? { running: false, remainingSec: displaySec }
                : {
                    running: true,
                    remainingSec: displaySec || dto.durationSec || 25 * 60,
                  },
            })
          }
        >
          {dto.running ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          type="button"
          disabled={patch.isPending}
          onClick={() =>
            patch.mutate({
              roomId: props.roomId,
              data: { phase: "idle", running: false, remainingSec: 0 },
            })
          }
        >
          <RotateCcw size={14} />
        </Button>
      </div>
      {dto.leaderUserId && (
        <span className={cn("w-full text-[10px] text-muted-foreground sm:w-auto sm:ml-2")}>
          Leader session active
        </span>
      )}
    </div>
  );
}
