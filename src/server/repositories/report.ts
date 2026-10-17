import type { PrismaClient } from "@/generated/prisma/client";
import type { Mode, Mood } from "@/types/domain";
import { buildLevelProgress, buildModeTimeline, type LevelProgress, type ModeSwitch } from "./reportShape";

export const RECENT_TURNS = 20;
export const RECENT_CHECK_INS = 14;

export type ReportTurn = {
  id: string;
  createdAt: Date;
  childInput: string;
  botReply: string;
  mode: Mode;
  safetyFlag: string | null;
};
export type CheckIn = { at: Date; mood: Mood };

export type ParentReport = {
  nickname: string;
  level: number;
  stars: number;
  progress: LevelProgress[];
  checkIns: CheckIn[];
  modeTimeline: ModeSwitch[];
  turns: ReportTurn[];
};

/** Everything the grown-up page shows for one profile, or null when it is not on this device. */
export async function getParentReport(
  db: PrismaClient,
  deviceId: string,
  profileId: string,
): Promise<ParentReport | null> {
  const profile = await db.profile.findFirst({
    where: { id: profileId, deviceId },
    select: {
      nickname: true,
      level: true,
      stars: true,
      skills: { select: { skillId: true, mastery: true } },
      sessions: {
        orderBy: { startedAt: "desc" },
        take: RECENT_CHECK_INS,
        select: { id: true, startedAt: true, checkIn: true },
      },
      turns: {
        orderBy: { createdAt: "desc" },
        take: RECENT_TURNS,
        select: { id: true, createdAt: true, childInput: true, botReply: true, mode: true, safetyFlag: true },
      },
    },
  });
  if (!profile) return null;

  const lastSessionId = profile.sessions[0]?.id;
  const lastSessionTurns = lastSessionId
    ? await db.turn.findMany({
        where: { sessionId: lastSessionId },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, mode: true, modeReason: true },
      })
    : [];

  return {
    nickname: profile.nickname,
    level: profile.level,
    stars: profile.stars,
    progress: buildLevelProgress(profile.skills),
    checkIns: profile.sessions.flatMap((s) => (s.checkIn ? [{ at: s.startedAt, mood: s.checkIn }] : [])),
    modeTimeline: buildModeTimeline(lastSessionTurns),
    turns: profile.turns,
  };
}
