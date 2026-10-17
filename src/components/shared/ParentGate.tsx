"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { makeSum } from "./gateSum";

const HOLD_MS = 2000;
const FOCUSABLE = "button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])";

type Challenge = { question: string; options: number[]; answer?: number; token?: string };

type Props = {
  onPass: () => void;
  onClose: () => void;
  /** Ask the server for the sum and let it set the signed cookie; without it the sum is checked here. */
  server?: boolean;
};

async function fetchChallenge(): Promise<Challenge | null> {
  const response = await fetch("/parent-gate/challenge", { cache: "no-store" });
  return response.ok ? ((await response.json()) as Challenge) : null;
}

async function verifyAnswer(token: string, answer: number): Promise<boolean> {
  const response = await fetch("/parent-gate/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, answer }),
  });
  return response.ok;
}

/** Parental gate: press and hold for 2 seconds, then solve a sum written in words. */
export function ParentGate({ onPass, onClose, server = false }: Props) {
  const reduced = useReducedMotion();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [missed, setMissed] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [onClose]);

  /** Keeps Tab and Shift+Tab inside the dialog so keyboard users cannot reach the page behind it. */
  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !dialog.current) return;
    const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.current.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !dialog.current.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  const startHold = () => {
    setHolding(true);
    timer.current = setTimeout(async () => {
      setChallenge(server ? await fetchChallenge() : makeSum(Math.random));
    }, HOLD_MS);
  };
  const stopHold = () => {
    setHolding(false);
    if (timer.current) clearTimeout(timer.current);
  };

  const choose = async (option: number) => {
    if (!challenge) return;
    const right = challenge.token
      ? await verifyAnswer(challenge.token, option)
      : option === challenge.answer;
    if (right) return onPass();
    // A fresh hold and a fresh sum make random tapping a poor strategy.
    setChallenge(null);
    setMissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div
        ref={dialog}
        onKeyDown={trapFocus}
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
        {challenge ? (
          <>
            <p className="mb-4 text-label">{challenge.question}?</p>
            <div className="flex justify-center gap-4">
              {challenge.options.map((option, index) => (
                <Button key={option} variant="outline" autoFocus={index === 0} onClick={() => choose(option)}>
                  {option}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            {missed && <p className="mb-2 text-body text-muted-foreground">Not quite. Try again.</p>}
            <p className="mb-4 text-body text-muted-foreground">Press and hold the button for two seconds.</p>
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
