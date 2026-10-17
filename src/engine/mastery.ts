import {
  AFTER_HINT_SCORE,
  MASTERED,
  MASTERY_ALPHA,
  REVIEW_INTERVALS_MIN,
} from "./config";
import type { AnswerOutcome, SkillState } from "@/types/engine";

const MS_PER_MINUTE = 60_000;

/** A fresh, unseen skill. */
export function newSkillState(skillId: string): SkillState {
  return { skillId, mastery: 0, attempts: 0, streak: 0, lastSeenAt: null, dueAt: null };
}

function scoreFor({ correct, afterHint }: AnswerOutcome): number {
  if (!correct) return 0;
  return afterHint ? AFTER_HINT_SCORE : 1;
}

function nextStreak(streak: number, correct: boolean): number {
  if (correct) return streak > 0 ? streak + 1 : 1;
  return streak < 0 ? streak - 1 : -1;
}

function afterMinutes(now: Date, minutes: number): Date {
  return new Date(now.getTime() + minutes * MS_PER_MINUTE);
}

/** Review gaps grow 10 min, 1 hour, 1 day; a miss drops mastery below 0.8 and clears the review; early practice never moves the due time. */
function nextDueAt(previous: SkillState, mastery: number, now: Date): Date | null {
  if (mastery < MASTERED) return null;
  if (previous.dueAt && now < previous.dueAt) return previous.dueAt;

  const lastGapMin =
    previous.dueAt && previous.lastSeenAt
      ? (previous.dueAt.getTime() - previous.lastSeenAt.getTime()) / MS_PER_MINUTE
      : 0;
  const next = REVIEW_INTERVALS_MIN.find((gap) => gap > lastGapMin);
  return afterMinutes(now, next ?? REVIEW_INTERVALS_MIN[REVIEW_INTERVALS_MIN.length - 1]);
}

/** m' = m + alpha * (score - m); a correct answer after a hint scores 0.6, not 1. */
export function updateMastery(state: SkillState, answer: AnswerOutcome, now: Date): SkillState {
  const raw = state.mastery + MASTERY_ALPHA * (scoreFor(answer) - state.mastery);
  const mastery = Math.min(1, Math.max(0, raw));
  return {
    ...state,
    mastery,
    attempts: state.attempts + 1,
    streak: nextStreak(state.streak, answer.correct),
    lastSeenAt: now,
    dueAt: nextDueAt(state, mastery, now),
  };
}
