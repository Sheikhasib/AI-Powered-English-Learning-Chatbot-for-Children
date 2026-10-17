import {
  DISCLOSURE_PATTERNS,
  DISCLOSURE_SCRIPT,
  NAME_FOLLOWERS,
  SCHOOL_NON_NAMES,
  SCHOOL_WORDS,
  STREET_WORDS,
  UNSAFE_TOPIC_SCRIPT,
  UNSAFE_WORDS,
} from "./lists";
import { normalise, wholeWordMatcher } from "./text";

export type RedactReason = "phone" | "email" | "address" | "school" | "surname";
export type RedirectReason = "disclosure" | "unsafe_topic";

export type InputGuardResult =
  | { action: "ok" }
  | { action: "redact"; text: string; reason: RedactReason }
  | { action: "redirect"; reason: RedirectReason; script: string; flagForParent: boolean };

const REMOVED = "[removed]";
const unsafeMatcher = wholeWordMatcher(UNSAFE_WORDS);

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE = /\+?\d(?:[\s().-]*\d){6,}/g;
const ADDRESS = new RegExp(
  `\\b\\d{1,5}\\s+(?:[a-z]+\\s+){0,3}(?:${STREET_WORDS.join("|")})\\b|\\bi live (?:at|on|in)\\s+(?:\\w+\\s?){1,5}`,
  "gi",
);
const SCHOOL = new RegExp(
  `\\b(?:i go to|i went to|i am at|i'm at|my school is|i attend)\\s+(?:the\\s+)?` +
    `(?!(?:${SCHOOL_NON_NAMES.join("|")})\\b)((?:[a-z]+\\s+){1,3}?(?:${SCHOOL_WORDS.join("|")}))\\b`,
  "gi",
);
const SURNAME = /\b(my name is\s+\w+\s+)(\w+)/gi;

type Redactor = (text: string) => string;

const redactors: ReadonlyArray<readonly [RedactReason, Redactor]> = [
  ["email", (text) => text.replace(EMAIL, REMOVED)],
  ["phone", (text) => text.replace(PHONE, REMOVED)],
  ["address", (text) => text.replace(ADDRESS, REMOVED)],
  ["school", (text) => text.replace(SCHOOL, (whole, name: string) => whole.replace(name, REMOVED))],
  [
    "surname",
    (text) =>
      text.replace(SURNAME, (whole, lead: string, second: string) =>
        NAME_FOLLOWERS.includes(second.toLowerCase()) ? whole : `${lead}${REMOVED}`,
      ),
  ],
];

/** Checks one child message: disclosure first, then unsafe topics, then personal details to redact. */
export function inputGuard(text: string): InputGuardResult {
  const plain = normalise(text);

  if (DISCLOSURE_PATTERNS.some((pattern) => pattern.test(plain))) {
    return { action: "redirect", reason: "disclosure", script: DISCLOSURE_SCRIPT, flagForParent: true };
  }
  if (unsafeMatcher.test(plain)) {
    return { action: "redirect", reason: "unsafe_topic", script: UNSAFE_TOPIC_SCRIPT, flagForParent: false };
  }

  let current = text;
  let firstReason: RedactReason | null = null;
  for (const [reason, redact] of redactors) {
    const next = redact(current);
    if (next !== current) {
      current = next;
      firstReason ??= reason;
    }
  }
  return firstReason ? { action: "redact", text: current, reason: firstReason } : { action: "ok" };
}
