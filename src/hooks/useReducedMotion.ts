"use client";

import { useReducedMotion as useMotionReducedMotion } from "motion/react";

/** True when the child's device asks for less movement; components then fade instead of move. */
export function useReducedMotion(): boolean {
  return useMotionReducedMotion() ?? false;
}
