import { Suspense } from "react";
import { GateClient } from "./GateClient";

const DEFAULT_NEXT = "/parent";

/** Only paths inside the grown-up area are allowed, so the gate cannot bounce elsewhere. */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && /^\/parent(?:[/?]|$)/.test(next) ? next : DEFAULT_NEXT;
}

async function Gate({ searchParams }: Pick<PageProps<"/parent-gate">, "searchParams">) {
  const { next } = await searchParams;
  return <GateClient next={safeNext(next)} />;
}

export default function ParentGatePage({ searchParams }: PageProps<"/parent-gate">) {
  return (
    <Suspense fallback={null}>
      <Gate searchParams={searchParams} />
    </Suspense>
  );
}
