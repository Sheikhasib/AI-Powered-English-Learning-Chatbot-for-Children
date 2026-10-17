import type { Item, Skill } from "./curriculum/types";

/** Words that match each onboarding interest, so a child who likes cars sees "car" and "train" first. Dinosaurs has no matching content yet. */
const INTEREST_WORDS: Record<string, readonly string[]> = {
  animals: ["cat", "dog", "rabbit", "cow", "duck", "pig", "frog", "elephant", "bird", "fish", "lion", "goat", "zebra", "octopus"],
  space: ["moon", "sun", "star"],
  cars: ["car", "bus", "train", "van"],
  music: ["drum", "xylophone"],
  food: ["apple", "banana", "grapes", "bread", "milk", "cheese", "carrot", "cake", "egg"],
  sports: ["ball", "kite"],
  nature: ["tree", "flower", "rain", "rainbow", "sunny", "rainy", "moon", "sun"],
};

/** Items in the skill that match any of the child's interests; empty when none do. */
export function preferredItems(skill: Skill, interests: readonly string[]): Item[] {
  const words = new Set(interests.flatMap((interest) => INTEREST_WORDS[interest] ?? []));
  return skill.items.filter((item) => words.has(item.word));
}
