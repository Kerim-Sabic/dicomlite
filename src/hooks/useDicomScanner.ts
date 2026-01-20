import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { parseDicomFile, groupDicomFiles } from '../utils/dicomParser';
import { ParsedDicomFile } from '../types/dicom';

interface UseDicomScannerReturn {
  scanFolder: (folderPath: string) => Promise<void>;
  openFolderDialog: () => Promise<void>;
  cancelScan: () => Promise<void>;
  isScanning: boolean;
}

const BATCH_SIZE = 20; // Number of files to parse in each batch

export function useDicomScanner(): UseDicomScannerReturn {
  const {
    setStudies,
    setScanProgress,
    resetScanProgress,
    scanProgress,
    setSelectedStudy,
    setSelectedSeries,
    setLastError,
  } = useAppStore();

  const cancelledRef = useRef(false);

  const scanFolder = useCallback(async (folderPath: string) => {
    cancelledRef.current = false;
    resetScanProgress();
    setScanProgress({ isScanning: true, currentPath: folderPath });

    try {
      // Step 1: Scan for DICOM files
      const result = await window.dicom.scanDicomFolder(folderPath);

      if (!result.success || !result.files) {
        throw new Error(result.error || 'Failed to scan folder');
      }

      const files = result.files;
      setScanProgress({ filesFound: files.length });

      if (files.length === 0) {
        setLastError('No DICOM files found in the selected folder');
        setScanProgress({ isScanning: false });
        return;
      }

      // Step 2: Parse files in batches to keep UI responsive
      const parsedFiles: ParsedDicomFile[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        if (cancelledRef.current) {
          setScanProgress({ isScanning: false });
          return;
        }

        const batch = files.slice(i, i + BATCH_SIZE);

        // Parse batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (filePath) => {
            try {
              const fileResult = await window.dicom.readFile(filePath);
              if (!fileResult.success || !fileResult.data) {
                return { error: filePath };
              }

              const parsed = parseDicomFile(fileResult.data.buffer, filePath);
              if (!parsed) {
                return { error: filePath };
              }

              return { parsed };
            } catch {
              return { error: filePath };
            }
          })
        );

        // Collect results
        for (const result of batchResults) {
          if ('parsed' in result && result.parsed) {
            parsedFiles.push(result.parsed);
          } else if ('error' in result && result.error) {
            errors.push(result.error);
          }
        }

        // Update progress
        setScanProgress({
          filesParsed: parsedFiles.length,
          errors: errors.slice(0, 10), // Limit stored errors
        });

        // Yield to UI
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (cancelledRef.current) {
        setScanProgress({ isScanning: false });
        return;
      }

      // Step 3: Group into studies and series
      const studies = groupDicomFiles(parsedFiles);
      setStudies(studies);

      // Auto-select first study and series
      const firstStudy = studies.values().next().value;
      if (firstStudy) {
        setSelectedStudy(firstStudy.studyInstanceUID);
        const firstSeries = firstStudy.series.values().next().value;
        if (firstSeries) {
          setSelectedSeries(firstSeries.seriesInstanceUID);
        }
      }

      setScanProgress({ isScanning: false });

      // Show summary
      console.log(
        `Scan complete: ${studies.size} studies, ${parsedFiles.length} images, ${errors.length} errors`
      );
    } catch (error) {
      console.error('Scan error:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error during scan');
      setScanProgress({ isScanning: false });
    }
  }, [setStudies, setScanProgress, resetScanProgress, setSelectedStudy, setSelectedSeries, setLastError]);

  const openFolderDialog = useCallback(async () => {
    try {
      const folderPath = await window.dicom.openFolderDialog();
      if (folderPath) {
        await scanFolder(folderPath);
      }
    } catch (error) {
      console.error('Error opening folder dialog:', error);
      setLastError('Failed to open folder dialog');
    }
  }, [scanFolder, setLastError]);

  const cancelScan = useCallback(async () => {
    cancelledRef.current = true;
    await window.dicom.cancelScan();
    setScanProgress({ isScanning: false });
  }, [setScanProgress]);

  return {
    scanFolder,
    openFolderDialog,
    cancelScan,
    isScanning: scanProgress.isScanning,
  };
}
