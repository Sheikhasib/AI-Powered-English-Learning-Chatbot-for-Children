import { describe, expect, it } from "vitest";
import { makeSum } from "@/components/shared/gateSum";
import { createRng } from "@/engine/rng";

describe("makeSum", () => {
  it("writes both numbers from five to twelve in words", () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(makeSum(createRng(seed)).question).toMatch(
        /^(five|six|seven|eight|nine|ten|eleven|twelve) plus (five|six|seven|eight|nine|ten|eleven|twelve)$/,
      );
    }
  });

  it("offers the right answer among three distinct options", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { answer, options } = makeSum(createRng(seed));
      expect(options).toContain(answer);
      expect(new Set(options).size).toBe(3);
    }
  });

  it("gives the same sum for the same seed", () => {
    expect(makeSum(createRng(7))).toEqual(makeSum(createRng(7)));
  });
});
