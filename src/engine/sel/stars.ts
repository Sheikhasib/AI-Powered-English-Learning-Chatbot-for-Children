import { STARS_FOR_ATTEMPT, STARS_FOR_CORRECT, STARS_FOR_RETRY_AFTER_MISS } from "../config";

export type StarEvent = {
  correct: boolean;
  /** True when this try follows an earlier miss on the same activity. */
  afterMiss: boolean;
};

/** +1 for any attempt, +1 more if correct, +2 more for trying again after a miss; stars never go away. */
export function starsFor({ correct, afterMiss }: StarEvent): number {
  return (
    STARS_FOR_ATTEMPT +
    (correct ? STARS_FOR_CORRECT : 0) +
    (afterMiss ? STARS_FOR_RETRY_AFTER_MISS : 0)
  );
}
