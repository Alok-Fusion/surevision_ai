import {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  dialog,
  shell
} from "electron";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";
import { ChildProcess, spawn } from "child_process";
import log from "electron-log";
import Store from "electron-store";
import { TrayManager } from "./services/trayManager";
const pdfParse = require("pdf-parse");

// ── Logging ──────────────────────────────────────────────────────────────────
(log as any).initialize();
(log as any).transports.file.level = "info";

// ── State ────────────────────────────────────────────────────────────────────
const store = new Store();
let isQuitting = false;
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;
let backendProcess: ChildProcess | null = null;

const isProd = app.isPackaged;
const BACKEND_PORT = 5000;
const API_BASE_URL = isProd ? "https://surevision-ai-e9vy.onrender.com" : `http://localhost:${BACKEND_PORT}`;
const projectRoot = path.resolve(__dirname, "..", "..", "..");

// ── Error handling ───────────────────────────────────────────────────────────
process.on("uncaughtException", (error) => {
  log.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
  log.error("Unhandled Rejection:", reason);
});

// ── Splash Window ────────────────────────────────────────────────────────────
function createSplashWindow(): BrowserWindow {
  const splashPreload = path.join(__dirname, "splash-preload.js");
  const win = new BrowserWindow({
    width: 480,
    height: 420,
    show: false,
    frame: false,
    resizable: false,
    backgroundColor: "#030712",
    center: true,
    webPreferences: {
      preload: splashPreload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.loadFile(path.join(__dirname, "..", "..", "public", "splash.html"));
  win.once("ready-to-show", () => win.show());
  return win;
}

function updateSplash(data: { message?: string; backendReady?: boolean; frontendReady?: boolean }) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send("splash:status", data);
  }
}

// ── Main Window ──────────────────────────────────────────────────────────────
function createMainWindow(): BrowserWindow {
  const preloadPath = path.join(__dirname, "preload.js");
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    show: false,
    frame: false,
    backgroundColor: "#030712",
    title: "SureVision AI",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, "..", "..", "public", "desktop-app.html"));

  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(true); // allow all for desktop
    }
  });

  win.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') return true;
    return true;
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  win.on("closed", () => { mainWindow = null; });
  return win;
}

// ── Backend Spawning ─────────────────────────────────────────────────────────
function spawnBackend(): ChildProcess {
  const backendDir = path.join(projectRoot, "backend");
  log.info(`Spawning backend in: ${backendDir}`);

  const child = spawn("npm", ["run", "dev"], {
    cwd: backendDir,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    windowsHide: true
  });

  child.stdout?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) log.info(`[backend] ${line}`);
  });
  child.stderr?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) log.warn(`[backend:err] ${line}`);
  });
  child.on("error", (err) => log.error("Backend error:", err));
  child.on("exit", (code) => {
    log.info(`Backend exited: ${code}`);
    backendProcess = null;
  });
  return child;
}

// ── Health Check ─────────────────────────────────────────────────────────────
function checkUrl(url: string): Promise<boolean> {
  return fetch(url).then(r => r.ok).catch(() => false);
}

async function waitForServer(url: string, label: string, timeoutMs = 120_000): Promise<boolean> {
  const start = Date.now();
  log.info(`Waiting for ${label} at ${url}...`);
  while (Date.now() - start < timeoutMs) {
    if (await checkUrl(url)) { log.info(`${label} is ready!`); return true; }
    await new Promise((r) => setTimeout(r, 1000));
  }
  log.error(`${label} timed out`);
  return false;
}

// ── Process Cleanup ──────────────────────────────────────────────────────────
function killProcess(child: ChildProcess | null, label: string) {
  if (!child || child.killed) return;
  log.info(`Killing ${label} (pid: ${child.pid})...`);
  if (process.platform === "win32" && child.pid) {
    try {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    } catch { child.kill("SIGKILL"); }
  } else {
    child.kill("SIGTERM");
  }
}

// ── File Analysis ────────────────────────────────────────────────────────────
async function readFileContent(filePath: string): Promise<{ content: string; fileName: string; ext: string }> {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let content = "";

  try {
    if (ext === ".csv" || ext === ".txt" || ext === ".json" || ext === ".md") {
      content = fs.readFileSync(filePath, "utf-8").substring(0, 50000);
    } else if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      content = data.text.substring(0, 50000);
    } else if (ext === ".xlsx" || ext === ".xls") {
      content = `[Excel file: ${fileName}] — Binary spreadsheet uploaded for analysis.`;
    } else {
      content = fs.readFileSync(filePath, "utf-8").substring(0, 50000);
    }
  } catch (err) {
    log.error(`Failed to read file: ${filePath}`, err);
    content = `[Could not read file: ${fileName}]`;
  }

  return { content, fileName, ext };
}

async function analyzeWithBackend(filePath: string): Promise<any> {
  const { content, fileName } = await readFileContent(filePath);

  // Send progress updates
  mainWindow?.webContents.send("analysis:progress", { step: "reading", message: "Reading file..." });

  await new Promise((r) => setTimeout(r, 300));
  mainWindow?.webContents.send("analysis:progress", { step: "analyzing", message: "Running AI analysis..." });

  // Call backend desktop endpoint
  const postData = {
    title: fileName.replace(/\.[^.]+$/, ""),
    description: content,
    fileName,
    fileContent: content,
    currentPainPoint: `Automated analysis of ${fileName}`
  };

  const res = await fetch(`${API_BASE_URL}/api/desktop/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData)
  });

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.message || `Backend error: ${res.status}`);
  }

  const result: any = await res.json();
  const id = `analysis_${Date.now()}`;
  const historyEntry = { id, filePath, fileName, timestamp: new Date().toISOString(), ...(typeof result === 'object' && result ? result : {}) };
  const history: any[] = (store.get("analysisHistory") as any[]) || [];
  history.unshift(historyEntry);
  if (history.length > 50) history.pop();
  store.set("analysisHistory", history);

  mainWindow?.webContents.send("analysis:progress", { step: "done", message: "Analysis complete!" });
  return historyEntry;
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────
function registerIPC() {
  // Window controls
  ipcMain.handle("window:minimize", () => mainWindow?.minimize());
  ipcMain.handle("window:maximize", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle("window:close", () => mainWindow?.hide());
  ipcMain.handle("window:quit", () => { isQuitting = true; app.quit(); });

  // File operations
  ipcMain.handle("file:open-dialog", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: "Select file to analyze",
      filters: [
        { name: "Documents", extensions: ["csv", "pdf", "xlsx", "xls", "txt", "json", "md"] },
        { name: "All Files", extensions: ["*"] }
      ],
      properties: ["openFile"]
    });
    if (!result.canceled && result.filePaths[0]) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle("file:analyze", async (_event, filePath: string) => {
    try {
      return await analyzeWithBackend(filePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      log.error("Analysis error:", message);
      throw new Error(message);
    }
  });

  // History
  ipcMain.handle("history:list", () => {
    return (store.get("analysisHistory") as any[]) || [];
  });

  ipcMain.handle("history:get", (_event, id: string) => {
    const history: any[] = (store.get("analysisHistory") as any[]) || [];
    return history.find((h) => h.id === id) || null;
  });

  ipcMain.handle("history:clear", () => {
    store.set("analysisHistory", []);
    return true;
  });

  // Manual analysis (form submission)
  ipcMain.handle("manual:analyze", async (_event, formData: any) => {
    try {
      mainWindow?.webContents.send("analysis:progress", { step: "reading", message: "Preparing decision..." });
      await new Promise((r) => setTimeout(r, 300));
      mainWindow?.webContents.send("analysis:progress", { step: "analyzing", message: "Running AI analysis..." });

      const res = await fetch(`${API_BASE_URL}/api/desktop/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err: any = await res.json().catch(() => ({}));
        throw new Error(err.message || `Backend error: ${res.status}`);
      }

      const result: any = await res.json();
      const id = `manual_${Date.now()}`;
      const historyEntry = { id, fileName: formData.title || "Manual Decision", timestamp: new Date().toISOString(), ...(typeof result === 'object' && result ? result : {}) };
      const history: any[] = (store.get("analysisHistory") as any[]) || [];
      history.unshift(historyEntry);
      if (history.length > 50) history.pop();
      store.set("analysisHistory", history);
      mainWindow?.webContents.send("analysis:progress", { step: "done", message: "Analysis complete!" });
      return historyEntry;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Manual analysis failed";
      log.error("Manual analysis error:", message);
      throw new Error(message);
    }
  });

  // Generic API request handler for renderer
  ipcMain.handle("api:request", async (_event, { method, path, body, token }: any) => {
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const targetUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;

      const res = await fetch(targetUrl, {
        method: method || "GET",
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await res.text();
      if (!data) return null;
      
      const result = JSON.parse(data);
      if (!res.ok) {
        throw new Error(result.message || `Backend error: ${res.status}`);
      }
      return result;
    } catch (error) {
       const msg = error instanceof Error ? error.message : String(error);
       throw new Error(`API failed: ${msg}`);
    }
  });

  log.info("IPC handlers registered");
}

// ── Shortcuts ────────────────────────────────────────────────────────────────
function registerShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+V", () => {
    if (mainWindow?.isVisible()) mainWindow.hide();
    else { mainWindow?.show(); mainWindow?.focus(); }
  });
  log.info("Global shortcuts registered");
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  log.info("App ready, starting initialization...");
  log.info(`Project root: ${projectRoot}`);

  // 1. Splash
  splashWindow = createSplashWindow();

  // 2. Main window (hidden)
  mainWindow = createMainWindow();

  // 3. IPC & shortcuts
  registerIPC();
  registerShortcuts();

  // 4. System tray
  trayManager = new TrayManager(mainWindow, {
    onShow: () => { mainWindow?.show(); mainWindow?.focus(); },
    onQuit: () => { isQuitting = true; app.quit(); },
    onSettings: () => { mainWindow?.show(); mainWindow?.focus(); }
  });

  // 5. Spawn backend only if not packaged
  if (!isProd) {
    updateSplash({ message: "Starting local backend server..." });
    backendProcess = spawnBackend();
  }

  updateSplash({ message: "Waiting for backend API..." });
  const backendOk = await waitForServer(`${API_BASE_URL}/health`, "Backend", isProd ? 30000 : 120000);
  updateSplash({ backendReady: backendOk, frontendReady: true });

  if (!backendOk) {
    updateSplash({ message: "Backend failed — check MongoDB." });
    dialog.showErrorBox(
      "SureVision AI",
      "Backend failed to start.\n\nPlease ensure MongoDB is running on localhost:27017."
    );
  }

  // 6. Show main window
  updateSplash({ message: "Loading SureVision AI..." });
  await new Promise((r) => setTimeout(r, 600));

  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
  mainWindow.show();
  mainWindow.focus();

  if (backendOk) {
    mainWindow.webContents.send("backend:ready");
  }

  log.info("SureVision AI Copilot is ready!");
});

// ── Lifecycle ────────────────────────────────────────────────────────────────
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { mainWindow?.show(); mainWindow?.focus(); });
app.on("before-quit", () => { isQuitting = true; });
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  killProcess(backendProcess, "backend");
  log.info("App quitting, cleanup complete");
});