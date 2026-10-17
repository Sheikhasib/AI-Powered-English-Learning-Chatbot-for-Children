"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { PipBrows, PipEyes } from "./PipEyes";
import { SHAPES, type PipExpression } from "./expressions";

const BLINK_MIN_MS = 4000;
const BLINK_SPREAD_MS = 2000;
const BLINK_HOLD_MS = 140;
const SPRING = { type: "spring" as const, stiffness: 300, damping: 20 };

type Props = {
  expression: PipExpression;
  /** Opens and closes the beak while Pip talks. */
  speaking?: boolean;
  /** Waves a wing, for the welcome screen. */
  waving?: boolean;
  className?: string;
};

/** Pip the owl, built from SVG shapes only. The look follows `expression`. */
export function Pip({ expression, speaking = false, waving = false, className }: Props) {
  const reduced = useReducedMotion();
  const shape = SHAPES[expression];
  const blinking = useBlink(reduced);
  const fadeMs = reduced ? 200 : 300;
  const wave = waving && !reduced;

  return (
    <svg
      viewBox="0 0 200 220"
      role="img"
      aria-label={`Pip the owl, looking ${expression}`}
      className={cn("h-full w-full overflow-visible", className)}
    >
      <ellipse cx={100} cy={210} rx={52} ry={7} className="fill-foreground/10" />
      <g className="fill-pip-beak">
        <ellipse cx={80} cy={198} rx={14} ry={7} />
        <ellipse cx={120} cy={198} rx={14} ry={7} />
      </g>
      <motion.g
        animate={reduced ? { y: 0 } : { y: [0, -shape.bob.distance, 0] }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: shape.bob.seconds, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <motion.g
          initial={false}
          animate={{ rotate: reduced ? 0 : shape.tilt }}
          transition={SPRING}
          style={{ transformOrigin: "100px 120px" }}
        >
          <g className="fill-pip-body">
            <path d="M44 34 L80 66 L40 76 Z" />
            <path d="M156 34 L120 66 L160 76 Z" />
            <ellipse cx={100} cy={118} rx={70} ry={80} />
          </g>
          <Wing
            cx={32}
            rotate={reduced ? 0 : shape.wingLift}
            transition={SPRING}
          />
          <Wing
            cx={168}
            rotate={wave ? [-30, -58, -30] : reduced ? 0 : -shape.wingLift}
            transition={wave ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : SPRING}
          />
          <ellipse cx={100} cy={146} rx={44} ry={56} className="fill-pip-belly" />
          <g className="stroke-pip-body/40" fill="none" strokeWidth={4} strokeLinecap="round">
            <path d="M84 138 q8 8 16 0 q8 8 16 0" />
            <path d="M84 160 q8 8 16 0 q8 8 16 0" />
          </g>
          <PipEyes shape={shape} blinking={blinking} fadeMs={fadeMs} />
          <PipBrows shape={shape} fadeMs={fadeMs} />
          <Beak speaking={speaking && !reduced} />
          {shape.sleepyZ && !reduced && <SleepyZ />}
        </motion.g>
      </motion.g>
    </svg>
  );
}

type WingProps = {
  cx: number;
  rotate: number | number[];
  transition: object;
};

function Wing({ cx, rotate, transition }: WingProps) {
  return (
    <motion.ellipse
      cx={cx}
      cy={132}
      rx={15}
      ry={42}
      className="fill-pip-body stroke-card/40"
      strokeWidth={3}
      style={{ transformOrigin: `${cx}px 100px` }}
      initial={false}
      animate={{ rotate }}
      transition={transition}
    />
  );
}

function Beak({ speaking }: { speaking: boolean }) {
  return (
    <g>
      <path d="M92 118 L108 118 L100 128 Z" className="fill-pip-eyes" />
      <motion.path
        d="M90 108 L110 108 L100 126 Z"
        className="fill-pip-beak"
        animate={speaking ? { y: [0, -3, 0] } : { y: 0 }}
        transition={speaking ? { duration: 0.34, repeat: Infinity } : { duration: 0.15 }}
      />
    </g>
  );
}

function SleepyZ() {
  return (
    <motion.text
      x={158}
      y={44}
      fontSize={26}
      fontWeight={700}
      className="fill-pip-eyes"
      aria-hidden
      animate={{ opacity: [0, 1, 0], y: [50, 30, 14] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      z
    </motion.text>
  );
}

function useBlink(disabled: boolean): boolean {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (disabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlinking(true);
        timer = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, BLINK_HOLD_MS);
      }, BLINK_MIN_MS + Math.random() * BLINK_SPREAD_MS);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [disabled]);

  return blinking && !disabled;
}
