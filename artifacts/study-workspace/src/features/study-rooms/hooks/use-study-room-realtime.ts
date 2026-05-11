import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import {
  getListStudyRoomGoalsQueryKey,
  getStudyRoomTimerQueryKey,
  type StudyRoomTimerDto,
} from "@workspace/api-client-react";

export function useStudyRoomRealtime(roomId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    const socket = io({
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    const onTimer = (dto: StudyRoomTimerDto) => {
      queryClient.setQueryData(getStudyRoomTimerQueryKey(roomId), {
        success: true,
        data: dto,
      });
    };

    const onGoalsSync = () => {
      void queryClient.invalidateQueries({ queryKey: getListStudyRoomGoalsQueryKey(roomId) });
    };

    socket.on("connect", () => {
      socket.emit("studyRoom:join", { roomId });
    });
    socket.on("studyRoom:timer", onTimer);
    socket.on("studyRoom:goalsSync", onGoalsSync);

    return () => {
      socket.emit("studyRoom:leave", { roomId });
      socket.removeAllListeners();
      socket.close();
    };
  }, [roomId, queryClient]);
}
