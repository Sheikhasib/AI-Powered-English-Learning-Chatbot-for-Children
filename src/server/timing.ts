export type TimingName = "t_guard" | "t_context" | "t_engine" | "t_first_token" | "t_total";

export type Timer = {
  /** Records the milliseconds elapsed since the previous mark (or since creation). */
  mark: (name: TimingName) => void;
  durations: () => Partial<Record<TimingName, number>>;
  toServerTimingHeader: () => string;
};

/** The clock is injected so tests stay deterministic. */
export function createTimer(now: () => number = () => performance.now()): Timer {
  let last = now();
  const recorded: Partial<Record<TimingName, number>> = {};

  return {
    mark(name) {
      const current = now();
      recorded[name] = Math.round(current - last);
      last = current;
    },
    durations: () => ({ ...recorded }),
    toServerTimingHeader: () =>
      Object.entries(recorded)
        .map(([name, duration]) => `${name};dur=${duration}`)
        .join(", "),
  };
}
