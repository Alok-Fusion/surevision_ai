"use client";

import { useEffect, useState } from "react";
import { X, Minus, Square } from "lucide-react";

export function NativeTitlebar() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  if (!isElectron) return null;

  return (
    <div className="flex h-[38px] shrink-0 items-center justify-between border-b border-white/5 bg-[#0a0f1a] px-3 [app-region:drag]">
      <div className="flex items-center gap-2.5">
        <div className="h-4 w-4 rounded-[5px] bg-gradient-to-br from-[#6ee7b7] via-[#67e8f9] to-[#c4b5fd]"></div>
        <span className="text-[13px] font-semibold text-slate-400">SureVision AI</span>
        <span className="rounded-md bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.03em] text-emerald-400">Copilot</span>
      </div>
      <div className="flex gap-0.5 [app-region:no-drag]">
        <button
          onClick={() => (window as any).electronAPI?.window?.minimize()}
          className="flex h-7 w-9 items-center justify-center rounded transition-colors hover:bg-white/10 text-slate-400 hover:text-slate-200"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => (window as any).electronAPI?.window?.maximize()}
          className="flex h-7 w-9 items-center justify-center rounded transition-colors hover:bg-white/10 text-slate-400 hover:text-slate-200"
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={() => (window as any).electronAPI?.window?.close()}
          className="flex h-7 w-9 items-center justify-center rounded transition-colors hover:bg-red-600 hover:text-white text-slate-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
