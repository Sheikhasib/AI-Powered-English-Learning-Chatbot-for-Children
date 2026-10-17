"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Choice } from "@/engine/curriculum/types";
import type { CardFeedback } from "@/hooks/useBuddyChat";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { PictureCard, type CardState } from "./PictureCard";

/** A gentle nudge if the child has not answered for this long. */
const NUDGE_AFTER_MS = 8000;

type Props = {
  /** Changes with every new question; resets the idle nudge. */
  activityId: string;
  choices: Choice[];
  /** True while Pip is still asking the question. */
  locked: boolean;
  feedback: CardFeedback | null;
  onPick: (choiceId: string) => void;
};

function stateOf(choice: Choice, locked: boolean, feedback: CardFeedback | null): CardState {
  if (feedback) return feedback.choiceId === choice.id ? feedback.kind : "waiting";
  return locked ? "locked" : "rest";
}

export function PictureCards({ activityId, choices, locked, feedback, onPick }: Props) {
  const reduced = useReducedMotion();
  const [nudgedId, setNudgedId] = useState<string | null>(null);
  const idle = !locked && !feedback;

  useEffect(() => {
    if (!idle) return;
    const timer = setTimeout(() => setNudgedId(activityId), NUDGE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [idle, activityId]);

  const nudge = nudgedId === activityId && idle;
  const odd = choices.length % 2 === 1;

  return (
    <motion.div
      key={activityId}
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={
        nudge
          ? reduced
            ? { opacity: [1, 0.7, 1], y: 0 }
            : { opacity: 1, y: 0, rotate: [0, -1.5, 1.5, 0] }
          : { opacity: 1, y: 0 }
      }
      transition={{ duration: 0.3 }}
      role="group"
      aria-label="Pick a picture"
      className="grid grid-cols-2 gap-4"
    >
      {choices.map((choice, index) => (
        <PictureCard
          key={choice.id}
          choice={choice}
          state={stateOf(choice, locked, feedback)}
          onPick={onPick}
          className={cn(
            odd && index === choices.length - 1 && "col-span-2 w-[calc(50%-0.5rem)] justify-self-center",
          )}
        />
      ))}
    </motion.div>
  );
}
