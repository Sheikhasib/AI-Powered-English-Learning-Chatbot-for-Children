import { Suspense } from "react";
import { LevelMap } from "@/components/buddy/LevelMap";
import { ScreenHeader } from "@/components/buddy/ScreenHeader";
import { backHref, profileIdFrom } from "@/components/buddy/links";
import { buildIslands } from "@/components/buddy/progressView";
import { mockSkillStates } from "../mockProgress";

const FRAME = "mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-3 bg-mode-learn px-4 py-3";

async function MapScreen({ searchParams }: Pick<PageProps<"/map">, "searchParams">) {
  const profileId = profileIdFrom((await searchParams).p);

  return (
    <main className={FRAME}>
      <ScreenHeader backHref={backHref(profileId)} title="My map" />
      <LevelMap islands={buildIslands(mockSkillStates())} />
    </main>
  );
}

export default function MapPage({ searchParams }: PageProps<"/map">) {
  return (
    <Suspense fallback={<div className={FRAME} />}>
      <MapScreen searchParams={searchParams} />
    </Suspense>
  );
}
