"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { breathAt, totalBreathSeconds, type Breaths } from "./breathing";

const SMALL = 0.55;
const TICK_MS = 1000;

type Props = {
  breaths: Breaths;
  /** Waits until Pip has finished explaining, so the child is not told two things at once. */
  active: boolean;
  onDone: () => void;
};

/**
 * A bubble that grows while the child breathes in and shrinks while they breathe out.
 * The slow 4 s moves are the point of the exercise, so they sit outside the 150 to 400 ms
 * motion range; reduced motion swaps the growing for a soft fade.
 */
export function BreathingBubble({ breaths, active, onDone }: Props) {
  const reduced = useReducedMotion();
  const [second, setSecond] = useState(0);
  const phase = breathAt(second, breaths);
  const finished = phase.kind === "done";

  // Speech re-renders the screen on every word; the ref keeps the timer from restarting each time.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!active || finished) return;
    const timer = setTimeout(() => {
      setSecond(second + 1);
      if (second + 1 >= totalBreathSeconds(breaths)) doneRef.current();
    }, TICK_MS);
    return () => clearTimeout(timer);
  }, [active, finished, second, breaths]);

  const growing = active && phase.kind === "in";
  const shrinking = active && phase.kind === "out";
  const seconds = growing ? breaths.inSeconds : breaths.outSeconds;
  const word = !active ? "Get ready" : phase.kind === "in" ? "Breathe in" : phase.kind === "out" ? "Breathe out" : "Well done";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid size-[clamp(9rem,28dvh,16rem)] place-items-center">
        <motion.div
          aria-hidden
          animate={
            reduced
              ? { opacity: growing ? 1 : SMALL }
              : { scale: growing ? 1 : shrinking ? SMALL : 0.75, opacity: 1 }
          }
          transition={{ duration: active && !finished ? seconds : 0.4, ease: "easeInOut" }}
          className="grid size-full place-items-center rounded-full border-4 border-primary bg-card"
        >
          <span className="text-bubble font-bold text-primary">
            {active && !finished ? phase.count : ""}
          </span>
        </motion.div>
      </div>
      <p role="status" className="text-bubble font-bold text-primary">
        {word}
      </p>
    </div>
  );
}
