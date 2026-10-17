import { describe, expect, it } from "vitest";
import { PRAISE_LINES } from "@/engine/sel/praise";
import { praisesAnswer } from "@/llm/praiseGuard";

describe("praisesAnswer", () => {
  it.each(["Great job!", "Good job, Mia.", "Well done!", "Yay! You did it!", "That's right!", "Perfect!", "Super work!", "Great job tapping the card!", "I'm proud of you!", "You are so smart!"])(
    "catches %s",
    (line) => expect(praisesAnswer(line)).toBe(true),
  );

  it.each(["That was a brave try!", "Let's look again together.", "Thank you for trying!", "Tap the cat!"])(
    "lets %s through",
    (line) => expect(praisesAnswer(line)).toBe(false),
  );

  it("accepts every scripted line Pip uses after a miss", () => {
    expect(PRAISE_LINES.miss.filter(praisesAnswer)).toEqual([]);
  });

  it("does not match words that only contain a praise word", () => {
    expect(praisesAnswer("The superhero is here.")).toBe(false);
  });
});
