import { create } from 'zustand';
import { DicomStudy, DicomSeries, DicomInstance, ViewerTool, ViewerState } from '../types/dicom';

interface ScanProgress {
  isScanning: boolean;
  filesFound: number;
  filesParsed: number;
  currentPath: string;
  errors: string[];
}

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Studies & Series
  studies: Map<string, DicomStudy>;
  setStudies: (studies: Map<string, DicomStudy>) => void;
  clearStudies: () => void;

  // Selection
  selectedStudyUID: string | null;
  selectedSeriesUID: string | null;
  selectedInstanceIndex: number;
  setSelectedStudy: (uid: string | null) => void;
  setSelectedSeries: (uid: string | null) => void;
  setSelectedInstanceIndex: (index: number) => void;

  // Get computed values
  getSelectedStudy: () => DicomStudy | null;
  getSelectedSeries: () => DicomSeries | null;
  getSelectedInstance: () => DicomInstance | null;

  // Scan Progress
  scanProgress: ScanProgress;
  setScanProgress: (progress: Partial<ScanProgress>) => void;
  resetScanProgress: () => void;

  // Viewer State
  viewerState: ViewerState;
  setViewerState: (state: Partial<ViewerState>) => void;
  resetViewerState: () => void;

  // Active Tool
  activeTool: ViewerTool;
  setActiveTool: (tool: ViewerTool) => void;

  // UI State
  isMetadataPanelOpen: boolean;
  toggleMetadataPanel: () => void;
  setMetadataPanelOpen: (open: boolean) => void;

  isSeriesPanelOpen: boolean;
  toggleSeriesPanel: () => void;

  // Modals
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;

  showAboutModal: boolean;
  setShowAboutModal: (show: boolean) => void;

  // Error handling
  lastError: string | null;
  setLastError: (error: string | null) => void;
}

const defaultViewerState: ViewerState = {
  windowCenter: 40,
  windowWidth: 400,
  zoom: 1,
  pan: { x: 0, y: 0 },
  rotation: 0,
  flipH: false,
  flipV: false,
  invert: false,
};

const defaultScanProgress: ScanProgress = {
  isScanning: false,
  filesFound: 0,
  filesParsed: 0,
  currentPath: '',
  errors: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.classList.toggle('light', newTheme === 'light');
    return { theme: newTheme };
  }),

  // Studies & Series
  studies: new Map(),
  setStudies: (studies) => set({ studies }),
  clearStudies: () => set({
    studies: new Map(),
    selectedStudyUID: null,
    selectedSeriesUID: null,
    selectedInstanceIndex: 0,
  }),

  // Selection
  selectedStudyUID: null,
  selectedSeriesUID: null,
  selectedInstanceIndex: 0,
  setSelectedStudy: (uid) => set({ selectedStudyUID: uid }),
  setSelectedSeries: (uid) => set({ selectedSeriesUID: uid, selectedInstanceIndex: 0 }),
  setSelectedInstanceIndex: (index) => set({ selectedInstanceIndex: index }),

  // Get computed values
  getSelectedStudy: () => {
    const { studies, selectedStudyUID } = get();
    return selectedStudyUID ? studies.get(selectedStudyUID) ?? null : null;
  },
  getSelectedSeries: () => {
    const study = get().getSelectedStudy();
    const { selectedSeriesUID } = get();
    return study && selectedSeriesUID ? study.series.get(selectedSeriesUID) ?? null : null;
  },
  getSelectedInstance: () => {
    const series = get().getSelectedSeries();
    const { selectedInstanceIndex } = get();
    if (!series) return null;
    const instances = series.sortedInstances.length > 0 ? series.sortedInstances : series.instances;
    return instances[selectedInstanceIndex] ?? null;
  },

  // Scan Progress
  scanProgress: defaultScanProgress,
  setScanProgress: (progress) => set((state) => ({
    scanProgress: { ...state.scanProgress, ...progress }
  })),
  resetScanProgress: () => set({ scanProgress: defaultScanProgress }),

  // Viewer State
  viewerState: defaultViewerState,
  setViewerState: (newState) => set((state) => ({
    viewerState: { ...state.viewerState, ...newState }
  })),
  resetViewerState: () => set({ viewerState: defaultViewerState }),

  // Active Tool
  activeTool: 'windowLevel',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // UI State
  isMetadataPanelOpen: true,
  toggleMetadataPanel: () => set((state) => ({ isMetadataPanelOpen: !state.isMetadataPanelOpen })),
  setMetadataPanelOpen: (open) => set({ isMetadataPanelOpen: open }),

  isSeriesPanelOpen: true,
  toggleSeriesPanel: () => set((state) => ({ isSeriesPanelOpen: !state.isSeriesPanelOpen })),

  // Modals
  showShortcutsModal: false,
  setShowShortcutsModal: (show) => set({ showShortcutsModal: show }),

  showAboutModal: false,
  setShowAboutModal: (show) => set({ showAboutModal: show }),

  // Error handling
  lastError: null,
  setLastError: (error) => set({ lastError: error }),
}));
