import { AuthShell } from "@/components/forms/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="Receive reset instructions for your work account.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}

