"use client";

import { DragEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

const categories = ["invoice", "contract", "trade finance", "KYC", "policy", "vendor report"];

export function UploadDropzone() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("invoice");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const previewIcon = useMemo(() => {
    if (!file) return UploadCloud;
    if (file.name.endsWith(".pdf")) return FileText;
    return FileSpreadsheet;
  }, [file]);
  const PreviewIcon = previewIcon;

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files.item(0);
    if (dropped) setFile(dropped);
  }

  async function submit() {
    if (!file) {
      toast.error("Choose a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    setLoading(true);
    try {
      const res = await api.post("/upload", formData);
      setUploadResult(res.data.upload);
      toast.success("File metadata and preview stored");
      setFile(null);
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Upload failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Upload Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition ${
              dragging ? "border-emerald-300 bg-emerald-300/10" : "border-white/20 bg-white/5 hover:bg-white/10"
            }`}
          >
            <PreviewIcon className="h-12 w-12 text-emerald-200" />
            <span className="mt-5 text-lg font-semibold text-foreground">{file ? file.name : "Drop CSV, PDF, or XLSX"}</span>
            <span className="mt-2 text-sm text-muted-foreground">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB selected` : "Drag and drop or click to browse"}
            </span>
            <input
              className="sr-only"
              type="file"
              accept=".csv,.pdf,.xlsx,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="category">Document Type</Label>
              <Select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </div>
            <Button onClick={submit} disabled={loading}>
              <UploadCloud className="h-4 w-4" />
              {loading ? "Uploading" : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadResult ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-semibold text-emerald-100">Upload Processed</p>
                </div>
                <p className="mt-2 text-sm text-emerald-200/70">
                  {uploadResult.fileName} • {category}
                </p>
              </div>
              
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="border-b border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Data Extraction Preview</p>
                </div>
                <div className="p-4">
                  {uploadResult.extractedData?.previewRows?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <tbody>
                          {uploadResult.extractedData.previewRows.map((row: string[], i: number) => (
                            <tr key={i} className="border-b border-white/5 last:border-0">
                              {row.map((cell: string, j: number) => (
                                <td key={j} className="p-2 text-muted-foreground whitespace-nowrap">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap line-clamp-6">
                      {uploadResult.extractedData?.previewText || "No readable text extracted."}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setUploadResult(null)}>Upload Another</Button>
              </div>
            </div>
          ) : file ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-foreground">{file.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">Type: {file.type || "application/octet-stream"}</p>
                <p className="text-sm text-muted-foreground">Category: {category}</p>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                SureVision stores file metadata and sample previews, then routes structured rows to the AI engine for friction and silent pattern analysis.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-muted-foreground">
              No file selected.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
