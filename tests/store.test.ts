import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../src/store/useAppStore';
import { DicomStudy, DicomSeries, DicomInstance } from '../src/types/dicom';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useAppStore.getState();
    store.clearStudies();
    store.resetScanProgress();
    store.resetViewerState();
    store.setActiveTool('windowLevel');
    store.setLastError(null);
  });

  describe('theme', () => {
    it('defaults to dark theme', () => {
      const { theme } = useAppStore.getState();
      expect(theme).toBe('dark');
    });

    it('toggles theme between dark and light', () => {
      const store = useAppStore.getState();

      store.toggleTheme();
      expect(useAppStore.getState().theme).toBe('light');

      store.toggleTheme();
      expect(useAppStore.getState().theme).toBe('dark');
    });
  });

  describe('studies management', () => {
    it('sets and gets studies', () => {
      const store = useAppStore.getState();
      const studies = createMockStudies();

      store.setStudies(studies);

      expect(useAppStore.getState().studies.size).toBe(1);
      expect(useAppStore.getState().studies.get('study1')).toBeDefined();
    });

    it('clears studies and selection', () => {
      const store = useAppStore.getState();
      const studies = createMockStudies();

      store.setStudies(studies);
      store.setSelectedStudy('study1');
      store.setSelectedSeries('series1');
      store.clearStudies();

      expect(useAppStore.getState().studies.size).toBe(0);
      expect(useAppStore.getState().selectedStudyUID).toBeNull();
      expect(useAppStore.getState().selectedSeriesUID).toBeNull();
    });
  });

  describe('selection', () => {
    it('sets selected study', () => {
      const store = useAppStore.getState();

      store.setSelectedStudy('study1');

      expect(useAppStore.getState().selectedStudyUID).toBe('study1');
    });

    it('sets selected series and resets instance index', () => {
      const store = useAppStore.getState();

      store.setSelectedInstanceIndex(5);
      store.setSelectedSeries('series1');

      expect(useAppStore.getState().selectedSeriesUID).toBe('series1');
      expect(useAppStore.getState().selectedInstanceIndex).toBe(0);
    });

    it('gets selected study correctly', () => {
      const store = useAppStore.getState();
      const studies = createMockStudies();

      store.setStudies(studies);
      store.setSelectedStudy('study1');

      const selectedStudy = store.getSelectedStudy();
      expect(selectedStudy).toBeDefined();
      expect(selectedStudy?.studyInstanceUID).toBe('study1');
    });

    it('gets selected series correctly', () => {
      const store = useAppStore.getState();
      const studies = createMockStudies();

      store.setStudies(studies);
      store.setSelectedStudy('study1');
      store.setSelectedSeries('series1');

      const selectedSeries = store.getSelectedSeries();
      expect(selectedSeries).toBeDefined();
      expect(selectedSeries?.seriesInstanceUID).toBe('series1');
    });

    it('returns null for selected study when none selected', () => {
      const store = useAppStore.getState();
      expect(store.getSelectedStudy()).toBeNull();
    });

    it('returns null for selected series when no study selected', () => {
      const store = useAppStore.getState();
      expect(store.getSelectedSeries()).toBeNull();
    });
  });

  describe('scan progress', () => {
    it('updates scan progress', () => {
      const store = useAppStore.getState();

      store.setScanProgress({ isScanning: true, filesFound: 100 });

      const { scanProgress } = useAppStore.getState();
      expect(scanProgress.isScanning).toBe(true);
      expect(scanProgress.filesFound).toBe(100);
    });

    it('resets scan progress', () => {
      const store = useAppStore.getState();

      store.setScanProgress({ isScanning: true, filesFound: 100, filesParsed: 50 });
      store.resetScanProgress();

      const { scanProgress } = useAppStore.getState();
      expect(scanProgress.isScanning).toBe(false);
      expect(scanProgress.filesFound).toBe(0);
      expect(scanProgress.filesParsed).toBe(0);
    });
  });

  describe('viewer state', () => {
    it('updates viewer state partially', () => {
      const store = useAppStore.getState();

      store.setViewerState({ windowCenter: 100, windowWidth: 200 });

      const { viewerState } = useAppStore.getState();
      expect(viewerState.windowCenter).toBe(100);
      expect(viewerState.windowWidth).toBe(200);
      expect(viewerState.zoom).toBe(1); // unchanged
    });

    it('resets viewer state', () => {
      const store = useAppStore.getState();

      store.setViewerState({ windowCenter: 100, zoom: 2 });
      store.resetViewerState();

      const { viewerState } = useAppStore.getState();
      expect(viewerState.windowCenter).toBe(40);
      expect(viewerState.zoom).toBe(1);
    });
  });

  describe('active tool', () => {
    it('sets active tool', () => {
      const store = useAppStore.getState();

      store.setActiveTool('pan');
      expect(useAppStore.getState().activeTool).toBe('pan');

      store.setActiveTool('zoom');
      expect(useAppStore.getState().activeTool).toBe('zoom');
    });
  });

  describe('UI state', () => {
    it('toggles metadata panel', () => {
      const store = useAppStore.getState();
      const initial = store.isMetadataPanelOpen;

      store.toggleMetadataPanel();
      expect(useAppStore.getState().isMetadataPanelOpen).toBe(!initial);

      store.toggleMetadataPanel();
      expect(useAppStore.getState().isMetadataPanelOpen).toBe(initial);
    });

    it('sets metadata panel open state', () => {
      const store = useAppStore.getState();

      store.setMetadataPanelOpen(false);
      expect(useAppStore.getState().isMetadataPanelOpen).toBe(false);

      store.setMetadataPanelOpen(true);
      expect(useAppStore.getState().isMetadataPanelOpen).toBe(true);
    });

    it('toggles series panel', () => {
      const store = useAppStore.getState();
      const initial = store.isSeriesPanelOpen;

      store.toggleSeriesPanel();
      expect(useAppStore.getState().isSeriesPanelOpen).toBe(!initial);
    });
  });

  describe('error handling', () => {
    it('sets and clears error', () => {
      const store = useAppStore.getState();

      store.setLastError('Test error');
      expect(useAppStore.getState().lastError).toBe('Test error');

      store.setLastError(null);
      expect(useAppStore.getState().lastError).toBeNull();
    });
  });
});

// Helper function to create mock studies
function createMockStudies(): Map<string, DicomStudy> {
  const instance: DicomInstance = {
    filePath: '/path/to/file.dcm',
    sopInstanceUID: 'sop1',
    instanceNumber: 1,
    imagePositionPatient: null,
    sliceLocation: null,
    acquisitionNumber: null,
    rows: 512,
    columns: 512,
    bitsAllocated: 16,
    bitsStored: 12,
    pixelRepresentation: 0,
    photometricInterpretation: 'MONOCHROME2',
    rescaleSlope: 1,
    rescaleIntercept: 0,
    windowCenter: 40,
    windowWidth: 400,
    numberOfFrames: null,
    transferSyntaxUID: '1.2.840.10008.1.2.1',
  };

  const series: DicomSeries = {
    seriesInstanceUID: 'series1',
    seriesNumber: 1,
    seriesDescription: 'Test Series',
    modality: 'CT',
    studyInstanceUID: 'study1',
    instances: [instance],
    sortedInstances: [instance],
  };

  const study: DicomStudy = {
    studyInstanceUID: 'study1',
    studyDate: '20231215',
    studyTime: '120000',
    studyDescription: 'Test Study',
    patientName: 'Test Patient',
    patientId: 'PATIENT001',
    patientBirthDate: '19800101',
    patientSex: 'M',
    accessionNumber: 'ACC001',
    institutionName: 'Test Hospital',
    referringPhysicianName: 'Dr. Test',
    series: new Map([['series1', series]]),
  };

  return new Map([['study1', study]]);
}
