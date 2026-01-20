import { describe, it, expect } from 'vitest';
import {
  isTransferSyntaxSupported,
  getTransferSyntaxName,
  TRANSFER_SYNTAXES,
} from '../src/types/dicom';

describe('isTransferSyntaxSupported', () => {
  it('returns true for Implicit VR Little Endian', () => {
    expect(isTransferSyntaxSupported('1.2.840.10008.1.2')).toBe(true);
  });

  it('returns true for Explicit VR Little Endian', () => {
    expect(isTransferSyntaxSupported('1.2.840.10008.1.2.1')).toBe(true);
  });

  it('returns true for JPEG Baseline', () => {
    expect(isTransferSyntaxSupported('1.2.840.10008.1.2.4.50')).toBe(true);
  });

  it('returns true for JPEG Lossless', () => {
    expect(isTransferSyntaxSupported('1.2.840.10008.1.2.4.70')).toBe(true);
  });

  it('returns true for JPEG 2000', () => {
    expect(isTransferSyntaxSupported('1.2.840.10008.1.2.4.90')).toBe(true);
    expect(isTransferSyntaxSupported('1.2.840.10008.1.2.4.91')).toBe(true);
  });

  it('returns true for RLE Lossless', () => {
    expect(isTransferSyntaxSupported('1.2.840.10008.1.2.5')).toBe(true);
  });

  it('returns true for null (assumes implicit VR LE)', () => {
    expect(isTransferSyntaxSupported(null)).toBe(true);
  });

  it('returns false for unknown transfer syntax', () => {
    expect(isTransferSyntaxSupported('1.2.3.4.5.unknown')).toBe(false);
  });
});

describe('getTransferSyntaxName', () => {
  it('returns correct name for known syntaxes', () => {
    expect(getTransferSyntaxName('1.2.840.10008.1.2')).toBe('Implicit VR Little Endian');
    expect(getTransferSyntaxName('1.2.840.10008.1.2.1')).toBe('Explicit VR Little Endian');
    expect(getTransferSyntaxName('1.2.840.10008.1.2.4.50')).toBe('JPEG Baseline (Process 1)');
    expect(getTransferSyntaxName('1.2.840.10008.1.2.4.90')).toBe('JPEG 2000 Image Compression (Lossless Only)');
    expect(getTransferSyntaxName('1.2.840.10008.1.2.5')).toBe('RLE Lossless');
  });

  it('returns "Unknown" for null', () => {
    expect(getTransferSyntaxName(null)).toBe('Unknown');
  });

  it('returns formatted string for unknown UIDs', () => {
    const result = getTransferSyntaxName('1.2.3.4.5.unknown');
    expect(result).toContain('Unknown');
    expect(result).toContain('1.2.3.4.5.unknown');
  });
});

describe('TRANSFER_SYNTAXES', () => {
  it('contains all common transfer syntaxes', () => {
    const expectedSyntaxes = [
      '1.2.840.10008.1.2',      // Implicit VR LE
      '1.2.840.10008.1.2.1',    // Explicit VR LE
      '1.2.840.10008.1.2.2',    // Explicit VR BE
      '1.2.840.10008.1.2.4.50', // JPEG Baseline
      '1.2.840.10008.1.2.4.51', // JPEG Extended
      '1.2.840.10008.1.2.4.57', // JPEG Lossless P14
      '1.2.840.10008.1.2.4.70', // JPEG Lossless
      '1.2.840.10008.1.2.4.80', // JPEG-LS Lossless
      '1.2.840.10008.1.2.4.81', // JPEG-LS Lossy
      '1.2.840.10008.1.2.4.90', // JPEG 2000 Lossless
      '1.2.840.10008.1.2.4.91', // JPEG 2000
      '1.2.840.10008.1.2.5',    // RLE Lossless
    ];

    for (const uid of expectedSyntaxes) {
      expect(TRANSFER_SYNTAXES[uid]).toBeDefined();
      expect(TRANSFER_SYNTAXES[uid].uid).toBe(uid);
      expect(TRANSFER_SYNTAXES[uid].name).toBeTruthy();
      expect(typeof TRANSFER_SYNTAXES[uid].supported).toBe('boolean');
    }
  });

  it('all entries have required properties', () => {
    for (const [uid, syntax] of Object.entries(TRANSFER_SYNTAXES)) {
      expect(syntax.uid).toBe(uid);
      expect(typeof syntax.name).toBe('string');
      expect(syntax.name.length).toBeGreaterThan(0);
      expect(typeof syntax.supported).toBe('boolean');
    }
  });
});
