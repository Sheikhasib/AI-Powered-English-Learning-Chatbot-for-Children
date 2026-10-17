import { detectMode } from "@/engine/detectMode";
import type { Activity } from "@/engine/curriculum/types";
import { levelIdSchema } from "@/engine/curriculum/types";
import { evaluateLevel } from "@/engine/progression";
import { pickNextActivity, type Pick } from "@/engine/picker";
import { extractSignals } from "@/engine/signals";
import { starsFor } from "@/engine/sel/stars";
import { buildFallback, type FallbackEvent } from "@/llm/fallback";
import type { PromptDecision } from "@/llm/composePrompt";
import type { InputGuardResult } from "@/safety/inputGuard";
import type { TurnContext } from "@/server/repositories/context";
import type { TurnOutcome } from "@/server/repositories/persist";
import type { ChatInput, TurnData } from "@/types/chat";
import type { Mode, Rng } from "@/types/domain";
import type { LearnerProfile } from "@/types/engine";
import type { ModeDecision, TurnInput } from "@/types/mode";
import { gradeCard, type GradedCard } from "./grading";
import { consecutiveMisses, deriveHistory, type DerivedHistory } from "./history";
import { situationFor } from "./situation";
import { SUPPORT_OFFER_ID, breathingCard, copingOffer, isReadyQuestion, readyCheckCard } from "./socialCards";

export type DecideArgs = {
  ctx: TurnContext;
  input: ChatInput;
  /** The child's words as typed or spoken; empty for taps. Redaction happens here, so raw text never reaches the log. */
  text: string;
  guard: InputGuardResult;
  now: Date;
  rng: Rng;
};

export type Decision = {
  turn: TurnData;
  prompt: PromptDecision;
  /** True when a fixed safety script replaces the model for this turn. */
  scripted: boolean;
  record: {
    childInput: string;
    inputKind: string;
    activityId: string | null;
    correct: boolean | null;
    responseMs: number | null;
    safetyFlag: string | null;
    modeReason: string;
  };
  outcome: TurnOutcome;
};

const NOT_SAVED = "[not saved]";

type Plan = { activity: Activity | null; showHint: boolean; reason: string | null };

/** The check-in faces and support cards are answered with a tap, not words, so the tap becomes the matching phrase. */
function cardPhrase(input: ChatInput): string {
  return readyAnswer(input) === "ready" ? "ready" : "";
}

/** The child's answer to a "ready?" question, or null when this turn was not one. */
function readyAnswer(input: ChatInput): "ready" | "not-yet" | null {
  if (input.kind !== "card" || !isReadyQuestion(input.activityId)) return null;
  return input.choiceId === "ready" || input.choiceId === "not-yet" ? input.choiceId : null;
}

/** A tap on a coping or ready card steers the mode directly; everything else is left to `detectMode`. */
function socialOverride(input: ChatInput, previous: DerivedHistory["previous"], base: ModeDecision): ModeDecision | null {
  if (input.kind !== "card") return null;
  const { choiceId, activityId } = input;
  if (activityId === SUPPORT_OFFER_ID && choiceId === "breathe") {
    return { ...base, mode: "CALM", reason: "child chose to breathe" };
  }
  if (activityId === SUPPORT_OFFER_ID && choiceId === "slow-game") {
    return { ...base, mode: "PLAY", reason: "child chose a slow game" };
  }
  if (readyAnswer(input) === "not-yet") {
    return { ...base, mode: previous.mode === "CALM" ? "CALM" : "SUPPORT", reason: "child is not ready yet" };
  }
  return null;
}

function planActivity(
  mode: Mode,
  args: DecideArgs,
  graded: GradedCard | null,
  history: DerivedHistory,
  learner: LearnerProfile,
  skills: GradedCard["skills"],
): Plan {
  // "Not yet" gets something to do instead of the same question again.
  const notYet = readyAnswer(args.input) === "not-yet";
  if (mode === "SUPPORT") {
    const again = history.previous.mode === "SUPPORT" && history.previous.turnsInMode > 0 && !notYet;
    return { activity: again ? readyCheckCard() : copingOffer(), showHint: false, reason: null };
  }
  if (mode === "CALM") return { activity: breathingCard(), showHint: false, reason: null };
  if (mode === "CHAT") return { activity: null, showHint: false, reason: null };

  const pending = graded && !graded.correct ? { activity: graded.activity, misses: graded.priorMisses + 1 } : undefined;
  const pick: Pick = pickNextActivity(
    { profile: learner, skills, recentKinds: history.recentKinds, recentItemIds: history.recentItemIds, pending },
    args.rng,
    args.now,
  );
  return { activity: pick.activity, showHint: pick.showHint, reason: pick.reason };
}

function eventFor(input: ChatInput, graded: GradedCard | null, levelUp: boolean): FallbackEvent {
  if (levelUp) return "level-up";
  if (input.kind === "mood") return "start";
  if (graded) return graded.correct ? (graded.priorMisses > 0 ? "persisted" : "correct") : "miss";
  return "none";
}

/** Praise words are earned by a correct card; a mood tap, chat, a miss or any comforting mode never gets them. */
function mayPraise(event: FallbackEvent, mode: Mode): boolean {
  const earned = event === "correct" || event === "persisted" || event === "level-up";
  return earned && mode !== "SUPPORT" && mode !== "CALM";
}

function starsEarned(input: ChatInput, graded: GradedCard | null): number {
  if (graded) return starsFor({ correct: graded.correct, afterMiss: graded.priorMisses > 0 });
  const spoke = input.kind === "text" || input.kind === "voice";
  return spoke ? starsFor({ correct: false, afterMiss: false }) : 0;
}

function turnInputFor(args: DecideArgs, text: string, disclosure: boolean): TurnInput {
  const { input } = args;
  return {
    text: text || cardPhrase(input),
    kind: input.kind,
    tappedMood: input.kind === "mood" ? input.mood : null,
    answerMs: input.kind === "card" ? input.responseMs : null,
    safetyDisclosure: disclosure,
  };
}

/** The whole engine step of a turn: grade, update mastery, detect the mode, pick cards, write the scripted line. */
export function decideTurn(args: DecideArgs): Decision {
  const { ctx, input, guard, now, rng } = args;
  const redirect = guard.action === "redirect" ? guard : null;
  const history = deriveHistory(ctx);
  const text = guard.action === "redact" ? guard.text : args.text;

  const card = input.kind === "card" && !redirect ? input : null;
  const priorMisses = card ? consecutiveMisses(ctx.turns, card.activityId) : 0;
  const graded = card ? gradeCard(card, ctx.skills, priorMisses, now) : null;
  const skills = graded?.skills ?? ctx.skills;

  const level = levelIdSchema.catch(1).parse(ctx.profile.level);
  const learnerBefore: LearnerProfile = { level, ageBand: ctx.profile.ageBand, interests: ctx.profile.interests };
  const levelDecision = evaluateLevel(learnerBefore, skills);
  const learner = { ...learnerBefore, level: levelDecision.level };

  const signals = extractSignals(
    turnInputFor(args, text, redirect?.reason === "disclosure"),
    {
      skillStreak: graded?.skill.streak ?? 0,
      previousFastGuess: history.previousFastGuess,
      lastBotAt: history.lastBotAt,
      teachingStreak: history.teachingStreak,
      sessionStartedAt: ctx.session.startedAt,
      lastMood: history.lastMood,
    },
    now,
  );
  const detected = detectMode(signals, history.previous);
  const unsafeTopic = redirect?.reason === "unsafe_topic";
  const decision = unsafeTopic
    ? { ...detected, mode: "PLAY" as const, reason: "child brought up an unsafe topic, so Pip redirected" }
    : (socialOverride(input, history.previous, detected) ?? detected);

  const plan = redirect?.reason === "disclosure"
    ? { activity: null, showHint: false, reason: null }
    : planActivity(decision.mode, args, graded, history, learner, skills);
  const event = eventFor(input, graded, levelDecision.celebrate);
  const line =
    redirect?.script ??
    buildFallback({ mode: decision.mode, mood: decision.mood, event, activity: plan.activity, showHint: plan.showHint }, rng);

  const modeReason = [decision.reason, plan.reason].filter(Boolean).join("; ");
  const stars = redirect ? 0 : starsEarned(input, graded);
  const closing = plan.activity ? (plan.showHint ? `${plan.activity.hint} ${plan.activity.prompt}` : plan.activity.prompt) : null;

  return {
    turn: {
      mode: decision.mode,
      mood: decision.mood,
      reason: modeReason,
      activity: plan.activity,
      fallbackLine: line,
      celebrate: Boolean(graded?.correct) || levelDecision.celebrate,
      levelUp: levelDecision.level === level ? null : { from: level, to: levelDecision.level },
      stars,
    },
    prompt: { mode: decision.mode, mood: decision.mood, situation: situationFor(event, input, decision.mode, decision.mood), closingLine: closing, wrongAnswer: event === "miss", praiseAllowed: mayPraise(event, decision.mode) },
    scripted: redirect !== null,
    record: {
      childInput: redirect ? NOT_SAVED : storedInput(input, text),
      inputKind: input.kind,
      activityId: input.kind === "card" ? input.activityId : null,
      correct: graded?.correct ?? null,
      responseMs: input.kind === "card" ? input.responseMs : null,
      safetyFlag: safetyFlagFor(guard),
      modeReason,
    },
    outcome: { skill: graded?.skill ?? null, level: levelDecision.level, starsEarned: stars },
  };
}

function storedInput(input: ChatInput, text: string): string {
  if (input.kind === "card") return `[card] ${input.choiceId}`;
  if (input.kind === "mood") return `[mood] ${input.mood.toLowerCase()}`;
  if (input.kind === "break") return "[break]";
  return text;
}

function safetyFlagFor(guard: InputGuardResult): string | null {
  if (guard.action === "redirect") return guard.reason;
  return guard.action === "redact" ? `redacted:${guard.reason}` : null;
}
