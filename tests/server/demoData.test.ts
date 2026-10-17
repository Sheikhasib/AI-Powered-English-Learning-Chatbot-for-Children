import { describe, expect, it } from "vitest";
import { MASTERED } from "@/engine/config";
import { getSkill } from "@/engine/curriculum";
import { MODES } from "@/types/domain";
import { buildDemoSessions, buildDemoSkills } from "@/server/repositories/demo/build";
import { DEMO_DEVICE_ID, isDemoDevice } from "@/server/repositories/demo/ids";

const NOW = new Date("2026-10-17T12:00:00Z");
const sessions = buildDemoSessions(NOW);
const turns = sessions.flatMap((s) => s.turns);

describe("demo data", () => {
  it("has three sessions with about forty turns", () => {
    expect(sessions).toHaveLength(3);
    expect(turns.length).toBeGreaterThanOrEqual(38);
    expect(turns.length).toBeLessThanOrEqual(42);
  });

  it("covers every mode with a reason from the engine", () => {
    expect(new Set(turns.map((t) => t.mode))).toEqual(new Set(MODES));
    expect(turns.every((t) => t.modeReason.length > 0)).toBe(true);
  });

  it("moves from sad to breathing to play in the last session", () => {
    const last = sessions[2].turns;
    expect(last.slice(0, 5).map((t) => t.mode)).toEqual(["SUPPORT", "SUPPORT", "CALM", "PLAY", "LEARN"]);
    expect(last[0].modeReason).toBe("child said or showed they feel sad");
  });

  it("includes one redacted input and two fallback turns", () => {
    const flagged = turns.filter((t) => t.safetyFlag);
    expect(flagged).toHaveLength(1);
    expect(flagged[0].childInput).not.toMatch(/\d{3}/);
    expect(turns.filter((t) => t.fallback)).toHaveLength(2);
  });

  it("keeps made-up timings inside the stated ranges", () => {
    for (const t of turns) {
      expect(t.tFirstToken).toBeGreaterThanOrEqual(80);
      expect(t.tFirstToken).toBeLessThanOrEqual(400);
      expect(t.tTotal).toBeGreaterThanOrEqual(150);
      expect(t.tTotal).toBeLessThanOrEqual(900);
      expect(t.tTotal).toBeGreaterThan(t.tFirstToken);
    }
  });

  it("is the same every time for the same clock", () => {
    expect(buildDemoSessions(NOW)).toEqual(sessions);
  });

  it("keeps every turn in the past and in order", () => {
    const times = turns.map((t) => t.createdAt.getTime());
    expect(Math.max(...times)).toBeLessThan(NOW.getTime());
    for (const s of sessions) {
      const own = s.turns.map((t) => t.createdAt.getTime());
      expect(own).toEqual([...own].sort((a, b) => a - b));
    }
  });
});

describe("demo skills", () => {
  const skills = buildDemoSkills(NOW);

  it("only uses skill ids from the curriculum", () => {
    expect(skills.every((s) => getSkill(s.skillId))).toBe(true);
    expect(turns.flatMap((t) => (t.activityId ? [t.activityId.split(":picture-match")[0]] : [])).every((id) => getSkill(id))).toBe(true);
  });

  it("has most of Level 1 mastered and some of Level 2 started", () => {
    const level1 = skills.filter((s) => s.skillId.startsWith("l1."));
    expect(level1.filter((s) => s.mastery >= MASTERED).length / level1.length).toBeGreaterThanOrEqual(0.8);
    expect(skills.some((s) => s.skillId.startsWith("l2."))).toBe(true);
  });
});

describe("demo device id", () => {
  it("recognises only the demo device", () => {
    expect(isDemoDevice(DEMO_DEVICE_ID)).toBe(true);
    expect(isDemoDevice("someone-else")).toBe(false);
    expect(isDemoDevice(undefined)).toBe(false);
  });
});
