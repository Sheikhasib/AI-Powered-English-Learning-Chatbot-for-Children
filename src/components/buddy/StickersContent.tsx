"use client";

import { useProgress } from "@/hooks/useProgress";
import { earnedStickers } from "./progressView";
import { SpeakLine } from "./SpeakLine";
import { EMPTY_LINE, StickerBook } from "./StickerBook";

/** Loads the child's real skill states, shows one sticker per mastered skill, and says the title (and the empty line). */
export function StickersContent({ profileId }: { profileId: string | undefined }) {
  const progress = useProgress(profileId);
  if (!progress) return null;
  const stickers = earnedStickers(progress.skills);
  return (
    <>
      <SpeakLine text={stickers.length === 0 ? `My stickers. ${EMPTY_LINE}` : "My stickers."} />
      <StickerBook stickers={stickers} />
    </>
  );
}
