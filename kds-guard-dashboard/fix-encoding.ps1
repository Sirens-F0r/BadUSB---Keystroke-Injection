$content = @'
import {
    app,
    BrowserWindow,
    Tray,
    Menu,
    nativeImage,
    Notification,
    ipcMain,
} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Polyfill __dirname for ESM (used by Vite in package type=module)
const _module = import.meta.url;
const __filename = fileURLToPath(_module);
const __dirname = path.dirname(__filename);

// --- Prevent multiple instances ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
}

// --- Globals ---
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let wsBridgeProcess: ReturnType<typeof spawn> | null = null;
let engineProcess: ReturnType<typeof spawn> | null = null;
let isQuitting = false;

// --- Paths ---
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PROJECT_ROOT = isDev
    ? path.join(__dirname, '..', '..')
    : path.join(path.dirname(app.getPath('exe')), '..');
// ws_bridge.py and kds_guard.exe are alongside the portable exe
const WS_BRIDGE_SCRIPT = path.join(PROJECT_ROOT, 'ws_bridge.py');
const KDS_GUARD_EXE = path.join(PROJECT_ROOT, 'kds_guard.exe');
const KDS_GUARD_EXE_DEBUG = path.join(PROJECT_ROOT, 'kds_guard_debug.exe');

function getEnginePath(): string {
    if (isDev) {
        // Dev: try VITE_KDS_ENGINE_PATH env var first, then standard paths
        if (import.meta.env.VITE_KDS_ENGINE_PATH) return import.meta.env.VITE_KDS_ENGINE_PATH;
        // Try release first, then debug
        if (fs.existsSync(KDS_GUARD_EXE)) return KDS_GUARD_EXE;
        if (fs.existsSync(KDS_GUARD_EXE_DEBUG)) return KDS_GUARD_EXE_DEBUG;
        return KDS_GUARD_EXE;
    }
    // Packaged: kds_guard.exe is in resources/ folder
    const bundledPath = path.join(process.resourcesPath!, 'kds_guard.exe');
    if (fs.existsSync(bundledPath)) return bundledPath;
    // Fallback: try alongside executable
    return path.join(path.dirname(app.getPath('exe')), 'kds_guard.exe');
}

// --- Tray icon ---
function getTrayIcon(): nativeImage {
    const iconPath = isDev
        ? path.join(__dirname, '..', '..', 'public', 'electron-icon.png')
        : path.join(PROJECT_ROOT, 'public', 'electron-icon.png');

    try {
        return nativeImage.createFromPath(iconPath);
    } catch {
        return nativeImage.createEmpty();
    }
}

function createTray() {
    const icon = getTrayIcon();
    tray = new Tray(
        icon.isEmpty()
            ? nativeImage.createFromDataURL(
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADwSURBVDiNpZMxDoJAEEXfruxQsLCysPQKPABegAcgr8kDsLf0DN7B3kt4A1gs7CwtbGxMLG1M4mYTd7PJJpnZ7P/zM5MBIpJOYl+SqSRvSYJfB/ACvCWZS/qQtCnpo7I1STqS2kmWkj4k9UrU96ukDUnDqNYo6V1SO8lKUj+JfQW4SjpP1pWkY2BH0t9knqX/A8+BpaS1pI6kdon6/7f+BNaS1pL6SS1JzST2J+APcAQ2wFbSOYnbSR1JzUr3F3AFVsA+8SOwT8L+HzAOvJLUTmIn0U+yqYAx8A04JM4vsK9AD3iVdEjiNJI6STbAB3hI2k9iJ9FPsqkAf2ADjCRtJDUBTkEPfnADYhZqLw2K1e4AAAAASUVORK5CYII=',
              )
            : icon,
    );

    tray.setToolTip('KDS Guard - Dang giam sat');
    updateTrayMenu('Normal');

    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.focus();
            } else {
                mainWindow.show();
            }
        } else {
            createWindow();
        }
    });

    tray.on('double-click', () => {
        mainWindow?.show();
        mainWindow?.focus();
    });
}

function updateTrayMenu(riskLevel: string) {
    if (!tray) return;

    const statusText: Record<string, string> = {
        Normal: '[Normal]',
        Low: '[Low]',
        Medium: '[Medium]',
        High: '[High]',
        Critical: '[Critical]',
    };

    const label = statusText[riskLevel] ?? '[Normal]';

    tray.setToolTip(`KDS Guard - Muc rui ro: ${label}`);
    tray.setImage(
        nativeImage.createFromDataURL(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADwSURBVDiNpZMxDoJAEEXfruxQsLCysPQKPABegAcgr8kDsLf0DN7B3kt4A1gs7CwtbGxMLG1M4mYTd7PJJpnZ7P/zM5MBIpJOYl+SqSRvSYJfB/ACvCWZS/qQtCnpo7I1STqS2kmWkj4k9UrU96ukDUnDqNYo6V1SO8lKUj+JfQW4SjpP1pWkY2BH0t9knqX/A8+BpaS1pI6kdon6/7f+BNaS1pL6SS1JzST2J+APcAQ2wFbSOYnbSR1JzUr3F3AFVsA+8SOwT8L+HzAOvJLUTmIn0U+yqYAx8A04JM4vsK9AD3iVdEjiNJI6STbAB3hI2k9iJ9FPsqkAf2ADjCRtJDUBTkEPfnADYhZqLw2K1e4AAAAASUVORK5CYII=',
        ),
    );

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '--- KDS Guard ---',
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Mo Dashboard',
            click: () => {
                mainWindow?.show();
                mainWindow?.focus();
            },
        },
        {
            label:
                riskLevel === 'Normal'
                    ? '✓ Engine dang chay'
                    : `⚠ Phat hien: ${label}`,
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Thoat',
            click: () => {
                isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);
}

// --- Window ---
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        title: 'KDS Guard Dashboard',
        backgroundColor: '#0a0e1a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    return mainWindow;
}

// --- Start kds_guard.exe engine ---
function startEngine() {
    const enginePath = getEnginePath();

    if (!fs.existsSync(enginePath)) {
        console.error(`[KDS Guard Electron] Engine not found at: ${enginePath}`);
        return;
    }

    console.log(`[KDS Guard Electron] Starting kds_guard.exe engine from: ${enginePath}`);

    try {
        engineProcess = spawn(enginePath, {
            cwd: path.dirname(enginePath),
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false,
        });

        engineProcess.stdout?.on('data', (data) => {
            const line = data.toString().trim();
            if (line) console.log('[kds_engine]', line);
        });

        engineProcess.stderr?.on('data', (data) => {
            console.error('[kds_engine ERROR]', data.toString().trim());
        });

        engineProcess.on('error', (err) => {
            console.error('[kds_engine ERROR] Failed to start:', err.message);
        });

        engineProcess.on('exit', (code) => {
            if (!isQuitting) {
                console.warn(`[kds_engine] exited with code ${code}, restarting in 3s...`);
                setTimeout(startEngine, 3000);
            }
        });

        console.log(
            '[KDS Guard Electron] kds_guard.exe started (PID:',
            engineProcess.pid,
            ')',
        );
    } catch (err) {
        console.error(
            '[KDS Guard Electron] Could not start kds_guard.exe:',
            err,
        );
    }
}

// --- Start ws_bridge.py ---
function startWsBridge() {
    console.log('[KDS Guard Electron] Starting ws_bridge.py...');
    console.log('[KDS Guard Electron] Script path:', WS_BRIDGE_SCRIPT);

    try {
        wsBridgeProcess = spawn('python', [WS_BRIDGE_SCRIPT], {
            cwd: PROJECT_ROOT,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false,
        });

        wsBridgeProcess.stdout?.on('data', (data) => {
            const line = data.toString().trim();
            if (line) console.log('[ws_bridge]', line);
        });

        wsBridgeProcess.stderr?.on('data', (data) => {
            console.error('[ws_bridge ERROR]', data.toString().trim());
        });

        wsBridgeProcess.on('error', (err) => {
            console.error('[ws_bridge ERROR] Failed to start:', err.message);
        });

        wsBridgeProcess.on('exit', (code) => {
            if (!isQuitting) {
                console.warn(`[ws_bridge] exited with code ${code}, restarting in 3s...`);
                setTimeout(startWsBridge, 3000);
            }
        });

        console.log(
            '[KDS Guard Electron] ws_bridge.py started (PID:',
            wsBridgeProcess.pid,
            ')',
        );
    } catch (err) {
        console.error(
            '[KDS Guard Electron] Could not start ws_bridge.py:',
            err,
        );
    }
}

// --- System Notification ---
function showDetectionNotification(
    riskLevel: string,
    riskScore: number,
    reasons: string[],
) {
    const isHigh = riskLevel === 'High' || riskLevel === 'Critical';

    if (Notification.isSupported()) {
        const notification = new Notification({
            title: isHigh
                ? '⚠ KDS GUARD - PHAT HIEN TAN CONG!'
                : '✓ KDS Guard - Canh bao',
            body: `Muc: ${riskLevel} (${riskScore}%)\nLy do: ${reasons.join(', ')}`,
            urgency: isHigh ? 'critical' : 'normal',
            silent: false,
        });

        notification.on('click', () => {
            mainWindow?.show();
            mainWindow?.focus();
        });

        notification.show();
    }

    updateTrayMenu(riskLevel);
}

// --- USB/HID Device Enumeration (Windows WMI) ---
function getConnectedDevices(): string {
    try {
        const output = execSync(
            `powershell -NoProfile -Command "Get-PnpDevice -Class Keyboard,HIDClass,HidDevice -Status OK | Select-Object FriendlyName, InstanceId, Status | ConvertTo-Json -Compress"`,
            {
                encoding: 'utf-8',
                timeout: 10000,
                windowsHide: true,
            },
        );
        return output;
    } catch {
        try {
            const output = execSync(
                `powershell -NoProfile -Command "Get-WmiObject Win32_Keyboard | Select-Object Name, DeviceID, Status | ConvertTo-Json -Compress"`,
                {
                    encoding: 'utf-8',
                    timeout: 10000,
                    windowsHide: true,
                },
            );
            return output;
        } catch {
            return '[]';
        }
    }
}

// --- IPC: Renderer ⟷ Main ---
ipcMain.on(
    'detection-update',
    (
        _event,
        data: { riskLevel: string; riskScore: number; reasons: string[] },
    ) => {
        updateTrayMenu(data.riskLevel);

        if (data.riskLevel === 'High' || data.riskLevel === 'Critical') {
            showDetectionNotification(
                data.riskLevel,
                data.riskScore,
                data.reasons,
            );
        }
    },
);

// --- USB Device Blocking (Windows) ---
ipcMain.handle('block-usb-device', async (_event, instanceId: string): Promise<{ success: boolean; message: string }> => {
    try {
        execSync(
            `powershell -NoProfile -Command "Disable-PnpDevice -InstanceId '${instanceId}' -Confirm:\$False -ErrorAction SilentlyContinue"`,
            { windowsHide: true, timeout: 10000 },
        );
        return { success: true, message: 'Da vo hieu hoa thiet bi USB' };
    } catch {
        return { success: false, message: 'Khong the vo hieu hoa thiet bi. Can quyen Administrator.' };
    }
});

ipcMain.handle('unblock-usb-device', async (_event, instanceId: string): Promise<{ success: boolean; message: string }> => {
    try {
        execSync(
            `powershell -NoProfile -Command "Enable-PnpDevice -InstanceId '${instanceId}' -Confirm:\$False -ErrorAction SilentlyContinue"`,
            { windowsHide: true, timeout: 10000 },
        );
        return { success: true, message: 'Da khoi phuc thiet bi USB' };
    } catch {
        return { success: false, message: 'Khong the khoi phuc thiet bi. Can quyen Administrator.' };
    }
});

ipcMain.handle('get-app-path', () => PROJECT_ROOT);

ipcMain.handle('get-usb-devices', () => {
    const raw = getConnectedDevices();
    try {
        const parsed = JSON.parse(raw);
        return parsed;
    } catch {
        return raw;
    }
});

// --- App lifecycle ---
app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('will-quit', () => {
    if (wsBridgeProcess) {
        wsBridgeProcess.kill('SIGTERM');
    }
    if (engineProcess) {
        engineProcess.kill('SIGTERM');
    }
    tray?.destroy();
});

app.whenReady().then(() => {
    console.log('[KDS Guard Electron] App ready, starting...');
    createWindow();
    createTray();
    startEngine();
    startWsBridge();
});

app.on('window-all-closed', () => {
    // On Windows: keep running in tray
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
'@

$filePath = 'C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds-guard-dashboard\electron\main.ts'
$content | Out-File -FilePath $filePath -Encoding UTF8
Write-Host "Done writing $filePath"
