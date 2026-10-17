"use client";

import { useProgress } from "@/hooks/useProgress";
import { LevelMap } from "./LevelMap";
import { buildIslands } from "./progressView";

/** Loads the child's real skill states, then draws the islands. */
export function MapContent({ profileId }: { profileId: string | undefined }) {
  const progress = useProgress(profileId);
  return progress ? <LevelMap islands={buildIslands(progress.skills)} /> : null;
}
