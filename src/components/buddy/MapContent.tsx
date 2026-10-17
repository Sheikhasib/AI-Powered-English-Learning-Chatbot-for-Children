"use client";

import { useProgress } from "@/hooks/useProgress";
import { LevelMap } from "./LevelMap";
import { buildIslands } from "./progressView";
import { SpeakLine } from "./SpeakLine";

/** Loads the child's real skill states, then draws the islands and says the title. */
export function MapContent({ profileId }: { profileId: string | undefined }) {
  const progress = useProgress(profileId);
  if (!progress) return null;
  return (
    <>
      <SpeakLine text="My map." />
      <LevelMap islands={buildIslands(progress.skills)} />
    </>
  );
}
