import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ExternalLink, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePomodoroSpotifySlot } from "../pomodoro-spotify-slot-context";
import {
  deriveAmbientOutputFromSnapshot,
  readSessionSnapshot,
  subscribePomodoroSync,
  type PomodoroSessionSnapshot,
} from "../persistence";
import { useCallback } from "react";

const SPOTIFY_EMBED_SRC =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator";

const SPOTIFY_FLOAT_DISMISSED_KEY = "studyroom.pomodoro.ui.spotifyFloatDismissed";

function loadSpotifyFloatDismissed(): boolean {
  try {
    return localStorage.getItem(SPOTIFY_FLOAT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function saveSpotifyFloatDismissed(v: boolean) {
  try {
    if (v) localStorage.setItem(SPOTIFY_FLOAT_DISMISSED_KEY, "1");
    else localStorage.removeItem(SPOTIFY_FLOAT_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * One Spotify embed kept mounted at the layout level. While on `/pomodoro` its wrapper is
 * positioned over the page slot; when navigating away it docks bottom-right so playback survives.
 */
export function PomodoroSpotifyPortal() {
  const [location, setLocation] = useLocation();
  const { spotifySlotEl } = usePomodoroSpotifySlot();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<PomodoroSessionSnapshot | null>(() => readSessionSnapshot());
  const [spotifyFloatDismissed, setSpotifyFloatDismissed] = useState(loadSpotifyFloatDismissed);

  useEffect(() => {
    return subscribePomodoroSync((next) => {
      setSnap(next ?? readSessionSnapshot());
    });
  }, []);

  const onPomodoro = location.startsWith("/pomodoro");
  const ambientOut = snap ? deriveAmbientOutputFromSnapshot(snap) : "off";
  const spotifyActive = ambientOut === "spotify";

  const layoutWrap = useCallback(() => {
    const el = wrapRef.current;
    const slot = spotifySlotEl;
    if (!el) return;
    const dockFloat = !onPomodoro && spotifyActive && !spotifyFloatDismissed;
    if (onPomodoro && slot) {
      const r = slot.getBoundingClientRect();
      el.style.left = `${r.left}px`;
      el.style.top = `${r.top}px`;
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.width = `${r.width}px`;
      el.style.height = `${Math.max(360, r.height)}px`;
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
    } else if (onPomodoro && !slot) {
      el.style.left = "-9999px";
      el.style.top = "0";
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.width = "380px";
      el.style.height = "352px";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    } else if (spotifyFloatDismissed && spotifyActive) {
      el.style.left = "-9999px";
      el.style.top = "0";
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.width = "380px";
      el.style.height = "352px";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    } else {
      el.style.left = "auto";
      el.style.right = "1.5rem";
      el.style.bottom = "1.5rem";
      el.style.top = "auto";
      el.style.width = "min(calc(100vw - 3rem), 380px)";
      el.style.height = dockFloat ? "200px" : "152px";
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
    }
  }, [onPomodoro, spotifyActive, spotifyFloatDismissed, spotifySlotEl]);

  useLayoutEffect(() => {
    layoutWrap();
    const ro =
      typeof ResizeObserver !== "undefined" && spotifySlotEl
        ? new ResizeObserver(() => layoutWrap())
        : null;
    ro?.observe(spotifySlotEl);
    window.addEventListener("resize", layoutWrap);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", layoutWrap);
    };
  }, [layoutWrap, spotifySlotEl]);

  const showFloatChrome = !onPomodoro && spotifyActive && !spotifyFloatDismissed;

  return (
    <>
      <div
        ref={wrapRef}
        className={cn(
          "pointer-events-auto fixed z-[45] flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-xl backdrop-blur-xl transition-[opacity,transform] duration-200",
          !spotifyActive && "pointer-events-none opacity-0",
          onPomodoro && "shadow-none md:rounded-xl",
        )}
      >
        {showFloatChrome ? (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Spotify
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Open Pomodoro page"
                onClick={() => setLocation("/pomodoro")}
              >
                <ExternalLink size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Hide player (audio keeps playing)"
                onClick={() => {
                  setSpotifyFloatDismissed(true);
                  saveSpotifyFloatDismissed(true);
                }}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        ) : null}
        <iframe
          title="Spotify focus playlist"
          width="100%"
          height="100%"
          className="min-h-0 flex-1 border-0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          src={spotifyActive ? SPOTIFY_EMBED_SRC : "about:blank"}
        />
      </div>
      {!onPomodoro && spotifyActive && spotifyFloatDismissed ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="fixed bottom-6 right-6 z-[46] h-9 gap-2 rounded-full px-3 shadow-md"
          title="Show Spotify player"
          onClick={() => {
            setSpotifyFloatDismissed(false);
            saveSpotifyFloatDismissed(false);
          }}
        >
          <Maximize2 size={14} />
          <span className="text-xs">Spotify</span>
        </Button>
      ) : null}
    </>
  );
}
