import { Suspense } from "react";
import { ScreenHeader } from "@/components/buddy/ScreenHeader";
import { StickerBook } from "@/components/buddy/StickerBook";
import { backHref, profileIdFrom } from "@/components/buddy/links";
import { earnedStickers } from "@/components/buddy/progressView";
import { mockSkillStates } from "../mockProgress";

const FRAME = "mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 bg-mode-chat px-4 py-3";

async function StickersScreen({ searchParams }: Pick<PageProps<"/stickers">, "searchParams">) {
  const profileId = profileIdFrom((await searchParams).p);

  return (
    <main className={FRAME}>
      <ScreenHeader backHref={backHref(profileId)} title="My stickers" />
      <StickerBook stickers={earnedStickers(mockSkillStates())} />
    </main>
  );
}

export default function StickersPage({ searchParams }: PageProps<"/stickers">) {
  return (
    <Suspense fallback={<div className={FRAME} />}>
      <StickersScreen searchParams={searchParams} />
    </Suspense>
  );
}
