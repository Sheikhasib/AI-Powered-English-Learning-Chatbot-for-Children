import { describe, expect, it } from "vitest";
import { extractSignals } from "@/engine/signals";
import type { TurnHistory, TurnInput } from "@/types/mode";

const now = new Date("2026-01-01T10:10:00Z");

function input(overrides: Partial<TurnInput> = {}): TurnInput {
  return { text: "", kind: "text", tappedMood: null, answerMs: null, safetyDisclosure: false, ...overrides };
}

function history(overrides: Partial<TurnHistory> = {}): TurnHistory {
  return {
    skillStreak: 0,
    previousFastGuess: false,
    lastBotAt: null,
    teachingStreak: 0,
    sessionStartedAt: now,
    lastMood: null,
    ...overrides,
  };
}

const signalsFor = (text: string) => extractSignals(input({ text }), history(), now);

describe("extractSignals: feelings", () => {
  it.each([
    ["i am sad", "SAD"],
    ["im sad", "SAD"],
    ["sadd", "SAD"],
    ["i feel saaad", "SAD"],
    ["i am scared", "SCARED"],
    ["im skared", "SCARED"],
    ["i'm angry", "ANGRY"],
    ["im mad", "ANGRY"],
    ["i am tired", "TIRED"],
    ["so sleepy", "TIRED"],
    ["i am happy", "HAPPY"],
    ["i am excited!", "EXCITED"],
    ["im ok", "OKAY"],
  ])("hears %s as %s", (text, mood) => {
    expect(signalsFor(text).feeling).toBe(mood);
  });

  it("ignores a feeling that is negated", () => {
    expect(signalsFor("i am not sad").feeling).toBeNull();
  });

  it("prefers the worrying feeling when several are named", () => {
    expect(signalsFor("happy but scared").feeling).toBe("SCARED");
  });

  it("takes a tapped face over the words", () => {
    const signals = extractSignals(input({ text: "im sad", tappedMood: "HAPPY", kind: "mood" }), history(), now);
    expect(signals.feeling).toBe("HAPPY");
  });

  it("finds no feeling in a plain word", () => {
    expect(signalsFor("cat").feeling).toBeNull();
  });
});

describe("extractSignals: intent words", () => {
  it("catches break requests", () => {
    for (const text of ["stop", "no more", "i want a break", "im tired", "all done"]) {
      expect(signalsFor(text).wantsBreak, text).toBe(true);
    }
  });

  it("treats the break button as a break request", () => {
    const signals = extractSignals(input({ kind: "break" }), history(), now);
    expect(signals.wantsBreak).toBe(true);
  });

  it("catches refusals and boredom", () => {
    for (const text of ["no", "i dont want to", "don't want", "boring", "boooring", "im bored"]) {
      expect(signalsFor(text).refusal, text).toBe(true);
    }
  });

  it("catches questions by mark or opening word", () => {
    for (const text of ["why is the sky blue", "what is that", "can you sing", "is it big?"]) {
      expect(signalsFor(text).isQuestion, text).toBe(true);
    }
    expect(signalsFor("cat").isQuestion).toBe(false);
  });

  it("catches story cues and long free speech", () => {
    expect(signalsFor("my dog is big").isStory).toBe(true);
    expect(signalsFor("today i played").isStory).toBe(true);
    expect(signalsFor("we had pasta and then we went outside to the park").isStory).toBe(true);
    expect(signalsFor("cat").isStory).toBe(false);
  });

  it("catches greetings", () => {
    for (const text of ["hello", "hi pip", "hey!", "good morning"]) {
      expect(signalsFor(text).isGreeting, text).toBe(true);
    }
  });

  it("hears that the child is ready", () => {
    expect(signalsFor("im ready").isReady).toBe(true);
    expect(signalsFor("lets play").isReady).toBe(true);
    expect(signalsFor("cat").isReady).toBe(false);
  });

  it("counts a tapped happy face as ready", () => {
    const tapped = (tappedMood: "HAPPY" | "EXCITED" | "SAD") =>
      extractSignals(input({ kind: "mood", tappedMood }), history(), now).isReady;
    expect(tapped("HAPPY")).toBe(true);
    expect(tapped("EXCITED")).toBe(true);
    expect(tapped("SAD")).toBe(false);
  });

  it("passes the safety disclosure flag through", () => {
    const signals = extractSignals(input({ safetyDisclosure: true }), history(), now);
    expect(signals.safetyDisclosure).toBe(true);
  });
});

describe("extractSignals: behavior", () => {
  it("splits the skill streak into correct and wrong runs", () => {
    const good = extractSignals(input(), history({ skillStreak: 4 }), now);
    const bad = extractSignals(input(), history({ skillStreak: -2 }), now);
    expect([good.correctStreak, good.wrongStreak]).toEqual([4, 0]);
    expect([bad.correctStreak, bad.wrongStreak]).toEqual([0, 2]);
  });

  it("flags a card answered under 700 ms as a fast guess", () => {
    const fast = extractSignals(input({ kind: "card", answerMs: 699 }), history(), now);
    const slow = extractSignals(input({ kind: "card", answerMs: 700 }), history(), now);
    const typed = extractSignals(input({ answerMs: 100 }), history(), now);
    expect(fast.fastGuess).toBe(true);
    expect(slow.fastGuess).toBe(false);
    expect(typed.fastGuess).toBe(false);
  });

  it("measures silence since Pip's last line", () => {
    const quiet = extractSignals(input(), history({ lastBotAt: new Date(now.getTime() - 25_000) }), now);
    expect(quiet.silenceMs).toBe(25_000);
    expect(extractSignals(input(), history(), now).silenceMs).toBe(0);
  });

  it("measures session minutes and carries history through", () => {
    const signals = extractSignals(
      input(),
      history({ sessionStartedAt: new Date(now.getTime() - 16 * 60_000), teachingStreak: 3, lastMood: "TIRED", previousFastGuess: true }),
      now,
    );
    expect(signals.sessionMinutes).toBe(16);
    expect(signals.teachingStreak).toBe(3);
    expect(signals.lastMood).toBe("TIRED");
    expect(signals.previousFastGuess).toBe(true);
  });
});
