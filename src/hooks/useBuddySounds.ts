"use client";

import { useEffect, useRef } from "react";
import { useSoundEffects } from "./useSoundEffects";

/** Delay so the star sparkle follows the correct chime instead of landing on it. */
const STAR_AFTER_CHIME_SECONDS = 0.35;

/**
 * Sounds for the buddy screen: a chime for each right answer, a sparkle for each
 * new star, and `play` for taps. Follows the same mute switch as Pip's voice.
 */
export function useBuddySounds(muted: boolean, progress: { bursts: number; stars: number }) {
  const { play } = useSoundEffects(muted);
  const { bursts, stars } = progress;
  const seen = useRef({ bursts, stars });

  useEffect(() => {
    const before = seen.current;
    seen.current = { bursts, stars };
    const cheered = bursts > before.bursts;
    if (cheered) play("correct");
    if (stars > before.stars) play("star", cheered ? STAR_AFTER_CHIME_SECONDS : 0);
  }, [bursts, stars, play]);

  return play;
}
