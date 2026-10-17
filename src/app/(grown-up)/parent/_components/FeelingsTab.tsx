import type { ParentReport } from "@/server/repositories/report";
import { MODE_STYLES, MOOD_FACES, formatTime } from "./display";

/** Mood check-ins over recent sessions, then the last session's mode switches with their reasons. */
export function FeelingsTab({ report }: { report: ParentReport }) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="checkins" className="space-y-3">
        <h3 id="checkins" className="text-body font-bold">
          How {report.nickname} felt at the start
        </h3>
        {report.checkIns.length === 0 ? (
          <p className="text-body text-muted-foreground">No check-ins yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {report.checkIns.map(({ at, mood }) => (
              <li key={at.toISOString()} className="rounded-lg border bg-card px-4 py-2 text-center">
                <span className="block text-heading" aria-hidden>
                  {MOOD_FACES[mood].face}
                </span>
                <span className="block text-meta font-bold">{MOOD_FACES[mood].word}</span>
                <span className="block text-meta text-muted-foreground">{formatTime(at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="timeline" className="space-y-3">
        <h3 id="timeline" className="text-body font-bold">
          Pip&apos;s modes in the last session
        </h3>
        {report.modeTimeline.length === 0 ? (
          <p className="text-body text-muted-foreground">No session yet.</p>
        ) : (
          <ol className="space-y-2">
            {report.modeTimeline.map(({ at, mode, reason }) => (
              <li key={at.toISOString()} className={`rounded-lg px-4 py-3 ${MODE_STYLES[mode].className}`}>
                <p className="text-body">
                  <strong>{MODE_STYLES[mode].label}</strong> <span className="text-meta">{formatTime(at)}</span>
                </p>
                <p className="text-body">Because {reason}.</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
