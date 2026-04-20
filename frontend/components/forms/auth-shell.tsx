import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/80 p-6 shadow-panel backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Protected by enterprise RBAC and audit logging.{" "}
          <Link href="/" className="text-emerald-200 hover:text-emerald-100">
            Return home
          </Link>
        </p>
      </div>
    </main>
  );
}

