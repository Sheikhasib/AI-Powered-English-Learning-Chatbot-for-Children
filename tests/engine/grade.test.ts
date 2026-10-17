import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/engine/grade";
import type { Activity } from "@/engine/curriculum/types";

const activity: Activity = {
  id: "a",
  skillId: "l2.animals",
  kind: "listen-tap",
  prompt: "Tap the cat!",
  choices: [
    { id: "cat", label: "cat", picture: "🐱" },
    { id: "dog", label: "dog", picture: "🐶" },
  ],
  answerId: "cat",
  hint: "Look for the cat.",
};

describe("gradeAnswer", () => {
  it("marks the right card correct on the first attempt", () => {
    expect(gradeAnswer(activity, "cat")).toEqual({ correct: true, attempt: 1 });
  });

  it("marks another card incorrect", () => {
    expect(gradeAnswer(activity, "dog")).toEqual({ correct: false, attempt: 1 });
  });

  it("numbers the attempt after earlier misses", () => {
    expect(gradeAnswer(activity, "cat", 2)).toEqual({ correct: true, attempt: 3 });
  });

  it("counts an unknown card as incorrect", () => {
    expect(gradeAnswer(activity, "zzz").correct).toBe(false);
  });

  it("counts any try on an open activity as correct effort", () => {
    const open = { ...activity, kind: "say-it" as const, answerId: null };
    expect(gradeAnswer(open, "dog").correct).toBe(true);
  });
});
