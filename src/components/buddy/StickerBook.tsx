import type { Sticker } from "./progressView";

export const EMPTY_LINE = "Play with Pip to win stickers.";

const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"] as const;

/** One sticker per mastered skill. Static, so there is nothing to tone down for reduced motion. */
export function StickerBook({ stickers }: { stickers: Sticker[] }) {
  if (stickers.length === 0) {
    return <p className="mt-8 text-center text-bubble font-bold">{EMPTY_LINE}</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-4 pb-4 min-[700px]:grid-cols-4">
      {stickers.map((sticker, index) => (
        <li
          key={sticker.skillId}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-border bg-card p-3 text-center shadow-sm ${TILTS[index % TILTS.length]}`}
        >
          {sticker.picture.startsWith("/") ? (
            // eslint-disable-next-line @next/next/no-img-element -- small local SVG, no optimisation needed
            <img src={sticker.picture} alt="" className="size-18" />
          ) : (
            <span aria-hidden className="text-7xl leading-none">
              {sticker.picture}
            </span>
          )}
          <span className="text-label font-bold">{sticker.title}</span>
        </li>
      ))}
    </ul>
  );
}
