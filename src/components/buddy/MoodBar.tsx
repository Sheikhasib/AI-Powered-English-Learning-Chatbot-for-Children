"use client";

import { BedDouble } from "lucide-react";
import type { Mood } from "@/types/domain";
import { cn } from "@/lib/utils";
import { QUICK_FACES } from "./moodFaces";

type Props = {
  onMood: (mood: Mood) => void;
  onBreak: () => void;
  /** After 15 minutes the break button glows to invite a rest. */
  restSuggested: boolean;
};

/** Always visible: three feeling faces and a pillow button for a break. */
export function MoodBar({ onMood, onBreak, restSuggested }: Props) {
  return (
    <div role="group" aria-label="How I feel" className="flex items-center justify-center gap-4">
      {QUICK_FACES.map(({ mood, face, word }) => (
        <button
          key={mood}
          type="button"
          onClick={() => onMood(mood)}
          aria-label={`I feel ${word}`}
          className="grid size-16 place-items-center rounded-full border-2 border-border bg-card text-4xl transition-transform duration-(--duration-quick) active:scale-[0.96] motion-reduce:active:scale-100"
        >
          <span aria-hidden>{face}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onBreak}
        aria-label="Take a break"
        className={cn(
          "grid size-16 place-items-center rounded-full border-2 transition-transform duration-(--duration-quick) active:scale-[0.96] motion-reduce:active:scale-100",
          restSuggested
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-card text-primary",
        )}
      >
        <BedDouble className="size-7" />
      </button>
    </div>
  );
}
