import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { getDb } from "@/server/db";
import { DEVICE_COOKIE } from "@/server/device";
import { demoDataExists } from "@/server/repositories/demo/exists";
import { isDemoDevice } from "@/server/repositories/demo/ids";
import { getLatencyStats } from "@/server/repositories/metrics";
import { listProfiles } from "@/server/repositories/profiles";
import { getParentReport } from "@/server/repositories/report";
import { ConversationsTab } from "./_components/ConversationsTab";
import { DeleteAllData } from "./_components/DeleteAllData";
import { SampleBanner, ViewSampleButton } from "./_components/DemoSwitch";
import { FeelingsTab } from "./_components/FeelingsTab";
import { PerformanceTab } from "./_components/PerformanceTab";
import { ProgressTab } from "./_components/ProgressTab";

const TABS = [
  { id: "progress", label: "Progress" },
  { id: "feelings", label: "Feelings and modes" },
  { id: "chats", label: "Conversations" },
  { id: "speed", label: "Performance" },
  { id: "privacy", label: "Privacy" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const linkClass = (active: boolean) =>
  `inline-flex min-h-12 items-center rounded-full border-2 px-5 text-body font-bold ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
  }`;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ParentPage({ searchParams }: PageProps<"/parent">) {
  return (
    <Suspense fallback={null}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/parent">, "searchParams">) {
  const params = await searchParams;
  const deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  const db = getDb();
  const sample = isDemoDevice(deviceId);
  const offerSample = !sample && (await demoDataExists(db));
  const profiles = deviceId ? await listProfiles(db, deviceId) : [];
  const profile = profiles.find((p) => p.id === first(params.profile)) ?? profiles[0];
  const tab: TabId = TABS.find((t) => t.id === first(params.tab))?.id ?? "progress";

  const report = deviceId && profile ? await getParentReport(db, deviceId, profile.id) : null;
  const stats = tab === "speed" && deviceId && profile ? await getLatencyStats(db, deviceId, profile.id, { includeSample: sample }) : null;
  const href = (profileId: string, tabId: TabId) => `/parent?profile=${profileId}&tab=${tabId}`;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-heading font-bold">Grown-up corner</h1>
        <Link href="/" className={linkClass(false)}>
          <ArrowLeft className="mr-2 size-5" aria-hidden /> Back to Pip
        </Link>
      </header>

      {sample && <SampleBanner />}

      {!profile || !report ? (
        <p className="text-body">No child profile on this device yet. Add one from the welcome screen.</p>
      ) : (
        <>
          <nav aria-label="Children" className="flex flex-wrap gap-3">
            {profiles.map((p) => (
              <Link key={p.id} href={href(p.id, tab)} aria-current={p.id === profile.id} className={linkClass(p.id === profile.id)}>
                {p.nickname}
              </Link>
            ))}
          </nav>
          <nav aria-label="Sections" className="flex flex-wrap gap-3">
            {TABS.map((t) => (
              <Link key={t.id} href={href(profile.id, t.id)} aria-current={t.id === tab ? "page" : undefined} className={linkClass(t.id === tab)}>
                {t.label}
              </Link>
            ))}
          </nav>
          <section aria-label={TABS.find((t) => t.id === tab)?.label} className="rounded-lg bg-card p-4 sm:p-6">
            {tab === "progress" && <ProgressTab report={report} />}
            {tab === "feelings" && <FeelingsTab report={report} />}
            {tab === "chats" && <ConversationsTab report={report} />}
            {tab === "speed" && stats && <PerformanceTab stats={stats} sample={sample} />}
            {tab === "privacy" && <DeleteAllData profileId={profile.id} nickname={profile.nickname} />}
          </section>
        </>
      )}

      {offerSample && <ViewSampleButton />}
    </main>
  );
}
