/**
 * Core DICOM types for the application
 */

export interface DicomTag {
  tag: string;
  vr: string;
  name: string;
  value: string | number | string[] | number[] | null;
}

export interface DicomInstance {
  filePath: string;
  sopInstanceUID: string;
  instanceNumber: number | null;
  imagePositionPatient: number[] | null;
  sliceLocation: number | null;
  acquisitionNumber: number | null;
  rows: number | null;
  columns: number | null;
  bitsAllocated: number | null;
  bitsStored: number | null;
  pixelRepresentation: number | null;
  photometricInterpretation: string | null;
  rescaleSlope: number | null;
  rescaleIntercept: number | null;
  windowCenter: number | number[] | null;
  windowWidth: number | number[] | null;
  numberOfFrames: number | null;
  transferSyntaxUID: string | null;
}

export interface DicomSeries {
  seriesInstanceUID: string;
  seriesNumber: number | null;
  seriesDescription: string | null;
  modality: string;
  studyInstanceUID: string;
  instances: DicomInstance[];
  sortedInstances: DicomInstance[];
  thumbnailImageId?: string;
}

export interface DicomStudy {
  studyInstanceUID: string;
  studyDate: string | null;
  studyTime: string | null;
  studyDescription: string | null;
  patientName: string | null;
  patientId: string | null;
  patientBirthDate: string | null;
  patientSex: string | null;
  accessionNumber: string | null;
  institutionName: string | null;
  referringPhysicianName: string | null;
  series: Map<string, DicomSeries>;
}

export interface ParsedDicomFile {
  filePath: string;
  studyInstanceUID: string;
  seriesInstanceUID: string;
  sopInstanceUID: string;
  instance: DicomInstance;
  studyInfo: Partial<DicomStudy>;
  seriesInfo: Partial<DicomSeries>;
  metadata: Map<string, DicomTag>;
}

export interface ScanResult {
  studies: Map<string, DicomStudy>;
  totalFiles: number;
  parsedFiles: number;
  errorFiles: string[];
}

export interface ViewerState {
  windowCenter: number;
  windowWidth: number;
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  invert: boolean;
}

export type ViewerTool = 'windowLevel' | 'pan' | 'zoom' | 'scroll';

export interface TransferSyntax {
  uid: string;
  name: string;
  supported: boolean;
}

export const TRANSFER_SYNTAXES: Record<string, TransferSyntax> = {
  '1.2.840.10008.1.2': { uid: '1.2.840.10008.1.2', name: 'Implicit VR Little Endian', supported: true },
  '1.2.840.10008.1.2.1': { uid: '1.2.840.10008.1.2.1', name: 'Explicit VR Little Endian', supported: true },
  '1.2.840.10008.1.2.2': { uid: '1.2.840.10008.1.2.2', name: 'Explicit VR Big Endian', supported: true },
  '1.2.840.10008.1.2.1.99': { uid: '1.2.840.10008.1.2.1.99', name: 'Deflated Explicit VR Little Endian', supported: true },
  '1.2.840.10008.1.2.4.50': { uid: '1.2.840.10008.1.2.4.50', name: 'JPEG Baseline (Process 1)', supported: true },
  '1.2.840.10008.1.2.4.51': { uid: '1.2.840.10008.1.2.4.51', name: 'JPEG Extended (Process 2 & 4)', supported: true },
  '1.2.840.10008.1.2.4.57': { uid: '1.2.840.10008.1.2.4.57', name: 'JPEG Lossless, Non-Hierarchical (Process 14)', supported: true },
  '1.2.840.10008.1.2.4.70': { uid: '1.2.840.10008.1.2.4.70', name: 'JPEG Lossless, Non-Hierarchical, First-Order Prediction', supported: true },
  '1.2.840.10008.1.2.4.80': { uid: '1.2.840.10008.1.2.4.80', name: 'JPEG-LS Lossless Image Compression', supported: true },
  '1.2.840.10008.1.2.4.81': { uid: '1.2.840.10008.1.2.4.81', name: 'JPEG-LS Lossy (Near-Lossless) Image Compression', supported: true },
  '1.2.840.10008.1.2.4.90': { uid: '1.2.840.10008.1.2.4.90', name: 'JPEG 2000 Image Compression (Lossless Only)', supported: true },
  '1.2.840.10008.1.2.4.91': { uid: '1.2.840.10008.1.2.4.91', name: 'JPEG 2000 Image Compression', supported: true },
  '1.2.840.10008.1.2.5': { uid: '1.2.840.10008.1.2.5', name: 'RLE Lossless', supported: true },
};

export function isTransferSyntaxSupported(uid: string | null): boolean {
  if (!uid) return true; // Assume implicit VR LE if not specified
  return TRANSFER_SYNTAXES[uid]?.supported ?? false;
}

export function getTransferSyntaxName(uid: string | null): string {
  if (!uid) return 'Unknown';
  return TRANSFER_SYNTAXES[uid]?.name ?? `Unknown (${uid})`;
}
