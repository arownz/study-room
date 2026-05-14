import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface PomodoroSpotifySlotContextValue {
  spotifySlotEl: HTMLDivElement | null;
  setSpotifySlotEl: (el: HTMLDivElement | null) => void;
}

const PomodoroSpotifySlotContext = createContext<PomodoroSpotifySlotContextValue | null>(null);

export function PomodoroSpotifySlotProvider({ children }: { children: ReactNode }) {
  const [spotifySlotEl, setSpotifySlotState] = useState<HTMLDivElement | null>(null);
  const setSpotifySlotEl = useCallback((el: HTMLDivElement | null) => {
    setSpotifySlotState((prev) => (prev === el ? prev : el));
  }, []);

  const value = useMemo(
    () => ({
      spotifySlotEl,
      setSpotifySlotEl,
    }),
    [spotifySlotEl, setSpotifySlotEl],
  );

  return <PomodoroSpotifySlotContext.Provider value={value}>{children}</PomodoroSpotifySlotContext.Provider>;
}

export function usePomodoroSpotifySlot(): PomodoroSpotifySlotContextValue {
  const ctx = useContext(PomodoroSpotifySlotContext);
  if (!ctx) {
    return {
      spotifySlotEl: null,
      setSpotifySlotEl: () => {
        /* no-op when provider missing */
      },
    };
  }
  return ctx;
}
