import { describe, expect, it } from "vitest";
import { newSkillState, updateMastery } from "@/engine/mastery";
import type { SkillState } from "@/types/engine";

const now = new Date("2026-01-01T10:00:00Z");
const minutes = (n: number) => new Date(now.getTime() + n * 60_000);
const right = { correct: true, afterHint: false };
const wrong = { correct: false, afterHint: false };

function state(overrides: Partial<SkillState> = {}): SkillState {
  return { ...newSkillState("l2.animals"), ...overrides };
}

describe("updateMastery", () => {
  it("starts new skills at zero", () => {
    expect(newSkillState("x")).toEqual({
      skillId: "x", mastery: 0, attempts: 0, streak: 0, lastSeenAt: null, dueAt: null,
    });
  });

  it("moves mastery toward 1 with the moving average", () => {
    expect(updateMastery(state(), right, now).mastery).toBeCloseTo(0.35);
    expect(updateMastery(state({ mastery: 0.5 }), right, now).mastery).toBeCloseTo(0.675);
  });

  it("moves mastery down after a miss", () => {
    expect(updateMastery(state({ mastery: 0.5 }), wrong, now).mastery).toBeCloseTo(0.325);
  });

  it("gives partial credit (0.6) for a correct answer after a hint", () => {
    const result = updateMastery(state(), { correct: true, afterHint: true }, now);
    expect(result.mastery).toBeCloseTo(0.35 * 0.6);
  });

  it("never leaves the range 0 to 1", () => {
    let s = state({ mastery: 0.99 });
    for (let i = 0; i < 50; i++) s = updateMastery(s, right, now);
    expect(s.mastery).toBeLessThanOrEqual(1);
    for (let i = 0; i < 100; i++) s = updateMastery(s, wrong, now);
    expect(s.mastery).toBeGreaterThanOrEqual(0);
  });

  it("counts attempts and stamps the time seen", () => {
    const result = updateMastery(state({ attempts: 4 }), right, now);
    expect(result.attempts).toBe(5);
    expect(result.lastSeenAt).toEqual(now);
  });

  it("builds a positive streak from correct answers and resets on a miss", () => {
    let s = updateMastery(state(), right, now);
    s = updateMastery(s, right, now);
    expect(s.streak).toBe(2);
    expect(updateMastery(s, wrong, now).streak).toBe(-1);
  });

  it("builds a negative streak from misses and resets on a correct answer", () => {
    let s = updateMastery(state(), wrong, now);
    s = updateMastery(s, wrong, now);
    expect(s.streak).toBe(-2);
    expect(updateMastery(s, right, now).streak).toBe(1);
  });

  it("does not schedule a review while unmastered", () => {
    expect(updateMastery(state({ mastery: 0.2 }), right, now).dueAt).toBeNull();
  });

  it("schedules the first review 10 minutes after mastery is reached", () => {
    const result = updateMastery(state({ mastery: 0.75 }), right, now);
    expect(result.mastery).toBeGreaterThanOrEqual(0.8);
    expect(result.dueAt).toEqual(minutes(10));
  });

  it("clears the review when a miss drops a mastered skill below 0.8", () => {
    const s = state({ mastery: 0.99, lastSeenAt: now, dueAt: minutes(60) });
    expect(updateMastery(s, wrong, minutes(70)).dueAt).toBeNull();
  });

  it("keeps the due time when the child practises early", () => {
    const s = state({ mastery: 0.9, lastSeenAt: now, dueAt: minutes(60) });
    expect(updateMastery(s, right, minutes(30)).dueAt).toEqual(minutes(60));
  });

  it("moves to the next review gap when a due review is passed", () => {
    const s = state({ mastery: 0.9, lastSeenAt: now, dueAt: minutes(10) });
    expect(updateMastery(s, right, minutes(12)).dueAt).toEqual(minutes(72));
    const second = state({ mastery: 0.9, lastSeenAt: now, dueAt: minutes(60) });
    expect(updateMastery(second, right, minutes(61)).dueAt).toEqual(minutes(61 + 24 * 60));
  });

  it("stays on the longest gap once the ladder is finished", () => {
    const s = state({ mastery: 0.95, lastSeenAt: now, dueAt: minutes(24 * 60) });
    const later = minutes(24 * 60 + 5);
    expect(updateMastery(s, right, later).dueAt).toEqual(new Date(later.getTime() + 24 * 60 * 60_000));
  });

  it("treats a due date without a last-seen time as a fresh ladder", () => {
    const s = state({ mastery: 0.9, lastSeenAt: null, dueAt: minutes(1) });
    expect(updateMastery(s, right, minutes(2)).dueAt).toEqual(minutes(12));
  });
});
