import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Send detection update to main process (tray + notification)
    sendDetectionUpdate: (data: { riskLevel: string; riskScore: number; reasons: string[] }) => {
        ipcRenderer.send('detection-update', data);
    },

    // Get app root path
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // Listen for detection alerts from main (e.g., triggered by main process logic)
    onAlert: (callback: (data: { riskLevel: string; riskScore: number; reasons: string[] }) => void) => {
        ipcRenderer.on('alert', (_event, data) => callback(data));
    },

    // Platform info
    platform: process.platform,
});
