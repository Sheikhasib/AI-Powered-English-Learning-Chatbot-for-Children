import { describe, expect, it } from "vitest";
import {
  BELLY_BREATHS,
  breathAt,
  breathingActivity,
  isBreathingActivity,
  totalBreathSeconds,
} from "@/components/buddy/breathing";

const breaths = { inSeconds: 4, outSeconds: 4, cycles: 2 };

describe("breathAt", () => {
  it("counts 1 to 4 while breathing in, then 1 to 4 while breathing out", () => {
    expect(breathAt(0, breaths)).toEqual({ kind: "in", count: 1 });
    expect(breathAt(3, breaths)).toEqual({ kind: "in", count: 4 });
    expect(breathAt(4, breaths)).toEqual({ kind: "out", count: 1 });
    expect(breathAt(7, breaths)).toEqual({ kind: "out", count: 4 });
  });

  it("starts the next cycle with a breath in", () => {
    expect(breathAt(8, breaths)).toEqual({ kind: "in", count: 1 });
  });

  it("is done after the last cycle", () => {
    expect(breathAt(16, breaths).kind).toBe("done");
    expect(totalBreathSeconds(breaths)).toBe(16);
  });
});

describe("breathing activity", () => {
  it("uses the engine's belly-breathing timing", () => {
    expect(BELLY_BREATHS).toEqual({ inSeconds: 4, outSeconds: 4, cycles: 3 });
  });

  it("is recognised by id and offers the ready cards afterwards", () => {
    const activity = breathingActivity();
    expect(isBreathingActivity(activity)).toBe(true);
    expect(isBreathingActivity(null)).toBe(false);
    expect(activity.choices.map((c) => c.id)).toEqual(["ready", "not-yet"]);
  });
});
