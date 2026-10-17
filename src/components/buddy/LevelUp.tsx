"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Pip } from "@/components/pip/Pip";
import { Button } from "@/components/ui/button";
import { getLevel } from "@/engine/curriculum";
import type { LevelId } from "@/engine/curriculum/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { StarBurst } from "./StarBurst";

/** Long enough to enjoy, short enough that the child is never stuck behind it. */
const AUTO_CLOSE_MS = 6000;

type Props = {
  level: LevelId;
  onClose: () => void;
};

/** Big, kind, short: Pip cheers, one burst of stars (no flashing), one button to go on. */
export function LevelUp({ level, onClose }: Props) {
  const reduced = useReducedMotion();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    button.current?.focus();
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Level ${level}. You did it!`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 grid place-items-center bg-background p-6"
    >
      <motion.div
        initial={reduced ? false : { scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex w-full max-w-sm flex-col items-center gap-4 text-center"
      >
        <div className="relative h-[clamp(10rem,32dvh,18rem)] w-full max-w-64">
          <Pip expression="celebrate" />
          <StarBurst trigger={1} />
        </div>
        <h2 className="text-5xl font-bold text-primary">Level {level}!</h2>
        <p className="text-bubble font-bold">{getLevel(level).title}</p>
        <p className="text-bubble">You did it!</p>
        <Button ref={button} variant="accent" onClick={onClose} className="min-w-48">
          <Check aria-hidden />
          Yay!
        </Button>
      </motion.div>
    </motion.div>
  );
}
