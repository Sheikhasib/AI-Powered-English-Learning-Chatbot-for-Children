import type { Activity } from "./curriculum/types";

export type Grade = { correct: boolean; attempt: number };

/** A tap is correct when it is the answer card; open activities (say-it, build-story) always earn credit for trying. */
export function gradeAnswer(activity: Activity, choiceId: string, priorMisses = 0): Grade {
  const correct = activity.answerId === null || activity.answerId === choiceId;
  return { correct, attempt: priorMisses + 1 };
}
