import { ResultDetail } from "@/components/dashboard/result-detail";
import { DissentPanel } from "@/components/decision/dissent-panel";
import { AppShell } from "@/components/layout/app-shell";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <ResultDetail id={id} />
    </AppShell>
  );
}

