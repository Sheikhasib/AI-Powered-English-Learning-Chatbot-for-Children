import { describe, expect, it } from "vitest";
import { newSentences } from "@/hooks/speechSupport";

describe("newSentences", () => {
  it("returns every sentence of a fresh line with its place in the line", () => {
    const { chunks } = newSentences("Great job! Find the dog.", 0);
    expect(chunks).toEqual([
      { text: "Great job!", offset: 0 },
      { text: "Find the dog.", offset: 11 },
    ]);
  });

  it("returns only the sentences added since the last call", () => {
    const first = newSentences("Great job!", 0);
    const next = newSentences("Great job! Find the dog.", first.consumed);
    expect(next.chunks).toEqual([{ text: "Find the dog.", offset: 11 }]);
    expect(next.consumed).toBe("Great job! Find the dog.".length);
  });

  it("returns nothing when the line has not grown", () => {
    const first = newSentences("Hello!", 0);
    expect(newSentences("Hello!", first.consumed).chunks).toEqual([]);
  });

  it("returns nothing for an empty line", () => {
    expect(newSentences("", 0)).toEqual({ chunks: [], consumed: 0 });
  });
});
