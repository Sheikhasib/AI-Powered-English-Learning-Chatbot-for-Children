import Link from "next/link";
import { House, Map as MapIcon, Sticker, type LucideIcon } from "lucide-react";
import { childHref } from "./links";
import { MuteButton } from "./MuteButton";
import { ROUND_BUTTON, ROUND_LABEL } from "./roundButton";

type Props = {
  profileId: string;
  muted: boolean;
  onToggleMute: () => void;
};

type NavProps = { href: string; label: string; icon: LucideIcon };

/** Icon with its word underneath, so a child who cannot read yet still has the picture and a grown-up has the word. */
function NavButton({ href, label, icon: Icon }: NavProps) {
  return (
    <Link href={href} aria-label={label} className={ROUND_BUTTON}>
      <Icon aria-hidden className="size-7" />
      <span aria-hidden className={ROUND_LABEL}>
        {label}
      </span>
    </Link>
  );
}

/** Home, map, stickers and sound: four big buttons, 16 px apart. */
export function TopBar({ profileId, muted, onToggleMute }: Props) {
  return (
    <header className="flex items-center justify-between gap-4">
      <NavButton href="/" label="Home" icon={House} />
      <NavButton href={childHref("/map", profileId)} label="Map" icon={MapIcon} />
      <NavButton href={childHref("/stickers", profileId)} label="Stickers" icon={Sticker} />
      <MuteButton muted={muted} onToggle={onToggleMute} />
    </header>
  );
}
