import { HINT_AFTER_MISSES } from "@/engine/config";
import { getSkill } from "@/engine/curriculum";
import type { Activity, ActivityKind, Skill } from "@/engine/curriculum/types";
import { ACTIVITY_KINDS } from "@/engine/curriculum/types";
import { gradeAnswer } from "@/engine/grade";
import { newSkillState, updateMastery } from "@/engine/mastery";
import type { SkillState } from "@/types/engine";

/** An activity rebuilt from its id alone: ids are `skillId:kind:targetId`, so the server stays stateless. */
export type ResolvedActivity = {
  skill: Skill;
  kind: ActivityKind;
  /** Null for open activities, where any try earns credit. */
  answerId: string | null;
};

const OPEN_KINDS: readonly ActivityKind[] = ["say-it", "build-story"];

function isKind(value: string): value is ActivityKind {
  return (ACTIVITY_KINDS as readonly string[]).includes(value);
}

/** Looks up the skill, kind and correct card for an activity id; null for unknown ids and for support cards. */
export function resolveActivity(activityId: string): ResolvedActivity | null {
  const [skillId, kind, ...rest] = activityId.split(":");
  const targetId = rest.join(":");
  const skill = skillId ? getSkill(skillId) : undefined;
  if (!skill || !kind || !isKind(kind) || !targetId) return null;
  if (OPEN_KINDS.includes(kind)) return { skill, kind, answerId: null };

  const target = skill.items.find((item) => item.id === targetId);
  // Yes/no items are answered with the "yes" or "no" card, not with the item's own id.
  return { skill, kind, answerId: target?.answer ?? targetId };
}

/** The minimal activity the picker and grader read: skill, kind and answer. Its text is never shown. */
export function activityStub(activityId: string, resolved: ResolvedActivity): Activity {
  return {
    id: activityId,
    skillId: resolved.skill.id,
    kind: resolved.kind,
    prompt: "",
    choices: [],
    answerId: resolved.answerId,
    hint: "",
  };
}

export type GradedCard = {
  correct: boolean;
  /** Misses in a row on this activity before this tap. */
  priorMisses: number;
  /** The skill after the mastery update. */
  skill: SkillState;
  /** Every skill state with the updated one swapped in. */
  skills: SkillState[];
  /** The activity as the picker needs it to schedule a retry. */
  activity: Activity;
};

/** Grades a card tap against the rebuilt activity and updates that skill's mastery; null for ids we cannot grade. */
export function gradeCard(
  card: { activityId: string; choiceId: string },
  skills: SkillState[],
  priorMisses: number,
  now: Date,
): GradedCard | null {
  const resolved = resolveActivity(card.activityId);
  if (!resolved) return null;

  const activity = activityStub(card.activityId, resolved);
  const { correct } = gradeAnswer(activity, card.choiceId, priorMisses);
  const before = skills.find((s) => s.skillId === resolved.skill.id) ?? newSkillState(resolved.skill.id);
  const afterHint = priorMisses >= HINT_AFTER_MISSES;
  const skill = updateMastery(before, { correct, afterHint }, now);
  const others = skills.filter((s) => s.skillId !== skill.skillId);
  return { correct, priorMisses, skill, skills: [...others, skill], activity };
}
