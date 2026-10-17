import { describe, expect, it } from "vitest";
import { situationFor } from "@/app/api/chat/situation";

const card = { kind: "card", activityId: "a", choiceId: "b", responseMs: 1000 } as const;

describe("situationFor", () => {
  it("asks for comfort, not teaching, in Support", () => {
    const text = situationFor("none", { kind: "text", text: "I feel sad" }, "SUPPORT", "SAD");
    expect(text).toContain("feels sad");
    expect(text).toMatch(/do not teach/i);
    expect(text).not.toMatch(/praise/i);
  });

  it("names the feeling after the check-in so it cannot be confused with the nickname", () => {
    expect(situationFor("start", { kind: "mood", mood: "HAPPY" }, "LEARN", "HAPPY")).toContain("feels happy");
  });

  it("praises effort after a right card and encourages after a miss without saying wrong", () => {
    expect(situationFor("correct", card, "LEARN", "HAPPY")).toMatch(/praise/i);
    const miss = situationFor("miss", card, "LEARN", "OKAY");
    expect(miss).toMatch(/brave try/i);
    expect(miss).toMatch(/do not praise the answer/i);
    expect(miss).toMatch(/do not say wrong/i);
  });

  it("agrees kindly to a break request", () => {
    expect(situationFor("none", { kind: "break" }, "CALM", "TIRED")).toContain("rest");
  });

  it("contains no child text, so the system prompt stays fixed", () => {
    expect(situationFor("none", { kind: "text", text: "banana" }, "CHAT", "OKAY")).not.toContain("banana");
  });
});
