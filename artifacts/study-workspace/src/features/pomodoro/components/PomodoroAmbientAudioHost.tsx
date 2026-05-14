import { useEffect, useRef, useState } from "react";
import {
  deriveAmbientOutputFromSnapshot,
  readSessionSnapshot,
  subscribePomodoroSync,
  type PomodoroSessionSnapshot,
} from "../persistence";

/**
 * Plays local ambient MP3s from the persisted session so audio survives leaving `/pomodoro`.
 * Spotify is handled separately by {@link PomodoroSpotifyPortal}.
 */
export function PomodoroAmbientAudioHost() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const boundSrcRef = useRef<string | null>(null);
  const [snap, setSnap] = useState<PomodoroSessionSnapshot | null>(() => readSessionSnapshot());

  useEffect(() => {
    return subscribePomodoroSync((next) => {
      setSnap(next ?? readSessionSnapshot());
    });
  }, []);

  const ambientOut = snap ? deriveAmbientOutputFromSnapshot(snap) : "off";
  const active = snap?.sounds.find((s) => s.active);
  const src =
    ambientOut === "local" && active?.sourceType === "audio" && active.audioUrl ? active.audioUrl : null;
  const shouldPlay = Boolean(snap?.ambientPlaying && src);

  useEffect(() => {
    if (!src) {
      boundSrcRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
      return;
    }

    let audio = audioRef.current;
    if (!audio || boundSrcRef.current !== src) {
      audio?.pause();
      audio = new Audio(src);
      audio.loop = true;
      audio.preload = "auto";
      audioRef.current = audio;
      boundSrcRef.current = src;
    }

    const el = audioRef.current;
    if (!el) return;
    el.volume = snap?.ambientVolume ?? 0.45;

    if (!shouldPlay) {
      el.pause();
      return;
    }

    void el.play().catch(() => {
      /* autoplay blocked — user can press play on Pomodoro page */
    });
  }, [shouldPlay, snap?.ambientVolume, src]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      boundSrcRef.current = null;
    };
  }, []);

  return null;
}
