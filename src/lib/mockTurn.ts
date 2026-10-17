import { breathingActivity, BREATHING_ACTIVITY_ID } from "@/components/buddy/breathing";
import type { Activity } from "@/engine/curriculum/types";
import type { Mode, Mood } from "@/types/domain";

/**
 * Stand-in for POST /api/chat until the real route lands. The types below
 * mirror spec 06 exactly, so swapping means replacing `createMockTurnSource`
 * with a source that calls the API and reads the `data-turn` part.
 */

/** The `data-turn` part: the first thing the stream sends, before any LLM token. */
export type TurnData = {
  mode: Mode;
  mood: Mood;
  reason: string;
  /** Null when Pip has nothing to ask, for example while saying goodbye. */
  activity: Activity | null;
  /** The scripted line; used until (or instead of) the LLM's own words. */
  fallbackLine: string;
  /** True when the last card was right. */
  celebrate: boolean;
  /** Brave-try stars earned by this turn, not the running total. */
  stars: number;
};

/** What the child did, as spec 06's request `input` (the ids travel separately). */
export type ChatInput =
  | { kind: "text"; text: string }
  | { kind: "voice"; text: string }
  | { kind: "card"; activityId: string; choiceId: string; responseMs: number }
  | { kind: "mood"; mood: Mood }
  | { kind: "break" };

export type TurnSource = (input: ChatInput) => Promise<TurnData>;

const MOCK_LATENCY_MS = 350;
const LEARN_ROUND = 3;
const PLAY_ROUND = 5;

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function learnActivity(id: string, word: string, picture: string, others: [string, string][]): Activity {
  const choices = [
    { id: word, label: word, picture },
    ...others.map(([label, pic]) => ({ id: label, label, picture: pic })),
  ];
  return {
    id,
    skillId: "mock-words",
    kind: "picture-match",
    prompt: `Tap the ${word}!`,
    choices,
    answerId: word,
    hint: `Look for the ${word}. You can do it!`,
  };
}

const LEARN: Activity[] = [
  learnActivity("mock-dog", "dog", "🐶", [["cat", "🐱"], ["fish", "🐟"]]),
  learnActivity("mock-sun", "sun", "☀️", [["moon", "🌙"], ["star", "⭐"], ["cloud", "☁️"]]),
  learnActivity("mock-apple", "apple", "🍎", [["bus", "🚌"], ["ball", "⚽"]]),
  learnActivity("mock-bird", "bird", "🐦", [["frog", "🐸"], ["bee", "🐝"], ["cow", "🐮"]]),
];

const PLAY_GAME: Activity = {
  id: "mock-play",
  skillId: "mock-words",
  kind: "odd-one-out",
  prompt: "Which one is not an animal?",
  choices: [
    { id: "cow", label: "cow", picture: "🐮" },
    { id: "car", label: "car", picture: "🚗" },
    { id: "pig", label: "pig", picture: "🐷" },
  ],
  answerId: "car",
  hint: "Which one can not run or swim?",
};

const KIND_TALK: Activity = {
  id: "mock-kind",
  skillId: "mock-feelings",
  kind: "picture-match",
  prompt: "Your friend is sad. What can you do?",
  choices: [
    { id: "hug", label: "hug", picture: "🤗" },
    { id: "share", label: "share", picture: "🎁" },
    { id: "smile", label: "smile", picture: "😊" },
  ],
  answerId: null,
  hint: "Think of something kind.",
};

const CALM_CHOICE: Activity = {
  id: "mock-calm",
  skillId: "mock-feelings",
  kind: "picture-match",
  prompt: "Do you want to breathe, or play slow?",
  choices: [
    { id: "breathe", label: "breathe", picture: "🫧" },
    { id: "slow-game", label: "slow game", picture: "🧩" },
  ],
  answerId: null,
  hint: "Pick the one that feels good.",
};

const MODE_FOR_MOOD: Record<Mood, Mode> = {
  HAPPY: "LEARN",
  OKAY: "LEARN",
  EXCITED: "PLAY",
  SAD: "SUPPORT",
  ANGRY: "SUPPORT",
  SCARED: "SUPPORT",
  TIRED: "CALM",
};

const MOOD_WORD: Record<Mood, string> = {
  HAPPY: "happy",
  OKAY: "okay",
  EXCITED: "excited",
  SAD: "sad",
  ANGRY: "angry",
  SCARED: "scared",
  TIRED: "tired",
};

/** A scripted conversation: check-in, a few learn rounds, a play round, then chat. */
export function createMockTurnSource(): TurnSource {
  let mode: Mode = "LEARN";
  let mood: Mood = "OKAY";
  let current: Activity = LEARN[0];
  let answered = 0;
  let misses = 0;

  const turn = (partial: Pick<TurnData, "fallbackLine" | "activity" | "reason"> & Partial<TurnData>): TurnData => ({
    mode,
    mood,
    celebrate: false,
    stars: 0,
    ...partial,
  });

  const nextActivity = (): Activity => {
    if (answered === LEARN_ROUND) return PLAY_GAME;
    if (answered === PLAY_ROUND) return KIND_TALK;
    return LEARN[answered % LEARN.length];
  };

  const modeForRound = (): Mode =>
    answered === LEARN_ROUND ? "PLAY" : answered === PLAY_ROUND ? "CHAT" : "LEARN";

  return async (input) => {
    await pause(MOCK_LATENCY_MS);

    if (input.kind === "mood") {
      mood = input.mood;
      mode = MODE_FOR_MOOD[mood];
      current = mode === "LEARN" ? LEARN[0] : mode === "PLAY" ? PLAY_GAME : CALM_CHOICE;
      const feeling = `You feel ${MOOD_WORD[mood]}. Thank you for telling me.`;
      return turn({
        reason: "check-in",
        activity: current,
        fallbackLine: `${feeling} ${current.prompt}`,
      });
    }

    if (input.kind === "break") {
      mode = "CALM";
      current = CALM_CHOICE;
      return turn({
        reason: "break requested",
        activity: current,
        fallbackLine: `Good idea. Let's rest. ${current.prompt}`,
      });
    }

    if (input.kind === "text" || input.kind === "voice") {
      mode = "CHAT";
      current = KIND_TALK;
      return turn({
        reason: "child spoke",
        activity: current,
        stars: 1,
        fallbackLine: `I love talking with you! ${current.prompt}`,
      });
    }

    if (current.id === CALM_CHOICE.id && input.choiceId === "breathe") {
      current = breathingActivity();
      return turn({
        reason: "chose breathing",
        activity: current,
        stars: 1,
        fallbackLine: `Good choice. ${current.prompt}`,
      });
    }

    if (current.id === BREATHING_ACTIVITY_ID && input.choiceId === "not-yet") {
      current = CALM_CHOICE;
      return turn({
        reason: "not ready yet",
        activity: current,
        fallbackLine: `That's okay. ${current.prompt}`,
      });
    }

    if (mode === "SUPPORT" || mode === "CALM" || current.answerId === null) {
      mode = "LEARN";
      current = LEARN[answered % LEARN.length];
      return turn({
        reason: "chose a coping card",
        activity: current,
        celebrate: true,
        stars: 1,
        fallbackLine: `Lovely choice! ${current.prompt}`,
      });
    }

    if (input.choiceId !== current.answerId) {
      misses += 1;
      return turn({
        reason: "wrong answer",
        activity: current,
        stars: 1,
        fallbackLine: `Oops! Let's try together. ${current.hint}`,
      });
    }

    const persisted = misses > 0;
    misses = 0;
    answered += 1;
    mode = modeForRound();
    current = nextActivity();
    return turn({
      reason: "correct answer",
      activity: current,
      celebrate: true,
      stars: persisted ? 4 : 2,
      fallbackLine: `${persisted ? "You kept trying!" : "Yes! Great job!"} ${current.prompt}`,
    });
  };
}
