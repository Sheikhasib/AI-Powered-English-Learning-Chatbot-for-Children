"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Mood } from "@/types/domain";
import { CHECK_IN_FACES } from "./moodFaces";

type Props = {
  locked: boolean;
  onPick: (mood: Mood) => void;
};

/** Session opener: six big feeling faces. Pip names the choice back on the next turn. */
export function CheckIn({ locked, onPick }: Props) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="group"
      aria-label="How do you feel?"
      className="grid grid-cols-3 gap-4"
    >
      {CHECK_IN_FACES.map(({ mood, face, word }) => (
        <button
          key={mood}
          type="button"
          aria-disabled={locked}
          onClick={() => !locked && onPick(mood)}
          className="flex h-[clamp(6rem,17dvh,8.5rem)] flex-col items-center justify-center gap-1 rounded-lg border-2 border-border bg-card text-label font-bold shadow-sm transition-transform duration-(--duration-quick) active:scale-[0.96] motion-reduce:active:scale-100 aria-disabled:opacity-60"
        >
          <span aria-hidden className="text-[clamp(2.5rem,7dvh,3.5rem)] leading-none">
            {face}
          </span>
          <span>{word}</span>
        </button>
      ))}
    </motion.div>
  );
}
