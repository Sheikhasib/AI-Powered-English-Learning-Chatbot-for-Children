import { timingSafeEqual } from "node:crypto";
import { streamText } from "ai";
import { connection } from "next/server";
import { env } from "@/lib/env";
import { getChatModel } from "@/llm/provider";
import { logger } from "@/server/logger";
import { createTimer } from "@/server/timing";

const HEALTH_PROMPT = "Say hello to a child";
const HEALTH_SYSTEM = "You are a friendly owl. Reply with about 10 words.";
const HEALTH_MAX_OUTPUT_TOKENS = 40;

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

/** Compares in constant time; unequal lengths fail without leaking where they differ. */
function keyMatches(given: string | null, secret: string): boolean {
  if (given === null) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

/** Dev: open. Production: hidden (404) unless ?key= equals PARENT_GATE_SECRET. */
function isAllowed(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return keyMatches(new URL(request.url).searchParams.get("key"), env.PARENT_GATE_SECRET);
}

/** Measures the model's time to first token and total time for a tiny reply. */
export async function GET(request: Request) {
  // Opt out of prerendering before the try block so its catch cannot swallow Next's bail-out signal.
  await connection();
  try {
    if (!isAllowed(request)) return errorResponse(404, "not_found", "Not found.");

    const timer = createTimer();
    let streamError: unknown;
    const result = streamText({
      model: getChatModel(),
      system: HEALTH_SYSTEM,
      prompt: HEALTH_PROMPT,
      maxOutputTokens: HEALTH_MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      // Reasoning models otherwise spend the whole token cap thinking and return no text.
      providerOptions: { groq: { reasoningEffort: "low" } },
      onError: ({ error }) => {
        streamError = error;
      },
    });

    let sawFirstToken = false;
    for await (const chunk of result.textStream) {
      if (chunk.length > 0 && !sawFirstToken) {
        timer.mark("t_first_token");
        sawFirstToken = true;
      }
    }
    timer.mark("t_total");
    if (streamError !== undefined || !sawFirstToken) throw streamError ?? new Error("empty reply");

    const { t_first_token: firstTokenMs = 0, t_total: afterFirst = 0 } = timer.durations();
    return Response.json({
      model: env.LLM_MODEL,
      firstTokenMs,
      totalMs: firstTokenMs + afterFirst,
    });
  } catch (error) {
    logger.error("LLM health check failed", describeError(error));
    return errorResponse(502, "llm_unavailable", "The language model did not answer.");
  }
}
