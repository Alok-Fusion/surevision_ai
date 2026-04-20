import { EmployeesClient } from "@/components/employees/employees-client";
import { AppShell } from "@/components/layout/app-shell";

export default function EmployeesPage() {
  return (
    <AppShell>
      <EmployeesClient />
    </AppShell>
  );
}
