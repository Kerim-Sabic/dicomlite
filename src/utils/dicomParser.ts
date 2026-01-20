import dicomParser from 'dicom-parser';
import {
  DicomInstance,
  DicomSeries,
  DicomStudy,
  DicomTag,
  ParsedDicomFile,
} from '../types/dicom';

/**
 * DICOM Tag Dictionary - Common tags with their names
 */
const TAG_DICTIONARY: Record<string, string> = {
  'x00020010': 'TransferSyntaxUID',
  'x00080005': 'SpecificCharacterSet',
  'x00080008': 'ImageType',
  'x00080016': 'SOPClassUID',
  'x00080018': 'SOPInstanceUID',
  'x00080020': 'StudyDate',
  'x00080021': 'SeriesDate',
  'x00080030': 'StudyTime',
  'x00080031': 'SeriesTime',
  'x00080050': 'AccessionNumber',
  'x00080060': 'Modality',
  'x00080070': 'Manufacturer',
  'x00080080': 'InstitutionName',
  'x00080090': 'ReferringPhysicianName',
  'x00081030': 'StudyDescription',
  'x0008103e': 'SeriesDescription',
  'x00100010': 'PatientName',
  'x00100020': 'PatientID',
  'x00100030': 'PatientBirthDate',
  'x00100040': 'PatientSex',
  'x00180050': 'SliceThickness',
  'x00180088': 'SpacingBetweenSlices',
  'x00181020': 'SoftwareVersions',
  'x00185100': 'PatientPosition',
  'x0020000d': 'StudyInstanceUID',
  'x0020000e': 'SeriesInstanceUID',
  'x00200010': 'StudyID',
  'x00200011': 'SeriesNumber',
  'x00200012': 'AcquisitionNumber',
  'x00200013': 'InstanceNumber',
  'x00200032': 'ImagePositionPatient',
  'x00200037': 'ImageOrientationPatient',
  'x00201041': 'SliceLocation',
  'x00280002': 'SamplesPerPixel',
  'x00280004': 'PhotometricInterpretation',
  'x00280010': 'Rows',
  'x00280011': 'Columns',
  'x00280030': 'PixelSpacing',
  'x00280100': 'BitsAllocated',
  'x00280101': 'BitsStored',
  'x00280102': 'HighBit',
  'x00280103': 'PixelRepresentation',
  'x00281050': 'WindowCenter',
  'x00281051': 'WindowWidth',
  'x00281052': 'RescaleIntercept',
  'x00281053': 'RescaleSlope',
  'x00281054': 'RescaleType',
  'x00280008': 'NumberOfFrames',
  'x7fe00010': 'PixelData',
};

/**
 * Key tags that should be displayed first in the metadata panel
 */
export const KEY_METADATA_TAGS = [
  'PatientName',
  'PatientID',
  'PatientBirthDate',
  'PatientSex',
  'StudyDate',
  'StudyTime',
  'StudyDescription',
  'Modality',
  'SeriesDescription',
  'SeriesNumber',
  'InstanceNumber',
  'Rows',
  'Columns',
  'BitsAllocated',
  'BitsStored',
  'WindowCenter',
  'WindowWidth',
  'RescaleSlope',
  'RescaleIntercept',
  'PhotometricInterpretation',
  'TransferSyntaxUID',
];

/**
 * Get string value from DICOM dataset
 */
function getString(dataSet: dicomParser.DataSet, tag: string): string | null {
  try {
    const value = dataSet.string(tag);
    return value !== undefined ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Get numeric value from DICOM dataset
 */
function getNumber(dataSet: dicomParser.DataSet, tag: string): number | null {
  try {
    const strValue = dataSet.string(tag);
    if (strValue === undefined) return null;
    const num = parseFloat(strValue);
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
}

/**
 * Get integer value from DICOM dataset
 */
function getInt(dataSet: dicomParser.DataSet, tag: string): number | null {
  try {
    const value = dataSet.uint16(tag);
    return value !== undefined ? value : null;
  } catch {
    return null;
  }
}

/**
 * Get array of numbers from DICOM dataset (e.g., ImagePositionPatient)
 */
function getNumberArray(dataSet: dicomParser.DataSet, tag: string): number[] | null {
  try {
    const strValue = dataSet.string(tag);
    if (strValue === undefined) return null;
    const parts = strValue.split('\\').map((s) => parseFloat(s.trim()));
    if (parts.some(isNaN)) return null;
    return parts;
  } catch {
    return null;
  }
}

/**
 * Parse DICOM file from ArrayBuffer
 */
export function parseDicomFile(
  arrayBuffer: ArrayBuffer,
  filePath: string
): ParsedDicomFile | null {
  try {
    const byteArray = new Uint8Array(arrayBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    // Required UIDs
    const studyInstanceUID = getString(dataSet, 'x0020000d');
    const seriesInstanceUID = getString(dataSet, 'x0020000e');
    const sopInstanceUID = getString(dataSet, 'x00080018');

    if (!studyInstanceUID || !seriesInstanceUID || !sopInstanceUID) {
      return null;
    }

    // Window values can be arrays
    let windowCenter: number | number[] | null = null;
    let windowWidth: number | number[] | null = null;
    const wcStr = getString(dataSet, 'x00281050');
    const wwStr = getString(dataSet, 'x00281051');
    if (wcStr) {
      const wcParts = wcStr.split('\\').map((s) => parseFloat(s.trim()));
      windowCenter = wcParts.length === 1 ? wcParts[0] : wcParts;
    }
    if (wwStr) {
      const wwParts = wwStr.split('\\').map((s) => parseFloat(s.trim()));
      windowWidth = wwParts.length === 1 ? wwParts[0] : wwParts;
    }

    // Build instance info
    const instance: DicomInstance = {
      filePath,
      sopInstanceUID,
      instanceNumber: getNumber(dataSet, 'x00200013'),
      imagePositionPatient: getNumberArray(dataSet, 'x00200032'),
      sliceLocation: getNumber(dataSet, 'x00201041'),
      acquisitionNumber: getNumber(dataSet, 'x00200012'),
      rows: getInt(dataSet, 'x00280010'),
      columns: getInt(dataSet, 'x00280011'),
      bitsAllocated: getInt(dataSet, 'x00280100'),
      bitsStored: getInt(dataSet, 'x00280101'),
      pixelRepresentation: getInt(dataSet, 'x00280103'),
      photometricInterpretation: getString(dataSet, 'x00280004'),
      rescaleSlope: getNumber(dataSet, 'x00281053') ?? 1,
      rescaleIntercept: getNumber(dataSet, 'x00281052') ?? 0,
      windowCenter,
      windowWidth,
      numberOfFrames: getNumber(dataSet, 'x00280008'),
      transferSyntaxUID: getString(dataSet, 'x00020010'),
    };

    // Build study info
    const studyInfo: Partial<DicomStudy> = {
      studyInstanceUID,
      studyDate: getString(dataSet, 'x00080020'),
      studyTime: getString(dataSet, 'x00080030'),
      studyDescription: getString(dataSet, 'x00081030'),
      patientName: formatPatientName(getString(dataSet, 'x00100010')),
      patientId: getString(dataSet, 'x00100020'),
      patientBirthDate: getString(dataSet, 'x00100030'),
      patientSex: getString(dataSet, 'x00100040'),
      accessionNumber: getString(dataSet, 'x00080050'),
      institutionName: getString(dataSet, 'x00080080'),
      referringPhysicianName: getString(dataSet, 'x00080090'),
    };

    // Build series info
    const seriesInfo: Partial<DicomSeries> = {
      seriesInstanceUID,
      seriesNumber: getNumber(dataSet, 'x00200011'),
      seriesDescription: getString(dataSet, 'x0008103e'),
      modality: getString(dataSet, 'x00080060') ?? 'OT',
      studyInstanceUID,
    };

    // Extract all metadata
    const metadata = new Map<string, DicomTag>();
    const elements = dataSet.elements;

    for (const tag in elements) {
      if (tag === 'x7fe00010') continue; // Skip pixel data

      const element = elements[tag];
      const tagName = TAG_DICTIONARY[tag] ?? formatTagString(tag);

      let value: string | number | string[] | number[] | null = null;

      try {
        if (element.vr === 'SQ') {
          value = '[Sequence]';
        } else if (element.length > 256) {
          value = `[Binary data: ${element.length} bytes]`;
        } else {
          const strValue = dataSet.string(tag);
          if (strValue !== undefined) {
            value = strValue.includes('\\') ? strValue.split('\\') : strValue;
          }
        }
      } catch {
        value = null;
      }

      metadata.set(tag, {
        tag: formatTagString(tag),
        vr: element.vr ?? 'UN',
        name: tagName,
        value,
      });
    }

    return {
      filePath,
      studyInstanceUID,
      seriesInstanceUID,
      sopInstanceUID,
      instance,
      studyInfo,
      seriesInfo,
      metadata,
    };
  } catch (error) {
    console.error('Error parsing DICOM file:', filePath, error);
    return null;
  }
}

/**
 * Format patient name (replace ^ with space)
 */
function formatPatientName(name: string | null): string | null {
  if (!name) return null;
  return name.replace(/\^/g, ' ').trim();
}

/**
 * Format tag string to standard format (0008,0018)
 */
function formatTagString(tag: string): string {
  if (tag.startsWith('x')) {
    const hex = tag.substring(1);
    return `(${hex.substring(0, 4)},${hex.substring(4)})`.toUpperCase();
  }
  return tag;
}

/**
 * Sort instances by position/number
 */
export function sortInstances(instances: DicomInstance[]): DicomInstance[] {
  return [...instances].sort((a, b) => {
    // First try ImagePositionPatient Z coordinate
    if (a.imagePositionPatient && b.imagePositionPatient) {
      const zDiff = a.imagePositionPatient[2] - b.imagePositionPatient[2];
      if (Math.abs(zDiff) > 0.001) return zDiff;
    }

    // Then try SliceLocation
    if (a.sliceLocation !== null && b.sliceLocation !== null) {
      const sliceDiff = a.sliceLocation - b.sliceLocation;
      if (Math.abs(sliceDiff) > 0.001) return sliceDiff;
    }

    // Then try InstanceNumber
    if (a.instanceNumber !== null && b.instanceNumber !== null) {
      return a.instanceNumber - b.instanceNumber;
    }

    // Then try AcquisitionNumber
    if (a.acquisitionNumber !== null && b.acquisitionNumber !== null) {
      return a.acquisitionNumber - b.acquisitionNumber;
    }

    // Finally, fall back to file path
    return a.filePath.localeCompare(b.filePath);
  });
}

/**
 * Group parsed files into studies and series
 */
export function groupDicomFiles(parsedFiles: ParsedDicomFile[]): Map<string, DicomStudy> {
  const studies = new Map<string, DicomStudy>();

  for (const file of parsedFiles) {
    // Get or create study
    let study = studies.get(file.studyInstanceUID);
    if (!study) {
      study = {
        studyInstanceUID: file.studyInstanceUID,
        studyDate: file.studyInfo.studyDate ?? null,
        studyTime: file.studyInfo.studyTime ?? null,
        studyDescription: file.studyInfo.studyDescription ?? null,
        patientName: file.studyInfo.patientName ?? null,
        patientId: file.studyInfo.patientId ?? null,
        patientBirthDate: file.studyInfo.patientBirthDate ?? null,
        patientSex: file.studyInfo.patientSex ?? null,
        accessionNumber: file.studyInfo.accessionNumber ?? null,
        institutionName: file.studyInfo.institutionName ?? null,
        referringPhysicianName: file.studyInfo.referringPhysicianName ?? null,
        series: new Map(),
      };
      studies.set(file.studyInstanceUID, study);
    }

    // Get or create series
    let series = study.series.get(file.seriesInstanceUID);
    if (!series) {
      series = {
        seriesInstanceUID: file.seriesInstanceUID,
        seriesNumber: file.seriesInfo.seriesNumber ?? null,
        seriesDescription: file.seriesInfo.seriesDescription ?? null,
        modality: file.seriesInfo.modality ?? 'OT',
        studyInstanceUID: file.studyInstanceUID,
        instances: [],
        sortedInstances: [],
      };
      study.series.set(file.seriesInstanceUID, series);
    }

    // Add instance to series
    series.instances.push(file.instance);
  }

  // Sort instances within each series
  for (const study of studies.values()) {
    for (const series of study.series.values()) {
      series.sortedInstances = sortInstances(series.instances);
    }
  }

  return studies;
}

/**
 * Get DICOM metadata from file for display
 */
export async function getDicomMetadata(
  filePath: string
): Promise<Map<string, DicomTag> | null> {
  try {
    const result = await window.dicom.readFile(filePath);
    if (!result.success || !result.data) return null;

    const parsed = parseDicomFile(result.data.buffer, filePath);
    return parsed?.metadata ?? null;
  } catch {
    return null;
  }
}
