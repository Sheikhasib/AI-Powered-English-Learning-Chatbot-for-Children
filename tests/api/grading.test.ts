import { describe, expect, it } from "vitest";
import { activityStub, gradeCard, resolveActivity } from "@/app/api/chat/grading";
import { deriveHistory, consecutiveMisses } from "@/app/api/chat/history";
import { getSkill } from "@/engine/curriculum";
import type { RecentTurn, TurnContext } from "@/server/repositories/context";

const NOW = new Date("2026-01-01T10:00:00Z");
const animals = getSkill("l2.animals");
const target = animals?.items[0];

describe("resolveActivity", () => {
  it("rebuilds the correct card from the activity id alone", () => {
    const resolved = resolveActivity(`l2.animals:listen-tap:${target?.id}`);
    expect(resolved?.answerId).toBe(target?.id);
    expect(resolved?.skill.id).toBe("l2.animals");
  });

  it("treats say-it as open so any try earns credit", () => {
    expect(resolveActivity(`l2.animals:say-it:${target?.id}`)?.answerId).toBeNull();
  });

  it("returns null for unknown skills, unknown kinds and support cards", () => {
    expect(resolveActivity("nope:listen-tap:x")).toBeNull();
    expect(resolveActivity("l2.animals:dance:x")).toBeNull();
    expect(resolveActivity("support:offer")).toBeNull();
  });

  it("builds a stub the picker can read", () => {
    const resolved = resolveActivity(`l2.animals:listen-tap:${target?.id}`);
    expect(resolved && activityStub("id", resolved).skillId).toBe("l2.animals");
  });
});

describe("gradeCard", () => {
  const id = `l2.animals:listen-tap:${target?.id}`;

  it("counts the answer card as correct and raises mastery", () => {
    const graded = gradeCard({ activityId: id, choiceId: target?.id ?? "" }, [], 0, NOW);
    expect(graded?.correct).toBe(true);
    expect(graded?.skill.mastery).toBeGreaterThan(0);
    expect(graded?.skills).toHaveLength(1);
  });

  it("counts another card as a miss and starts a negative streak", () => {
    const graded = gradeCard({ activityId: id, choiceId: "other" }, [], 0, NOW);
    expect(graded?.correct).toBe(false);
    expect(graded?.skill.streak).toBe(-1);
  });

  it("replaces the old state of the same skill instead of adding a second one", () => {
    const first = gradeCard({ activityId: id, choiceId: target?.id ?? "" }, [], 0, NOW);
    const second = gradeCard({ activityId: id, choiceId: target?.id ?? "" }, first?.skills ?? [], 0, NOW);
    expect(second?.skills).toHaveLength(1);
    expect(second?.skill.attempts).toBe(2);
  });

  it("returns null for a card it cannot grade", () => {
    expect(gradeCard({ activityId: "support:offer", choiceId: "breathe" }, [], 0, NOW)).toBeNull();
  });
});

function turn(partial: Partial<RecentTurn>): RecentTurn {
  return {
    childInput: "",
    botReply: "",
    mode: "LEARN",
    mood: null,
    activityId: null,
    correct: null,
    createdAt: NOW,
    ...partial,
  };
}

function context(turns: RecentTurn[], checkIn: TurnContext["session"]["checkIn"] = null): TurnContext {
  return {
    profile: { id: "p", nickname: "Mia", ageBand: "AGE_5_6", interests: [], level: 1, summary: "" },
    skills: [],
    session: { id: "s", startedAt: NOW, checkIn },
    turns,
    turnCount: turns.length,
  };
}

describe("deriveHistory", () => {
  it("starts a new session in Chat with the check-in mood", () => {
    const history = deriveHistory(context([], "SAD"));
    expect(history.previous.mode).toBe("CHAT");
    expect(history.lastMood).toBe("SAD");
    expect(history.teachingStreak).toBe(0);
  });

  it("counts the turns spent in the current mode and the Learn streak", () => {
    const history = deriveHistory(context([turn({}), turn({}), turn({ mode: "CHAT" })]));
    expect(history.previous).toMatchObject({ mode: "LEARN", turnsInMode: 2, lastBreak: "CHAT" });
    expect(history.teachingStreak).toBe(2);
  });

  it("lists recent activity kinds and items oldest first", () => {
    const history = deriveHistory(
      context([turn({ activityId: "l2.animals:say-it:cat" }), turn({ activityId: "l2.animals:listen-tap:dog" })]),
    );
    expect(history.recentKinds).toEqual(["listen-tap", "say-it"]);
    expect(history.recentItemIds).toEqual(["dog", "cat"]);
  });
});

describe("consecutiveMisses", () => {
  it("counts misses in a row on the same activity, newest first", () => {
    const turns = [
      turn({ activityId: "a", correct: false }),
      turn({ activityId: "a", correct: false }),
      turn({ activityId: "a", correct: true }),
    ];
    expect(consecutiveMisses(turns, "a")).toBe(2);
  });

  it("stops at a different activity", () => {
    expect(consecutiveMisses([turn({ activityId: "b", correct: false })], "a")).toBe(0);
  });
});
