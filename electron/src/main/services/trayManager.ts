import { Tray, Menu, nativeImage, BrowserWindow, app, NativeImage } from "electron";
import * as path from "path";
import log from "electron-log";

interface TrayCallbacks {
  onShow: () => void;
  onQuit: () => void;
  onSettings: () => void;
}

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;
  private callbacks: TrayCallbacks;

  constructor(mainWindow: BrowserWindow, callbacks: TrayCallbacks) {
    this.mainWindow = mainWindow;
    this.callbacks = callbacks;
    this.create();
  }

  private create() {
    const iconPath = path.join(__dirname, "../../../public/tray-icon.png");
    
    let icon: NativeImage;
    try {
      icon = nativeImage.createFromPath(iconPath);
      if (icon.isEmpty()) {
        icon = nativeImage.createEmpty();
      }
    } catch {
      icon = nativeImage.createEmpty();
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip("SureVision AI - Running in background");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show SureVision AI",
        click: () => this.callbacks.onShow()
      },
      {
        label: "Analyze File...",
        click: async () => {
          this.callbacks.onShow();
        }
      },
      { type: "separator" },
      {
        label: "Voice Command",
        accelerator: "CommandOrControl+Shift+A",
        click: () => {
          this.callbacks.onShow();
          this.mainWindow.webContents.send("voice:activate");
        }
      },
      { type: "separator" },
      {
        label: "Settings",
        click: () => this.callbacks.onSettings()
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => this.callbacks.onQuit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);

    this.tray.on("double-click", () => {
      this.callbacks.onShow();
    });

    log.info("Tray manager created");
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}