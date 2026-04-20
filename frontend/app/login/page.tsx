import { Suspense } from "react";
import { AuthShell } from "@/components/forms/auth-shell";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" subtitle="Access the SureVision AI command center.">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign-in...</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
