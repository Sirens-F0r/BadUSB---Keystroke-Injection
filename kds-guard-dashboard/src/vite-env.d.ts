/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Khoảng cách (ms) polling snapshot trong dev (mặc định 15000) */
  readonly VITE_SNAPSHOT_POLL_MS?: string;
  /** `true` = không kết nối ws_bridge, dùng dữ liệu giả */
  readonly VITE_USE_MOCK?: string;
  /** WebSocket URL (mặc định ws://localhost:8765) */
  readonly VITE_WS_URL?: string;
}

interface ElectronAPI {
  sendDetectionUpdate(data: {
    riskLevel: string;
    riskScore: number;
    reasons: string[];
  }): void;
  getAppPath(): Promise<string>;
  getUsbDevices(): Promise<unknown>;
  blockUsbDevice(instanceId: string): Promise<{ success: boolean; message: string }>;
  unblockUsbDevice(instanceId: string): Promise<{ success: boolean; message: string }>;
  onAlert(
    callback: (data: {
      riskLevel: string;
      riskScore: number;
      reasons: string[];
    }) => void,
  ): void;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
