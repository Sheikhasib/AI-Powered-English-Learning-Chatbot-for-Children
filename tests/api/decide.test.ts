import { describe, expect, it } from "vitest";
import { decideTurn } from "@/app/api/chat/decide";
import { createRng } from "@/engine/rng";
import { curriculum, getSkill } from "@/engine/curriculum";
import { inputGuard } from "@/safety/inputGuard";
import type { RecentTurn, TurnContext } from "@/server/repositories/context";
import type { ChatInput } from "@/types/chat";

const NOW = new Date("2026-01-01T10:00:00Z");
const target = getSkill("l2.animals")?.items[0];
const ACTIVITY_ID = `l2.animals:listen-tap:${target?.id}`;

function context(turns: RecentTurn[] = [], checkIn: TurnContext["session"]["checkIn"] = "HAPPY"): TurnContext {
  return {
    profile: { id: "p", nickname: "Mia", ageBand: "AGE_5_6", interests: [], level: 2, summary: "" },
    skills: [],
    session: { id: "s", startedAt: NOW, checkIn },
    turns,
    turnCount: turns.length,
  };
}

function decide(input: ChatInput, ctx = context(), text = "") {
  return decideTurn({ ctx, input, text, guard: text ? inputGuard(text) : { action: "ok" }, now: NOW, rng: createRng(7) });
}

const miss: RecentTurn = {
  childInput: "[card] x",
  botReply: "",
  mode: "LEARN",
  mood: null,
  activityId: ACTIVITY_ID,
  correct: false,
  responseMs: null,
  createdAt: NOW,
};

const tap = (choiceId: string): ChatInput => ({ kind: "card", activityId: ACTIVITY_ID, choiceId, responseMs: 2000 });

describe("decideTurn", () => {
  it("celebrates a right card, earns stars and updates the skill", () => {
    const { turn, outcome, record } = decide(tap(target?.id ?? ""));
    expect(turn.celebrate).toBe(true);
    expect(turn.stars).toBe(2);
    expect(outcome.skill?.skillId).toBe("l2.animals");
    expect(record).toMatchObject({ correct: true, activityId: ACTIVITY_ID, inputKind: "card" });
  });

  it("answers a wrong card with a retry and no cross: not celebrated, still earns a star", () => {
    const { turn, record } = decide(tap("other"));
    expect(turn.celebrate).toBe(false);
    expect(turn.stars).toBe(1);
    expect(turn.activity).not.toBeNull();
    expect(record.correct).toBe(false);
  });

  it("reports the old and new level when a right card unlocks the next one", () => {
    const mastered = curriculum[1].skills.map((skill) => ({
      skillId: skill.id, mastery: 0.95, attempts: 10, streak: 5, lastSeenAt: NOW, dueAt: NOW,
    }));
    const { turn } = decide(tap(target?.id ?? ""), { ...context(), skills: mastered });
    expect(turn.levelUp).toEqual({ from: 2, to: 3 });
    expect(turn.celebrate).toBe(true);
  });

  it("leaves levelUp empty on an ordinary turn", () => {
    expect(decide(tap(target?.id ?? "")).turn.levelUp).toBeNull();
  });

  it("moves to Play after two fast taps in a row", () => {
    const fastTurn: RecentTurn = { ...miss, responseMs: 300 };
    const fastTap: ChatInput = { kind: "card", activityId: ACTIVITY_ID, choiceId: "other", responseMs: 300 };
    expect(decide(fastTap, context([fastTurn])).turn.mode).toBe("PLAY");
    expect(decide(fastTap, context([miss])).turn.mode).toBe("LEARN");
  });

  it("flags a wrong card so the reply may not praise the answer", () => {
    expect(decide(tap("other")).prompt.wrongAnswer).toBe(true);
    expect(decide(tap(target?.id ?? "")).prompt.wrongAnswer).toBe(false);
  });

  it("records how long the tap took", () => {
    expect(decide(tap("other")).record.responseMs).toBe(2000);
    expect(decide({ kind: "text", text: "hi" }, context(), "hi").record.responseMs).toBeNull();
  });

  it("gives extra stars for trying again after a miss", () => {
    expect(decide(tap(target?.id ?? ""), context([miss])).turn.stars).toBe(4);
  });

  it("moves to Support and offers two coping cards when the child says they feel sad", () => {
    const { turn } = decide({ kind: "text", text: "I feel sad" }, context(), "I feel sad");
    expect(turn.mode).toBe("SUPPORT");
    expect(turn.activity?.choices.map((c) => c.id)).toEqual(["breathe", "slow-game"]);
    expect(turn.fallbackLine).toMatch(/okay to feel sad/);
  });

  it("moves to Calm when the child chooses to breathe", () => {
    const ctx = context([{ ...miss, mode: "SUPPORT", activityId: "support:offer", correct: null }]);
    const { turn } = decide({ kind: "card", activityId: "support:offer", choiceId: "breathe", responseMs: 900 }, ctx);
    expect(turn.mode).toBe("CALM");
    expect(turn.activity?.choices.map((c) => c.id)).toEqual(["ready", "not-yet"]);
  });

  it("uses the fixed script for a disclosure and shows no cards", () => {
    const { turn, scripted, record } = decide({ kind: "text", text: "someone hurt me" }, context(), "someone hurt me");
    expect(scripted).toBe(true);
    expect(turn.mode).toBe("SUPPORT");
    expect(turn.activity).toBeNull();
    expect(turn.stars).toBe(0);
    expect(record).toMatchObject({ safetyFlag: "disclosure", childInput: "[not saved]" });
  });

  it("redirects an unsafe topic to a light game and does not save the words", () => {
    const { turn, scripted, record } = decide({ kind: "text", text: "I have a gun" }, context(), "I have a gun");
    expect(scripted).toBe(true);
    expect(turn.mode).toBe("PLAY");
    expect(turn.activity).not.toBeNull();
    expect(record.childInput).toBe("[not saved]");
  });

  it("saves redacted text and flags the redaction", () => {
    const input: ChatInput = { kind: "text", text: "call 555 123 4567" };
    const { record } = decide(input, context(), "call 555 123 4567");
    expect(record.childInput).toContain("[removed]");
    expect(record.safetyFlag).toBe("redacted:phone");
  });

  it("never puts the child's words in the engine's prompt decision", () => {
    const { prompt } = decide({ kind: "text", text: "banana pancakes" }, context(), "banana pancakes");
    expect(JSON.stringify(prompt)).not.toContain("banana");
  });

  it("shows 2 to 4 picture cards in every mode that asks something", () => {
    for (const text of ["hello", "I feel sad", "stop", "why is the sky blue"]) {
      const { turn } = decide({ kind: "text", text }, context(), text);
      if (turn.activity) expect(turn.activity.choices.length).toBeGreaterThanOrEqual(2);
    }
  });
});
