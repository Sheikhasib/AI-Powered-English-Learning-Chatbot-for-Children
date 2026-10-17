import type { Rng } from "@/types/domain";

const NUMBER_WORDS: Record<number, string> = {
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
};
const MIN_ADDEND = 5;
const MAX_ADDEND = 12;
const DISTRACTOR_STEP = 2;

export type GateSum = { question: string; answer: number; options: number[] };

function addend(rng: Rng): number {
  return MIN_ADDEND + Math.floor(rng() * (MAX_ADDEND - MIN_ADDEND + 1));
}

/** A sum of two numbers from 5 to 12 written in words, which a pre-reader cannot solve. */
export function makeSum(rng: Rng): GateSum {
  const a = addend(rng);
  const b = addend(rng);
  const answer = a + b;
  const options = [answer, answer + DISTRACTOR_STEP, answer - DISTRACTOR_STEP];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { question: `${NUMBER_WORDS[a]} plus ${NUMBER_WORDS[b]}`, answer, options };
}
