export {};

declare global {
  interface Window {
    electronAPI?: {
      window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        quit: () => void;
      };
      file: {
        openDialog: () => Promise<string | null>;
        analyze: (filePath: string) => Promise<any>;
      };
      manual: {
        analyze: (data: any) => Promise<any>;
      };
      history: {
        list: () => Promise<any[]>;
        get: (id: string) => Promise<any>;
        clear: () => Promise<boolean>;
      };
      onProgress: (callback: (data: any) => void) => void;
      onBackendReady: (callback: () => void) => void;
    };
  }
}
