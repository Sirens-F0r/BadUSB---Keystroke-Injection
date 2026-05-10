/**
 * TypeScript definitions for Electron preload API
 * Used by renderer to communicate with main process via contextBridge
 */

export interface ElectronAPI {
    sendDetectionUpdate: (data: {
        riskLevel: string;
        riskScore: number;
        reasons: string[];
    }) => void;
    getAppPath: () => Promise<string>;
    onAlert: (callback: (data: {
        riskLevel: string;
        riskScore: number;
        reasons: string[];
    }) => void) => void;
    platform: string;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export {};
