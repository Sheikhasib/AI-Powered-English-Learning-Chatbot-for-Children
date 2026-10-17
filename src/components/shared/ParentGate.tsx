"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const HOLD_MS = 1500;

type Sum = { a: number; b: number; options: number[] };

/** Two-digit answers are out of a young child's reach, but easy for a grown-up. */
function makeSum(): Sum {
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  const answer = a + b;
  const options = [answer, answer + 2, answer - 2].sort(() => Math.random() - 0.5);
  return { a, b, options };
}

type Props = {
  onPass: () => void;
  onClose: () => void;
};

/** Parental gate: press and hold, then solve a sum. Opens the grown-up parts of the app. */
export function ParentGate({ onPass, onClose }: Props) {
  const reduced = useReducedMotion();
  const [sum, setSum] = useState<Sum | null>(null);
  const [missed, setMissed] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startHold = () => {
    setHolding(true);
    timer.current = setTimeout(() => setSum(makeSum()), HOLD_MS);
  };
  const stopHold = () => {
    setHolding(false);
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Grown-ups only"
        className="relative w-full max-w-sm rounded-lg bg-card p-6 text-center shadow-lg"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 grid size-16 place-items-center rounded-full text-muted-foreground"
        >
          <X className="size-7" />
        </button>
        <h2 className="mb-2 text-heading font-bold">Grown-ups only</h2>
        {sum ? (
          <>
            <p className="mb-4 text-label">
              {sum.a} + {sum.b} = ?
            </p>
            <div className="flex justify-center gap-4">
              {sum.options.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  autoFocus={option === sum.options[0]}
                  onClick={() => (option === sum.a + sum.b ? onPass() : setMissed(true))}
                >
                  {option}
                </Button>
              ))}
            </div>
            {missed && <p className="mt-4 text-body text-muted-foreground">Not quite. Try again.</p>}
          </>
        ) : (
          <>
            <p className="mb-4 text-body text-muted-foreground">Press and hold the button.</p>
            <button
              type="button"
              autoFocus
              onPointerDown={startHold}
              onPointerUp={stopHold}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              onKeyDown={(e) => !e.repeat && (e.key === "Enter" || e.key === " ") && startHold()}
              onKeyUp={stopHold}
              className="relative h-16 w-full overflow-hidden rounded-full border-2 border-primary text-label font-bold text-primary select-none"
            >
              <motion.span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-primary/20"
                initial={false}
                animate={{ width: holding ? "100%" : "0%" }}
                transition={{ duration: holding ? HOLD_MS / 1000 : reduced ? 0 : 0.2, ease: "linear" }}
              />
              <span className="relative">Hold me</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
