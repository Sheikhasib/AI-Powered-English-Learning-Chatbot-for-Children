import {
  EASIER_CHOICE_COUNT,
  MASTERED,
  MAX_SAME_KIND_IN_ROW,
  RECENT_ITEMS_MEMORY,
  REVIEW_SHARE,
} from "./config";
import { getSkill, skillsForLevel } from "./curriculum";
import { buildActivity } from "./curriculum/buildActivity";
import type { Activity, ActivityKind, Item, Skill } from "./curriculum/types";
import { preferredItems } from "./interests";
import { pickOne } from "./rng";
import { easiestItem, scaffoldFor } from "./scaffold";
import type { LearnerProfile, SkillState } from "@/types/engine";
import type { Rng } from "@/types/domain";

export type PickContext = {
  profile: LearnerProfile;
  skills: SkillState[];
  /** Kinds of the latest activities, oldest first. */
  recentKinds: ActivityKind[];
  /** Ids of the latest taught items, oldest first. */
  recentItemIds: string[];
  /** Set while the child is mid-activity after a miss. */
  pending?: { activity: Activity; misses: number };
};

export type Pick = {
  activity: Activity;
  source: "retry" | "review" | "new";
  /** Plain-language explanation the parent view can show. */
  reason: string;
  showHint: boolean;
};

function chooseKind(skill: Skill, recentKinds: ActivityKind[], rng: Rng): ActivityKind {
  const tail = recentKinds.slice(-MAX_SAME_KIND_IN_ROW);
  const blocked =
    tail.length === MAX_SAME_KIND_IN_ROW && tail.every((kind) => kind === tail[0]) ? tail[0] : null;
  const allowed = skill.activityKinds.filter((kind) => kind !== blocked);
  return pickOne(allowed.length > 0 ? allowed : skill.activityKinds, rng);
}

function chooseTarget(skill: Skill, ctx: PickContext, rng: Rng): Item {
  const preferred = preferredItems(skill, ctx.profile.interests);
  const candidates = preferred.length > 0 ? preferred : skill.items;
  const recent = new Set(ctx.recentItemIds.slice(-RECENT_ITEMS_MEMORY));
  const fresh = candidates.filter((item) => !recent.has(item.id));
  return pickOne(fresh.length > 0 ? fresh : candidates, rng);
}

function offer(skill: Skill, ctx: PickContext, rng: Rng): Activity {
  const kind = chooseKind(skill, ctx.recentKinds, rng);
  const target = chooseTarget(skill, ctx, rng);
  return buildActivity(skill, kind, rng, ctx.profile.ageBand, { target });
}

function retryPick(ctx: PickContext, rng: Rng): Pick | null {
  if (!ctx.pending) return null;
  const { activity, misses } = ctx.pending;
  const skill = getSkill(activity.skillId);
  const missed = skill?.items.find((item) => item.id === activity.answerId);
  if (!skill || !missed) return null;

  const { showHint, easier } = scaffoldFor(misses);
  const target = easier ? easiestItem(skill) : missed;
  const retry = buildActivity(skill, activity.kind, rng, ctx.profile.ageBand, {
    target,
    ...(easier ? { choiceCount: EASIER_CHOICE_COUNT } : {}),
  });
  const how = easier ? "an easier one with 2 cards and a hint" : showHint ? "with a hint" : "one more time";
  return {
    activity: retry,
    source: "retry",
    showHint,
    reason: `Missed ${misses} in a row on "${skill.title}": trying again ${how}`,
  };
}

function reviewPick(ctx: PickContext, rng: Rng, now: Date): Pick | null {
  const due = ctx.skills
    .filter((state) => state.mastery >= MASTERED && state.dueAt !== null && state.dueAt <= now)
    .flatMap((state) => {
      const skill = getSkill(state.skillId);
      return skill && skill.level <= ctx.profile.level ? [{ skill, dueAt: state.dueAt as Date }] : [];
    })
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  if (due.length === 0 || rng() >= REVIEW_SHARE) return null;

  const { skill } = due[0];
  return {
    activity: offer(skill, ctx, rng),
    source: "review",
    showHint: false,
    reason: `Review due: "${skill.title}" was mastered earlier`,
  };
}

function newPick(ctx: PickContext, rng: Rng): Pick {
  const masteryById = new Map(ctx.skills.map((s) => [s.skillId, s]));
  const skills = skillsForLevel(ctx.profile.level);
  const next = skills.find((s) => (masteryById.get(s.id)?.mastery ?? 0) < MASTERED);
  if (next) {
    return {
      activity: offer(next, ctx, rng),
      source: "new",
      showHint: false,
      reason: `Next skill in Level ${ctx.profile.level}: "${next.title}"`,
    };
  }
  const seenAt = (s: Skill) => masteryById.get(s.id)?.lastSeenAt?.getTime() ?? -Infinity;
  const stalest = [...skills].sort((a, b) => seenAt(a) - seenAt(b))[0];
  return {
    activity: offer(stalest, ctx, rng),
    source: "new",
    showHint: false,
    reason: `All Level ${ctx.profile.level} skills mastered: practising "${stalest.title}"`,
  };
}

/** Order: retry after a miss, then a due review (about 1 in 4), then the lowest-order unmastered skill of the current level. */
export function pickNextActivity(ctx: PickContext, rng: Rng, now: Date): Pick {
  return retryPick(ctx, rng) ?? reviewPick(ctx, rng, now) ?? newPick(ctx, rng);
}
