import type { FallbackEvent } from "@/llm/fallback";
import type { ChatInput } from "@/types/chat";

const SITUATION: Record<FallbackEvent, string> = {
  correct: "The child tapped the right card. Praise their effort in one short sentence.",
  persisted: "The child kept trying and got it. Praise how they kept going.",
  miss: "The child's card was not right yet. Be kind and cheer for another try. Do not say wrong.",
  attempt: "The child gave it a brave try. Thank them for trying.",
  "level-up": "The child unlocked a new level. Celebrate their hard work.",
  start: "The child just showed you how they feel. Name that feeling kindly.",
  none: "Answer what the child said, kindly and briefly.",
};

/** The engine's description of what happened, written by us so no child text reaches the system prompt. */
export function situationFor(event: FallbackEvent, input: ChatInput): string {
  if (input.kind === "break") return "The child wants a rest. Agree kindly.";
  return SITUATION[event];
}
