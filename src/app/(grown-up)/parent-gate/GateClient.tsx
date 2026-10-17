"use client";

import { useRouter } from "next/navigation";
import { ParentGate } from "@/components/shared/ParentGate";

/** Opens the real, server-checked gate and sends the grown-up on to where they were headed. */
export function GateClient({ next }: { next: string }) {
  const router = useRouter();
  return <ParentGate server onClose={() => router.push("/")} onPass={() => router.replace(next)} />;
}
