import type { LevelId } from "@/engine/curriculum/types";
import type { AgeBand } from "./domain";

/** One child's progress on one skill; mirrors the SkillState table. */
export type SkillState = {
  skillId: string;
  /** 0 to 1, moving average of recent answers. */
  mastery: number;
  attempts: number;
  /** +n correct in a row, -n wrong in a row. */
  streak: number;
  lastSeenAt: Date | null;
  /** When the next spaced review is due; null while unmastered. */
  dueAt: Date | null;
};

/** What the engine needs to know about the child. */
export type LearnerProfile = {
  level: LevelId;
  ageBand: AgeBand;
  interests: string[];
};

/** How one answer went, as the mastery update needs it. */
export type AnswerOutcome = {
  correct: boolean;
  /** True when the child had been shown a hint before answering. */
  afterHint: boolean;
};
