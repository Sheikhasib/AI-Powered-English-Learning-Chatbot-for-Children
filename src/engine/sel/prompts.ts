import { pickOne } from "../rng";
import type { Mood, Rng } from "@/types/domain";

export type ChatTheme = "curiosity" | "kindness";

/** Open questions for Chat mode. None ask for names, places, schools or anything identifying. */
export const CHAT_PROMPTS: Record<ChatTheme, readonly string[]> = {
  curiosity: [
    "What makes you laugh?",
    "What is your favorite animal?",
    "What do you like to build?",
    "What do you see in the sky?",
  ],
  kindness: [
    "What could you say to a sad friend?",
    "How can we help someone?",
    "What is a kind thing to do?",
    "How can you share a toy?",
  ],
};

/** Picks a curiosity or kindness question for Chat mode. */
export function chatPrompt(theme: ChatTheme, rng: Rng): string {
  return pickOne(CHAT_PROMPTS[theme], rng);
}

const FEELING_MODELS: Record<Mood, string> = {
  HAPPY: "I feel happy when I see you!",
  OKAY: "I feel okay when we play.",
  SAD: "Sometimes I feel sad. Then I ask for a hug.",
  ANGRY: "Sometimes I feel angry. Then I breathe slowly.",
  TIRED: "I feel tired at night. Then I rest.",
  SCARED: "Sometimes I feel scared. Then I tell a grown-up.",
  EXCITED: "I feel excited to play with you!",
};

/** Pip models a feeling word in a whole sentence, so Level 3 language and SEL reinforce each other. */
export function feelingModelLine(mood: Mood): string {
  return FEELING_MODELS[mood];
}
