import { Suspense } from "react";
import { AuthShell } from "@/components/forms/auth-shell";
import { VerifyEmailClient } from "@/components/forms/verify-email-client";

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Verify your email" subtitle="Activate your SureVision AI account from the email link we sent.">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading verification workflow...</p>}>
        <VerifyEmailClient />
      </Suspense>
    </AuthShell>
  );
}
