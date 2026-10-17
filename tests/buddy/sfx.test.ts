import { describe, expect, it } from "vitest";
import { MAX_PEAK, RECIPES, SOUND_NAMES } from "@/hooks/sfx";

describe("sound recipes", () => {
  it("stays soft: no note is louder than the cap", () => {
    for (const name of SOUND_NAMES) {
      for (const note of RECIPES[name]) expect(note.peak).toBeLessThanOrEqual(MAX_PEAK);
    }
  });

  it("stays short: every sound ends within a second", () => {
    for (const name of SOUND_NAMES) {
      const end = Math.max(...RECIPES[name].map((n) => n.at + n.seconds));
      expect(end).toBeLessThanOrEqual(1);
    }
  });

  it("keeps the tap quick so it feels instant", () => {
    expect(RECIPES.tap).toHaveLength(1);
    expect(RECIPES.tap[0].seconds).toBeLessThanOrEqual(0.15);
  });
});
