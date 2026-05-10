/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Khoảng cách (ms) polling snapshot trong dev (mặc định 15000) */
  readonly VITE_SNAPSHOT_POLL_MS?: string;
  /** `true` = không kết nối ws_bridge, dùng dữ liệu giả */
  readonly VITE_USE_MOCK?: string;
  /** WebSocket URL (mặc định ws://localhost:8765) */
  readonly VITE_WS_URL?: string;
}
