import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AlertIcon, XIcon } from './Icons';

export const ErrorToast: React.FC = () => {
  const { lastError, setLastError } = useAppStore();

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!lastError) return;

    const timer = setTimeout(() => {
      setLastError(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [lastError, setLastError]);

  if (!lastError) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
      <div className="flex items-start gap-3 bg-red-950 border border-red-800 rounded-lg px-4 py-3 shadow-lg max-w-md">
        <AlertIcon size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-200">Error</p>
          <p className="text-sm text-red-300 mt-0.5">{lastError}</p>
        </div>
        <button
          className="flex-shrink-0 text-red-400 hover:text-red-200 transition-colors"
          onClick={() => setLastError(null)}
        >
          <XIcon size={18} />
        </button>
      </div>
    </div>
  );
};
