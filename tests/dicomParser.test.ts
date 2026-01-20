import { describe, it, expect } from 'vitest';
import { sortInstances, groupDicomFiles } from '../src/utils/dicomParser';
import { DicomInstance, ParsedDicomFile } from '../src/types/dicom';

describe('sortInstances', () => {
  it('sorts by ImagePositionPatient Z coordinate', () => {
    const instances: DicomInstance[] = [
      createInstance({ imagePositionPatient: [0, 0, 30], instanceNumber: 3 }),
      createInstance({ imagePositionPatient: [0, 0, 10], instanceNumber: 1 }),
      createInstance({ imagePositionPatient: [0, 0, 20], instanceNumber: 2 }),
    ];

    const sorted = sortInstances(instances);

    expect(sorted[0].imagePositionPatient![2]).toBe(10);
    expect(sorted[1].imagePositionPatient![2]).toBe(20);
    expect(sorted[2].imagePositionPatient![2]).toBe(30);
  });

  it('sorts by SliceLocation when ImagePositionPatient is not available', () => {
    const instances: DicomInstance[] = [
      createInstance({ sliceLocation: 30, instanceNumber: 3 }),
      createInstance({ sliceLocation: 10, instanceNumber: 1 }),
      createInstance({ sliceLocation: 20, instanceNumber: 2 }),
    ];

    const sorted = sortInstances(instances);

    expect(sorted[0].sliceLocation).toBe(10);
    expect(sorted[1].sliceLocation).toBe(20);
    expect(sorted[2].sliceLocation).toBe(30);
  });

  it('sorts by InstanceNumber as fallback', () => {
    const instances: DicomInstance[] = [
      createInstance({ instanceNumber: 3 }),
      createInstance({ instanceNumber: 1 }),
      createInstance({ instanceNumber: 2 }),
    ];

    const sorted = sortInstances(instances);

    expect(sorted[0].instanceNumber).toBe(1);
    expect(sorted[1].instanceNumber).toBe(2);
    expect(sorted[2].instanceNumber).toBe(3);
  });

  it('handles mixed available sorting criteria', () => {
    const instances: DicomInstance[] = [
      createInstance({ imagePositionPatient: [0, 0, 30] }),
      createInstance({ sliceLocation: 10 }),
      createInstance({ instanceNumber: 2 }),
    ];

    // Should not throw and should return a sorted array
    const sorted = sortInstances(instances);
    expect(sorted).toHaveLength(3);
  });

  it('handles empty array', () => {
    const sorted = sortInstances([]);
    expect(sorted).toHaveLength(0);
  });

  it('handles single instance', () => {
    const instances = [createInstance({ instanceNumber: 1 })];
    const sorted = sortInstances(instances);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].instanceNumber).toBe(1);
  });
});

describe('groupDicomFiles', () => {
  it('groups files by StudyInstanceUID and SeriesInstanceUID', () => {
    const files: ParsedDicomFile[] = [
      createParsedFile('study1', 'series1', 'sop1'),
      createParsedFile('study1', 'series1', 'sop2'),
      createParsedFile('study1', 'series2', 'sop3'),
      createParsedFile('study2', 'series3', 'sop4'),
    ];

    const studies = groupDicomFiles(files);

    expect(studies.size).toBe(2);

    const study1 = studies.get('study1');
    expect(study1).toBeDefined();
    expect(study1!.series.size).toBe(2);

    const series1 = study1!.series.get('series1');
    expect(series1).toBeDefined();
    expect(series1!.instances).toHaveLength(2);

    const series2 = study1!.series.get('series2');
    expect(series2).toBeDefined();
    expect(series2!.instances).toHaveLength(1);

    const study2 = studies.get('study2');
    expect(study2).toBeDefined();
    expect(study2!.series.size).toBe(1);
  });

  it('populates study info from parsed files', () => {
    const files: ParsedDicomFile[] = [
      createParsedFile('study1', 'series1', 'sop1', {
        studyDate: '20231215',
        patientName: 'Test Patient',
      }),
    ];

    const studies = groupDicomFiles(files);
    const study = studies.get('study1');

    expect(study?.studyDate).toBe('20231215');
    expect(study?.patientName).toBe('Test Patient');
  });

  it('populates series info from parsed files', () => {
    const files: ParsedDicomFile[] = [
      createParsedFile('study1', 'series1', 'sop1', {}, {
        modality: 'CT',
        seriesDescription: 'Chest CT',
        seriesNumber: 1,
      }),
    ];

    const studies = groupDicomFiles(files);
    const series = studies.get('study1')?.series.get('series1');

    expect(series?.modality).toBe('CT');
    expect(series?.seriesDescription).toBe('Chest CT');
    expect(series?.seriesNumber).toBe(1);
  });

  it('sorts instances within series', () => {
    const files: ParsedDicomFile[] = [
      createParsedFile('study1', 'series1', 'sop1', {}, {}, { instanceNumber: 3 }),
      createParsedFile('study1', 'series1', 'sop2', {}, {}, { instanceNumber: 1 }),
      createParsedFile('study1', 'series1', 'sop3', {}, {}, { instanceNumber: 2 }),
    ];

    const studies = groupDicomFiles(files);
    const series = studies.get('study1')?.series.get('series1');

    expect(series?.sortedInstances[0].instanceNumber).toBe(1);
    expect(series?.sortedInstances[1].instanceNumber).toBe(2);
    expect(series?.sortedInstances[2].instanceNumber).toBe(3);
  });

  it('handles empty array', () => {
    const studies = groupDicomFiles([]);
    expect(studies.size).toBe(0);
  });
});

// Helper functions for creating test data
function createInstance(overrides: Partial<DicomInstance> = {}): DicomInstance {
  return {
    filePath: `/path/to/file_${Math.random()}.dcm`,
    sopInstanceUID: `1.2.3.${Math.random()}`,
    instanceNumber: null,
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
    ...overrides,
  };
}

function createParsedFile(
  studyUID: string,
  seriesUID: string,
  sopUID: string,
  studyInfo: Partial<ParsedDicomFile['studyInfo']> = {},
  seriesInfo: Partial<ParsedDicomFile['seriesInfo']> = {},
  instanceInfo: Partial<DicomInstance> = {}
): ParsedDicomFile {
  return {
    filePath: `/path/to/${sopUID}.dcm`,
    studyInstanceUID: studyUID,
    seriesInstanceUID: seriesUID,
    sopInstanceUID: sopUID,
    instance: createInstance({ sopInstanceUID: sopUID, ...instanceInfo }),
    studyInfo: {
      studyInstanceUID: studyUID,
      studyDate: null,
      studyTime: null,
      studyDescription: null,
      patientName: null,
      patientId: null,
      patientBirthDate: null,
      patientSex: null,
      accessionNumber: null,
      institutionName: null,
      referringPhysicianName: null,
      ...studyInfo,
    },
    seriesInfo: {
      seriesInstanceUID: seriesUID,
      seriesNumber: null,
      seriesDescription: null,
      modality: 'OT',
      studyInstanceUID: studyUID,
      ...seriesInfo,
    },
    metadata: new Map(),
  };
}
