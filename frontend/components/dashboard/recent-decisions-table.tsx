import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { recommendationTone, scoreTone } from "@/lib/utils";
import type { DecisionRow } from "@/types";

function urgencyTone(urgency: DecisionRow["urgency"]) {
  if (urgency === "critical") return "danger";
  if (urgency === "high") return "warning";
  if (urgency === "medium") return "info";
  return "neutral";
}

export function RecentDecisionsTable({ rows }: { rows: DecisionRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/30 scrollbar-thin">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Decision</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Urgency</TableHead>
            <TableHead>Recommendation</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id}>
              <TableCell>
                <Link href={`/results/${row._id}`} className="font-medium text-foreground transition hover:text-cyan-200">
                  {row.title}
                </Link>
                <p className="mt-1 text-xs text-slate-500">Decision ID {row._id.replace("dec_", "SV-")}</p>
              </TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{row.industry}</TableCell>
              <TableCell>
                <Badge tone={urgencyTone(row.urgency)}>{row.urgency}</Badge>
              </TableCell>
              <TableCell>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${recommendationTone(row.analysis?.recommendation ?? "Pilot")}`}>
                  {row.analysis?.recommendation ?? "Pending"}
                </span>
              </TableCell>
              <TableCell>
                <Badge className={scoreTone(row.analysis?.riskScore ?? 52)}>{row.analysis?.riskScore ?? 52}</Badge>
              </TableCell>
              <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
