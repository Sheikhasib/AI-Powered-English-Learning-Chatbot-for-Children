import { describe, expect, it } from "vitest";
import { parseMoodReply } from "@/llm/classifyMood";
import { SUMMARY_MAX_CHARS, cleanSummary } from "@/llm/summarize";

describe("parseMoodReply", () => {
  it("reads a clean JSON reply", () => {
    expect(parseMoodReply('{"mood":"SAD","confidence":0.9}')).toEqual({ mood: "SAD", confidence: 0.9 });
  });

  it("finds the JSON inside extra words", () => {
    expect(parseMoodReply('Sure! {"mood":"HAPPY","confidence":0.7} done')?.mood).toBe("HAPPY");
  });

  it("rejects unknown moods, bad confidence and non-JSON", () => {
    expect(parseMoodReply('{"mood":"GRUMPY","confidence":0.9}')).toBeNull();
    expect(parseMoodReply('{"mood":"SAD","confidence":3}')).toBeNull();
    expect(parseMoodReply("I think sad")).toBeNull();
    expect(parseMoodReply("{broken")).toBeNull();
  });
});

describe("cleanSummary", () => {
  it("collapses whitespace and caps the length", () => {
    expect(cleanSummary("  likes   dogs \n and cars ")).toBe("likes dogs and cars");
    expect(cleanSummary("a ".repeat(500))?.length).toBeLessThanOrEqual(SUMMARY_MAX_CHARS);
  });

  it("drops an empty note and a note that touches unsafe topics", () => {
    expect(cleanSummary("   ")).toBeNull();
    expect(cleanSummary("talked about a knife")).toBeNull();
  });

  it("redacts personal details the model let through", () => {
    expect(cleanSummary("lives at 42 Oak Street and likes dogs")).not.toContain("42 Oak Street");
  });
});
