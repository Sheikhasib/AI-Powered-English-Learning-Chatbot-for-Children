import type { Activity } from "@/engine/curriculum/types";
import { pickOne } from "@/engine/rng";
import { chatPrompt, type ChatTheme } from "@/engine/sel/prompts";
import { checkInReply } from "@/engine/sel/checkIn";
import { praiseFor, type PraiseEvent } from "@/engine/sel/praise";
import { pickCalmActivity, supportOpening } from "@/engine/sel/support";
import type { Mode, Mood, Rng } from "@/types/domain";

/** What just happened; "start" is the mood check-in, "none" is an ordinary turn with no result to praise. */
export type FallbackEvent = PraiseEvent | "start" | "none";

export type FallbackInput = {
  mode: Mode;
  mood: Mood;
  event: FallbackEvent;
  /** The cards Pip is about to show, or null. */
  activity: Activity | null;
  /** True after repeated misses: the hint replaces the praise so the line stays short. */
  showHint: boolean;
};

const CHAT_LEAD = "I love talking with you!";
const PLAY_LEAD = "Let's play a game!";
const LEARN_LEAD = "Let's learn together!";
const HINT_LEAD = "That's okay.";
const THEMES: readonly ChatTheme[] = ["curiosity", "kindness"];

function learnLead(input: FallbackInput, rng: Rng): string {
  if (input.event === "start") return checkInReply(input.mood).line;
  if (input.event === "none") return LEARN_LEAD;
  return praiseFor(input.event, rng);
}

function learnLine(input: FallbackInput, rng: Rng): string {
  const { activity, showHint } = input;
  if (!activity) return learnLead(input, rng);
  if (showHint) return `${HINT_LEAD} ${activity.hint} ${activity.prompt}`;
  return `${learnLead(input, rng)} ${activity.prompt}`;
}

function calmLine(activity: Activity | null, rng: Rng): string {
  const { lines } = pickCalmActivity(rng);
  const spoken = lines.slice(0, activity ? 1 : 2).join(" ");
  return activity ? `${spoken} ${activity.prompt}` : spoken;
}

/**
 * The engine's own spoken line for a turn: sent before any LLM token and used whenever the model is slow,
 * fails or breaks a safety rule. Every line is at most 3 sentences so it also passes the output guard.
 */
export function buildFallback(input: FallbackInput, rng: Rng): string {
  const { mode, mood, activity } = input;
  switch (mode) {
    case "SUPPORT":
      return `${supportOpening(mood)[0].line} ${activity?.prompt ?? supportOpening(mood)[1].line}`;
    case "CALM":
      return calmLine(activity, rng);
    case "CHAT":
      return `${CHAT_LEAD} ${activity?.prompt ?? chatPrompt(pickOne(THEMES, rng), rng)}`;
    case "PLAY":
      return `${PLAY_LEAD} ${activity?.prompt ?? chatPrompt("curiosity", rng)}`;
    case "LEARN":
      return learnLine(input, rng);
  }
}
