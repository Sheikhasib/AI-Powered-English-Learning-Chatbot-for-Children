import type { Item } from "./types";

/** [word, picture, sound?] */
export type ItemRow = readonly [string, string, string?];

function slug(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Builds items with ids like "animals.cat", unique across the curriculum by prefix. */
export function makeItems(prefix: string, rows: readonly ItemRow[]): Item[] {
  return rows.map(([word, picture, sound]) => ({
    id: `${prefix}.${slug(word)}`,
    word,
    picture,
    ...(sound ? { sound } : {}),
  }));
}

/** Adds sentence templates (and optionally groups) to items by position. */
export function withSentences(items: Item[], sentences: readonly string[]): Item[] {
  return items.map((item, i) => ({ ...item, sentence: sentences[i] }));
}

/** Tags items with a group, by position. */
export function withGroups(items: Item[], groups: readonly string[]): Item[] {
  return items.map((item, i) => ({ ...item, group: groups[i] }));
}
