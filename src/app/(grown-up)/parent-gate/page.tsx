import { GateClient } from "./GateClient";

const DEFAULT_NEXT = "/parent";

/** Only paths inside the grown-up area are allowed, so the gate cannot bounce elsewhere. */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && /^\/parent(?:[/?]|$)/.test(next) ? next : DEFAULT_NEXT;
}

export default async function ParentGatePage({ searchParams }: PageProps<"/parent-gate">) {
  const { next } = await searchParams;
  return <GateClient next={safeNext(next)} />;
}
