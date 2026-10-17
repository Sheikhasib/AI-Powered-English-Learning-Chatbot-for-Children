import { Star } from "lucide-react";
import type { Mode } from "@/types/domain";

const MODE_LABEL: Record<Mode, string> = {
  LEARN: "Learn",
  CHAT: "Chat",
  PLAY: "Play",
  SUPPORT: "Support",
  CALM: "Calm",
};

type Props = {
  stars: number;
  mode: Mode;
};

/** Brave-try stars. The tiny mode label is for grown-ups; the child feels the mode in Pip. */
export function StarCount({ stars, mode }: Props) {
  return (
    <div className="flex flex-col items-center">
      <div
        role="status"
        aria-label={`${stars} stars`}
        className="flex h-16 min-w-24 items-center justify-center gap-2 rounded-full bg-card px-5 text-label font-bold"
      >
        <Star aria-hidden className="size-7 fill-accent stroke-foreground stroke-[1.5]" />
        <span>{stars}</span>
      </div>
      <span className="text-[0.875rem] text-muted-foreground" aria-label={`Pip is in ${MODE_LABEL[mode]} mode`}>
        {MODE_LABEL[mode]}
      </span>
    </div>
  );
}
