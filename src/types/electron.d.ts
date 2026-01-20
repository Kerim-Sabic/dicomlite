export interface FileStats {
  size: number;
  mtime: string;
}

export interface ScanProgress {
  filesFound: number;
  currentPath: string;
}

export interface DicomAPI {
  openFolderDialog: () => Promise<string | null>;
  scanDicomFolder: (folderPath: string) => Promise<{ success: boolean; files?: string[]; error?: string }>;
  cancelScan: () => Promise<boolean>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: Buffer; error?: string }>;
  getFileStats: (filePath: string) => Promise<{ success: boolean; stats?: FileStats; error?: string }>;
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

declare global {
  interface Window {
    dicom: DicomAPI;
  }
}

export {};
