import { pickOne } from "../rng";
import type { Rng } from "@/types/domain";

export const PRAISE_EVENTS = ["attempt", "correct", "persisted", "miss", "level-up"] as const;
export type PraiseEvent = (typeof PRAISE_EVENTS)[number];

/** Effort-based lines only: they praise what the child did, never who the child is. */
export const PRAISE_LINES: Record<PraiseEvent, readonly string[]> = {
  attempt: ["That was a brave try!", "You gave it a go!", "Thank you for trying!"],
  correct: ["Yes, you did it!", "Hooray, that's right!", "Nice listening!"],
  persisted: ["You kept trying!", "You did not give up!", "You kept going. I love that!"],
  miss: ["Oops! Let's try together.", "That's okay. Let's look again.", "Mistakes help us learn."],
  "level-up": ["You worked so hard!", "All that practice paid off!", "A new adventure is here!"],
};

/** Picks a warm line for what just happened; mistakes are framed as learning, never as failing. */
export function praiseFor(event: PraiseEvent, rng: Rng): string {
  return pickOne(PRAISE_LINES[event], rng);
}
