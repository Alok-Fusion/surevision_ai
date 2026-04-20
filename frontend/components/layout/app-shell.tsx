import { AuthGate } from "@/components/auth/auth-gate";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OnboardingTour } from "@/components/layout/onboarding-tour";
import { NativeTitlebar } from "@/components/layout/native-titlebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex flex-col min-h-screen">
        <NativeTitlebar />
        <div className="flex flex-1 min-h-0 overflow-hidden lg:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1 flex flex-col overflow-y-auto">
            <Topbar />
            <div className="mx-auto w-full max-w-[1480px] px-4 py-7 md:px-8 flex-1">{children}</div>
          </main>
        </div>
      </div>
      <OnboardingTour />
    </AuthGate>
  );
}
