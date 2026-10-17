/** Lowercases and strips punctuation so phrase patterns match spoken-style text. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/['‘’`]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeLiteral(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Builds a case-insensitive whole-word matcher for a list of words. */
export function wholeWordMatcher(words: readonly string[]): RegExp {
  return new RegExp(`\\b(?:${words.map(escapeLiteral).join("|")})\\b`, "i");
}
