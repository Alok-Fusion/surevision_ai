import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    quit: () => ipcRenderer.invoke("window:quit")
  },

  // File operations
  file: {
    openDialog: () => ipcRenderer.invoke("file:open-dialog"),
    analyze: (filePath: string) => ipcRenderer.invoke("file:analyze", filePath)
  },

  // Manual analysis
  manual: {
    analyze: (data: any) => ipcRenderer.invoke("manual:analyze", data)
  },

  // Backend API proxy
  api: {
    request: (options: any) => ipcRenderer.invoke("api:request", options)
  },

  // History
  history: {
    list: () => ipcRenderer.invoke("history:list"),
    get: (id: string) => ipcRenderer.invoke("history:get", id),
    clear: () => ipcRenderer.invoke("history:clear")
  },

  // Events from main process
  onProgress: (callback: (data: any) => void) => {
    ipcRenderer.on("analysis:progress", (_event, data) => callback(data));
  },

  onBackendReady: (callback: () => void) => {
    ipcRenderer.on("backend:ready", () => callback());
  }
});