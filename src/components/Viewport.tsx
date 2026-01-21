import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useDicomScanner } from '../hooks/useDicomScanner';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import {
  FolderOpenIcon,
  LoadingSpinner,
  AlertIcon,
  ZoomInIcon,
  ZoomOutIcon,
  FitIcon,
  ResetIcon,
  WindowLevelIcon,
  PanIcon,
  ScrollIcon,
} from './Icons';

/**
 * Check if the Electron dicom API is available
 */
function isDicomApiAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.dicom !== 'undefined';
}

// Simplified viewport component that creates a basic canvas for DICOM display
export const Viewport: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState({
    windowCenter: 40,
    windowWidth: 400,
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  const {
    studies,
    getSelectedSeries,
    selectedInstanceIndex,
    setSelectedInstanceIndex,
    activeTool,
    setActiveTool,
    scanProgress,
  } = useAppStore();

  const { openFolderDialog, scanFolder } = useDicomScanner();

  // Drag and drop handling
  const handleDrop = useCallback(async (paths: string[]) => {
    // Find directories from dropped paths
    for (const path of paths) {
      // Try to scan as directory first
      await scanFolder(path);
      break; // Just handle first path for simplicity
    }
  }, [scanFolder]);

  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop: onDrop } =
    useDragAndDrop(handleDrop);

  // Load and render the current image
  const renderImage = useCallback(async () => {
    const series = getSelectedSeries();
    if (!series || !canvasRef.current) return;

    const instances = series.sortedInstances.length > 0 ? series.sortedInstances : series.instances;
    if (instances.length === 0) return;

    const instance = instances[selectedInstanceIndex];
    if (!instance) return;

    // Check if window.dicom is available before trying to read the file
    if (!isDicomApiAvailable()) {
      setError('DICOM file system API is not available. Please run this application in Electron.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Read the file
      const result = await window.dicom.readFile(instance.filePath);
      if (!result.success || !result.data) {
        throw new Error('Failed to read DICOM file');
      }

      // Parse pixel data using dicom-parser
      const { default: dicomParser } = await import('dicom-parser');
      const byteArray = new Uint8Array(result.data);
      const dataSet = dicomParser.parseDicom(byteArray);

      // Get image dimensions
      const rows = dataSet.uint16('x00280010') || 512;
      const columns = dataSet.uint16('x00280011') || 512;
      const bitsAllocated = dataSet.uint16('x00280100') || 16;
      const bitsStored = dataSet.uint16('x00280101') || 12;
      const pixelRepresentation = dataSet.uint16('x00280103') || 0;
      const rescaleSlope = parseFloat(dataSet.string('x00281053') || '1');
      const rescaleIntercept = parseFloat(dataSet.string('x00281052') || '0');

      // Get window/level from DICOM or use defaults
      let wc = viewerState.windowCenter;
      let ww = viewerState.windowWidth;
      const wcStr = dataSet.string('x00281050');
      const wwStr = dataSet.string('x00281051');
      if (wcStr && wwStr) {
        wc = parseFloat(wcStr.split('\\')[0]);
        ww = parseFloat(wwStr.split('\\')[0]);
        setViewerState(prev => ({ ...prev, windowCenter: wc, windowWidth: ww }));
      }

      // Get pixel data element
      const pixelDataElement = dataSet.elements['x7fe00010'];
      if (!pixelDataElement) {
        throw new Error('No pixel data found in DICOM file');
      }

      // Create canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      canvas.width = columns;
      canvas.height = rows;

      // Create image data
      const imageData = ctx.createImageData(columns, rows);

      // Read pixel values
      const pixelData = new DataView(byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length);

      // Calculate window/level bounds
      const windowLow = wc - ww / 2;
      const windowHigh = wc + ww / 2;

      // Process pixels
      const isSigned = pixelRepresentation === 1;
      const bytesPerPixel = bitsAllocated / 8;

      for (let i = 0; i < rows * columns; i++) {
        let pixelValue: number;

        if (bytesPerPixel === 2) {
          if (isSigned) {
            pixelValue = pixelData.getInt16(i * 2, true);
          } else {
            pixelValue = pixelData.getUint16(i * 2, true);
          }
        } else if (bytesPerPixel === 1) {
          pixelValue = pixelData.getUint8(i);
        } else {
          pixelValue = 0;
        }

        // Apply rescale
        const modalityValue = pixelValue * rescaleSlope + rescaleIntercept;

        // Apply window/level
        let displayValue: number;
        if (modalityValue <= windowLow) {
          displayValue = 0;
        } else if (modalityValue >= windowHigh) {
          displayValue = 255;
        } else {
          displayValue = Math.round(((modalityValue - windowLow) / ww) * 255);
        }

        // Set RGBA
        const idx = i * 4;
        imageData.data[idx] = displayValue;
        imageData.data[idx + 1] = displayValue;
        imageData.data[idx + 2] = displayValue;
        imageData.data[idx + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      setIsLoading(false);
    } catch (err) {
      console.error('Error rendering image:', err);
      setError(err instanceof Error ? err.message : 'Failed to render image');
      setIsLoading(false);
    }
  }, [getSelectedSeries, selectedInstanceIndex, viewerState.windowCenter, viewerState.windowWidth]);

  // Render image when selection changes
  useEffect(() => {
    renderImage();
  }, [renderImage]);

  // Handle mouse wheel for scrolling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const series = getSelectedSeries();
    if (!series) return;

    const instances = series.sortedInstances.length > 0 ? series.sortedInstances : series.instances;
    const maxIndex = instances.length - 1;

    if (e.deltaY > 0) {
      setSelectedInstanceIndex(Math.min(selectedInstanceIndex + 1, maxIndex));
    } else {
      setSelectedInstanceIndex(Math.max(selectedInstanceIndex - 1, 0));
    }
  }, [getSelectedSeries, selectedInstanceIndex, setSelectedInstanceIndex]);

  // Mouse interaction for window/level, pan, zoom
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastPosRef.current.x;
    const deltaY = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };

    if (activeTool === 'windowLevel') {
      setViewerState(prev => ({
        ...prev,
        windowCenter: prev.windowCenter + deltaY,
        windowWidth: Math.max(1, prev.windowWidth + deltaX * 2),
      }));
      // Re-render with new window/level
      requestAnimationFrame(renderImage);
    } else if (activeTool === 'pan') {
      setViewerState(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY,
      }));
    } else if (activeTool === 'zoom') {
      const zoomDelta = deltaY * -0.01;
      setViewerState(prev => ({
        ...prev,
        zoom: Math.max(0.1, Math.min(10, prev.zoom + zoomDelta)),
      }));
    }
  }, [activeTool, renderImage]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Viewer controls
  const zoomIn = () => setViewerState(prev => ({ ...prev, zoom: Math.min(10, prev.zoom * 1.25) }));
  const zoomOut = () => setViewerState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.25) }));
  const fitToWindow = () => setViewerState(prev => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));
  const resetView = () => setViewerState({ windowCenter: 40, windowWidth: 400, zoom: 1, panX: 0, panY: 0 });

  const hasStudies = studies.size > 0;
  const selectedSeries = getSelectedSeries();
  const instances = selectedSeries?.sortedInstances.length
    ? selectedSeries.sortedInstances
    : selectedSeries?.instances || [];
  const totalSlices = instances.length;

  // Electron not available state
  if (!isDicomApiAvailable()) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-950">
        <div className="max-w-md text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <AlertIcon size={40} className="text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-surface-100 mb-2">
            Electron Required
          </h2>
          <p className="text-surface-400 mb-4">
            DICOMLite requires the Electron desktop environment to access the file system.
            The DICOM API is not available when running in a web browser.
          </p>
          <p className="text-sm text-surface-500">
            To use this application, please run it using Electron:
          </p>
          <code className="block mt-3 p-3 bg-surface-800 rounded text-sm text-accent-400 font-mono">
            npm run electron:dev
          </code>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasStudies && !scanProgress.isScanning) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center bg-surface-950 ${isDragging ? 'drop-zone active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={onDrop}
      >
        <div className="max-w-md text-center p-8">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-accent-500/20' : 'bg-surface-800'}`}>
            <FolderOpenIcon
              size={40}
              className={`transition-colors ${isDragging ? 'text-accent-400' : 'text-surface-500'}`}
            />
          </div>
          <h2 className="text-xl font-semibold text-surface-100 mb-2">
            {isDragging ? 'Drop DICOM folder here' : 'Welcome to DICOMLite'}
          </h2>
          <p className="text-surface-400 mb-6">
            {isDragging
              ? 'Release to scan for DICOM files'
              : 'Open a folder containing DICOM files or drag and drop a folder here to get started.'}
          </p>
          {!isDragging && (
            <button
              className="btn-primary px-6 py-2.5"
              onClick={openFolderDialog}
            >
              Open DICOM Folder
            </button>
          )}
          <p className="text-xs text-surface-500 mt-6">
            Keyboard shortcut: Ctrl+O
          </p>
        </div>
      </div>
    );
  }

  // Scanning state
  if (scanProgress.isScanning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-950">
        <LoadingSpinner size={48} className="text-accent-500 mb-4" />
        <h3 className="text-lg font-medium text-surface-100 mb-2">Scanning for DICOM files...</h3>
        <p className="text-surface-400 mb-4">
          Found {scanProgress.filesFound} files · Parsed {scanProgress.filesParsed}
        </p>
        <div className="w-64 h-1 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full progress-bar rounded-full"
            style={{
              width: scanProgress.filesFound > 0
                ? `${Math.round((scanProgress.filesParsed / scanProgress.filesFound) * 100)}%`
                : '0%',
            }}
          />
        </div>
      </div>
    );
  }

  // No series selected
  if (!selectedSeries) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-950">
        <p className="text-surface-400">Select a series from the left panel</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Toolbar */}
      <div className="flex-shrink-0 h-10 bg-surface-900 border-b border-surface-700 flex items-center px-2 gap-1">
        {/* Tool buttons */}
        <div className="flex items-center gap-1 pr-2 border-r border-surface-700">
          <button
            className={`btn-icon ${activeTool === 'windowLevel' ? 'bg-accent-600 text-white' : ''}`}
            onClick={() => setActiveTool('windowLevel')}
            title="Window/Level (W)"
          >
            <WindowLevelIcon size={18} />
          </button>
          <button
            className={`btn-icon ${activeTool === 'pan' ? 'bg-accent-600 text-white' : ''}`}
            onClick={() => setActiveTool('pan')}
            title="Pan (P)"
          >
            <PanIcon size={18} />
          </button>
          <button
            className={`btn-icon ${activeTool === 'zoom' ? 'bg-accent-600 text-white' : ''}`}
            onClick={() => setActiveTool('zoom')}
            title="Zoom (Z)"
          >
            <ZoomInIcon size={18} />
          </button>
          <button
            className={`btn-icon ${activeTool === 'scroll' ? 'bg-accent-600 text-white' : ''}`}
            onClick={() => setActiveTool('scroll')}
            title="Scroll (S)"
          >
            <ScrollIcon size={18} />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 pr-2 border-r border-surface-700">
          <button className="btn-icon" onClick={zoomOut} title="Zoom Out (Ctrl+-)">
            <ZoomOutIcon size={18} />
          </button>
          <span className="text-xs text-surface-400 w-12 text-center">
            {Math.round(viewerState.zoom * 100)}%
          </span>
          <button className="btn-icon" onClick={zoomIn} title="Zoom In (Ctrl+=)">
            <ZoomInIcon size={18} />
          </button>
        </div>

        {/* Fit/Reset */}
        <div className="flex items-center gap-1">
          <button className="btn-icon" onClick={fitToWindow} title="Fit to Window (Ctrl+0)">
            <FitIcon size={18} />
          </button>
          <button className="btn-icon" onClick={resetView} title="Reset View (Ctrl+R)">
            <ResetIcon size={18} />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Info */}
        <div className="text-xs text-surface-400 pr-2">
          WC: {Math.round(viewerState.windowCenter)} · WW: {Math.round(viewerState.windowWidth)}
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        className="flex-1 relative overflow-hidden cursor-crosshair select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <LoadingSpinner size={32} className="text-accent-500" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <AlertIcon size={48} className="text-red-500 mb-4" />
            <p className="text-red-400 text-center max-w-md">{error}</p>
          </div>
        )}

        {/* Canvas container */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${viewerState.panX}px, ${viewerState.panY}px) scale(${viewerState.zoom})`,
          }}
        >
          <canvas ref={canvasRef} className="max-w-full max-h-full" />
        </div>

        {/* Overlays */}
        <div className="absolute top-3 left-3 text-xs text-white/80 font-mono bg-black/40 px-2 py-1 rounded pointer-events-none">
          <div>{selectedSeries.seriesDescription || 'Series'}</div>
          <div className="text-white/60">{selectedSeries.modality}</div>
        </div>

        <div className="absolute top-3 right-3 text-xs text-white/80 font-mono bg-black/40 px-2 py-1 rounded pointer-events-none text-right">
          <div>Slice {selectedInstanceIndex + 1} / {totalSlices}</div>
        </div>

        <div className="absolute bottom-3 left-3 text-xs text-white/80 font-mono bg-black/40 px-2 py-1 rounded pointer-events-none">
          <div>WC: {Math.round(viewerState.windowCenter)}</div>
          <div>WW: {Math.round(viewerState.windowWidth)}</div>
        </div>

        <div className="absolute bottom-3 right-3 text-xs text-white/80 font-mono bg-black/40 px-2 py-1 rounded pointer-events-none text-right">
          <div>Zoom: {Math.round(viewerState.zoom * 100)}%</div>
        </div>
      </div>
    </div>
  );
};
