import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // Send detection update to main process (tray + notification)
    sendDetectionUpdate: (data: {
        riskLevel: string;
        riskScore: number;
        reasons: string[];
    }) => {
        ipcRenderer.send('detection-update', data);
    },

    // Get app root path
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // Enumerate connected USB/HID devices (keyboards, HIDClass)
    getUsbDevices: (): Promise<unknown> => ipcRenderer.invoke('get-usb-devices'),

    // Block a USB device by instance ID (requires Admin)
    blockUsbDevice: (instanceId: string): Promise<{ success: boolean; message: string }> =>
        ipcRenderer.invoke('block-usb-device', instanceId),

    // Unblock a USB device by instance ID (requires Admin)
    unblockUsbDevice: (instanceId: string): Promise<{ success: boolean; message: string }> =>
        ipcRenderer.invoke('unblock-usb-device', instanceId),

    // Listen for detection alerts from main
    onAlert: (
        callback: (data: {
            riskLevel: string;
            riskScore: number;
            reasons: string[];
        }) => void,
    ) => {
        ipcRenderer.on('alert', (_event, data) => callback(data));
    },

    // Platform info
    platform: process.platform,
});
