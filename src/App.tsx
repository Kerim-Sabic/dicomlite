import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useDicomScanner } from './hooks/useDicomScanner';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { SeriesBrowser } from './components/SeriesBrowser';
import { Viewport } from './components/Viewport';
import { MetadataPanel } from './components/MetadataPanel';
import { ShortcutsModal, AboutModal } from './components/Modals';
import { ErrorToast } from './components/ErrorToast';
import {
  FolderOpenIcon,
  SunIcon,
  MoonIcon,
  KeyboardIcon,
  InfoIcon,
} from './components/Icons';

const App: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setShowShortcutsModal,
    setShowAboutModal,
    selectedInstanceIndex,
    setSelectedInstanceIndex,
    getSelectedSeries,
  } = useAppStore();

  const { openFolderDialog } = useDicomScanner();

  // Get series for navigation
  const series = getSelectedSeries();
  const instances = series?.sortedInstances.length
    ? series.sortedInstances
    : series?.instances || [];
  const maxIndex = Math.max(0, instances.length - 1);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onOpenFolder: openFolderDialog,
    onNextSlice: () => setSelectedInstanceIndex(Math.min(selectedInstanceIndex + 1, maxIndex)),
    onPrevSlice: () => setSelectedInstanceIndex(Math.max(selectedInstanceIndex - 1, 0)),
    // Note: zoom/fit/reset are handled by the Viewport component
  });

  // Set up IPC listeners for menu commands
  useEffect(() => {
    const cleanupFns: (() => void)[] = [];

    if (window.dicom) {
      cleanupFns.push(window.dicom.onMenuOpenFolder(openFolderDialog));
      cleanupFns.push(window.dicom.onToggleTheme(toggleTheme));
      cleanupFns.push(window.dicom.onShowShortcuts(() => setShowShortcutsModal(true)));
      cleanupFns.push(window.dicom.onShowAbout(() => setShowAboutModal(true)));
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [openFolderDialog, toggleTheme, setShowShortcutsModal, setShowAboutModal]);

  // Ensure theme class is set on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      {/* Header */}
      <header className="flex-shrink-0 h-12 bg-surface-900 dark:bg-surface-900 light:bg-white border-b border-surface-700 dark:border-surface-700 light:border-surface-200 flex items-center px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <span className="font-semibold text-surface-100 dark:text-surface-100 light:text-surface-900">
            DICOMLite
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost flex items-center gap-2"
            onClick={openFolderDialog}
          >
            <FolderOpenIcon size={16} />
            <span className="text-sm">Open Folder</span>
          </button>

          <div className="w-px h-5 bg-surface-700 mx-2" />

          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>

          <button
            className="btn-icon"
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard shortcuts (F1)"
          >
            <KeyboardIcon size={18} />
          </button>

          <button
            className="btn-icon"
            onClick={() => setShowAboutModal(true)}
            title="About DICOMLite"
          >
            <InfoIcon size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Series Browser */}
        <SeriesBrowser />

        {/* Center: Viewport */}
        <Viewport />

        {/* Right Panel: Metadata */}
        <MetadataPanel />
      </main>

      {/* Modals */}
      <ShortcutsModal />
      <AboutModal />

      {/* Error Toast */}
      <ErrorToast />
    </div>
  );
};

export default App;
