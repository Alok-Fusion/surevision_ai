import { HistoryClient } from "@/components/dashboard/history-client";
import { AppShell } from "@/components/layout/app-shell";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search } = await searchParams;
  return (
    <AppShell>
      <HistoryClient initialSearch={search ?? ""} />
    </AppShell>
  );
}

