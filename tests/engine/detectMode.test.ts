import { describe, expect, it } from "vitest";
import { INITIAL_MODE, detectMode } from "@/engine/detectMode";
import { extractSignals } from "@/engine/signals";
import type { PreviousMode, Signals } from "@/types/mode";

const calm: Signals = {
  feeling: null,
  wantsBreak: false,
  refusal: false,
  isQuestion: false,
  isStory: false,
  isGreeting: false,
  isReady: false,
  safetyDisclosure: false,
  correctStreak: 0,
  wrongStreak: 0,
  fastGuess: false,
  previousFastGuess: false,
  silenceMs: 0,
  teachingStreak: 0,
  sessionMinutes: 1,
  lastMood: null,
};

const sig = (overrides: Partial<Signals> = {}): Signals => ({ ...calm, ...overrides });
const prev = (overrides: Partial<PreviousMode> = {}): PreviousMode => ({ ...INITIAL_MODE, ...overrides });

describe("detectMode rules", () => {
  it("1: a sad, scared or angry feeling means Support", () => {
    for (const feeling of ["SAD", "SCARED", "ANGRY"] as const) {
      const result = detectMode(sig({ feeling }), prev());
      expect(result.mode, feeling).toBe("SUPPORT");
      expect(result.reason).toContain(feeling.toLowerCase());
    }
  });

  it("1: a safety disclosure means Support", () => {
    const result = detectMode(sig({ safetyDisclosure: true }), prev());
    expect(result.mode).toBe("SUPPORT");
    expect(result.reason).toContain("safety");
  });

  it("2: a break request means Calm", () => {
    expect(detectMode(sig({ wantsBreak: true }), prev()).mode).toBe("CALM");
  });

  it("2: 15 minutes of session time means Calm", () => {
    expect(detectMode(sig({ sessionMinutes: 15 }), prev()).mode).toBe("CALM");
    expect(detectMode(sig({ sessionMinutes: 14.9 }), prev()).mode).toBe("LEARN");
  });

  it("2: a tired last mood means Calm", () => {
    expect(detectMode(sig({ lastMood: "TIRED" }), prev()).mode).toBe("CALM");
  });

  it("3: three wrong answers in a row means Support", () => {
    expect(detectMode(sig({ wrongStreak: 3 }), prev()).mode).toBe("SUPPORT");
    expect(detectMode(sig({ wrongStreak: 2 }), prev()).mode).toBe("LEARN");
  });

  it("3: a refusal after a miss means Support", () => {
    expect(detectMode(sig({ refusal: true, wrongStreak: 1 }), prev()).mode).toBe("SUPPORT");
  });

  it("4: a refusal alone means Play", () => {
    expect(detectMode(sig({ refusal: true }), prev()).mode).toBe("PLAY");
  });

  it("4: two fast guesses in a row mean Play", () => {
    expect(detectMode(sig({ fastGuess: true, previousFastGuess: true }), prev()).mode).toBe("PLAY");
    expect(detectMode(sig({ fastGuess: true }), prev()).mode).toBe("LEARN");
  });

  it("4: more than 20 seconds of silence means Play", () => {
    expect(detectMode(sig({ silenceMs: 20_001 }), prev()).mode).toBe("PLAY");
    expect(detectMode(sig({ silenceMs: 20_000 }), prev()).mode).toBe("LEARN");
  });

  it("5: a question, a story or a greeting means Chat", () => {
    expect(detectMode(sig({ isQuestion: true }), prev()).mode).toBe("CHAT");
    expect(detectMode(sig({ isStory: true }), prev()).mode).toBe("CHAT");
    expect(detectMode(sig({ isGreeting: true }), prev()).mode).toBe("CHAT");
  });

  it("6: a long teaching streak forces a break, alternating Chat and Play", () => {
    expect(detectMode(sig({ teachingStreak: 4 }), prev({ lastBreak: null })).mode).toBe("CHAT");
    expect(detectMode(sig({ teachingStreak: 4 }), prev({ lastBreak: "CHAT" })).mode).toBe("PLAY");
    expect(detectMode(sig({ teachingStreak: 5 }), prev({ lastBreak: "PLAY" })).mode).toBe("CHAT");
    expect(detectMode(sig({ teachingStreak: 3 }), prev()).mode).toBe("LEARN");
  });

  it("7: otherwise Learn", () => {
    expect(detectMode(sig(), prev()).mode).toBe("LEARN");
  });
});

describe("detectMode priority", () => {
  it("lets a sad feeling beat a break request", () => {
    expect(detectMode(sig({ feeling: "SAD", wantsBreak: true }), prev()).mode).toBe("SUPPORT");
  });

  it("lets a break request beat a refusal", () => {
    expect(detectMode(sig({ wantsBreak: true, refusal: true }), prev()).mode).toBe("CALM");
  });

  it("lets Support beat Play for a refusal after a miss", () => {
    expect(detectMode(sig({ refusal: true, wrongStreak: 2 }), prev()).mode).toBe("SUPPORT");
  });

  it("lets Play beat Chat", () => {
    expect(detectMode(sig({ refusal: true, isQuestion: true }), prev()).mode).toBe("PLAY");
  });

  it("lets Chat beat the teaching-streak break", () => {
    const result = detectMode(sig({ isQuestion: true, teachingStreak: 9 }), prev({ lastBreak: "CHAT" }));
    expect(result.mode).toBe("CHAT");
  });
});

describe("detectMode hysteresis", () => {
  it("stays in Support for at least 2 turns", () => {
    const result = detectMode(sig(), prev({ mode: "SUPPORT", turnsInMode: 1 }));
    expect(result.mode).toBe("SUPPORT");
    expect(result.reason).toContain("staying");
  });

  it("stays in Calm for at least 2 turns", () => {
    expect(detectMode(sig(), prev({ mode: "CALM", turnsInMode: 1 })).mode).toBe("CALM");
  });

  it("lets the child leave early by tapping a happy face or saying ready", () => {
    const result = detectMode(sig({ isReady: true }), prev({ mode: "SUPPORT", turnsInMode: 1 }));
    expect(result.mode).not.toBe("SUPPORT");
  });

  it("never goes from Support straight to Learn", () => {
    const result = detectMode(sig(), prev({ mode: "SUPPORT", turnsInMode: 2 }));
    expect(result.mode).toBe("CHAT");
  });

  it("never goes from Calm straight to Learn", () => {
    const result = detectMode(sig(), prev({ mode: "CALM", turnsInMode: 2 }));
    expect(result.mode).toBe("PLAY");
  });

  it("can leave to Play or Chat directly when the rules say so", () => {
    expect(detectMode(sig({ refusal: true }), prev({ mode: "SUPPORT", turnsInMode: 3 })).mode).toBe("PLAY");
    expect(detectMode(sig({ isQuestion: true }), prev({ mode: "SUPPORT", turnsInMode: 3 })).mode).toBe("CHAT");
  });

  it("switches between Support and Calm without waiting", () => {
    expect(detectMode(sig({ feeling: "SAD" }), prev({ mode: "CALM", turnsInMode: 1 })).mode).toBe("SUPPORT");
    expect(detectMode(sig({ wantsBreak: true }), prev({ mode: "SUPPORT", turnsInMode: 1 })).mode).toBe("CALM");
  });
});

describe("detectMode mood", () => {
  it("uses the feeling when present", () => {
    expect(detectMode(sig({ feeling: "SAD", lastMood: "HAPPY" }), prev()).mood).toBe("SAD");
  });

  it("falls back to the last mood", () => {
    expect(detectMode(sig({ lastMood: "EXCITED" }), prev()).mood).toBe("EXCITED");
  });

  it("infers HAPPY from 3 correct answers in a row", () => {
    expect(detectMode(sig({ correctStreak: 3 }), prev()).mood).toBe("HAPPY");
  });

  it("infers OKAY from a refusal", () => {
    expect(detectMode(sig({ refusal: true }), prev()).mood).toBe("OKAY");
  });

  it("defaults to OKAY when nothing is known", () => {
    expect(detectMode(sig(), prev()).mood).toBe("OKAY");
  });
});

describe("detectMode output", () => {
  it("always gives a readable reason and a confidence between 0 and 1", () => {
    const cases: Partial<Signals>[] = [
      {}, { feeling: "SAD" }, { safetyDisclosure: true }, { wantsBreak: true }, { wrongStreak: 3 },
      { refusal: true }, { isQuestion: true }, { teachingStreak: 4 }, { sessionMinutes: 20 },
    ];
    for (const overrides of cases) {
      const result = detectMode(sig(overrides), prev());
      expect(result.reason.length).toBeGreaterThan(5);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("runs 1,000 calls in under 1 ms each on average", () => {
    const history = { skillStreak: 0, previousFastGuess: false, lastBotAt: null, teachingStreak: 0, sessionStartedAt: new Date(0), lastMood: null };
    const input = { text: "i am sad because my dog is not here today", kind: "text" as const, tappedMood: null, answerMs: null, safetyDisclosure: false };
    const now = new Date(60_000);
    const start = performance.now();
    for (let i = 0; i < 1000; i++) detectMode(extractSignals(input, history, now), prev());
    expect(performance.now() - start).toBeLessThan(1000);
  });
});
