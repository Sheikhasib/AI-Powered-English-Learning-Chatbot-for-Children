import { describe, expect, it } from "vitest";
import { curriculum } from "@/engine/curriculum";
import { buildLevelProgress, buildModeTimeline } from "@/server/repositories/reportShape";

describe("buildLevelProgress", () => {
  const firstSkill = curriculum[0].skills[0];

  it("shows every curriculum skill, empty when the child has not met it", () => {
    const progress = buildLevelProgress([]);
    expect(progress.map((level) => level.skills.length)).toEqual(curriculum.map((level) => level.skills.length));
    expect(progress.flatMap((level) => level.skills).every((skill) => skill.mastery === 0)).toBe(true);
  });

  it("marks a skill mastered at 0.8 and counts it for its level", () => {
    const [levelOne] = buildLevelProgress([{ skillId: firstSkill.id, mastery: 0.8 }]);
    expect(levelOne.skills[0].mastered).toBe(true);
    expect(levelOne.masteredCount).toBe(1);
  });

  it("does not mark a skill just under 0.8 as mastered", () => {
    const [levelOne] = buildLevelProgress([{ skillId: firstSkill.id, mastery: 0.79 }]);
    expect(levelOne.skills[0].mastered).toBe(false);
  });
});

describe("buildModeTimeline", () => {
  const at = (minute: number) => new Date(Date.UTC(2026, 0, 1, 10, minute));

  it("keeps only the turns where the mode changed", () => {
    const timeline = buildModeTimeline([
      { createdAt: at(0), mode: "LEARN", modeReason: "keep learning" },
      { createdAt: at(1), mode: "LEARN", modeReason: "keep learning" },
      { createdAt: at(2), mode: "SUPPORT", modeReason: "child feels sad" },
      { createdAt: at(3), mode: "LEARN", modeReason: "easing back" },
    ]);
    expect(timeline.map((entry) => entry.mode)).toEqual(["LEARN", "SUPPORT", "LEARN"]);
    expect(timeline[1].reason).toBe("child feels sad");
  });

  it("is empty when there were no turns", () => {
    expect(buildModeTimeline([])).toEqual([]);
  });
});
