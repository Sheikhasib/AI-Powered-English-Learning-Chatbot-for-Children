import { Suspense } from "react";
import { BuddyScreen } from "@/components/buddy/BuddyScreen";

export default function BuddyPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-mode-learn" />}>
      <BuddyScreen />
    </Suspense>
  );
}
