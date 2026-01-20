import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DicomTag } from '../types/dicom';
import { KEY_METADATA_TAGS, getDicomMetadata } from '../utils/dicomParser';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  SearchIcon,
  XIcon,
  LoadingSpinner,
} from './Icons';

interface MetadataRowProps {
  tag: DicomTag;
  isKeyTag: boolean;
}

const MetadataRow: React.FC<MetadataRowProps> = ({ tag, isKeyTag }) => {
  const displayValue = useMemo(() => {
    if (tag.value === null || tag.value === undefined) {
      return <span className="text-surface-500 italic">-</span>;
    }
    if (Array.isArray(tag.value)) {
      return tag.value.join(' \\ ');
    }
    if (typeof tag.value === 'string' && tag.value.startsWith('[')) {
      return <span className="text-surface-500 italic">{tag.value}</span>;
    }
    return String(tag.value);
  }, [tag.value]);

  return (
    <tr className={`border-b border-surface-800 dark:border-surface-800 light:border-surface-100 hover:bg-surface-800/30 dark:hover:bg-surface-800/30 light:hover:bg-surface-50 transition-colors ${isKeyTag ? 'bg-surface-850/50' : ''}`}>
      <td className="py-1.5 px-2 text-2xs text-surface-500 font-mono whitespace-nowrap align-top">
        {tag.tag}
      </td>
      <td className="py-1.5 px-2 text-xs text-surface-300 dark:text-surface-300 light:text-surface-700 font-medium align-top">
        {tag.name}
      </td>
      <td className="py-1.5 px-2 text-xs text-surface-200 dark:text-surface-200 light:text-surface-800 break-all align-top">
        {displayValue}
      </td>
    </tr>
  );
};

export const MetadataPanel: React.FC = () => {
  const {
    getSelectedInstance,
    isMetadataPanelOpen,
    toggleMetadataPanel,
  } = useAppStore();

  const [metadata, setMetadata] = useState<Map<string, DicomTag> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);

  const instance = getSelectedInstance();

  // Load metadata when instance changes
  useEffect(() => {
    if (!instance?.filePath) {
      setMetadata(null);
      return;
    }

    let cancelled = false;

    const loadMetadata = async () => {
      setIsLoading(true);
      try {
        const meta = await getDicomMetadata(instance.filePath);
        if (!cancelled) {
          setMetadata(meta);
        }
      } catch (error) {
        console.error('Error loading metadata:', error);
        if (!cancelled) {
          setMetadata(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [instance?.filePath]);

  // Filter and sort metadata
  const { keyTags, allTags } = useMemo(() => {
    if (!metadata) return { keyTags: [], allTags: [] };

    const key: DicomTag[] = [];
    const all: DicomTag[] = [];

    const query = searchQuery.toLowerCase();

    for (const [, tag] of metadata) {
      const matchesSearch = !query ||
        tag.name.toLowerCase().includes(query) ||
        tag.tag.toLowerCase().includes(query) ||
        (tag.value !== null && String(tag.value).toLowerCase().includes(query));

      if (!matchesSearch) continue;

      if (KEY_METADATA_TAGS.includes(tag.name)) {
        key.push(tag);
      }
      all.push(tag);
    }

    // Sort key tags by their position in KEY_METADATA_TAGS
    key.sort((a, b) => KEY_METADATA_TAGS.indexOf(a.name) - KEY_METADATA_TAGS.indexOf(b.name));

    // Sort all tags by tag number
    all.sort((a, b) => a.tag.localeCompare(b.tag));

    return { keyTags: key, allTags: all };
  }, [metadata, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  if (!isMetadataPanelOpen) {
    return (
      <div className="h-full flex flex-col bg-surface-900 dark:bg-surface-900 light:bg-white border-l border-surface-700 dark:border-surface-700 light:border-surface-200">
        <button
          className="p-2 hover:bg-surface-800 dark:hover:bg-surface-800 light:hover:bg-surface-100 transition-colors"
          onClick={toggleMetadataPanel}
          title="Expand metadata panel (M)"
        >
          <ChevronRightIcon size={16} className="text-surface-400 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-900 dark:bg-surface-900 light:bg-white border-l border-surface-700 dark:border-surface-700 light:border-surface-200 w-80">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-surface-700 dark:border-surface-700 light:border-surface-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-100 dark:text-surface-100 light:text-surface-900">
          DICOM Metadata
        </h2>
        <button
          className="btn-icon"
          onClick={toggleMetadataPanel}
          title="Collapse panel (M)"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-surface-700 dark:border-surface-700 light:border-surface-200">
        <div className="relative">
          <SearchIcon
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500"
          />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-8 pr-8 py-1.5 text-sm"
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
              onClick={handleClearSearch}
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!instance && (
          <div className="flex items-center justify-center h-full text-surface-500 text-sm">
            No image selected
          </div>
        )}

        {instance && isLoading && (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size={24} className="text-accent-500" />
          </div>
        )}

        {instance && !isLoading && !metadata && (
          <div className="flex items-center justify-center h-full text-surface-500 text-sm">
            Failed to load metadata
          </div>
        )}

        {instance && !isLoading && metadata && (
          <div className="p-2">
            {/* Key Tags Section */}
            {keyTags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wide px-2 py-1">
                  Key Information
                </h3>
                <table className="w-full">
                  <tbody>
                    {keyTags.map((tag) => (
                      <MetadataRow key={tag.tag} tag={tag} isKeyTag={true} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* All Tags Toggle */}
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-surface-400 uppercase tracking-wide hover:bg-surface-800 dark:hover:bg-surface-800 light:hover:bg-surface-100 rounded transition-colors"
              onClick={() => setShowAllTags(!showAllTags)}
            >
              {showAllTags ? (
                <ChevronDownIcon size={14} />
              ) : (
                <ChevronRightIcon size={14} />
              )}
              All Tags ({allTags.length})
            </button>

            {showAllTags && (
              <table className="w-full mt-1">
                <tbody>
                  {allTags.map((tag) => (
                    <MetadataRow
                      key={tag.tag}
                      tag={tag}
                      isKeyTag={KEY_METADATA_TAGS.includes(tag.name)}
                    />
                  ))}
                </tbody>
              </table>
            )}

            {searchQuery && allTags.length === 0 && (
              <div className="text-center text-surface-500 text-sm py-8">
                No tags matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
