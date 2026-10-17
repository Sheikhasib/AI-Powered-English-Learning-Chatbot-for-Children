import { describe, expect, it } from "vitest";
import { MOODS } from "@/types/domain";
import { createRng } from "@/engine/rng";
import {
  CALM_ACTIVITIES,
  SUPPORT_OFFER_LINE,
  pickCalmActivity,
  readyCheck,
  supportOpening,
} from "@/engine/sel/support";

describe("supportOpening", () => {
  it("always validates the feeling before offering a choice", () => {
    for (const mood of [...MOODS, null]) {
      const steps = supportOpening(mood);
      const offerAt = steps.findIndex((s) => s.kind === "offer");
      expect(steps[0].kind, String(mood)).toBe("validate");
      expect(offerAt, String(mood)).toBeGreaterThan(0);
    }
  });

  it("names sad, scared, angry and tired feelings back", () => {
    for (const [mood, word] of [["SAD", "sad"], ["SCARED", "scared"], ["ANGRY", "angry"], ["TIRED", "tired"]] as const) {
      expect(supportOpening(mood)[0].line.toLowerCase()).toContain(word);
    }
  });

  it("uses a gentle general line when there is no named feeling", () => {
    expect(supportOpening(null)[0].line).toBe("I hear you. Thank you for telling me.");
    expect(supportOpening("HAPPY")[0].line).toBe("I hear you. Thank you for telling me.");
  });

  it("offers one coping choice as two picture cards: breathe or a slow game", () => {
    const offer = supportOpening("SAD").find((s) => s.kind === "offer");
    expect(offer?.line).toBe(SUPPORT_OFFER_LINE);
    expect(offer?.choices?.map((c) => c.id)).toEqual(["breathe", "slow-game"]);
    for (const card of offer?.choices ?? []) expect(card.picture.length).toBeGreaterThan(0);
  });

  it("does not teach anything inside the opening", () => {
    expect(supportOpening("SAD").every((s) => s.kind !== "ready-check")).toBe(true);
  });
});

describe("readyCheck", () => {
  it("asks if the child is ready, with two big cards", () => {
    const step = readyCheck();
    expect(step.kind).toBe("ready-check");
    expect(step.line).toBe("Are you ready to play?");
    expect(step.choices?.map((c) => c.id)).toEqual(["ready", "not-yet"]);
  });
});

describe("calm activities", () => {
  it("has the five scripted activities", () => {
    expect(CALM_ACTIVITIES.map((a) => a.id)).toEqual([
      "name-feeling",
      "belly-breathing",
      "count-five",
      "hug-squeeze",
      "take-a-break",
    ]);
  });

  it("makes belly breathing 3 rounds of breathe in 4, breathe out 4", () => {
    const breathing = CALM_ACTIVITIES.find((a) => a.id === "belly-breathing");
    expect(breathing?.breaths).toEqual({ inSeconds: 4, outSeconds: 4, cycles: 3 });
  });

  it("keeps every spoken line short and kind", () => {
    for (const activity of CALM_ACTIVITIES) {
      expect(activity.lines.length, activity.id).toBeGreaterThan(0);
      for (const line of activity.lines) {
        for (const sentence of line.split(/[.!?]+/).filter((s) => s.trim())) {
          expect(sentence.trim().split(/\s+/).length, sentence).toBeLessThan(10);
        }
      }
    }
  });

  it("tells the child it is okay to take a break", () => {
    const rest = CALM_ACTIVITIES.find((a) => a.id === "take-a-break");
    expect(rest?.lines.join(" ")).toContain("It's okay to take a break");
  });

  it("picks an activity deterministically and can skip the one just used", () => {
    expect(pickCalmActivity(createRng(2)).id).toBe(pickCalmActivity(createRng(2)).id);
    for (let seed = 0; seed < 30; seed++) {
      expect(pickCalmActivity(createRng(seed), "count-five").id).not.toBe("count-five");
    }
  });
});
