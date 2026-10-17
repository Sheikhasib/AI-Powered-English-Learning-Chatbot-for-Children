import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { cookies } from "next/headers";
import { after } from "next/server";
import { getSkill } from "@/engine/curriculum";
import { createRng } from "@/engine/rng";
import { env } from "@/lib/env";
import { composePrompt, type PromptContext } from "@/llm/composePrompt";
import { inputGuard, type InputGuardResult } from "@/safety/inputGuard";
import { getDb } from "@/server/db";
import { DEVICE_COOKIE } from "@/server/device";
import { logger } from "@/server/logger";
import { allowChatTurn } from "@/server/ratelimit";
import { loadTurnContext, type TurnContext } from "@/server/repositories/context";
import { createTimer } from "@/server/timing";
import { chatRequestSchema, type PipUIMessage } from "@/types/chat";
import { decideTurn, type Decision } from "./decide";
import { afterResponse } from "./afterResponse";
import { streamReply, writeScripted, type ReplyResult } from "./streamReply";

const MAX_BODY_BYTES = 2048;
const WEAK_SKILLS_SHOWN = 3;
const RATE_LIMIT_RETRY_SECONDS = 60;

function failure(status: number, code: string, message: string, headers?: HeadersInit) {
  return Response.json({ error: { code, message } }, { status, headers });
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/** A Redis outage must not silence Pip, so the limiter fails open and logs the error. */
async function isUnderLimit(deviceId: string, ip: string): Promise<boolean> {
  try {
    return await allowChatTurn(deviceId, ip);
  } catch (error) {
    logger.error("Rate limiter unavailable", error instanceof Error ? error.message : "unknown");
    return true;
  }
}

function weakSkillTitles(ctx: TurnContext): string[] {
  return ctx.skills
    .filter((state) => state.attempts > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, WEAK_SKILLS_SHOWN)
    .flatMap((state) => getSkill(state.skillId)?.title ?? []);
}

function promptContext(ctx: TurnContext, childText: string): PromptContext {
  return {
    nickname: ctx.profile.nickname,
    ageBand: ctx.profile.ageBand,
    interests: ctx.profile.interests,
    level: ctx.profile.level,
    weakSkills: weakSkillTitles(ctx),
    summary: ctx.profile.summary,
    history: [...ctx.turns].reverse().map((turn) => ({ child: turn.childInput, pip: turn.botReply })),
    childText,
  };
}

function guardedText(kindIsText: boolean, text: string): { guard: InputGuardResult; text: string } {
  if (!kindIsText || text === "") return { guard: { action: "ok" }, text };
  const guard = inputGuard(text);
  return { guard, text: guard.action === "redact" ? guard.text : text };
}

/** One child turn: guard, one read, the engine, then a stream whose first part is the engine's decision. */
export async function POST(request: Request) {
  const timer = createTimer();
  const deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!deviceId) return failure(401, "no_device", "Pip does not know this device yet.");

  if (!(await isUnderLimit(deviceId, clientIp(request)))) {
    return failure(429, "rate_limited", "Pip needs a little rest.", { "Retry-After": String(RATE_LIMIT_RETRY_SECONDS) });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return failure(413, "too_large", "That message is too big.");
  const body = chatRequestSchema.safeParse(parseJson(raw));
  if (!body.success) return failure(400, "invalid_request", "Pip could not read that.");
  const { profileId, sessionId, input } = body.data;

  const said = input.kind === "text" || input.kind === "voice" ? input.text : "";
  const { guard, text } = guardedText(said !== "", said);
  timer.mark("t_guard");

  try {
    const ctx = await loadTurnContext(getDb(), { deviceId, profileId, sessionId });
    timer.mark("t_context");
    if (!ctx) return failure(404, "not_found", "No such profile or session on this device.");

    const now = new Date();
    const decision = decideTurn({ ctx, input, text, guard, now, rng: createRng((now.getTime() + ctx.turnCount) >>> 0) });
    timer.mark("t_engine");
    return respond({ timer, ctx, decision, text, profileId, sessionId });
  } catch (error) {
    logger.error("Chat turn failed", error instanceof Error ? error.message : "unknown");
    return failure(500, "server_error", "Pip needs a little rest.");
  }
}

type RespondArgs = {
  timer: ReturnType<typeof createTimer>;
  ctx: TurnContext;
  decision: Decision;
  text: string;
  profileId: string;
  sessionId: string;
};

function respond({ timer, ctx, decision, text, profileId, sessionId }: RespondArgs): Response {
  // The stream's first byte leaves before the model answers, so the header carries the marks known by then.
  const serverTiming = timer.toServerTimingHeader();
  const prompt = composePrompt(promptContext(ctx, text), decision.prompt);
  let settle: (result: ReplyResult) => void = () => undefined;
  const reply = new Promise<ReplyResult>((resolve) => {
    settle = resolve;
  });

  const stream = createUIMessageStream<PipUIMessage>({
    execute: async ({ writer }) => {
      let result: ReplyResult = { text: decision.turn.fallbackLine, fallback: true };
      try {
        writer.write({ type: "data-turn", data: decision.turn });
        result = decision.scripted
          ? writeScripted(writer, decision.turn.fallbackLine)
          : await streamReply({
              writer,
              system: prompt.system,
              messages: prompt.messages,
              fallbackLine: decision.turn.fallbackLine,
              closingLine: decision.turn.activity?.prompt ?? null,
              forbidPraise: decision.prompt.wrongAnswer,
              firstTokenTimeoutMs: env.LLM_FIRST_TOKEN_TIMEOUT_MS,
              onFirstToken: () => timer.mark("t_first_token"),
            });
        timer.mark("t_total");
        const { t_guard = 0, t_context = 0, t_engine = 0, t_first_token = 0, t_total = 0 } = timer.durations();
        const toFirstToken = t_guard + t_context + t_engine + t_first_token;
        writer.write({
          type: "data-timing",
          transient: true,
          data: { t_guard, t_context, t_engine, t_first_token: toFirstToken, t_total: toFirstToken + t_total, fallback: result.fallback },
        });
      } finally {
        settle(result);
      }
    },
    onError: (error) => {
      logger.error("Chat stream failed", error instanceof Error ? error.message : "unknown");
      return "stream_error";
    },
  });

  after(() => afterResponse({ reply, timer, ctx, decision, text, profileId, sessionId }));
  return createUIMessageStreamResponse({
    stream,
    headers: { "Server-Timing": serverTiming, "Cache-Control": "no-store" },
  });
}
