"use client";

import type { Activity } from "@/engine/curriculum/types";
import type { CardFeedback } from "@/hooks/useBuddyChat";
import type { Mood } from "@/types/domain";
import { BreathingBubble } from "./BreathingBubble";
import { BELLY_BREATHS, isBreathingActivity } from "./breathing";
import { CheckIn } from "./CheckIn";
import { PictureCards } from "./PictureCards";

type Props = {
  checkingIn: boolean;
  activity: Activity | null;
  /** True while Pip is talking or thinking. */
  locked: boolean;
  feedback: CardFeedback | null;
  breathed: boolean;
  onMood: (mood: Mood) => void;
  onPick: (choiceId: string) => void;
  onBreathDone: () => void;
};

/** What the child answers with right now: feeling faces, the breathing bubble, or picture cards. */
export function ActivityArea({
  checkingIn,
  activity,
  locked,
  feedback,
  breathed,
  onMood,
  onPick,
  onBreathDone,
}: Props) {
  if (checkingIn) return <CheckIn locked={locked} onPick={onMood} />;
  if (!activity) return null;
  if (BELLY_BREATHS && isBreathingActivity(activity) && !breathed) {
    return <BreathingBubble breaths={BELLY_BREATHS} active={!locked} onDone={onBreathDone} />;
  }
  return (
    <PictureCards
      activityId={activity.id}
      choices={activity.choices}
      locked={locked}
      feedback={feedback}
      onPick={onPick}
    />
  );
}
