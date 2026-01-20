# DICOMLite Architecture

This document describes the architecture and main modules of the DICOMLite DICOM viewer.

## Overview

DICOMLite is built using a modern Electron + React stack:

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Main Process                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   IPC       │  │   File      │  │   Window            │  │
│  │   Handlers  │  │   System    │  │   Management        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                     Preload Bridge
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Electron Renderer Process                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    React Application                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  Series  │  │ Viewport │  │    Metadata      │   │   │
│  │  │  Browser │  │          │  │    Panel         │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  │                      │                               │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │              Zustand Store                    │   │   │
│  │  │  • Studies/Series State                       │   │   │
│  │  │  • Selection State                            │   │   │
│  │  │  • UI State (theme, panels)                   │   │   │
│  │  │  • Viewer State (window/level, zoom)          │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                      │                               │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │           DICOM Parser Utilities              │   │   │
│  │  │  • File Parsing                               │   │   │
│  │  │  • Instance Sorting                           │   │   │
│  │  │  • Study/Series Grouping                      │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
dicomlite/
├── electron/                 # Electron main process
│   ├── main.ts              # Main process entry point
│   └── preload.ts           # Preload script (IPC bridge)
│
├── src/                     # React renderer process
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles + Tailwind
│   │
│   ├── components/          # React components
│   │   ├── SeriesBrowser.tsx   # Left panel - study/series list
│   │   ├── Viewport.tsx        # Center - image display
│   │   ├── MetadataPanel.tsx   # Right panel - DICOM tags
│   │   ├── Modals.tsx          # Shortcuts & About dialogs
│   │   ├── ErrorToast.tsx      # Error notifications
│   │   └── Icons.tsx           # SVG icon components
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useDicomScanner.ts     # Folder scanning logic
│   │   ├── useViewer.ts           # Viewport management
│   │   ├── useKeyboardShortcuts.ts # Keyboard handling
│   │   └── useDragAndDrop.ts      # Drag & drop handling
│   │
│   ├── store/               # State management
│   │   └── useAppStore.ts   # Zustand store
│   │
│   ├── types/               # TypeScript types
│   │   ├── dicom.ts         # DICOM-specific types
│   │   └── electron.d.ts    # Electron API types
│   │
│   └── utils/               # Utility functions
│       ├── dicomParser.ts   # DICOM parsing & grouping
│       └── cornerstoneSetup.ts # Cornerstone initialization
│
├── tests/                   # Unit tests
│   ├── dicomParser.test.ts  # Parser tests
│   ├── transferSyntax.test.ts # Transfer syntax tests
│   └── store.test.ts        # Store tests
│
├── public/                  # Static assets
│   └── icon.ico             # App icon
│
└── [config files]           # Various configuration
```

## Key Modules

### 1. Electron Main Process (`electron/main.ts`)

Responsibilities:
- Window creation and management
- Native file dialogs
- Recursive directory scanning for DICOM files
- DICOM file signature validation
- IPC communication with renderer
- Application menu

Key functions:
- `isDicomFile()`: Validates files by checking DICM signature at offset 128
- `scanDirectory()`: Recursively finds DICOM files with progress updates
- IPC handlers: `dialog:openFolder`, `fs:scanDicomFolder`, `fs:readFile`

### 2. Preload Bridge (`electron/preload.ts`)

Creates a secure bridge between main and renderer processes using `contextBridge`:
- File operations: `readFile`, `scanDicomFolder`, `getFileStats`
- Dialogs: `openFolderDialog`
- Events: `onScanProgress`, `onMenuOpenFolder`, etc.

### 3. DICOM Parser (`src/utils/dicomParser.ts`)

Core DICOM processing:
- `parseDicomFile()`: Extracts metadata from DICOM files
- `sortInstances()`: Orders slices by ImagePositionPatient, SliceLocation, or InstanceNumber
- `groupDicomFiles()`: Organizes files into Study → Series → Instance hierarchy

Sorting priority:
1. ImagePositionPatient Z-coordinate
2. SliceLocation
3. InstanceNumber
4. AcquisitionNumber
5. File path (fallback)

### 4. State Management (`src/store/useAppStore.ts`)

Zustand store managing:
- **Theme**: Dark/light mode
- **Studies**: Map of StudyInstanceUID → DicomStudy
- **Selection**: Currently selected study, series, instance
- **Scan Progress**: Scanning status, file counts, errors
- **Viewer State**: Window/level, zoom, pan, rotation
- **UI State**: Panel visibility, modal states, active tool

### 5. Components

#### SeriesBrowser
- Virtual list (react-virtuoso) for efficient rendering
- Study headers with expand/collapse
- Series items with modality badge, description, image count
- Keyboard navigation support

#### Viewport
- Canvas-based image rendering
- Manual pixel processing with rescale slope/intercept
- Window/level visualization
- Mouse-based tools: W/L, pan, zoom, scroll
- Drop zone for drag & drop
- Overlay information (series name, slice index, W/L values)

#### MetadataPanel
- DICOM tag display with search
- Key tags section (commonly needed tags)
- Expandable all-tags view
- Virtualized for large tag lists

### 6. Hooks

#### useDicomScanner
- Handles folder selection and scanning
- Batched file parsing to maintain UI responsiveness
- Cancellation support
- Auto-selects first study/series after scan

#### useViewer
- Manages Cornerstone viewport lifecycle
- Image loading and rendering
- Tool management
- Navigation controls (zoom, pan, fit, reset)

#### useKeyboardShortcuts
- Global keyboard event handling
- Tool switching (W, P, Z, S)
- Navigation (arrows, page up/down)
- View controls (Ctrl+0, Ctrl+R)

## Data Flow

### Opening a DICOM Folder

```
1. User clicks "Open Folder" or presses Ctrl+O
   │
2. openFolderDialog() → Main Process shows native dialog
   │
3. User selects folder → scanDicomFolder(path)
   │
4. Main Process:
   ├── Recursively scan directory
   ├── Check each file for DICOM signature
   ├── Send progress updates via IPC
   └── Return list of DICOM file paths
   │
5. Renderer Process:
   ├── Read each file via IPC
   ├── Parse DICOM metadata
   ├── Group into studies/series
   ├── Sort instances within series
   └── Update Zustand store
   │
6. UI updates reactively:
   ├── SeriesBrowser shows study/series tree
   ├── First study/series auto-selected
   └── Viewport loads first image
```

### Viewing an Image

```
1. User selects series in SeriesBrowser
   │
2. setSelectedSeries(uid) updates store
   │
3. Viewport component detects selection change
   │
4. loadSeries():
   ├── Get sorted instances from series
   ├── Create blob URLs for image loading
   └── Set up canvas for rendering
   │
5. renderImage():
   ├── Read DICOM file via IPC
   ├── Parse with dicom-parser
   ├── Extract pixel data
   ├── Apply rescale slope/intercept
   ├── Apply window/level
   └── Draw to canvas
   │
6. User interactions update viewerState
   │
7. Re-render on state changes
```

## Security Considerations

- **Context Isolation**: Enabled in Electron
- **Node Integration**: Disabled in renderer
- **Sandboxed Preload**: Minimal API surface
- **Path Validation**: Prevents path traversal attacks
- **No Remote URLs**: Only local file:// and localhost:// allowed
- **CSP Headers**: Restrict script sources

## Performance Optimizations

- **Virtual Lists**: react-virtuoso for series browser
- **Batched Parsing**: 20 files per batch during scan
- **Lazy Loading**: Images loaded on-demand
- **Memory Management**: Bounded cache size
- **Progressive Updates**: UI updates during scan
- **Cancelable Operations**: Scan can be cancelled

## Testing Strategy

Unit tests cover:
- DICOM sorting algorithms
- Study/series grouping
- Transfer syntax detection
- Store state management

Test fixtures:
- Mock DICOM instances (no real patient data)
- Programmatically generated test data

## Build Process

1. **Development**: `vite` serves React with HMR, Electron auto-reloads
2. **Production Build**:
   - `tsc` compiles TypeScript
   - `vite build` bundles React
   - `electron-builder` packages app
3. **Distribution**: NSIS installer for Windows
