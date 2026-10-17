import { describe, expect, it } from "vitest";
import { unlockedLevel } from "@/hooks/levelUp";

describe("unlockedLevel", () => {
  it("reads the new level from the engine's level-up reason", () => {
    expect(unlockedLevel("Unlocked Level 2: 4 of 5 skills mastered")).toBe(2);
    expect(unlockedLevel("Unlocked Level 3: 7 of 8 skills mastered")).toBe(3);
  });

  it("ignores ordinary celebrate turns", () => {
    expect(unlockedLevel("correct answer")).toBeNull();
    expect(unlockedLevel("Level 1: 3 of 10 skills mastered, 8 needed")).toBeNull();
  });

  it("ignores levels that do not exist", () => {
    expect(unlockedLevel("Unlocked Level 9: nonsense")).toBeNull();
  });
});
