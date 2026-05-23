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
import fsn from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const _module = import.meta.url;
const _filename = fileURLToPath(_module);
const _dirname = path.dirname(_filename);

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) app.quit();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let engineProcess: ReturnType<typeof spawn> | null = null;
let wss: WebSocketServer | null = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PROJECT_ROOT = isDev
    ? path.join(_dirname, '..', '..')
    : path.join(path.dirname(app.getPath('exe')), '..');

// Teal shield data URL — always works, no external files needed
const SHIELD_ICON_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGJSURBVFiF7ZY9TsNAEIW/sRsTF6iRGhSUCBU9FZegpOMSnIIjUNLRICGioqRGiQMU1Ak6JBwCGoSEhAQVCRJ2Zuc2JBGJ2NhsZ9b2eGd2PUL8E7bJFkkD0ALagCmgHxgEaoAm4AJYkLQqqQvYBDaAd+BS0qykLuCVrYukgO+StiS1AD3AXeBNUpekY+BJ0rqkFmDIdL+kc0mXwL2kZ0lrwBjwKekWeJe0BkwDj5IeJLUBY8CTpBXgTtKDpB3gUNKGpE1Jm5I2gS1gHrgE1iVtStoANoFN4FzSmqQzSWuSTiTtS1oHziTdkXQqaU3SgqQJSVOSpiQdSLqR9CLpVtKDpHNJd5KWJe1IOpV0LGlT0qakdUnrks4lPUk6lXQs6VTSqqRFSQuSJiWNSTqW9CTpVdKrpFNJJ5KOJR1JOpR0IOlI0p6kPUkHkk4kHUs6lLQjaVvSlqR1SSuSliVNSZqQdCTpRNKJpFNJp5KOJf0A1gAj3f9z8QAAAABJRU5ErkJggg==';

function loadTrayIcon(): nativeImage {
    // Try bundled tray-icon.png first
    const candidates = isDev
        ? [
              path.join(_dirname, '..', '..', 'public', 'tray-icon.png'),
              path.join(_dirname, '..', '..', 'public', 'electron-icon.png'),
          ]
        : [
              path.join(PROJECT_ROOT, 'public', 'tray-icon.png'),
              path.join(PROJECT_ROOT, 'public', 'electron-icon.png'),
          ];
    for (const p of candidates) {
        try {
            if (fsn.existsSync(p)) {
                const img = nativeImage.createFromPath(p);
                if (!img.isEmpty()) return img;
            }
        } catch { /* continue */ }
    }
    // Ultimate fallback: embedded shield data URL
    return nativeImage.createFromDataURL(SHIELD_ICON_URL);
}

function createTray() {
    const icon = loadTrayIcon();
    tray = new Tray(icon);
    tray.setToolTip('KDS Guard - Dang giam sat');
    updateTrayMenu('Normal');
    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.isVisible() ? mainWindow.focus() : mainWindow.show();
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
    const statusMap: Record<string, string> = {
        Normal: '[Normal]', Low: '[Low]', Medium: '[Medium]',
        High: '[High]', Critical: '[Critical]',
    };
    const label = statusMap[riskLevel] ?? '[Normal]';
    tray.setToolTip('KDS Guard - Muc rui ro: ' + label);
    // Update icon to match risk level
    const iconUrl = riskLevel === 'Critical' || riskLevel === 'High'
        ? SHIELD_ICON_URL  // same icon, works fine
        : SHIELD_ICON_URL;
    tray.setImage(nativeImage.createFromDataURL(iconUrl));
    tray.setContextMenu(
        Menu.buildFromTemplate([
            { label: '--- KDS Guard ---', enabled: false },
            { type: 'separator' },
            { label: 'Mo Dashboard', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
            { label: riskLevel === 'Normal' ? 'Engine dang chay' : 'Phat hien: ' + label, enabled: false },
            { type: 'separator' },
            { label: 'Thoat', click: () => { isQuitting = true; app.quit(); } },
        ]),
    );
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400, height: 900,
        minWidth: 1000, minHeight: 700,
        title: 'KDS Guard Dashboard',
        backgroundColor: '#0a0e1a',
        webPreferences: {
            preload: path.join(_dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    });
    mainWindow.once('ready-to-show', () => mainWindow?.show());
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(_dirname, '..', 'dist', 'index.html'));
    }
    mainWindow.on('close', (e) => { if (!isQuitting) { e.preventDefault(); mainWindow?.hide(); } });
    mainWindow.on('closed', () => { mainWindow = null; });
}

function getEnginePath(): string {
    if (isDev) {
        const p = path.join(PROJECT_ROOT, 'kds_guard', 'target', 'release', 'kds_guard.exe');
        if (fsn.existsSync(p)) return p;
        return path.join(PROJECT_ROOT, 'kds_guard', 'target', 'debug', 'kds_guard.exe');
    }
    const bundled = path.join(process.resourcesPath!, 'kds_guard.exe');
    if (fsn.existsSync(bundled)) return bundled;
    return path.join(path.dirname(app.getPath('exe')), 'kds_guard.exe');
}

function startEngine() {
    const enginePath = getEnginePath();
    if (!fsn.existsSync(enginePath)) {
        console.error('[KDS Guard] Engine not found: ' + enginePath);
        return;
    }
    console.log('[KDS Guard] Starting engine: ' + enginePath);

    engineProcess = spawn(enginePath, ['--json-output', '-u', 'kds-user'], {
        cwd: path.dirname(enginePath),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
    });

    engineProcess.stdout?.on('data', (data: Buffer) => {
        const line = data.toString().trim();
        if (!line || !line.startsWith('{')) return;
        broadcastWs(line);
        try {
            const json = JSON.parse(line);
            const lvl = json.result?.risk_level ?? 'Normal';
            const sc = json.result?.risk_score ?? 0;
            console.log('[KDS Guard] >> ' + lvl + ' (score=' + sc.toFixed(2) + ') -> ' + wsCount() + ' clients');
        } catch {}
    });

    engineProcess.stderr?.on('data', (d: Buffer) => console.error('[kds_engine ERR]', d.toString().trim()));
    engineProcess.on('error', (e: Error) => console.error('[kds_engine ERR] Start failed:', e.message));
    engineProcess.on('exit', (code: number | null) => {
        if (!isQuitting) {
            console.warn('[kds_engine] exited (code=' + code + '), restarting in 3s...');
            setTimeout(startEngine, 3000);
        }
    });
    console.log('[KDS Guard] Engine started (PID: ' + engineProcess.pid + ')');
}

// --- Integrated WebSocket Server (Node.js, no Python needed) ---
let wsClients = new Set<WebSocket>();
function wsCount(): number { return wsClients.size; }
function broadcastWs(msg: string) {
    wsClients.forEach((c) => { if (c.readyState === WebSocket.OPEN) { try { c.send(msg); } catch {} } });
}

function startWsServer() {
    const PORT = 8765;
    wss = new WebSocketServer({ port: PORT });
    wss.on('connection', (ws) => {
        wsClients.add(ws);
        console.log('[WS Server] Client connected (' + wsCount() + ' total)');
        ws.on('close', () => { wsClients.delete(ws); console.log('[WS Server] Client disconnected (' + wsCount() + ')'); });
        ws.on('error', () => wsClients.delete(ws));
    });
    wss.on('error', (e: Error & { code?: string }) => {
        if (e.code !== 'EADDRINUSE') console.error('[WS Server] Error:', e.message);
    });
    console.log('[WS Server] Listening on ws://localhost:' + PORT);
    console.log('[WS Server] Dashboard connects to: ws://localhost:' + PORT);
    startEngine(); // Start engine after WS server is ready
}

function stopWsServer() {
    if (wss) {
        wsClients.forEach((c) => { try { c.close(); } catch {} });
        wsClients.clear();
        wss.close();
        wss = null;
        console.log('[WS Server] Stopped');
    }
}

function showDetectionNotification(riskLevel: string, score: number, reasons: string[]) {
    if (Notification.isSupported()) {
        const isHigh = riskLevel === 'High' || riskLevel === 'Critical';
        const n = new Notification({
            title: isHigh ? 'KDS GUARD - PHAT HIEN TAN CONG!' : 'KDS Guard - Canh bao',
            body: 'Muc: ' + riskLevel + ' (' + score + '%) | Ly do: ' + reasons.join(', '),
            urgency: isHigh ? 'critical' : 'normal',
        });
        n.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
        n.show();
    }
    updateTrayMenu(riskLevel);
}

function getConnectedDevices(): string {
    try {
        const out = execSync(
            `powershell -NoProfile -Command "Get-PnpDevice -Class Keyboard,HIDClass,HidDevice -Status OK | Select-Object FriendlyName,InstanceId,Status | ConvertTo-Json -Compress"`,
            { encoding: 'utf-8', timeout: 10000, windowsHide: true },
        );
        return out;
    } catch {
        try {
            return execSync(
                `powershell -NoProfile -Command "Get-WmiObject Win32_Keyboard | Select-Object Name,DeviceID,Status | ConvertTo-Json -Compress"`,
                { encoding: 'utf-8', timeout: 10000, windowsHide: true },
            );
        } catch { return '[]'; }
    }
}

ipcMain.on(
    'detection-update',
    (_e, data: { riskLevel: string; riskScore: number; reasons: string[] }) => {
        updateTrayMenu(data.riskLevel);
        if (data.riskLevel === 'High' || data.riskLevel === 'Critical') {
            showDetectionNotification(data.riskLevel, data.riskScore, data.reasons);
        }
    },
);

ipcMain.handle('block-usb-device', async (_e, id: string) => {
    try {
        execSync(`powershell -NoProfile -Command "Disable-PnpDevice -InstanceId '${id}' -Confirm:\$False -ErrorAction SilentlyContinue"`, { windowsHide: true, timeout: 10000 });
        return { success: true, message: 'Da vo hieu hoa thiet bi USB' };
    } catch { return { success: false, message: 'Can quyen Administrator.' }; }
});

ipcMain.handle('unblock-usb-device', async (_e, id: string) => {
    try {
        execSync(`powershell -NoProfile -Command "Enable-PnpDevice -InstanceId '${id}' -Confirm:\$False -ErrorAction SilentlyContinue"`, { windowsHide: true, timeout: 10000 });
        return { success: true, message: 'Da khoi phuc thiet bi USB' };
    } catch { return { success: false, message: 'Can quyen Administrator.' }; }
});

ipcMain.handle('get-app-path', () => PROJECT_ROOT);
ipcMain.handle('get-usb-devices', () => {
    const raw = getConnectedDevices();
    try { return JSON.parse(raw); } catch { return raw; }
});

app.on('second-instance', () => {
    if (mainWindow) {
        mainWindow.isMinimized() && mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
});
app.on('before-quit', () => { isQuitting = true; });
app.on('will-quit', () => { stopWsServer(); engineProcess?.kill('SIGTERM'); tray?.destroy(); });

app.whenReady().then(() => {
    console.log('[KDS Guard] App ready, mode: ' + (isDev ? 'development' : 'production'));
    createWindow();
    createTray();
    startWsServer(); // Starts WS server + engine automatically
});
app.on('window-all-closed', () => {});
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
