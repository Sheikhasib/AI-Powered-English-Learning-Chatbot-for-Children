import type { Mode } from "@/types/domain";

/** SEL moments the parent view lists: the check-in, the coping choice, and entering or leaving Support. */
export type SelEventType = "check-in" | "coping-chosen" | "support-entered" | "support-left";

/** Returns the support event caused by a mode change, or null when Support is not entered or left. */
export function selEventForTransition(prev: Mode, next: Mode): SelEventType | null {
  if (prev !== "SUPPORT" && next === "SUPPORT") return "support-entered";
  if (prev === "SUPPORT" && next !== "SUPPORT") return "support-left";
  return null;
}
