import { Suspense } from "react";
import { AuthShell } from "@/components/forms/auth-shell";
import { ResetPasswordClient } from "@/components/forms/reset-password-client";

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="Enter your new password below.">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading reset workflow...</p>}>
        <ResetPasswordClient />
      </Suspense>
    </AuthShell>
  );
}
