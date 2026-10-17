/** Words that tell a child they got it right; none of them may follow a card that was not right. */
const PRAISE_PATTERN =
  /\b(great|good|nice|fine|excellent|awesome|amazing|fantastic|wonderful|brilliant|perfect|super|well done|hooray|yay|correct|you did it|you got it|that's right|you're right|you are right)\b/i;

/** Rejects a line that praises the answer; used after a wrong card so Pip cheers the try, not the result. */
export function praisesAnswer(text: string): boolean {
  return PRAISE_PATTERN.test(text);
}
