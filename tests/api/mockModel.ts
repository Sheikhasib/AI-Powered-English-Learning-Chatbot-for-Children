import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

type Options = { initialDelayMs?: number; chunkDelayMs?: number };

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 10, text: 10, reasoning: undefined },
};

/** A model that streams the given text word by word, optionally after a delay before the first token. */
export function textModel(text: string, { initialDelayMs = 0, chunkDelayMs = 0 }: Options = {}) {
  const deltas = text.split(/(?<=\s)/).map((delta) => ({ type: "text-delta" as const, id: "t", delta }));
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        initialDelayInMs: initialDelayMs,
        chunkDelayInMs: chunkDelayMs,
        chunks: [
          { type: "stream-start" as const, warnings: [] },
          { type: "text-start" as const, id: "t" },
          ...deltas,
          { type: "text-end" as const, id: "t" },
          { type: "finish" as const, finishReason: { unified: "stop" as const, raw: "stop" }, usage },
        ],
      }),
    }),
  });
}

/** A model whose call fails at once, like a bad API key. */
export function failingModel(message: string) {
  return new MockLanguageModelV4({
    doStream: async () => {
      throw new Error(message);
    },
  });
}

/** Reads a UI message stream response body into its JSON chunks. */
export function parseChunks(body: string): Array<Record<string, unknown>> {
  return body
    .split("\n\n")
    .filter((block) => block.startsWith("data: ") && !block.includes("[DONE]"))
    .map((block) => JSON.parse(block.slice("data: ".length)) as Record<string, unknown>);
}
