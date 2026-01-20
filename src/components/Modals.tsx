import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { XIcon, KeyboardIcon, InfoIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon, children }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div className="bg-surface-900 dark:bg-surface-900 light:bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 animate-slide-in border border-surface-700 dark:border-surface-700 light:border-surface-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700 dark:border-surface-700 light:border-surface-200">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-lg font-semibold text-surface-100 dark:text-surface-100 light:text-surface-900">
              {title}
            </h2>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            title="Close (Escape)"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ShortcutsModal: React.FC = () => {
  const { showShortcutsModal, setShowShortcutsModal } = useAppStore();

  return (
    <Modal
      isOpen={showShortcutsModal}
      onClose={() => setShowShortcutsModal(false)}
      title="Keyboard Shortcuts"
      icon={<KeyboardIcon size={22} className="text-accent-400" />}
    >
      <div className="space-y-6">
        {KEYBOARD_SHORTCUTS.map((category) => (
          <div key={category.category}>
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-2">
              {category.category}
            </h3>
            <div className="space-y-1">
              {category.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-sm text-surface-300 dark:text-surface-300 light:text-surface-700">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-0.5 text-xs font-mono bg-surface-800 dark:bg-surface-800 light:bg-surface-100 text-surface-300 dark:text-surface-300 light:text-surface-600 rounded border border-surface-700 dark:border-surface-700 light:border-surface-200">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export const AboutModal: React.FC = () => {
  const { showAboutModal, setShowAboutModal } = useAppStore();

  return (
    <Modal
      isOpen={showAboutModal}
      onClose={() => setShowAboutModal(false)}
      title="About DICOMLite"
      icon={<InfoIcon size={22} className="text-accent-400" />}
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">D</span>
        </div>
        <h3 className="text-xl font-semibold text-surface-100 dark:text-surface-100 light:text-surface-900 mb-1">
          DICOMLite
        </h3>
        <p className="text-sm text-surface-400 mb-4">Version 1.0.0</p>

        <div className="text-left space-y-4 text-sm text-surface-300 dark:text-surface-300 light:text-surface-700">
          <p>
            A minimal, local-first DICOM viewer for Windows. Designed for simplicity and privacy.
          </p>

          <div>
            <h4 className="font-medium text-surface-200 dark:text-surface-200 light:text-surface-800 mb-1">
              Supported Modalities
            </h4>
            <p className="text-surface-400">
              CT, MR, CR, DR, US, and other common DICOM modalities
            </p>
          </div>

          <div>
            <h4 className="font-medium text-surface-200 dark:text-surface-200 light:text-surface-800 mb-1">
              Supported Transfer Syntaxes
            </h4>
            <ul className="text-surface-400 text-xs space-y-0.5">
              <li>• Implicit/Explicit VR Little Endian</li>
              <li>• JPEG Baseline, Extended, Lossless</li>
              <li>• JPEG-LS (Lossless & Near-Lossless)</li>
              <li>• JPEG 2000 (Lossless & Lossy)</li>
              <li>• RLE Lossless</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-surface-200 dark:text-surface-200 light:text-surface-800 mb-1">
              Privacy
            </h4>
            <p className="text-surface-400">
              100% local processing. No data leaves your machine. No telemetry. No cloud.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-surface-700 dark:border-surface-700 light:border-surface-200">
          <p className="text-xs text-surface-500">
            Built with Electron, React, TypeScript, and dicom-parser
          </p>
        </div>
      </div>
    </Modal>
  );
};
