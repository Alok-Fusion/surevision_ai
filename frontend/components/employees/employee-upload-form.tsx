"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { UploadSummary } from "@/types";
import { toast } from "sonner";

const EXPECTED_COLUMNS = [
  "employee_id", "name", "email", "department", "designation", "date_of_joining",
  "period", "attendance_days", "total_working_days", "avg_login_time", "avg_logout_time",
  "avg_working_hours", "tasks_assigned", "tasks_completed", "quality_score",
  "peer_rating", "manager_rating", "overtime_hours", "leaves_used", "late_arrivals"
];

interface Props {
  onSuccess: () => void;
}

export function EmployeeUploadForm({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (f: File) => {
    setResult(null);
    setValidationErrors([]);

    if (!f.name.endsWith(".csv") && f.type !== "text/csv") {
      setValidationErrors(["Only CSV files are supported"]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setValidationErrors(["CSV must contain a header and at least one data row"]);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      const missing = EXPECTED_COLUMNS.filter((col) => !headers.includes(col));

      if (missing.length > 0) {
        setValidationErrors([`Missing columns: ${missing.join(", ")}`]);
      }

      const previewRows = lines.slice(0, 6).map((l) => l.split(",").map((c) => c.trim()));
      setPreview(previewRows);
      setFile(f);
    };
    reader.readAsText(f.slice(0, 50000));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await api.post<UploadSummary>("/employees/upload", form);
      setResult(data);
      toast.success(`Imported ${data.summary.recordsCreated} records for ${data.summary.newEmployees} new employees`);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-cyan-300" />
            Upload Employee Data
          </CardTitle>
          <CardDescription>
            Upload a CSV file containing employee performance records. The system will auto-create employee profiles for new IDs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
              dragOver
                ? "border-cyan-400 bg-cyan-400/10"
                : "border-white/20 bg-white/5 hover:border-cyan-300/40 hover:bg-white/10"
            }`}
          >
            <Upload className={`mx-auto h-12 w-12 ${dragOver ? "text-cyan-300" : "text-slate-500"} transition`} />
            <p className="mt-4 text-sm font-medium text-foreground">
              Drop your CSV file here or click to browse
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Supports .csv files up to 12MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processFile(f);
              }}
            />
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview(null); setResult(null); setValidationErrors([]); }}>
                  <XCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading || validationErrors.length > 0}
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload & Import
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-400/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
              <div>
                <p className="font-medium text-red-300">Validation Errors</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-300/80">
                  {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {preview && preview.length > 1 && validationErrors.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>Showing first {preview.length - 1} data rows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {preview[0].map((h, i) => (
                      <th key={i} className="whitespace-nowrap border-b border-white/10 px-3 py-2 text-left font-medium text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, ri) => (
                    <tr key={ri} className="border-b border-white/5">
                      {row.map((cell, ci) => (
                        <td key={ci} className="whitespace-nowrap px-3 py-2 text-slate-300">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Result */}
      {result && (
        <Card className="border-emerald-400/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-medium text-emerald-300">Import Successful</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  {[
                    ["Total Rows", result.summary.totalRows],
                    ["New Employees", result.summary.newEmployees],
                    ["Records Created", result.summary.recordsCreated],
                    ["Errors", result.summary.errorCount]
                  ].map(([label, val]) => (
                    <div key={label as string} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{val}</p>
                      <p className="mt-1 text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-amber-300">Row Errors:</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-amber-300/80">
                      {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expected Format */}
      <Card>
        <CardHeader>
          <CardTitle>Expected CSV Format</CardTitle>
          <CardDescription>Your CSV file should contain these columns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {EXPECTED_COLUMNS.map((col) => (
              <span key={col} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-cyan-200">
                {col}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
