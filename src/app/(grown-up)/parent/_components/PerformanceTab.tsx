import { LATENCY_WINDOW_TURNS, type LatencyStats } from "@/server/repositories/metrics";
import { Bar } from "./Bar";
import { SampleBadge } from "./SampleBadge";

const FIRST_TOKEN_TARGET_MS = 1000;
const TOTAL_TARGET_MS = 2000;
const HEADROOM = 1.25;

const ms = (value: number | null) => (value === null ? "no data" : `${Math.round(value)} ms`);

function Pair({ title, p50, p95, target }: { title: string; p50: number | null; p95: number | null; target: number }) {
  const scale = Math.max(p50 ?? 0, p95 ?? 0, target) * HEADROOM;
  return (
    <section aria-label={title} className="space-y-3">
      <h3 className="text-body font-bold">
        {title} <span className="text-meta font-normal text-muted-foreground">(goal under {target} ms, shown as a line)</span>
      </h3>
      <Bar label="Typical (p50)" value={(p50 ?? 0) / scale} valueText={ms(p50)} marker={target / scale} />
      <Bar label="Slowest 1 in 20 (p95)" value={(p95 ?? 0) / scale} valueText={ms(p95)} marker={target / scale} />
    </section>
  );
}

/** Stored timings from the latest turns; real ones match /api/metrics, sample ones are labelled as made up. */
export function PerformanceTab({ stats, sample }: { stats: LatencyStats; sample: boolean }) {
  if (stats.turns === 0) return <p className="text-body text-muted-foreground">No timings yet. Chat with Pip first.</p>;

  return (
    <div className="space-y-6">
      {sample && (
        <p className="flex flex-wrap items-center gap-3 text-body">
          <SampleBadge /> These timings are made up for the demo. They are not measured.
        </p>
      )}
      <p className="text-meta text-muted-foreground">
        Based on the latest {stats.turns} of up to {LATENCY_WINDOW_TURNS} turns.
      </p>
      <Pair title="First word from Pip" p50={stats.p50FirstToken} p95={stats.p95FirstToken} target={FIRST_TOKEN_TARGET_MS} />
      <Pair title="Whole reply" p50={stats.p50Total} p95={stats.p95Total} target={TOTAL_TARGET_MS} />
      <p className="text-body">
        Scripted fallback used in <strong>{Math.round((stats.fallbackRate ?? 0) * 100)}%</strong> of turns.
      </p>
    </div>
  );
}
