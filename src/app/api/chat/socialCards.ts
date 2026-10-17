import { BREATHING_ACTIVITY_ID, breathingActivity } from "@/components/buddy/breathing";
import type { Activity } from "@/engine/curriculum/types";
import { readyCheck, supportOpening, type SupportStep } from "@/engine/sel/support";

export const SUPPORT_OFFER_ID = "support:offer";
export const READY_CHECK_ID = "support:ready";

const SOCIAL_SKILL_ID = "support";
const SOCIAL_HINT = "Pick the one that feels good.";

function toActivity(id: string, step: SupportStep): Activity {
  return {
    id,
    skillId: SOCIAL_SKILL_ID,
    kind: "picture-match",
    prompt: step.line,
    choices: step.choices ?? [],
    answerId: null,
    hint: SOCIAL_HINT,
  };
}

/** The two coping cards (breathe, slow game) Pip offers after naming a feeling. */
export function copingOffer(): Activity {
  const offer = supportOpening(null)[1];
  return toActivity(SUPPORT_OFFER_ID, offer);
}

/** "Are you ready to play?" with a ready and a not-yet card, asked before teaching resumes. */
export function readyCheckCard(): Activity {
  return toActivity(READY_CHECK_ID, readyCheck());
}

/** Belly breathing with the bubble; its Ready and Not yet cards appear once the child has breathed. */
export function breathingCard(): Activity {
  return breathingActivity();
}

/** Both the plain ready check and the cards after breathing ask "ready?" with the same two choices. */
export function isReadyQuestion(activityId: string): boolean {
  return activityId === READY_CHECK_ID || activityId === BREATHING_ACTIVITY_ID;
}

export function isSocialCard(activityId: string): boolean {
  return activityId === SUPPORT_OFFER_ID || isReadyQuestion(activityId);
}
