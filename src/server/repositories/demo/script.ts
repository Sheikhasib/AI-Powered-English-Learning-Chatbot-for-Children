import type { Mode, Mood } from "@/types/domain";
import type { Signals, TurnKind } from "@/types/mode";

/** One scripted turn. The mode and its reason are not written here: the builder asks the real `detectMode`. */
export type DemoStep = {
  /** Minutes after the session started. */
  atMin: number;
  text: string;
  kind: TurnKind;
  reply: string;
  /** Skill being practised, or null for chat and care turns. */
  skillId: string | null;
  correct: boolean | null;
  fast?: boolean;
  fallback?: boolean;
  safetyFlag?: string;
  /** Signals this turn adds to the quiet baseline. */
  signals?: Partial<Signals>;
  /** For card taps that steer the mode directly, as `socialOverride` does in the chat route. */
  forced?: { mode: Mode; reason: string };
};

export type DemoSession = { daysAgo: number; checkIn: Mood; steps: DemoStep[] };

const L = (skillId: string, text: string, reply: string, correct: boolean, extra: Partial<DemoStep> = {}, at = 0): DemoStep => ({
  atMin: at, text, kind: "card", reply, skillId, correct, ...extra,
});
const C = (text: string, reply: string, signals: Partial<Signals>, extra: Partial<DemoStep> = {}, at = 0): DemoStep => ({
  atMin: at, text, kind: "text", reply, skillId: null, correct: null, signals, ...extra,
});
const at = (atMin: number, step: DemoStep): DemoStep => ({ ...step, atMin });

const AE = "l1.letters.a-e";
const NUM = "l1.numbers.1-5";

const sessionOne: DemoSession = {
  daysAgo: 6,
  checkIn: "HAPPY",
  steps: [
    at(0, C("Hi Pip!", "Hi Mina! I am so glad you are here.", { isGreeting: true })),
    at(1, L(AE, "A", "Yes! A is for apple.", true)),
    at(2, L(AE, "B", "Great! B is for ball.", true)),
    at(3, L(AE, "D", "Nice try! Look for the duck.", false)),
    at(4, L(AE, "C", "You did it! C is for cat.", true)),
    at(5, L("l1.colors", "red", "Red like an apple! Do you like apples?", true)),
    at(7, C("I saw a big cat at the park with my dad", "A big cat! That sounds fun.", { isStory: true })),
    at(8, L(NUM, "two", "Two! Great counting.", true)),
    at(9, L(NUM, "three", "Three! You are on a roll.", true)),
    at(10, L(NUM, "one", "One! Super.", true)),
    at(11, L(NUM, "four", "Four! You are so quick.", true, { fast: true })),
    at(11, L(NUM, "five", "Five! Let us hop like a frog.", true, { fast: true })),
    at(12, L("l1.colors", "blue", "Blue like the sky! Well done.", true)),
  ],
};

const sessionTwo: DemoSession = {
  daysAgo: 3,
  checkIn: "OKAY",
  steps: [
    at(0, C("Hello", "Hello Mina! Ready to play with words?", { isGreeting: true })),
    at(1, L("l1.shapes", "circle", "A circle! Round like a ball.", true)),
    at(2, L("l1.greetings", "hello", "Hello to you too!", true)),
    at(3, L("l2.animals", "cat", "Cat! You know your animals.", true)),
    at(4, L("l2.animals", "dog", "Dog! Woof woof.", true)),
    at(5, L("l2.food", "bread", "Let us look again. Which one is an apple?", false, { fallback: true })),
    at(6, L("l2.food", "apple", "Yes! An apple. You tried again.", true)),
    at(7, C("no more", "That is okay. Let us play a little game.", { refusal: true })),
    at(8, L("l2.animals", "cow", "Moo! The cow says moo.", true)),
    at(9, C("...", "Are you there? Let us find a fun one.", { silenceMs: 25_000 })),
    at(10, C("Why is the sky blue?", "Good question! The sky looks blue in the sun.", { isQuestion: true })),
    at(16, L("l2.toys", "ball", "A ball! Let us rest a little.", true, { signals: { breakTimeReached: true } })),
    at(17, C("okay", "Nice and slow. Breathe in, breathe out.", {})),
  ],
};

const sessionThree: DemoSession = {
  daysAgo: 0,
  checkIn: "SAD",
  steps: [
    at(0, { ...C("I feel sad", "I am here with you. Do you want to breathe or play slow?", { feeling: "SAD" }), kind: "mood" }),
    at(1, C("I miss my friend", "That is a big feeling. I am here.", { lastMood: "SAD" })),
    at(2, {
      atMin: 2, text: "breathe", kind: "card", reply: "In... and out... Nice and slow.", skillId: null, correct: null,
      signals: { lastMood: "SAD" }, forced: { mode: "CALM", reason: "child chose to breathe" },
    }),
    at(3, C("ready", "Yay! Let us play a little game.", { isReady: true })),
    at(4, L("l2.animals", "frog", "Frog! Ribbit. Well done.", true)),
    at(5, L("l2.animals", "bird", "Bird! Tweet tweet.", true)),
    at(6, L("l2.food", "milk", "Milk! Yum.", true)),
    at(7, L("l2.food", "egg", "An egg! Great job.", true)),
    at(8, L("l2.animals", "fish", "Fish! Splash.", true)),
    at(9, C("my phone is 555 123 4567", "Let us keep that a secret. Which one is a banana?", {}, { safetyFlag: "redacted:phone", text: "my phone is [removed]" })),
    at(10, L("l2.food", "banana", "Banana! You did it.", true, { fallback: true })),
    at(11, C("I am tired", "You worked so hard. Let us rest.", { feeling: "TIRED", lastMood: "TIRED" })),
    at(12, C("okay", "Breathe in, breathe out. You are doing great.", { lastMood: "TIRED" })),
    at(13, C("bye Pip", "Rest well, Mina. See you soon.", { isGreeting: true, lastMood: "TIRED" })),
  ],
};

export const DEMO_SESSIONS: readonly DemoSession[] = [sessionOne, sessionTwo, sessionThree];
