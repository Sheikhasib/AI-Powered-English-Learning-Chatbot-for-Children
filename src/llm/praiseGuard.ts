/** Words that tell a child they got it right; they may only follow a card that was answered correctly. */
const PRAISE_PATTERN =
  /\b(great|good|nice|fine|excellent|awesome|amazing|fantastic|wonderful|brilliant|perfect|super|smart|clever|proud|well done|hooray|yay|correct|you did it|you got it|that's right|you're right|you are right)\b/i;

/** Rejects a line that praises the answer; used wherever no card was answered correctly, so Pip cheers the try, not the result. */
export function praisesAnswer(text: string): boolean {
  return PRAISE_PATTERN.test(text);
}
