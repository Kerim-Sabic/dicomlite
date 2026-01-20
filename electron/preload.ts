import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface FileStats {
  size: number;
  mtime: string;
}

export interface ScanProgress {
  filesFound: number;
  currentPath: string;
}

export interface DicomAPI {
  // File system operations
  openFolderDialog: () => Promise<string | null>;
  scanDicomFolder: (folderPath: string) => Promise<{ success: boolean; files?: string[]; error?: string }>;
  cancelScan: () => Promise<boolean>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: Buffer; error?: string }>;
  getFileStats: (filePath: string) => Promise<{ success: boolean; stats?: FileStats; error?: string }>;

  // Event listeners
  onScanProgress: (callback: (progress: ScanProgress) => void) => () => void;
  onMenuOpenFolder: (callback: () => void) => () => void;
  onToggleTheme: (callback: () => void) => () => void;
  onViewerZoomIn: (callback: () => void) => () => void;
  onViewerZoomOut: (callback: () => void) => () => void;
  onViewerFit: (callback: () => void) => () => void;
  onViewerReset: (callback: () => void) => () => void;
  onShowShortcuts: (callback: () => void) => () => void;
  onShowAbout: (callback: () => void) => () => void;
}

const dicomAPI: DicomAPI = {
  // File system operations
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  scanDicomFolder: (folderPath: string) => ipcRenderer.invoke('fs:scanDicomFolder', folderPath),
  cancelScan: () => ipcRenderer.invoke('fs:cancelScan'),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  getFileStats: (filePath: string) => ipcRenderer.invoke('fs:getFileStats', filePath),

  // Event listeners with cleanup
  onScanProgress: (callback: (progress: ScanProgress) => void) => {
    const handler = (_event: IpcRendererEvent, progress: ScanProgress) => callback(progress);
    ipcRenderer.on('scan-progress', handler);
    return () => ipcRenderer.removeListener('scan-progress', handler);
  },

  onMenuOpenFolder: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-open-folder', handler);
    return () => ipcRenderer.removeListener('menu-open-folder', handler);
  },

  onToggleTheme: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('toggle-theme', handler);
    return () => ipcRenderer.removeListener('toggle-theme', handler);
  },

  onViewerZoomIn: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('viewer-zoom-in', handler);
    return () => ipcRenderer.removeListener('viewer-zoom-in', handler);
  },

  onViewerZoomOut: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('viewer-zoom-out', handler);
    return () => ipcRenderer.removeListener('viewer-zoom-out', handler);
  },

  onViewerFit: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('viewer-fit', handler);
    return () => ipcRenderer.removeListener('viewer-fit', handler);
  },

  onViewerReset: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('viewer-reset', handler);
    return () => ipcRenderer.removeListener('viewer-reset', handler);
  },

  onShowShortcuts: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('show-shortcuts', handler);
    return () => ipcRenderer.removeListener('show-shortcuts', handler);
  },

  onShowAbout: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('show-about', handler);
    return () => ipcRenderer.removeListener('show-about', handler);
  },
};

contextBridge.exposeInMainWorld('dicom', dicomAPI);

// Type declaration for window
declare global {
  interface Window {
    dicom: DicomAPI;
  }
}
