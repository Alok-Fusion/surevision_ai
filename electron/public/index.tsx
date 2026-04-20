import { useState, useEffect } from "react";
import { 
  Mic, 
  MicOff, 
  FileText, 
  FolderOpen, 
  Settings, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Select } from "./components/ui/select";
import { Label } from "./components/ui/label";

interface AnalysisResult {
  id: string;
  fileName: string;
  fileType: string;
  status: "pending" | "processing" | "completed" | "failed";
  summary?: string;
  riskScore?: number;
  trustScore?: number;
  warnings?: string[];
  timestamp: Date;
}

export default function DesktopApp() {
  const [listening, setListening] = useState(false);
  const [watchFolder, setWatchFolder] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [minimized, setMinimized] = useState(false);
  const [clipboardText, setClipboardText] = useState("");

  useEffect(() => {
    loadSettings();
    loadRecentFiles();
  }, []);

  async function readClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
    } catch (e) {
      console.log("Clipboard read failed:", e);
    }
  }

  async function loadSettings() {
    try {
      const folder = await window.electronAPI.folder.get();
      setWatchFolder(folder || "");
    } catch (e) {
      console.log("Running in browser");
    }
  }

  async function loadRecentFiles() {
    try {
      const files = await window.electronAPI.analysis.getRecent();
      if (files) setResults(files);
    } catch (e) {
      console.log("Running in browser");
    }
  }

  async function selectFolder() {
    try {
      const folder = await window.electronAPI.folder.select();
      if (folder) setWatchFolder(folder);
    } catch (e) {
      console.log("Running in browser");
    }
  }

  async function toggleVoice() {
    try {
      if (listening) {
        await window.electronAPI.voice.stop();
      } else {
        await window.electronAPI.voice.start();
      }
      setListening(!listening);
    } catch (e) {
      setListening(!listening);
    }
  }

  async function handleFileSelect() {
    try {
      setAnalyzing(true);
    } catch (e) {
      setAnalyzing(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed": return "text-emerald-400";
      case "processing": return "text-amber-400";
      case "failed": return "text-red-400";
      default: return "text-slate-400";
    }
  }

  function getScoreColor(score: number) {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-emerald-400">SureVision AI</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.electronAPI.window.minimize()}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={toggleVoice}
          className={`flex-1 ${listening ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
        >
          {listening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
          {listening ? "Stop" : "Voice"}
        </Button>
        <Button
          onClick={selectFolder}
          variant="outline"
          className="flex-1 border-white/20"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Watch
        </Button>
        <Button
          onClick={() => window.electronAPI.window.quit()}
          variant="ghost"
          size="sm"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {listening && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-400">Listening for commands...</span>
        </div>
      )}

      {watchFolder && (
        <div className="text-xs text-slate-400 truncate">
          Watching: {watchFolder}
        </div>
      )}

      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Recent Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">
              No recent files analyzed
            </div>
          ) : (
            results.slice(0, 10).map((result) => (
              <div
                key={result.id}
                className="p-3 rounded-lg bg-white/5 border border-white/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">
                        {result.fileName}
                      </p>
                      <p className="text-xs text-slate-500">{result.fileType}</p>
                    </div>
                  </div>
                  <span className={`text-xs ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>

                {result.status === "completed" && result.riskScore !== undefined && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Risk: </span>
                      <span className={getScoreColor(result.riskScore)}>{result.riskScore}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Trust: </span>
                      <span className={getScoreColor(result.trustScore || 0)}>{result.trustScore}</span>
                    </div>
                  </div>
                )}

                {result.warnings && result.warnings.length > 0 && (
                  <div className="mt-2 flex items-start gap-1 text-xs text-amber-400">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{result.warnings[0]}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-center text-slate-600">
        Press <kbd className="px-1 py-0.5 bg-slate-800 rounded">Ctrl+Shift+V</kbd> to toggle window
        {" "}&middot;{" "}
        <kbd className="px-1 py-0.5 bg-slate-800 rounded">Ctrl+Shift+A</kbd> for voice
      </div>
    </div>
  );
}

declare global {
  interface Window {
    electronAPI?: {
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        quit: () => Promise<void>;
      };
      settings: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
      };
      folder: {
        select: () => Promise<string | null>;
        get: () => Promise<string | null>;
      };
      analysis: {
        run: (filePath: string) => Promise<any>;
        getProgress: () => void;
        clearHistory: () => Promise<void>;
        getRecent: () => Promise<AnalysisResult[]>;
      };
      voice: {
        start: () => Promise<boolean>;
        stop: () => Promise<void>;
        status: () => Promise<boolean>;
      };
      autostart: {
        get: () => Promise<boolean>;
        set: (enable: boolean) => Promise<void>;
      };
      onNavigate: (callback: (path: string) => void) => void;
      onAnalysisProgress: (callback: (progress: any) => void) => void;
    };
  }
}