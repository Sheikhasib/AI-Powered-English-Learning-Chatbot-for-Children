import type { PrismaClient } from "@/generated/prisma/client";
import type { Mode, Mood } from "@/types/domain";
import type { SkillState } from "@/types/engine";

export type TurnRecord = {
  profileId: string;
  sessionId: string;
  /** Already redacted by the input guard. */
  childInput: string;
  inputKind: string;
  botReply: string;
  mode: Mode;
  modeReason: string;
  mood: Mood;
  activityId: string | null;
  correct: boolean | null;
  fallback: boolean;
  safetyFlag: string | null;
  timings: { tGuard: number; tContext: number; tEngine: number; tFirstToken: number; tTotal: number };
};

export type TurnOutcome = {
  /** The updated skill, or null when this turn graded nothing. */
  skill: SkillState | null;
  level: number;
  starsEarned: number;
};

/** Writes the turn, the skill state, the level and the stars in one transaction. Call it inside `after()`. */
export async function persistTurn(db: PrismaClient, turn: TurnRecord, outcome: TurnOutcome): Promise<string> {
  const { timings, ...fields } = turn;
  const skill = outcome.skill;
  const skillData = skill && {
    mastery: skill.mastery,
    attempts: skill.attempts,
    streak: skill.streak,
    lastSeenAt: skill.lastSeenAt,
    dueAt: skill.dueAt,
  };

  const [created] = await db.$transaction([
    db.turn.create({
      data: {
        ...fields,
        tGuard: timings.tGuard,
        tContext: timings.tContext,
        tEngine: timings.tEngine,
        tFirstToken: timings.tFirstToken,
        tTotal: timings.tTotal,
      },
      select: { id: true },
    }),
    ...(skill && skillData
      ? [
          db.skillState.upsert({
            where: { profileId_skillId: { profileId: turn.profileId, skillId: skill.skillId } },
            create: { profileId: turn.profileId, skillId: skill.skillId, ...skillData },
            update: skillData,
          }),
        ]
      : []),
    db.profile.update({
      where: { id: turn.profileId },
      data: { level: outcome.level, stars: { increment: outcome.starsEarned } },
      select: { id: true },
    }),
  ]);
  return created.id;
}

/** Replaces the turn's mood with the classifier's reading. */
export async function setTurnMood(db: PrismaClient, turnId: string, mood: Mood): Promise<void> {
  await db.turn.update({ where: { id: turnId }, data: { mood }, select: { id: true } });
}

/** Stores the rolling summary the next prompts will carry. */
export async function setProfileSummary(db: PrismaClient, profileId: string, summary: string): Promise<void> {
  await db.profile.update({ where: { id: profileId }, data: { summary }, select: { id: true } });
}
