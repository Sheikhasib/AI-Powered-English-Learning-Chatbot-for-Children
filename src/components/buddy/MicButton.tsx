"use client";

import { Mic, Square } from "lucide-react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type Props = {
  supported: boolean;
  listening: boolean;
  onToggle: () => void;
};

/** Tap to talk, tap again to stop. Hidden when the browser cannot listen, so cards still work. */
export function MicButton({ supported, listening, onToggle }: Props) {
  const reduced = useReducedMotion();
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={listening ? "Stop talking" : "Talk to Pip"}
      aria-pressed={listening}
      className={cn(
        "relative grid size-16 shrink-0 place-items-center rounded-full border-2 transition-colors duration-(--duration-quick) active:scale-[0.96] motion-reduce:active:scale-100",
        listening
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-primary",
      )}
    >
      {listening && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-primary"
          animate={reduced ? { opacity: [0.9, 0.3, 0.9] } : { scale: [1, 1.5], opacity: [0.7, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      {listening ? <Square className="size-6 fill-current" /> : <Mic className="size-7" />}
    </button>
  );
}
