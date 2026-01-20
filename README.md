# DICOMLite

A minimal, rock-solid Windows DICOM Viewer with a world-class, modern UI. Built for simplicity, privacy, and reliability.

## Features

- **Local-First Privacy**: 100% local processing. No telemetry, no cloud, no data leaving your machine.
- **Modern UI**: Clean "Swiss" design with dark mode by default, excellent typography, and smooth micro-interactions.
- **Multi-Modality Support**: CT, MR, CR, DR, US, and other common DICOM modalities.
- **Comprehensive Transfer Syntax Support**: Handles JPEG, JPEG-LS, JPEG 2000, RLE, and uncompressed formats.
- **Non-Blocking Performance**: Background indexing keeps the UI responsive during large folder scans.
- **Essential Tools**: Window/Level, Pan, Zoom, Scroll with keyboard shortcuts and toolbar buttons.

## System Requirements

- **OS**: Windows 10/11 (x64)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 200MB for installation

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [pnpm](https://pnpm.io/) (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dicomlite.git
cd dicomlite

# Install dependencies
pnpm install
# or
npm install
```

### Development

```bash
# Start the development server with hot reload
pnpm dev
# or
npm run dev
```

The app will open automatically when the development server is ready.

### Building

```bash
# Build for production (creates unpacked app in release/win-unpacked)
pnpm build
# or
npm run build

# Create Windows installer (.exe)
pnpm dist
# or
npm run dist

# Explicitly build for Windows (useful on other platforms)
pnpm dist:win
# or
npm run dist:win
```

The installer will be created in the `release` directory.

### Testing

```bash
# Run tests
pnpm test
# or
npm test

# Run tests in watch mode
pnpm test:watch
# or
npm run test:watch
```

## Usage

### Opening DICOM Files

1. **Open Folder**: Click "Open Folder" in the header or press `Ctrl+O`, then select a folder containing DICOM files.
2. **Drag & Drop**: Drag a folder or DICOM files directly onto the application window.

The application will recursively scan the selected folder, identify DICOM files, and group them by Study and Series.

### Navigation

- **Series Browser** (Left Panel): Browse studies and series. Click on a series to view it.
- **Viewport** (Center): Displays the current image with overlay information.
- **Metadata Panel** (Right): View DICOM tags with search functionality.

### Viewer Tools

| Tool | Keyboard | Mouse |
|------|----------|-------|
| Window/Level | `W` | Left-click + drag |
| Pan | `P` | Middle-click + drag |
| Zoom | `Z` | Right-click + drag |
| Scroll | `S` | Mouse wheel |

### Additional Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Folder | `Ctrl+O` |
| Zoom In | `Ctrl+=` |
| Zoom Out | `Ctrl+-` |
| Fit to Window | `Ctrl+0` |
| Reset View | `Ctrl+R` |
| Previous Slice | `↑` or `Page Up` |
| Next Slice | `↓` or `Page Down` |
| Toggle Metadata Panel | `M` |
| Toggle Dark/Light Mode | `Ctrl+Shift+D` |
| Show Shortcuts | `F1` |

## Supported Transfer Syntaxes

| Transfer Syntax | UID | Status |
|-----------------|-----|--------|
| Implicit VR Little Endian | 1.2.840.10008.1.2 | ✅ Supported |
| Explicit VR Little Endian | 1.2.840.10008.1.2.1 | ✅ Supported |
| Explicit VR Big Endian | 1.2.840.10008.1.2.2 | ✅ Supported |
| Deflated Explicit VR Little Endian | 1.2.840.10008.1.2.1.99 | ✅ Supported |
| JPEG Baseline (Process 1) | 1.2.840.10008.1.2.4.50 | ✅ Supported |
| JPEG Extended (Process 2 & 4) | 1.2.840.10008.1.2.4.51 | ✅ Supported |
| JPEG Lossless, Non-Hierarchical (Process 14) | 1.2.840.10008.1.2.4.57 | ✅ Supported |
| JPEG Lossless, First-Order Prediction | 1.2.840.10008.1.2.4.70 | ✅ Supported |
| JPEG-LS Lossless | 1.2.840.10008.1.2.4.80 | ✅ Supported |
| JPEG-LS Lossy (Near-Lossless) | 1.2.840.10008.1.2.4.81 | ✅ Supported |
| JPEG 2000 Lossless | 1.2.840.10008.1.2.4.90 | ✅ Supported |
| JPEG 2000 | 1.2.840.10008.1.2.4.91 | ✅ Supported |
| RLE Lossless | 1.2.840.10008.1.2.5 | ✅ Supported |

## Code Signing (Production)

For production distribution, the installer should be code-signed. To enable signing:

1. Obtain a code signing certificate from a trusted CA.
2. Set the following environment variables:
   ```bash
   CSC_LINK=path/to/certificate.pfx
   CSC_KEY_PASSWORD=your-certificate-password
   ```
3. Run the build: `pnpm dist`

Alternatively, configure signing in `package.json` under `build.win`:

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "${CSC_KEY_PASSWORD}"
    }
  }
}
```

## Troubleshooting

### "DICOM files not found" when scanning a folder

- Ensure the folder contains valid DICOM files (with `.dcm` extension or DICM signature)
- Some DICOM files without the standard preamble may not be detected

### Images appear too dark or too bright

- Use the Window/Level tool (press `W`, then drag) to adjust the display
- Press `Ctrl+R` to reset to default values from the DICOM file

### Application freezes when opening large folders

- The application uses background scanning, but very large folders (>10,000 files) may take time
- You can cancel the scan by clicking the cancel button

### Compressed images not displaying

- Ensure you're using a supported transfer syntax (see table above)
- Some proprietary compression formats may not be supported

## Project Structure

See [Architecture.md](Architecture.md) for detailed information about the codebase structure.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Acknowledgments

- [dicom-parser](https://github.com/cornerstonejs/dicomParser) - DICOM parsing
- [Electron](https://www.electronjs.org/) - Cross-platform desktop app framework
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://github.com/pmndrs/zustand) - State management
