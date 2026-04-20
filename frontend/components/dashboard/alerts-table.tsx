import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AlertRow } from "@/types";

function tone(severity: AlertRow["severity"]) {
  if (severity === "critical") return "danger";
  if (severity === "high") return "warning";
  if (severity === "medium") return "info";
  return "neutral";
}

export function AlertsTable({ rows }: { rows: AlertRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/30 scrollbar-thin">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Signal</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id}>
              <TableCell>
                <Badge tone={tone(row.severity)}>{row.severity}</Badge>
              </TableCell>
              <TableCell className="min-w-72 text-foreground">
                {row.message}
                <p className="mt-1 text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</p>
              </TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>
                <Badge tone={row.resolved ? "success" : "warning"}>{row.resolved ? "Resolved" : "Open"}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
