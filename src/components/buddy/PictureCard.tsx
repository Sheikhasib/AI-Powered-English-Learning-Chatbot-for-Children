"use client";

import { motion } from "motion/react";
import { RotateCcw, Star } from "lucide-react";
import type { Choice } from "@/engine/curriculum/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/** `waiting`: another card was chosen, so this one is quiet but not dimmed. */
export type CardState = "rest" | "waiting" | "chosen" | "correct" | "tryAgain" | "locked";

/** `rest` is the only tappable state, so it alone wears the accent ring: Pip has finished and it is the child's turn. */
const SURFACE: Record<CardState, string> = {
  rest: "border-border bg-card ring-4 ring-accent",
  waiting: "border-border bg-card",
  locked: "border-border bg-card opacity-60",
  chosen: "border-primary bg-card",
  correct: "border-success bg-success-soft",
  tryAgain: "border-gentle bg-gentle-soft",
};

type Props = {
  choice: Choice;
  state: CardState;
  onPick: (choiceId: string) => void;
  className?: string;
};

function Picture({ value }: { value: string }) {
  if (value.startsWith("/")) {
    // eslint-disable-next-line @next/next/no-img-element -- small local SVG, no optimisation needed
    return <img src={value} alt="" className="size-[clamp(3.5rem,9dvh,6rem)]" />;
  }
  return (
    <span aria-hidden className="text-[clamp(3rem,9dvh,5.5rem)] leading-none landscape:min-[700px]:text-[clamp(4rem,12dvh,6.5rem)]">
      {value}
    </span>
  );
}

/** One big tappable picture card. Locked cards stay focusable so the keyboard is never lost. */
export function PictureCard({ choice, state, onPick, className }: Props) {
  const reduced = useReducedMotion();
  const wiggle = state === "tryAgain" && !reduced ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 };

  return (
    <motion.button
      type="button"
      aria-disabled={state !== "rest"}
      onClick={() => state === "rest" && onPick(choice.id)}
      whileTap={reduced || state !== "rest" ? undefined : { scale: 0.96 }}
      animate={wiggle}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative flex h-[clamp(6.5rem,16dvh,11rem)] landscape:min-[700px]:h-[clamp(8rem,26dvh,14rem)] flex-col items-center justify-center gap-1 rounded-lg border-2 text-label font-bold text-card-foreground shadow-sm transition-colors duration-(--duration-quick)",
        SURFACE[state],
        className,
      )}
    >
      <Picture value={choice.picture} />
      <span>{choice.label}</span>
      {state === "correct" && (
        <motion.span
          aria-hidden
          initial={reduced ? { opacity: 0 } : { scale: 0, rotate: -30 }}
          animate={reduced ? { opacity: 1 } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-success text-primary-foreground"
        >
          <Star className="size-5 fill-current" />
        </motion.span>
      )}
      {state === "tryAgain" && (
        <span
          aria-hidden
          className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-gentle text-accent-foreground"
        >
          <RotateCcw className="size-5" />
        </span>
      )}
    </motion.button>
  );
}
