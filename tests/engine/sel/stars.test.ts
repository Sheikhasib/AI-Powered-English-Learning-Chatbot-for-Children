import { describe, expect, it } from "vitest";
import { starsFor } from "@/engine/sel/stars";

describe("starsFor", () => {
  it("gives 1 star for any attempt, even a miss", () => {
    expect(starsFor({ correct: false, afterMiss: false })).toBe(1);
  });

  it("gives 2 stars for a correct first try", () => {
    expect(starsFor({ correct: true, afterMiss: false })).toBe(2);
  });

  it("adds 2 stars for trying again after a miss, even if it is missed again", () => {
    expect(starsFor({ correct: false, afterMiss: true })).toBe(3);
  });

  it("gives the most stars for getting it right after trying again", () => {
    expect(starsFor({ correct: true, afterMiss: true })).toBe(4);
  });

  it("never takes stars away", () => {
    for (const correct of [true, false]) {
      for (const afterMiss of [true, false]) {
        expect(starsFor({ correct, afterMiss })).toBeGreaterThan(0);
      }
    }
  });
});
