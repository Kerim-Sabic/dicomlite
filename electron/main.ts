import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs';

// Disable hardware acceleration if needed for stability
// app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;

const DICOM_EXTENSIONS = ['.dcm', '.dicom', '.dic', ''];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit per file

function isDicomFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();

  // Check extension
  if (DICOM_EXTENSIONS.includes(ext) || ext === '') {
    try {
      // Quick DICOM signature check (DICM at offset 128)
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(132);
      const bytesRead = fs.readSync(fd, buffer, 0, 132, 0);
      fs.closeSync(fd);

      if (bytesRead >= 132) {
        const signature = buffer.slice(128, 132).toString('ascii');
        if (signature === 'DICM') {
          return true;
        }
      }

      // Some DICOM files don't have the preamble, check for valid group/element
      if (bytesRead >= 4) {
        const group = buffer.readUInt16LE(0);
        // Valid DICOM groups are typically 0x0002, 0x0008, 0x0010, etc.
        if (group === 0x0002 || group === 0x0008 || group === 0x0010) {
          return true;
        }
      }
    } catch {
      return false;
    }
  }

  return false;
}

async function scanDirectory(dirPath: string, signal?: { cancelled: boolean }): Promise<string[]> {
  const dicomFiles: string[] = [];

  async function scan(currentPath: string): Promise<void> {
    if (signal?.cancelled) return;

    try {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (signal?.cancelled) return;

        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Skip hidden directories and common non-DICOM directories
          if (!entry.name.startsWith('.') &&
              !['node_modules', '__pycache__', '.git'].includes(entry.name)) {
            await scan(fullPath);
          }
        } else if (entry.isFile()) {
          try {
            const stats = await fs.promises.stat(fullPath);
            if (stats.size > 0 && stats.size < MAX_FILE_SIZE && isDicomFile(fullPath)) {
              dicomFiles.push(fullPath);

              // Send progress update every 50 files
              if (dicomFiles.length % 50 === 0) {
                mainWindow?.webContents.send('scan-progress', {
                  filesFound: dicomFiles.length,
                  currentPath: currentPath,
                });
              }
            }
          } catch {
            // Skip files we can't stat
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  await scan(dirPath);
  return dicomFiles;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617',
    show: false,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for file system access via preload
      webSecurity: true,
    },
  });

  // Create application menu
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-open-folder'),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Mode',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => mainWindow?.webContents.send('toggle-theme'),
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow?.webContents.send('viewer-zoom-in'),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('viewer-zoom-out'),
        },
        {
          label: 'Fit to Window',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('viewer-fit'),
        },
        {
          label: 'Reset View',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.send('viewer-reset'),
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'F1',
          click: () => mainWindow?.webContents.send('show-shortcuts'),
        },
        {
          label: 'About DICOMLite',
          click: () => mainWindow?.webContents.send('show-about'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
let currentScanSignal: { cancelled: boolean } | null = null;

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Select DICOM Folder',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('fs:scanDicomFolder', async (_event, folderPath: string) => {
  // Cancel any existing scan
  if (currentScanSignal) {
    currentScanSignal.cancelled = true;
  }

  currentScanSignal = { cancelled: false };

  try {
    const files = await scanDirectory(folderPath, currentScanSignal);
    return { success: true, files };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error scanning folder'
    };
  } finally {
    currentScanSignal = null;
  }
});

ipcMain.handle('fs:cancelScan', async () => {
  if (currentScanSignal) {
    currentScanSignal.cancelled = true;
    return true;
  }
  return false;
});

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    // Security: Validate the path doesn't contain suspicious patterns
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..') || normalizedPath.startsWith('\\\\')) {
      throw new Error('Invalid file path');
    }

    const buffer = await fs.promises.readFile(normalizedPath);
    return { success: true, data: buffer };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error reading file'
    };
  }
});

ipcMain.handle('fs:getFileStats', async (_event, filePath: string) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      success: true,
      stats: {
        size: stats.size,
        mtime: stats.mtime.toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting file stats'
    };
  }
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.protocol !== 'file:' && !navigationUrl.startsWith('http://localhost')) {
      event.preventDefault();
    }
  });

  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
