import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/rng";
import { getSkill } from "@/engine/curriculum";
import { buildActivity } from "@/engine/curriculum/buildActivity";
import { MODES, MOODS } from "@/types/domain";
import { buildFallback, type FallbackEvent } from "@/llm/fallback";
import { outputGuard } from "@/safety/outputGuard";

const skill = getSkill("l2.animals");
const activity = skill ? buildActivity(skill, skill.activityKinds[0], createRng(1), "AGE_5_6") : null;

const EVENTS: FallbackEvent[] = ["correct", "miss", "attempt", "persisted", "level-up", "start", "none"];

describe("buildFallback", () => {
  it("has a skill to build activities from", () => {
    expect(activity).not.toBeNull();
  });

  it("praises effort and then asks the activity prompt in Learn", () => {
    const line = buildFallback({ mode: "LEARN", mood: "HAPPY", event: "correct", activity, showHint: false }, createRng(3));
    expect(line.endsWith(activity?.prompt ?? "?")).toBe(true);
    expect(line.length).toBeGreaterThan((activity?.prompt.length ?? 0) + 3);
  });

  it("adds the hint after repeated misses", () => {
    const line = buildFallback({ mode: "LEARN", mood: "OKAY", event: "miss", activity, showHint: true }, createRng(3));
    expect(line).toContain(activity?.hint);
  });

  it("never says wrong or failed after a miss", () => {
    for (let seed = 0; seed < 20; seed++) {
      const line = buildFallback({ mode: "LEARN", mood: "OKAY", event: "miss", activity, showHint: false }, createRng(seed));
      expect(line).not.toMatch(/wrong|fail|bad/i);
    }
  });

  it("validates the feeling before anything else in Support, with no teaching", () => {
    const line = buildFallback({ mode: "SUPPORT", mood: "SAD", event: "start", activity: null, showHint: false }, createRng(1));
    expect(line.startsWith("It's okay to feel sad.")).toBe(true);
    expect(line).not.toMatch(/tap the/i);
  });

  it("is deterministic for the same seed", () => {
    const make = () => buildFallback({ mode: "CHAT", mood: "OKAY", event: "none", activity: null, showHint: false }, createRng(9));
    expect(make()).toBe(make());
  });

  it("passes the output guard for every mode, mood and event", () => {
    for (const mode of MODES) {
      for (const mood of MOODS) {
        for (const event of EVENTS) {
          const line = buildFallback({ mode, mood, event, activity, showHint: event === "miss" }, createRng(5));
          expect(outputGuard(line), `${mode} ${mood} ${event}: ${line}`).toEqual({ ok: true });
        }
      }
    }
  });
});
