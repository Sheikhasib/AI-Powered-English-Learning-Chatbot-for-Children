import { SampleBadge } from "./SampleBadge";

const buttonClass = "inline-flex min-h-12 items-center rounded-full border-2 border-border bg-card px-5 text-body font-bold";

/** Banner while the sample profile is open, with the one button that returns to the real profiles. */
export function SampleBanner() {
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-gentle bg-gentle-soft p-4">
      <p className="flex flex-wrap items-center gap-3 text-body">
        <SampleBadge /> Made-up example. It is not a real child.
      </p>
      <form action="/api/demo" method="post">
        <input type="hidden" name="action" value="leave" />
        <button type="submit" className={buttonClass}>
          Back to my profiles
        </button>
      </form>
    </div>
  );
}

/** Offered only when the sample profile has been seeded. */
export function ViewSampleButton() {
  return (
    <form action="/api/demo" method="post">
      <input type="hidden" name="action" value="enter" />
      <button type="submit" className={buttonClass}>
        View sample data
      </button>
    </form>
  );
}
