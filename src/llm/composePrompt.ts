import type { AgeBand, Mode, Mood } from "@/types/domain";
import { MODE_POLICY, NO_PRAISE_RULE, PERSONA, WRONG_ANSWER_RULE } from "./systemPrompt";

/** The context block must stay under this many tokens (latency rule). */
export const CONTEXT_TOKEN_BUDGET = 400;

/** Last turns replayed to the model. */
export const HISTORY_TURNS = 6;

const WEAK_SKILLS_SHOWN = 3;
const SUMMARY_MAX_CHARS = 400;
const SKILL_MAX_CHARS = 40;
const HISTORY_LINE_MAX_CHARS = 120;
const CHARS_PER_TOKEN = 4;

export type PromptContext = {
  nickname: string;
  ageBand: AgeBand;
  interests: string[];
  level: number;
  /** Titles of the weakest skills, weakest first. */
  weakSkills: string[];
  /** Rolling summary written by `summarize`; derived from child text, so it is never put in the system prompt. */
  summary: string;
  /** Oldest first. */
  history: { child: string; pip: string }[];
  /** The child's words this turn after the input guard; empty for taps. */
  childText: string;
};

/** What the engine decided; every string here is written by us, not by the child. */
export type PromptDecision = {
  mode: Mode;
  mood: Mood;
  /** What just happened, in the engine's words. */
  situation: string;
  /** The exact line Pip must end with, or null when the reply may be free. */
  closingLine: string | null;
  /** True after a card that was not right: the reply may not praise the answer. */
  wrongAnswer: boolean;
  /** True only after a correct card answer outside Support and Calm; everywhere else praise words are banned. */
  praiseAllowed: boolean;
};

export type PromptMessage = { role: "user" | "assistant"; content: string };

/** Rough token count: about 4 characters per token, enough to enforce the budget. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const ageText = (ageBand: AgeBand) => (ageBand === "AGE_3_4" ? "3 to 4" : "5 to 6");
/** Quotes and line breaks inside child text would break out of the quoting or fake a context line. */
const quotable = (text: string) =>
  text
    .replace(/[\p{Cc}\u2028\u2029]+/gu, " ")
    .replace(/["“”]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/** Facts about the child, kept short; the summary and skill titles are trimmed to hold the 400-token budget. */
export function buildContextBlock(ctx: PromptContext): string {
  const lines = [
    `Child: ${ctx.nickname}, age ${ageText(ctx.ageBand)}, Level ${ctx.level}.`,
    ctx.interests.length > 0 ? `Likes: ${ctx.interests.join(", ")}.` : "",
    ctx.weakSkills.length > 0
      ? `Needs practice: ${ctx.weakSkills.slice(0, WEAK_SKILLS_SHOWN).map((s) => clip(s, SKILL_MAX_CHARS)).join("; ")}.`
      : "",
    ctx.summary ? `Earlier: ${clip(quotable(ctx.summary), SUMMARY_MAX_CHARS)}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

function systemFor(decision: PromptDecision): string {
  const parts = [
    PERSONA,
    MODE_POLICY[decision.mode],
    `The child seems ${decision.mood.toLowerCase()}.`,
    decision.situation,
    decision.wrongAnswer ? WRONG_ANSWER_RULE : "",
    decision.praiseAllowed || decision.wrongAnswer ? "" : NO_PRAISE_RULE,
    decision.closingLine ? `End with exactly this line: "${decision.closingLine}"` : "",
  ];
  return parts.filter(Boolean).join("\n");
}

function historyMessages(history: PromptContext["history"]): PromptMessage[] {
  return history.slice(-HISTORY_TURNS).flatMap((turn): PromptMessage[] => [
    { role: "user", content: clip(quotable(turn.child), HISTORY_LINE_MAX_CHARS) },
    { role: "assistant", content: clip(quotable(turn.pip), HISTORY_LINE_MAX_CHARS) },
  ]);
}

/** Builds the fixed system prompt plus messages; child text appears only inside quoted user messages. */
export function composePrompt(
  ctx: PromptContext,
  decision: PromptDecision,
): { system: string; messages: PromptMessage[] } {
  const said = ctx.childText ? `The child said: "${quotable(ctx.childText)}"` : "The child tapped a card.";
  // Replaying earlier quiz turns in Support and Calm makes the model repeat their praise and question.
  const comforting = decision.mode === "SUPPORT" || decision.mode === "CALM";
  return {
    system: systemFor(decision),
    messages: [
      ...historyMessages(comforting ? [] : ctx.history),
      { role: "user", content: `${buildContextBlock(ctx)}\n\n${said}` },
    ],
  };
}
