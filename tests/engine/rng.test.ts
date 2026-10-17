import { describe, expect, it } from "vitest";
import { createRng, pickOne, shuffle } from "@/engine/rng";

describe("createRng", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("stays inside [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("shuffle", () => {
  it("keeps every element and does not change the input", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, createRng(1));
    expect([...result].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("pickOne", () => {
  it("returns an element of the list", () => {
    expect(["a", "b", "c"]).toContain(pickOne(["a", "b", "c"], createRng(3)));
  });

  it("throws on an empty list", () => {
    expect(() => pickOne([], createRng(3))).toThrow();
  });
});
