"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, File, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CopilotDropzone() {
  const router = useRouter();
  const [isElectron, setIsElectron] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("Preparing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api) {
      setIsElectron(true);
      api.onProgress((data: any) => {
        setProgressMsg(data.message);
      });
    }
  }, []);

  const handleAnalyze = async (filePath: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      // Use the IPC handler we built
      const result = await (window as any).electronAPI.file.analyze(filePath);
      
      // Navigate to the Next.js results page for this decision!
      // The backend desktop route returns { decision: { _id } }
      if (result.decision && result.decision._id) {
        router.push(`/decisions/${result.decision._id}`);
      } else {
        // Fallback to history if something goes wrong with routing
        router.push("/history");
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze file.");
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isElectron) return;
    
    // Electron specific file path
    const file = e.dataTransfer.files[0];
    if (file && (file as any).path) {
      handleAnalyze((file as any).path);
    }
  };

  const handleBrowse = async () => {
    if (!isElectron) return;
    const filePath = await (window as any).electronAPI.file.openDialog();
    if (filePath) {
      handleAnalyze(filePath);
    }
  };

  if (!isElectron) {
    return (
      <Card className="border-dashed bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Desktop App Required</h3>
          <p className="mt-2 text-center text-sm text-slate-500 max-w-sm">
            The Copilot automatic file analysis feature requires the SureVision AI native desktop application.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isProcessing) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="mb-6 h-12 w-12 animate-spin text-emerald-500" />
          <h3 className="text-xl font-semibold text-white">Analyzing File...</h3>
          <p className="mt-3 text-sm text-emerald-400 font-medium">{progressMsg}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative rounded-xl border-2 border-dashed p-12 transition-all ${
        isDragging
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60"
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 rounded-full bg-slate-800 p-4 shadow-inner ring-1 ring-white/10">
          <UploadCloud className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-white">Drop your file here</h3>
        <p className="mb-8 max-w-sm text-sm text-slate-400">
          Upload CSV, PDF, XLSX, TXT, or JSON. The Copilot will automatically read the file and run the AI analysis.
        </p>
        <Button onClick={handleBrowse} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
          Browse Files
        </Button>
        {error && (
          <div className="mt-6 rounded-md bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
