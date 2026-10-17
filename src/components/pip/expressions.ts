import type { Mode } from "@/types/domain";

export const PIP_EXPRESSIONS = [
  "curious",
  "chatty",
  "bouncy",
  "soft",
  "sleepy",
  "celebrate",
  "thinking",
] as const;
export type PipExpression = (typeof PIP_EXPRESSIONS)[number];

/** Pip's face follows the mode, so the child feels the change without reading it. */
export const EXPRESSION_FOR_MODE: Record<Mode, PipExpression> = {
  LEARN: "curious",
  CHAT: "chatty",
  PLAY: "bouncy",
  SUPPORT: "soft",
  CALM: "sleepy",
};

type Brow = { y: number; rotate: number };

export type ExpressionShape = {
  /** Share of each eye covered by the lid: 0 wide open, 1 closed. */
  lid: number;
  /** Closed smiling arcs instead of round eyes. */
  happyEyes: boolean;
  look: { x: number; y: number };
  browLeft: Brow;
  browRight: Brow;
  /** Degrees the wings swing out from the body. */
  wingLift: number;
  /** Head tilt in degrees. */
  tilt: number;
  bob: { distance: number; seconds: number };
  sleepyZ: boolean;
};

export const SHAPES: Record<PipExpression, ExpressionShape> = {
  curious: {
    lid: 0,
    happyEyes: false,
    look: { x: 3, y: -2 },
    browLeft: { y: -4, rotate: -8 },
    browRight: { y: 2, rotate: 4 },
    wingLift: 4,
    tilt: -5,
    bob: { distance: 5, seconds: 3.2 },
    sleepyZ: false,
  },
  chatty: {
    lid: 0,
    happyEyes: false,
    look: { x: 0, y: 1 },
    browLeft: { y: -2, rotate: -4 },
    browRight: { y: -2, rotate: 4 },
    wingLift: 12,
    tilt: 0,
    bob: { distance: 6, seconds: 2.8 },
    sleepyZ: false,
  },
  bouncy: {
    lid: 0,
    happyEyes: false,
    look: { x: 0, y: 0 },
    browLeft: { y: -8, rotate: -10 },
    browRight: { y: -8, rotate: 10 },
    wingLift: 30,
    tilt: 4,
    bob: { distance: 12, seconds: 1.1 },
    sleepyZ: false,
  },
  soft: {
    lid: 0.2,
    happyEyes: false,
    look: { x: 0, y: 3 },
    browLeft: { y: 2, rotate: 14 },
    browRight: { y: 2, rotate: -14 },
    wingLift: -6,
    tilt: -3,
    bob: { distance: 3, seconds: 4.5 },
    sleepyZ: false,
  },
  sleepy: {
    lid: 0.55,
    happyEyes: false,
    look: { x: 0, y: 4 },
    browLeft: { y: 4, rotate: 6 },
    browRight: { y: 4, rotate: -6 },
    wingLift: -8,
    tilt: 3,
    bob: { distance: 3, seconds: 5.5 },
    sleepyZ: true,
  },
  celebrate: {
    lid: 0,
    happyEyes: true,
    look: { x: 0, y: 0 },
    browLeft: { y: -10, rotate: -6 },
    browRight: { y: -10, rotate: 6 },
    wingLift: 44,
    tilt: 0,
    bob: { distance: 14, seconds: 0.9 },
    sleepyZ: false,
  },
  thinking: {
    lid: 0,
    happyEyes: false,
    look: { x: 7, y: -8 },
    browLeft: { y: 2, rotate: 0 },
    browRight: { y: -8, rotate: -8 },
    wingLift: 2,
    tilt: 7,
    bob: { distance: 3, seconds: 3.5 },
    sleepyZ: false,
  },
};
