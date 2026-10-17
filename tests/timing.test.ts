import { describe, expect, it } from "vitest";
import { createTimer } from "@/server/timing";

function fakeClock(...ticks: number[]) {
  let i = 0;
  return () => ticks[Math.min(i++, ticks.length - 1)];
}

describe("createTimer", () => {
  it("records the time since the previous mark for each name", () => {
    const timer = createTimer(fakeClock(0, 10, 25));
    timer.mark("t_guard");
    timer.mark("t_context");
    expect(timer.durations()).toEqual({ t_guard: 10, t_context: 15 });
  });

  it("formats a Server-Timing header", () => {
    const timer = createTimer(fakeClock(0, 4, 10));
    timer.mark("t_guard");
    timer.mark("t_engine");
    expect(timer.toServerTimingHeader()).toBe("t_guard;dur=4, t_engine;dur=6");
  });

  it("rounds durations to whole milliseconds", () => {
    const timer = createTimer(fakeClock(0, 4.6));
    timer.mark("t_total");
    expect(timer.durations()).toEqual({ t_total: 5 });
  });

  it("returns an empty header when nothing was marked", () => {
    expect(createTimer(fakeClock(0)).toServerTimingHeader()).toBe("");
  });
});
