import type { UIMessage } from "ai";
import { z } from "zod";
import { activitySchema } from "@/engine/curriculum/types";
import { MODES, MOODS } from "./domain";

export const moodSchema = z.enum(MOODS);
export const modeSchema = z.enum(MODES);

/** Child text limit; also the request-body cap's basis (see security rules). */
export const MAX_CHILD_TEXT = 300;

export const chatInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string().max(MAX_CHILD_TEXT) }),
  z.object({ kind: z.literal("voice"), text: z.string().max(MAX_CHILD_TEXT) }),
  z.object({
    kind: z.literal("card"),
    activityId: z.string().min(1).max(120),
    choiceId: z.string().min(1).max(120),
    responseMs: z.number().int().nonnegative(),
  }),
  z.object({ kind: z.literal("mood"), mood: moodSchema }),
  z.object({ kind: z.literal("break") }),
]);
export type ChatInput = z.infer<typeof chatInputSchema>;

export const chatRequestSchema = z.object({
  profileId: z.string().cuid(),
  sessionId: z.string().cuid(),
  input: chatInputSchema,
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** The `data-turn` part: the first thing the stream sends, before any LLM token. */
export const turnDataSchema = z.object({
  mode: modeSchema,
  mood: moodSchema,
  reason: z.string(),
  /** Null when Pip has nothing to ask. */
  activity: activitySchema.nullable(),
  /** The scripted line; used until (or instead of) the LLM's own words. */
  fallbackLine: z.string(),
  /** True when the last card was right or a level was unlocked. */
  celebrate: z.boolean(),
  /** Set on the turn that unlocks a new level, so the UI never has to parse `reason`. */
  levelUp: z.object({ from: z.number().int(), to: z.number().int() }).nullable(),
  /** Brave-try stars earned by this turn, not the running total. */
  stars: z.number().int().nonnegative(),
});
export type TurnData = z.infer<typeof turnDataSchema>;

/** The `data-timing` part: sent last, so the client and /latency-check see the full server timings. */
export const timingDataSchema = z.object({
  t_guard: z.number(),
  t_context: z.number(),
  t_engine: z.number(),
  t_first_token: z.number(),
  t_total: z.number(),
  fallback: z.boolean(),
});
export type TimingData = z.infer<typeof timingDataSchema>;

/** Shape of the chat stream's message, for `useChat` and the server writer. */
export type PipUIMessage = UIMessage<never, { turn: TurnData; timing: TimingData }>;

export const sessionRequestSchema = z.object({
  profileId: z.string().cuid(),
  checkIn: moodSchema.nullable().default(null),
});
export type SessionRequest = z.infer<typeof sessionRequestSchema>;
