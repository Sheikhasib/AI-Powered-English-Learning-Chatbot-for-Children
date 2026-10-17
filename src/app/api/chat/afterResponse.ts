import { classifyMood } from "@/llm/classifyMood";
import { SUMMARY_EVERY_TURNS, summarize } from "@/llm/summarize";
import { getDb } from "@/server/db";
import { logger } from "@/server/logger";
import type { TurnContext } from "@/server/repositories/context";
import { persistTurn, setProfileSummary, setTurnMood } from "@/server/repositories/persist";
import type { Timer } from "@/server/timing";
import type { Decision } from "./decide";
import type { ReplyResult } from "./streamReply";

const MAX_REPLY_STORED = 400;

export type AfterArgs = {
  reply: Promise<ReplyResult>;
  timer: Timer;
  ctx: TurnContext;
  decision: Decision;
  /** The child's words after the input guard; empty for taps. */
  text: string;
  profileId: string;
  sessionId: string;
};

/** Everything that may wait until the child has their answer: the turn log, mood reading and summary. */
export async function afterResponse(args: AfterArgs): Promise<void> {
  const { ctx, decision, text } = args;
  const result = await args.reply;
  try {
    const db = getDb();
    const { t_guard = 0, t_context = 0, t_engine = 0, t_first_token = 0, t_total = 0 } = args.timer.durations();
    const beforeModel = t_guard + t_context + t_engine;

    const turnId = await persistTurn(
      db,
      {
        profileId: args.profileId,
        sessionId: args.sessionId,
        ...decision.record,
        botReply: result.text.slice(0, MAX_REPLY_STORED),
        mode: decision.turn.mode,
        mood: decision.turn.mood,
        fallback: result.fallback,
        timings: {
          tGuard: t_guard,
          tContext: t_context,
          tEngine: t_engine,
          tFirstToken: beforeModel + t_first_token,
          tTotal: beforeModel + t_first_token + t_total,
        },
      },
      decision.outcome,
    );

    if (!decision.scripted && text !== "") {
      const mood = await classifyMood(text);
      if (mood) await setTurnMood(db, turnId, mood);
    }
    if ((ctx.turnCount + 1) % SUMMARY_EVERY_TURNS === 0) {
      const newest = { child: decision.record.childInput, pip: result.text };
      const recent = [...ctx.turns].reverse().map((turn) => ({ child: turn.childInput, pip: turn.botReply }));
      const summary = await summarize(ctx.profile.summary, [...recent, newest]);
      if (summary) await setProfileSummary(db, args.profileId, summary);
    }
  } catch (error) {
    logger.error("Saving the turn failed", error instanceof Error ? error.message : "unknown");
  }
}
