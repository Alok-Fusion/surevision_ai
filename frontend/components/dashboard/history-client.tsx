"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { recommendationTone, scoreTone } from "@/lib/utils";
import type { DecisionRow } from "@/types";

export function HistoryClient({ initialSearch = "" }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [department, setDepartment] = useState("all");
  const [sort, setSort] = useState("date");
  const [rows, setRows] = useState<DecisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (department !== "all") params.set("department", department);
    params.set("sort", sort);
    return params.toString();
  }, [department, search, sort]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get<DecisionRow[]>(`/history${query ? `?${query}` : ""}`)
      .then((response) => {
        if (active) setRows(response);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load decision history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query]);

  return (
    <Card>
      <CardHeader className="border-b border-white/10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <CardTitle>Decision History</CardTitle>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search reports" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">All departments</option>
              {["Finance", "Compliance", "Procurement", "Trade Finance", "Claims", "Operations", "HR", "Logistics"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
            <Select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="date">Sort by date</option>
              <option value="risk">Sort by risk</option>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={Search} title="History unavailable" description={error} />
        ) : rows.length ? (
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>
                      <Link href={`/results/${row._id}`} className="font-medium text-foreground hover:text-emerald-200">
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={scoreTone(row.analysis?.riskScore ?? 0)}>{row.analysis?.riskScore ?? "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${recommendationTone(row.analysis?.recommendation ?? "Pilot")}`}>
                        {row.analysis?.recommendation ?? "Pending"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No decisions found"
            description="Adjust search or filters, or create a new analysis to start your decision archive."
          />
        )}
      </CardContent>
    </Card>
  );
}
