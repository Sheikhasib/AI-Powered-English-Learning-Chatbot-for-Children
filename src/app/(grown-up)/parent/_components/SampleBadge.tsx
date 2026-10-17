import { FlaskConical } from "lucide-react";

/** Marks made-up demo data; the icon and words carry the meaning, not the color. */
export function SampleBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-2 border-gentle bg-gentle-soft px-4 py-1 text-meta font-bold text-foreground">
      <FlaskConical className="size-4" aria-hidden />
      Sample data
    </span>
  );
}
