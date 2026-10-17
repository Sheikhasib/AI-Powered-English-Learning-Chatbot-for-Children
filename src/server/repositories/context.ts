import type { PrismaClient } from "@/generated/prisma/client";
import type { AgeBand, Mode, Mood } from "@/types/domain";
import type { SkillState } from "@/types/engine";

/** Recent turns replayed to the model and used to rebuild the mode history. */
export const RECENT_TURN_COUNT = 6;

export type RecentTurn = {
  childInput: string;
  botReply: string;
  mode: Mode;
  mood: Mood | null;
  activityId: string | null;
  correct: boolean | null;
  createdAt: Date;
};

export type TurnContext = {
  profile: {
    id: string;
    nickname: string;
    ageBand: AgeBand;
    interests: string[];
    level: number;
    summary: string;
  };
  skills: SkillState[];
  session: { id: string; startedAt: Date; checkIn: Mood | null };
  /** Newest first. */
  turns: RecentTurn[];
  /** All turns in this session so far, to decide when to refresh the summary. */
  turnCount: number;
};

/**
 * One query for everything a turn needs. Filtering the profile by device also proves ownership:
 * a profile or session that is not this device's comes back as null.
 */
export async function loadTurnContext(
  db: PrismaClient,
  ids: { deviceId: string; profileId: string; sessionId: string },
): Promise<TurnContext | null> {
  const row = await db.profile.findFirst({
    where: { id: ids.profileId, deviceId: ids.deviceId },
    select: {
      id: true,
      nickname: true,
      ageBand: true,
      interests: true,
      level: true,
      summary: true,
      skills: {
        select: { skillId: true, mastery: true, attempts: true, streak: true, lastSeenAt: true, dueAt: true },
      },
      sessions: {
        where: { id: ids.sessionId },
        select: { id: true, startedAt: true, checkIn: true, _count: { select: { turns: true } } },
        take: 1,
      },
      turns: {
        where: { sessionId: ids.sessionId },
        orderBy: { createdAt: "desc" },
        take: RECENT_TURN_COUNT,
        select: {
          childInput: true,
          botReply: true,
          mode: true,
          mood: true,
          activityId: true,
          correct: true,
          createdAt: true,
        },
      },
    },
  });
  const session = row?.sessions[0];
  if (!row || !session) return null;

  return {
    profile: {
      id: row.id,
      nickname: row.nickname,
      ageBand: row.ageBand,
      interests: row.interests,
      level: row.level,
      summary: row.summary,
    },
    skills: row.skills,
    session: { id: session.id, startedAt: session.startedAt, checkIn: session.checkIn },
    turns: row.turns,
    turnCount: session._count.turns,
  };
}
