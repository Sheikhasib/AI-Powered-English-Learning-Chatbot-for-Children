import type { FallbackEvent } from "@/llm/fallback";
import type { ChatInput } from "@/types/chat";
import type { Mode, Mood } from "@/types/domain";

const SITUATION: Record<FallbackEvent, string> = {
  correct: "The child tapped the right card. Praise their effort in one short sentence.",
  persisted: "The child kept trying and got it. Praise how they kept going.",
  miss: "The child's card was not right yet. Be kind and cheer for another try. Do not say wrong.",
  attempt: "The child gave it a brave try. Thank them for trying.",
  "level-up": "The child unlocked a new level. Celebrate their hard work.",
  start: "The child just showed you how they feel.",
  none: "Answer what the child said, kindly and briefly.",
};

/** Support and Calm are about the feeling, so the praise and retry wording above never applies there. */
function gentleSituation(mood: Mood): string {
  return `The child feels ${mood.toLowerCase()}. Say so kindly in one sentence and stay with them. Do not teach, quiz or say try again.`;
}

/** The engine's description of what happened, written by us so no child text reaches the system prompt. */
export function situationFor(event: FallbackEvent, input: ChatInput, mode: Mode, mood: Mood): string {
  if (input.kind === "break") return "The child wants a rest. Agree kindly.";
  if (mode === "SUPPORT" || mode === "CALM") return gentleSituation(mood);
  if (event === "start") return `The child feels ${mood.toLowerCase()}. Name that feeling kindly in one sentence.`;
  return SITUATION[event];
}
