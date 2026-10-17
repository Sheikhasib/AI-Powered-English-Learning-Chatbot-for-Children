"use client";

import { useCallback, useRef } from "react";
import { playRecipe, type SoundName } from "./sfx";

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

function createContext(): AudioContext | null {
  const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/**
 * Plays the soft tap, correct and star sounds. Silent while `muted`, and silent
 * (never an error) where Web Audio is missing. The context is created on first
 * use, which is always inside a tap or a reply to one, so browsers allow it.
 */
export function useSoundEffects(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(
    (name: SoundName, delaySeconds = 0) => {
      if (muted) return;
      ctxRef.current ??= createContext();
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume();
      playRecipe(ctx, name, delaySeconds);
    },
    [muted],
  );

  return { play };
}
