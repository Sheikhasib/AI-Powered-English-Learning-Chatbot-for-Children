/** Choices shown to 3-4 year olds on a first attempt: fewer cards, less overload. */
export const CHOICES_AGE_3_4_FIRST = 2;

/** Choices shown in every other case. */
export const CHOICES_DEFAULT = 3;

/** Hard limits on picture cards per question (matches the child UX rule of 2 to 4). */
export const MIN_CHOICES = 2;
export const MAX_CHOICES = 4;

/** Weight of the newest answer in the mastery moving average. */
export const MASTERY_ALPHA = 0.35;

/** A skill counts as mastered at or above this mastery. */
export const MASTERED = 0.8;

/** Score for a correct answer given after a hint: partial credit, not full. */
export const AFTER_HINT_SCORE = 0.6;

/** Share of a level's skills that must be mastered to unlock the next level. */
export const LEVEL_UNLOCK_SHARE = 0.8;

/** Consecutive misses before Pip offers a hint. */
export const HINT_AFTER_MISSES = 2;

/** Consecutive misses before the task gets easier (fewer cards, easiest item). */
export const EASIER_AFTER_MISSES = 3;

/** Cards shown in an easier variant. */
export const EASIER_CHOICE_COUNT = 2;

/** Spaced review gaps in minutes after a skill is mastered: 10 min, 1 hour, 1 day. */
export const REVIEW_INTERVALS_MIN = [10, 60, 24 * 60] as const;

/** Chance that a due review replaces the next new activity (about 1 in 4). */
export const REVIEW_SHARE = 0.25;

/** Learn turns in a row before Pip takes a Chat or Play break. */
export const MAX_TEACHING_STREAK = 4;

/** The same activity kind may not be used more than this many times in a row. */
export const MAX_SAME_KIND_IN_ROW = 2;

/** How many recently taught items the picker avoids repeating. */
export const RECENT_ITEMS_MEMORY = 2;
