import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("splashAPI", {
  onStatus: (callback: (data: any) => void) => {
    ipcRenderer.on("splash:status", (_event, data) => callback(data));
  }
});
