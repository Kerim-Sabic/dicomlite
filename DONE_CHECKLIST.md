# Done Checklist

This document maps the requirements to the implementation.

## Hard Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Run on Windows 10/11 (x64) | ✅ Done | Electron with electron-builder targeting Windows x64 |
| One-command build | ✅ Done | `npm run dist` produces Windows installer |
| Windows installer (.exe) | ✅ Done | NSIS installer configured in package.json |
| Open Folder (recursively scan) | ✅ Done | `electron/main.ts:scanDirectory()` |
| Drag & drop folder/files | ✅ Done | `src/hooks/useDragAndDrop.ts` |
| Display CT/MR/CR/DR/US | ✅ Done | dicom-parser with modality-agnostic rendering |
| Correct slice ordering | ✅ Done | `src/utils/dicomParser.ts:sortInstances()` |
| Series list (left panel) | ✅ Done | `src/components/SeriesBrowser.tsx` |
| Main viewport (center) | ✅ Done | `src/components/Viewport.tsx` |
| Metadata panel (right, collapsible) | ✅ Done | `src/components/MetadataPanel.tsx` |
| Pan tool | ✅ Done | Viewport with 'pan' active tool |
| Zoom tool | ✅ Done | Viewport with 'zoom' active tool |
| Window/Level tool | ✅ Done | Viewport with 'windowLevel' active tool |
| Scroll (mouse wheel) | ✅ Done | `handleWheel` in Viewport |
| Fit button | ✅ Done | `fitToWindow()` in Viewport |
| Reset button | ✅ Done | `resetView()` in Viewport |
| Keyboard shortcuts | ✅ Done | `src/hooks/useKeyboardShortcuts.ts` |
| Toolbar buttons | ✅ Done | Viewport toolbar with tool buttons |
| Handle multi-slice series | ✅ Done | Instance sorting and scroll navigation |
| Multi-frame DICOM support | ⚠️ Partial | numberOfFrames parsed but not rendered |
| Compressed transfer syntaxes | ✅ Done | See supported list in README |
| Graceful error handling | ✅ Done | Try-catch throughout, ErrorToast component |
| User-friendly error messaging | ✅ Done | Error messages in UI, toast notifications |
| Local-first privacy | ✅ Done | No network calls, no telemetry |
| No UI blocking during indexing | ✅ Done | Batched parsing with async/await |
| Robustness (no crashes) | ✅ Done | Error boundaries, validation |

## Functional Spec

### Import / Indexing

| Feature | Status | Location |
|---------|--------|----------|
| Scan folder recursively | ✅ Done | `electron/main.ts:scanDirectory()` |
| DICOM signature check | ✅ Done | `electron/main.ts:isDicomFile()` |
| Group by StudyInstanceUID | ✅ Done | `src/utils/dicomParser.ts:groupDicomFiles()` |
| Group by SeriesInstanceUID | ✅ Done | `src/utils/dicomParser.ts:groupDicomFiles()` |
| Sort by ImagePositionPatient | ✅ Done | `src/utils/dicomParser.ts:sortInstances()` |
| Sort by InstanceNumber (fallback) | ✅ Done | `src/utils/dicomParser.ts:sortInstances()` |
| UI responsive during indexing | ✅ Done | Batched parsing in `useDicomScanner` |

### Viewer

| Feature | Status | Location |
|---------|--------|----------|
| Render pixels correctly | ✅ Done | Viewport canvas rendering |
| Rescale slope/intercept | ✅ Done | Applied during pixel processing |
| Window/level from DICOM tags | ✅ Done | Read from 0028,1050/0028,1051 |
| Scroll through slices | ✅ Done | Mouse wheel + arrow keys |
| Window/level (click-drag) | ✅ Done | WindowLevel tool mode |
| Pan (click-drag) | ✅ Done | Pan tool mode |
| Zoom (ctrl+wheel or drag) | ✅ Done | Zoom tool mode |
| Fit/Reset buttons | ✅ Done | Toolbar buttons |

### UI

| Feature | Status | Location |
|---------|--------|----------|
| Study/Series browser | ✅ Done | `src/components/SeriesBrowser.tsx` |
| Modality display | ✅ Done | Badge in series item |
| Series description | ✅ Done | In series item |
| Image count | ✅ Done | "X images" in series item |
| Viewport overlays | ✅ Done | Series name, slice index, W/L |
| Metadata viewer | ✅ Done | `src/components/MetadataPanel.tsx` |
| Metadata search | ✅ Done | Search input in metadata panel |
| Key tags first | ✅ Done | `KEY_METADATA_TAGS` array |
| Expandable full list | ✅ Done | "All Tags" accordion |

### Performance & Safety

| Feature | Status | Location |
|---------|--------|----------|
| Lazy-load pixel data | ✅ Done | Images loaded on selection |
| Memory bounded | ✅ Done | Images recreated per render |
| Cancel indexing | ✅ Done | `cancelScan()` in useDicomScanner |
| Handle corrupted DICOMs | ✅ Done | Try-catch with error collection |
| Never load remote URLs | ✅ Done | CSP + path validation |

### Packaging

| Feature | Status | Location |
|---------|--------|----------|
| Windows installer (.exe) | ✅ Done | electron-builder NSIS config |
| Signing-ready instructions | ✅ Done | README.md Code Signing section |

### Documentation

| Feature | Status | Location |
|---------|--------|----------|
| README with setup | ✅ Done | README.md |
| Dev run commands | ✅ Done | README.md Quick Start |
| Build commands | ✅ Done | README.md Building section |
| Troubleshooting | ✅ Done | README.md Troubleshooting |
| Architecture.md | ✅ Done | Architecture.md |

### Testing

| Feature | Status | Location |
|---------|--------|----------|
| DICOM grouping/sorting tests | ✅ Done | `tests/dicomParser.test.ts` |
| Metadata parsing tests | ✅ Done | `tests/dicomParser.test.ts` |
| Error handling tests | ✅ Done | `tests/store.test.ts` |
| Transfer syntax tests | ✅ Done | `tests/transferSyntax.test.ts` |
| Test fixture strategy | ✅ Done | Mock data generators in tests |

## Design / UX

| Feature | Status | Implementation |
|---------|--------|----------------|
| Clean "Swiss" layout | ✅ Done | Tailwind with custom spacing/typography |
| Excellent spacing | ✅ Done | Consistent padding/margins |
| Typography hierarchy | ✅ Done | Font sizes, weights in Tailwind config |
| Dark mode by default | ✅ Done | `dark` class on html |
| Optional light mode | ✅ Done | Toggle via Ctrl+Shift+D |
| Subtle micro-interactions | ✅ Done | Hover states, transitions |
| Smooth panel collapse | ✅ Done | Animated width transitions |
| Minimal chrome | ✅ Done | Focus on image, minimal UI |
| Thoughtful empty states | ✅ Done | "Drop a DICOM folder here" |
| Keyboard navigation | ✅ Done | Full keyboard support |
| Readable contrast | ✅ Done | WCAG-compliant color palette |
| Scalable UI | ✅ Done | Responsive design |

## Non-Goals (Confirmed Not Implemented)

- ❌ PACS integration
- ❌ DICOM networking
- ❌ HL7 support
- ❌ Segmentation
- ❌ 3D MPR
- ❌ Cine tools beyond basic scroll
- ❌ Annotation saving
- ❌ User accounts
