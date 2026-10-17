import type { SpokenWord } from "@/hooks/useSpeech";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** The word being spoken right now, as a character range in `text`. */
  word: SpokenWord | null;
  className?: string;
};

/** Pip's line in a white bubble; the spoken word sits on the accent colour. */
export function SpeechBubble({ text, word, className }: Props) {
  const range = word && word.end <= text.length ? word : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative rounded-lg border-2 border-border bg-card px-5 py-4 text-center text-bubble font-bold text-card-foreground shadow-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute -top-2.5 left-1/2 size-5 -translate-x-1/2 rotate-45 border-t-2 border-l-2 border-border bg-card"
      />
      {range ? (
        <>
          <span>{text.slice(0, range.start)}</span>
          <mark className="rounded-md bg-accent px-1 text-accent-foreground">
            {text.slice(range.start, range.end)}
          </mark>
          <span>{text.slice(range.end)}</span>
        </>
      ) : (
        text
      )}
    </div>
  );
}
