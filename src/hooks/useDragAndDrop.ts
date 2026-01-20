import { useState, useCallback, useEffect, DragEvent } from 'react';

interface UseDragAndDropReturn {
  isDragging: boolean;
  handleDragEnter: (e: DragEvent) => void;
  handleDragLeave: (e: DragEvent) => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
}

export function useDragAndDrop(
  onDrop: (paths: string[]) => void
): UseDragAndDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);

    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    // Get all file paths
    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // In Electron, we can get the path from the File object
      if ((file as any).path) {
        paths.push((file as any).path);
      }
    }

    if (paths.length > 0) {
      onDrop(paths);
    }
  }, [onDrop]);

  // Reset on window blur (in case drag left window)
  useEffect(() => {
    const handleBlur = () => {
      setIsDragging(false);
      setDragCounter(0);
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
