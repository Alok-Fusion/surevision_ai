import { AuthShell } from "@/components/forms/auth-shell";
import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <AuthShell title="Create account" subtitle="Join your enterprise decision intelligence workspace.">
      <RegisterForm />
    </AuthShell>
  );
}

