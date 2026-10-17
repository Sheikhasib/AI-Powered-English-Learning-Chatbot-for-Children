import { describe, expect, it } from "vitest";
import { PRAISE_EVENTS, PRAISE_LINES, praiseFor } from "@/engine/sel/praise";
import { createRng } from "@/engine/rng";

const BANNED = /\b(smart|clever|genius|brilliant|talented|gifted|best|better than|winner|perfect|good (boy|girl)|failed|wrong|stupid)\b/i;
const allLines = PRAISE_EVENTS.flatMap((event) => PRAISE_LINES[event]);

describe("praiseFor", () => {
  it("has several lines for every event", () => {
    for (const event of PRAISE_EVENTS) {
      expect(PRAISE_LINES[event].length, event).toBeGreaterThanOrEqual(3);
    }
  });

  it("never praises intelligence, compares children or says failed or wrong", () => {
    for (const line of allLines) expect(line, line).not.toMatch(BANNED);
  });

  it("keeps every sentence under 8 words", () => {
    for (const line of allLines) {
      for (const sentence of line.split(/[.!?]+/).filter((s) => s.trim())) {
        expect(sentence.trim().split(/\s+/).length, sentence).toBeLessThan(8);
      }
    }
  });

  it("returns a line that belongs to the event", () => {
    for (const event of PRAISE_EVENTS) {
      expect(PRAISE_LINES[event]).toContain(praiseFor(event, createRng(3)));
    }
  });

  it("is deterministic for a fixed seed and varies across seeds", () => {
    expect(praiseFor("correct", createRng(4))).toBe(praiseFor("correct", createRng(4)));
    const seen = new Set(Array.from({ length: 40 }, (_, seed) => praiseFor("correct", createRng(seed))));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("names the effort when a child succeeds after misses", () => {
    for (const line of PRAISE_LINES.persisted) expect(line).toMatch(/trying|try|going|give up|kept/i);
  });

  it("frames a miss as learning together", () => {
    for (const line of PRAISE_LINES.miss) expect(line).toMatch(/try|learn|look|okay/i);
  });
});
