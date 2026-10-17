"use client";

import { useProgress } from "@/hooks/useProgress";
import { earnedStickers } from "./progressView";
import { StickerBook } from "./StickerBook";

/** Loads the child's real skill states, then shows one sticker per mastered skill. */
export function StickersContent({ profileId }: { profileId: string | undefined }) {
  const progress = useProgress(profileId);
  return progress ? <StickerBook stickers={earnedStickers(progress.skills)} /> : null;
}
