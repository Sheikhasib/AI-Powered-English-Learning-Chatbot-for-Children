import { INITIAL_MODE } from "@/engine/detectMode";
import type { ActivityKind } from "@/engine/curriculum/types";
import { ACTIVITY_KINDS } from "@/engine/curriculum/types";
import type { RecentTurn, TurnContext } from "@/server/repositories/context";
import type { Mood } from "@/types/domain";
import type { PreviousMode } from "@/types/mode";

export type DerivedHistory = {
  previous: PreviousMode;
  teachingStreak: number;
  lastMood: Mood | null;
  lastBotAt: Date | null;
  recentKinds: ActivityKind[];
  recentItemIds: string[];
};

function leadingRun(turns: RecentTurn[], matches: (turn: RecentTurn) => boolean): number {
  const stop = turns.findIndex((turn) => !matches(turn));
  return stop === -1 ? turns.length : stop;
}

function parseActivityId(id: string): { kind: ActivityKind; itemId: string } | null {
  const [, kind, ...rest] = id.split(":");
  const known = (ACTIVITY_KINDS as readonly string[]).includes(kind) ? (kind as ActivityKind) : null;
  return known && rest.length > 0 ? { kind: known, itemId: rest.join(":") } : null;
}

/** Misses in a row on this activity, counted from the newest turn back. */
export function consecutiveMisses(turns: RecentTurn[], activityId: string): number {
  return leadingRun(turns, (turn) => turn.activityId === activityId && turn.correct === false);
}

/** Rebuilds what the mode detector and picker remember from the last 6 stored turns (newest first). */
export function deriveHistory(ctx: TurnContext): DerivedHistory {
  const { turns } = ctx;
  const newest = turns[0];
  const lastBreakTurn = turns.find((turn) => turn.mode === "CHAT" || turn.mode === "PLAY");
  const parsed = [...turns]
    .reverse()
    .flatMap((turn) => (turn.activityId ? [parseActivityId(turn.activityId)] : []))
    .filter((entry) => entry !== null);

  return {
    previous: newest
      ? {
          mode: newest.mode,
          turnsInMode: leadingRun(turns, (turn) => turn.mode === newest.mode),
          lastBreak: lastBreakTurn?.mode === "CHAT" || lastBreakTurn?.mode === "PLAY" ? lastBreakTurn.mode : null,
        }
      : INITIAL_MODE,
    teachingStreak: leadingRun(turns, (turn) => turn.mode === "LEARN"),
    lastMood: newest?.mood ?? ctx.session.checkIn,
    lastBotAt: newest?.createdAt ?? null,
    recentKinds: parsed.map((entry) => entry.kind),
    recentItemIds: parsed.map((entry) => entry.itemId),
  };
}
