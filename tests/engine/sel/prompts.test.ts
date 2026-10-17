import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/rng";
import { CHAT_PROMPTS, chatPrompt, feelingModelLine } from "@/engine/sel/prompts";
import { MOODS } from "@/types/domain";

const PERSONAL = /\b(name|address|live|school|phone|number|email|photo|where are you|meet)\b/i;

describe("chat prompts", () => {
  it("covers curiosity and kindness", () => {
    expect(CHAT_PROMPTS.curiosity).toContain("What makes you laugh?");
    expect(CHAT_PROMPTS.kindness).toContain("What could you say to a sad friend?");
  });

  it("never asks for personal information", () => {
    for (const line of [...CHAT_PROMPTS.curiosity, ...CHAT_PROMPTS.kindness]) {
      expect(line, line).not.toMatch(PERSONAL);
    }
  });

  it("is deterministic and stays inside the requested theme", () => {
    expect(chatPrompt("kindness", createRng(5))).toBe(chatPrompt("kindness", createRng(5)));
    for (let seed = 0; seed < 20; seed++) {
      expect(CHAT_PROMPTS.curiosity).toContain(chatPrompt("curiosity", createRng(seed)));
    }
  });
});

describe("feelingModelLine", () => {
  it("models the feeling word in a full sentence", () => {
    expect(feelingModelLine("HAPPY")).toBe("I feel happy when I see you!");
  });

  it("has a line for every mood that mentions the feeling word", () => {
    for (const mood of MOODS) {
      expect(feelingModelLine(mood).toLowerCase()).toContain(mood.toLowerCase());
    }
  });
});
