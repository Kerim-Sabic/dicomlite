import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useAppStore } from '../store/useAppStore';
import { DicomStudy, DicomSeries } from '../types/dicom';
import { ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon, ImageIcon } from './Icons';

interface SeriesItemProps {
  series: DicomSeries;
  isSelected: boolean;
  onClick: () => void;
}

const SeriesItem: React.FC<SeriesItemProps> = ({ series, isSelected, onClick }) => {
  const instances = series.sortedInstances.length > 0 ? series.sortedInstances : series.instances;
  const imageCount = instances.length;

  return (
    <div
      className={`series-item ${isSelected ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-surface-800 dark:bg-surface-800 light:bg-surface-100 rounded flex items-center justify-center">
          <ImageIcon size={24} className="text-surface-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold uppercase tracking-wide bg-accent-600/20 text-accent-400">
              {series.modality}
            </span>
            {series.seriesNumber !== null && (
              <span className="text-2xs text-surface-500">
                #{series.seriesNumber}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-surface-200 dark:text-surface-200 light:text-surface-800 truncate">
            {series.seriesDescription || 'Unnamed Series'}
          </p>
          <p className="mt-0.5 text-xs text-surface-500">
            {imageCount} {imageCount === 1 ? 'image' : 'images'}
          </p>
        </div>
      </div>
    </div>
  );
};

interface StudyHeaderProps {
  study: DicomStudy;
  isExpanded: boolean;
  onToggle: () => void;
}

const StudyHeader: React.FC<StudyHeaderProps> = ({ study, isExpanded, onToggle }) => {
  const seriesCount = study.series.size;
  const studyDate = study.studyDate
    ? formatDate(study.studyDate)
    : 'Unknown date';

  return (
    <div
      className="px-3 py-2 bg-surface-850 dark:bg-surface-850 light:bg-surface-50 border-b border-surface-700 dark:border-surface-700 light:border-surface-200 cursor-pointer hover:bg-surface-800 dark:hover:bg-surface-800 light:hover:bg-surface-100 transition-colors"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
    >
      <div className="flex items-center gap-2">
        {isExpanded ? (
          <ChevronDownIcon size={16} className="text-surface-400" />
        ) : (
          <ChevronUpIcon size={16} className="text-surface-400" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-100 dark:text-surface-100 light:text-surface-900 truncate">
            {study.patientName || 'Unknown Patient'}
          </p>
          <p className="text-xs text-surface-500 truncate">
            {studyDate} · {seriesCount} {seriesCount === 1 ? 'series' : 'series'} · {study.studyDescription || 'No description'}
          </p>
        </div>
      </div>
    </div>
  );
};

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    // DICOM format: YYYYMMDD
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

export const SeriesBrowser: React.FC = () => {
  const {
    studies,
    selectedStudyUID,
    selectedSeriesUID,
    setSelectedStudy,
    setSelectedSeries,
    isSeriesPanelOpen,
    toggleSeriesPanel,
  } = useAppStore();

  const [expandedStudies, setExpandedStudies] = React.useState<Set<string>>(new Set());

  // Auto-expand first study when studies change
  React.useEffect(() => {
    if (studies.size > 0 && expandedStudies.size === 0) {
      const firstStudyUID = studies.keys().next().value;
      if (firstStudyUID) {
        setExpandedStudies(new Set([firstStudyUID]));
      }
    }
  }, [studies, expandedStudies.size]);

  // Build flat list for virtualization
  const items = useMemo(() => {
    const list: Array<{ type: 'study' | 'series'; data: DicomStudy | DicomSeries; studyUID: string }> = [];

    for (const [studyUID, study] of studies) {
      list.push({ type: 'study', data: study, studyUID });

      if (expandedStudies.has(studyUID)) {
        // Sort series by series number
        const sortedSeries = Array.from(study.series.values()).sort((a, b) => {
          if (a.seriesNumber !== null && b.seriesNumber !== null) {
            return a.seriesNumber - b.seriesNumber;
          }
          return 0;
        });

        for (const series of sortedSeries) {
          list.push({ type: 'series', data: series, studyUID });
        }
      }
    }

    return list;
  }, [studies, expandedStudies]);

  const toggleStudyExpand = (studyUID: string) => {
    setExpandedStudies((prev) => {
      const next = new Set(prev);
      if (next.has(studyUID)) {
        next.delete(studyUID);
      } else {
        next.add(studyUID);
      }
      return next;
    });
  };

  const handleSeriesClick = (series: DicomSeries) => {
    setSelectedStudy(series.studyInstanceUID);
    setSelectedSeries(series.seriesInstanceUID);
  };

  if (!isSeriesPanelOpen) {
    return (
      <div className="h-full flex flex-col bg-surface-900 dark:bg-surface-900 light:bg-white border-r border-surface-700 dark:border-surface-700 light:border-surface-200">
        <button
          className="p-2 hover:bg-surface-800 dark:hover:bg-surface-800 light:hover:bg-surface-100 transition-colors"
          onClick={toggleSeriesPanel}
          title="Expand series panel"
        >
          <ChevronLeftIcon size={16} className="text-surface-400 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-900 dark:bg-surface-900 light:bg-white border-r border-surface-700 dark:border-surface-700 light:border-surface-200 w-72">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-surface-700 dark:border-surface-700 light:border-surface-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-100 dark:text-surface-100 light:text-surface-900">
          Studies & Series
        </h2>
        <button
          className="btn-icon"
          onClick={toggleSeriesPanel}
          title="Collapse panel"
        >
          <ChevronLeftIcon size={16} />
        </button>
      </div>

      {/* Series List */}
      <div className="flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <ImageIcon size={48} className="text-surface-600 mb-3" />
            <p className="text-sm text-surface-400">No studies loaded</p>
            <p className="text-xs text-surface-500 mt-1">
              Open a folder or drag & drop DICOM files
            </p>
          </div>
        ) : (
          <Virtuoso
            data={items}
            itemContent={(index, item) => {
              if (item.type === 'study') {
                return (
                  <StudyHeader
                    study={item.data as DicomStudy}
                    isExpanded={expandedStudies.has(item.studyUID)}
                    onToggle={() => toggleStudyExpand(item.studyUID)}
                  />
                );
              } else {
                const series = item.data as DicomSeries;
                return (
                  <SeriesItem
                    series={series}
                    isSelected={selectedSeriesUID === series.seriesInstanceUID}
                    onClick={() => handleSeriesClick(series)}
                  />
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
