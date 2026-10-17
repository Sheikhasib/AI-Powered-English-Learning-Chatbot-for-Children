import { describe, expect, it } from "vitest";
import { getSkill, skillsForLevel } from "@/engine/curriculum";
import { buildActivity } from "@/engine/curriculum/buildActivity";
import type { ActivityKind, Activity } from "@/engine/curriculum/types";
import { newSkillState } from "@/engine/mastery";
import { pickNextActivity, type PickContext } from "@/engine/picker";
import { createRng } from "@/engine/rng";
import type { SkillState } from "@/types/engine";

const now = new Date("2026-01-01T10:00:00Z");
const minutes = (n: number) => new Date(now.getTime() + n * 60_000);
const always = (value: number) => () => value;

function mastered(skillId: string, overrides: Partial<SkillState> = {}): SkillState {
  return { ...newSkillState(skillId), mastery: 0.9, ...overrides };
}

function context(overrides: Partial<PickContext> = {}): PickContext {
  return {
    profile: { level: 1, ageBand: "AGE_5_6", interests: [] },
    skills: [],
    recentKinds: [],
    recentItemIds: [],
    ...overrides,
  };
}

function missedActivity(skillId = "l2.animals"): Activity {
  const skill = getSkill(skillId)!; // test data: id exists in the curriculum
  return buildActivity(skill, "listen-tap", createRng(1), "AGE_5_6");
}

describe("pickNextActivity: new activities", () => {
  it("starts with the first skill of the current level", () => {
    const pick = pickNextActivity(context(), createRng(1), now);
    expect(pick.source).toBe("new");
    expect(pick.activity.skillId).toBe(skillsForLevel(1)[0].id);
    expect(pick.reason).toContain("Letters A to E");
  });

  it("moves past mastered skills to the lowest-order unmastered one", () => {
    const [first, second] = skillsForLevel(1);
    const pick = pickNextActivity(context({ skills: [mastered(first.id)] }), createRng(1), now);
    expect(pick.activity.skillId).toBe(second.id);
  });

  it("only teaches skills from the current level", () => {
    const pick = pickNextActivity(context({ profile: { level: 2, ageBand: "AGE_5_6", interests: [] } }), createRng(1), now);
    expect(pick.activity.skillId.startsWith("l2.")).toBe(true);
  });

  it("practises the least recently seen skill when the level is fully mastered", () => {
    const skills = skillsForLevel(1).map((s, i) => mastered(s.id, { lastSeenAt: minutes(-i * 10) }));
    const oldest = skills[skills.length - 1];
    const pick = pickNextActivity(context({ skills }), createRng(1), now);
    expect(pick.activity.skillId).toBe(oldest.skillId);
    expect(pick.reason).toContain("practising");
  });

  it("practises a never-seen skill before a seen one when all are mastered", () => {
    const all = skillsForLevel(1);
    const skills = all.slice(1).map((s) => mastered(s.id, { lastSeenAt: minutes(-5) }));
    skills.push(mastered(all[0].id));
    const pick = pickNextActivity(context({ skills }), createRng(1), now);
    expect(pick.activity.skillId).toBe(all[0].id);
  });

  it("is deterministic for a fixed seed", () => {
    const a = pickNextActivity(context(), createRng(9), now);
    const b = pickNextActivity(context(), createRng(9), now);
    expect(a).toEqual(b);
  });

  it("prefers items that match the child's interests", () => {
    const toys = context({ profile: { level: 2, ageBand: "AGE_5_6", interests: ["cars"] } });
    const toysSkill = getSkill("l2.toys")!; // test data
    const masteredBefore = skillsForLevel(2)
      .filter((s) => s.order < toysSkill.order)
      .map((s) => mastered(s.id));
    for (let seed = 0; seed < 30; seed++) {
      const pick = pickNextActivity({ ...toys, skills: masteredBefore }, createRng(seed), now);
      expect(pick.activity.id).toMatch(/:toys\.(car|train)$/);
    }
  });

  it("avoids repeating the most recent items", () => {
    const skill = skillsForLevel(1)[0];
    const recent = skill.items.slice(0, 2).map((i) => i.id);
    for (let seed = 0; seed < 30; seed++) {
      const pick = pickNextActivity(
        context({ recentItemIds: recent, recentKinds: ["say-it"] }),
        createRng(seed),
        now,
      );
      if (pick.activity.kind !== "say-it") expect(recent).not.toContain(pick.activity.answerId);
    }
  });

  it("falls back to repeating an item when every candidate was just taught", () => {
    const skill = skillsForLevel(1)[0];
    const pick = pickNextActivity(
      context({ recentItemIds: skill.items.map((i) => i.id), recentKinds: ["say-it"] }),
      createRng(2),
      now,
    );
    expect(pick.activity.skillId).toBe(skill.id);
  });
});

describe("pickNextActivity: kind rotation", () => {
  it("never uses the same kind three times in a row", () => {
    const rng = createRng(3);
    const recentKinds: ActivityKind[] = [];
    for (let i = 0; i < 300; i++) {
      const pick = pickNextActivity(context({ recentKinds: recentKinds.slice(-2) }), rng, now);
      recentKinds.push(pick.activity.kind);
    }
    for (let i = 2; i < recentKinds.length; i++) {
      const run = recentKinds.slice(i - 2, i + 1);
      expect(new Set(run).size, run.join(",")).toBeGreaterThan(1);
    }
  });

  it("repeats a kind when the skill has no other kind", () => {
    const stories = getSkill("l3.stories")!; // test data
    const earlier = skillsForLevel(3).filter((s) => s.order < stories.order).map((s) => mastered(s.id));
    const pick = pickNextActivity(
      context({
        profile: { level: 3, ageBand: "AGE_5_6", interests: [] },
        skills: earlier,
        recentKinds: ["build-story", "build-story"],
      }),
      createRng(1),
      now,
    );
    expect(pick.activity.kind).toBe("build-story");
  });
});

describe("pickNextActivity: retries after a miss", () => {
  const pendingFor = (misses: number) => ({ activity: missedActivity(), misses });

  it("re-offers the same item after one miss without a hint", () => {
    const pending = pendingFor(1);
    const pick = pickNextActivity(context({ pending }), createRng(2), now);
    expect(pick.source).toBe("retry");
    expect(pick.activity.answerId).toBe(pending.activity.answerId);
    expect(pick.activity.kind).toBe(pending.activity.kind);
    expect(pick.showHint).toBe(false);
  });

  it("adds a hint after 2 misses", () => {
    const pick = pickNextActivity(context({ pending: pendingFor(2) }), createRng(2), now);
    expect(pick.showHint).toBe(true);
    expect(pick.activity.answerId).toBe(pendingFor(2).activity.answerId);
    expect(pick.reason).toContain("hint");
  });

  it("switches to 2 cards and the easiest item after 3 misses", () => {
    const skill = getSkill("l2.animals")!; // test data
    const pick = pickNextActivity(context({ pending: pendingFor(3) }), createRng(2), now);
    expect(pick.source).toBe("retry");
    expect(pick.activity.choices).toHaveLength(2);
    expect(pick.activity.answerId).toBe(skill.items[0].id);
    expect(pick.reason).toContain("easier");
  });

  it("takes priority over a due review", () => {
    const skills = [mastered("l1.colors", { dueAt: minutes(-30) })];
    const pick = pickNextActivity(context({ pending: pendingFor(1), skills }), always(0), now);
    expect(pick.source).toBe("retry");
  });

  it("skips the retry for open activities that cannot be missed", () => {
    const open = { ...missedActivity(), kind: "say-it" as const, answerId: null };
    const pick = pickNextActivity(context({ pending: { activity: open, misses: 2 } }), createRng(2), now);
    expect(pick.source).toBe("new");
  });

  it("skips the retry when the skill is unknown", () => {
    const orphan = { ...missedActivity(), skillId: "gone" };
    const pick = pickNextActivity(context({ pending: { activity: orphan, misses: 1 } }), createRng(2), now);
    expect(pick.source).toBe("new");
  });

  it("skips the retry when the missed item is unknown", () => {
    const orphan = { ...missedActivity(), answerId: "animals.dragon" };
    const pick = pickNextActivity(context({ pending: { activity: orphan, misses: 1 } }), createRng(2), now);
    expect(pick.source).toBe("new");
  });
});

describe("pickNextActivity: spaced review", () => {
  const level = { level: 2 as const, ageBand: "AGE_5_6" as const, interests: [] };

  it("picks the most overdue mastered skill when due and the rng allows", () => {
    const skills = [
      mastered("l1.colors", { dueAt: minutes(-5) }),
      mastered("l1.shapes", { dueAt: minutes(-50) }),
    ];
    const pick = pickNextActivity(context({ profile: level, skills }), always(0.1), now);
    expect(pick.source).toBe("review");
    expect(pick.activity.skillId).toBe("l1.shapes");
    expect(pick.reason).toContain("Shapes");
  });

  it("moves on to new material when the rng says no", () => {
    const skills = [mastered("l1.colors", { dueAt: minutes(-5) })];
    const pick = pickNextActivity(context({ profile: level, skills }), always(0.9), now);
    expect(pick.source).toBe("new");
  });

  it("does not review a skill that is not due yet", () => {
    const skills = [mastered("l1.colors", { dueAt: minutes(5) })];
    expect(pickNextActivity(context({ profile: level, skills }), always(0), now).source).toBe("new");
  });

  it("does not review a skill that lost its mastery", () => {
    const skills = [{ ...newSkillState("l1.colors"), mastery: 0.5, dueAt: minutes(-5) }];
    expect(pickNextActivity(context({ profile: level, skills }), always(0), now).source).toBe("new");
  });

  it("does not review a due skill without a due date", () => {
    const skills = [mastered("l1.colors", { dueAt: null })];
    expect(pickNextActivity(context({ profile: level, skills }), always(0), now).source).toBe("new");
  });

  it("never picks a skill from a locked level", () => {
    const skills = [mastered("l2.animals", { dueAt: minutes(-5) })];
    const pick = pickNextActivity(context({ skills }), always(0), now);
    expect(pick.source).toBe("new");
    expect(pick.activity.skillId.startsWith("l1.")).toBe(true);
  });

  it("ignores state rows for skills that no longer exist", () => {
    const skills = [mastered("l0.removed", { dueAt: minutes(-5) })];
    expect(pickNextActivity(context({ skills }), always(0), now).source).toBe("new");
  });
});
