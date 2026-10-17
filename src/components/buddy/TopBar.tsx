import Link from "next/link";
import { House, Star, Volume2, VolumeX } from "lucide-react";
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
  muted: boolean;
  mode: Mode;
  onToggleMute: () => void;
};

const roundButton =
  "grid size-16 place-items-center rounded-full border-2 border-border bg-card text-primary active:scale-[0.96] motion-reduce:active:scale-100";

/** Home, star count and mute. The tiny mode label is for grown-ups; the child feels the mode in Pip. */
export function TopBar({ stars, muted, mode, onToggleMute }: Props) {
  return (
    <header className="flex items-center justify-between gap-2">
      <Link href="/" aria-label="Home" className={roundButton}>
        <House className="size-8" />
      </Link>
      <div className="flex flex-col items-center">
        <div
          role="status"
          aria-label={`${stars} stars`}
          className="flex h-16 min-w-24 items-center justify-center gap-2 rounded-full bg-card px-5 text-label font-bold"
        >
          <Star aria-hidden className="size-7 fill-accent text-accent" />
          <span>{stars}</span>
        </div>
        <span className="text-[0.7rem] text-muted-foreground" aria-label={`Pip is in ${MODE_LABEL[mode]} mode`}>
          {MODE_LABEL[mode]}
        </span>
      </div>
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Turn Pip's voice on" : "Turn Pip's voice off"}
        aria-pressed={muted}
        className={roundButton}
      >
        {muted ? <VolumeX className="size-8" /> : <Volume2 className="size-8" />}
      </button>
    </header>
  );
}
