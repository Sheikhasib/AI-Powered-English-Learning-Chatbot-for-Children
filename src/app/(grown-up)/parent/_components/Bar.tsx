type Props = {
  label: string;
  /** Fraction from 0 to 1. */
  value: number;
  valueText: string;
  /** Optional marker position as a fraction, e.g. the mastery line or a latency target. */
  marker?: number;
};

/** A plain CSS bar: label, fill and a number, so meaning never rests on color alone. */
export function Bar({ label, value, valueText, marker }: Props) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
      <span className="text-body">{label}</span>
      <span className="text-meta font-bold tabular-nums">{valueText}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={valueText}
        className="relative col-span-2 h-3 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        {marker !== undefined && (
          <div className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${marker * 100}%` }} />
        )}
      </div>
    </div>
  );
}
