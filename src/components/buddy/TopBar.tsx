import Link from "next/link";
import { House, Map as MapIcon, Sticker, Volume2, VolumeX, type LucideIcon } from "lucide-react";
import { childHref } from "./links";

type Props = {
  profileId: string;
  muted: boolean;
  onToggleMute: () => void;
};

const roundButton =
  "grid size-16 place-items-center rounded-full border-2 border-border bg-card text-primary active:scale-[0.96] motion-reduce:active:scale-100";

type NavProps = { href: string; label: string; icon: LucideIcon };

/** Icon on phones; icon and word where there is room, so a grown-up can read it too. */
function NavButton({ href, label, icon: Icon }: NavProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${roundButton} min-[700px]:flex min-[700px]:w-auto min-[700px]:items-center min-[700px]:gap-2 min-[700px]:px-6`}
    >
      <Icon aria-hidden className="size-8" />
      <span aria-hidden className="hidden text-label font-bold min-[700px]:inline">
        {label}
      </span>
    </Link>
  );
}

/** Home, map, stickers and sound: four big buttons. */
export function TopBar({ profileId, muted, onToggleMute }: Props) {
  return (
    <header className="flex items-center justify-between gap-2">
      <NavButton href="/" label="Home" icon={House} />
      <NavButton href={childHref("/map", profileId)} label="Map" icon={MapIcon} />
      <NavButton href={childHref("/stickers", profileId)} label="Stickers" icon={Sticker} />
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        aria-pressed={muted}
        className={roundButton}
      >
        {muted ? <VolumeX className="size-8" /> : <Volume2 className="size-8" />}
      </button>
    </header>
  );
}
