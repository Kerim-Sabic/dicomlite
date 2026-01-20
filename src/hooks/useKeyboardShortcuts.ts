import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

interface KeyboardShortcutsConfig {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFit?: () => void;
  onReset?: () => void;
  onNextSlice?: () => void;
  onPrevSlice?: () => void;
  onOpenFolder?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig): void {
  const {
    setActiveTool,
    toggleMetadataPanel,
    toggleTheme,
    setShowShortcutsModal,
    setShowAboutModal,
  } = useAppStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;

    // Tool shortcuts (single keys)
    if (!ctrl && !shift && !event.altKey) {
      switch (key) {
        case 'w':
          event.preventDefault();
          setActiveTool('windowLevel');
          break;
        case 'p':
          event.preventDefault();
          setActiveTool('pan');
          break;
        case 'z':
          event.preventDefault();
          setActiveTool('zoom');
          break;
        case 's':
          event.preventDefault();
          setActiveTool('scroll');
          break;
        case 'arrowup':
        case 'pageup':
          event.preventDefault();
          config.onPrevSlice?.();
          break;
        case 'arrowdown':
        case 'pagedown':
          event.preventDefault();
          config.onNextSlice?.();
          break;
        case 'home':
          event.preventDefault();
          // Go to first slice - handled by viewer
          break;
        case 'end':
          event.preventDefault();
          // Go to last slice - handled by viewer
          break;
        case 'm':
          event.preventDefault();
          toggleMetadataPanel();
          break;
        case 'f1':
          event.preventDefault();
          setShowShortcutsModal(true);
          break;
        case 'escape':
          event.preventDefault();
          setShowShortcutsModal(false);
          setShowAboutModal(false);
          break;
      }
    }

    // Ctrl/Cmd shortcuts
    if (ctrl && !shift) {
      switch (key) {
        case 'o':
          event.preventDefault();
          config.onOpenFolder?.();
          break;
        case '=':
        case '+':
          event.preventDefault();
          config.onZoomIn?.();
          break;
        case '-':
          event.preventDefault();
          config.onZoomOut?.();
          break;
        case '0':
          event.preventDefault();
          config.onFit?.();
          break;
        case 'r':
          event.preventDefault();
          config.onReset?.();
          break;
      }
    }

    // Ctrl+Shift shortcuts
    if (ctrl && shift) {
      switch (key) {
        case 'd':
          event.preventDefault();
          toggleTheme();
          break;
      }
    }
  }, [
    config,
    setActiveTool,
    toggleMetadataPanel,
    toggleTheme,
    setShowShortcutsModal,
    setShowAboutModal,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = [
  { category: 'Tools', shortcuts: [
    { key: 'W', description: 'Window/Level tool' },
    { key: 'P', description: 'Pan tool' },
    { key: 'Z', description: 'Zoom tool' },
    { key: 'S', description: 'Scroll tool' },
  ]},
  { category: 'Navigation', shortcuts: [
    { key: '↑ / Page Up', description: 'Previous slice' },
    { key: '↓ / Page Down', description: 'Next slice' },
    { key: 'Mouse Wheel', description: 'Scroll slices' },
    { key: 'Home', description: 'First slice' },
    { key: 'End', description: 'Last slice' },
  ]},
  { category: 'View', shortcuts: [
    { key: 'Ctrl + =', description: 'Zoom in' },
    { key: 'Ctrl + -', description: 'Zoom out' },
    { key: 'Ctrl + 0', description: 'Fit to window' },
    { key: 'Ctrl + R', description: 'Reset view' },
    { key: 'M', description: 'Toggle metadata panel' },
    { key: 'Ctrl + Shift + D', description: 'Toggle dark/light mode' },
  ]},
  { category: 'File', shortcuts: [
    { key: 'Ctrl + O', description: 'Open folder' },
  ]},
  { category: 'Help', shortcuts: [
    { key: 'F1', description: 'Show keyboard shortcuts' },
    { key: 'Escape', description: 'Close dialogs' },
  ]},
];
