# KDS Guard Dashboard

> **KDS Guard** — BadUSB Detection via Keystroke Dynamics
>
> Phát hiện thiết bị BadUSB dựa trên phân tích dynamics gõ phím (Keystroke Dynamics) bằng Rust engine.

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Các tính năng chính](#các-tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [API & Backend](#api--backend)
- [Dark/Light Mode](#darklight-mode)
- [Build & Package](#build--package)
- [Xử lý sự cố](#xử-lý-sự-cố)

---

## Tổng quan

KDS Guard là hệ thống giám sát và phát hiện tấn công BadUSB theo thời gian thực. Dashboard cung cấp giao diện web-based để:

- Theo dõi mức độ rủi ro hệ thống
- Xem danh sách thiết bị USB/HID đang kết nối
- Cấu hình các quy tắc phát hiện
- Xem lịch sử cảnh báo và sự kiện
- Giám sát realtime keystroke dynamics

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    KDS Guard Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  BadUSB /    │───▶│  Rust Engine │───▶│  WebSocket   │  │
│  │  Keyboard    │    │  (kds_guard) │    │  Bridge      │  │
│  │  Input       │    │              │    │  (ws_bridge) │  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘  │
│                                                  │          │
│  ┌──────────────┐                     ┌────────▼───────┐  │
│  │  Electron    │◀─────────────────────│  Dashboard     │  │
│  │  Main       │   IPC / Tray / Notif  │  (React+Vite) │  │
│  │  Process    │◀─────────────────────│  localhost:3000│  │
│  └──────┬───────┘                     └────────────────┘  │
│         │                                                       │
│         │  PowerShell WMI                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  USB Device │                                               │
│  │  Enumeration│                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component chính

| Component | Mô tả |
|-----------|-------|
| `kds_guard.exe` | Rust engine phân tích keystroke dynamics |
| `ws_bridge.py` | Python WebSocket bridge kết nối engine ↔ dashboard |
| `electron/main.ts` | Electron main process (tray, notification, IPC) |
| `electron/preload.ts` | Preload script expose IPC APIs |
| Dashboard (React) | Giao diện người dùng |

---

## Yêu cầu hệ thống

| Yêu cầu | Phiên bản tối thiểu |
|----------|---------------------|
| Hệ điều hành | Windows 10/11 (x64) |
| Node.js | 18.x trở lên |
| Python | 3.8+ (cho ws_bridge.py) |
| Rust | 1.70+ (nếu build engine) |
| RAM | 4GB |
| Dung lượng đĩa | ~200MB |

---

## Cài đặt

### 1. Clone/Copy dự án

```bash
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
```

### 2. Cài đặt dependencies Node.js

```bash
cd kds-guard-dashboard
npm install
```

### 3. Cài đặt Python dependencies (cho ws_bridge)

```bash
# ws_bridge.py cần websocket-client
pip install websocket-client
```

### 4. Đảm bảo Rust engine đã được build

KDS Guard engine (`kds_guard.exe`) cần được build trước từ thư mục `kds_guard/`.

---

## Chạy ứng dụng

### Chế độ Development (Web only)

```bash
cd kds-guard-dashboard
npm run dev
```

Dashboard sẽ chạy tại `http://localhost:3000`.

> **Lưu ý:** Chế độ dev không khởi động Electron. Dùng dữ liệu mock nếu `VITE_USE_MOCK=true`.

### Chạy với Electron (Full app)

```bash
cd kds-guard-dashboard
npm run electron:dev
```

Điều này sẽ:
1. Khởi động Vite dev server tại `localhost:3000`
2. Mở cửa sổ Electron
3. Khởi động `ws_bridge.py` (trong production build)

### Chạy với dữ liệu mock (không cần backend)

```bash
VITE_USE_MOCK=true npm run dev
```

### Environment Variables

| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `VITE_USE_MOCK` | `false` | `true` = dùng dữ liệu mock thay vì kết nối thật |
| `VITE_WS_URL` | `ws://localhost:8765` | WebSocket URL của ws_bridge |
| `VITE_SNAPSHOT_POLL_MS` | `15000` | Khoảng thời gian poll snapshot (ms) |

---

## Cấu trúc dự án

```
kds-guard-dashboard/
├── electron/
│   ├── main.ts           # Electron main process
│   └── preload.ts       # Preload script (IPC bridge)
├── public/
│   └── electron-icon.png
├── src/
│   ├── components/      # UI components
│   │   ├── base/        # IconifyIcon, Image, ReactEChart, etc.
│   │   ├── common/      # Shared components
│   │   ├── icons/       # Custom icon components
│   │   ├── loading/     # Splash screen
│   │   └── sections/    # Dashboard sections
│   │       └── dashboard/
│   │           ├── activity-timeline/
│   │           ├── detection-rules/
│   │           ├── event-log/
│   │           ├── keystroke-metrics/
│   │           ├── recent-alerts/
│   │           ├── risk-score/
│   │           ├── system-overview/
│   │           └── threat-level/
│   ├── data/            # Static data & mock data
│   │   └── chart-data/  # Chart configuration data
│   ├── hooks/           # Custom React hooks
│   │   ├── useKdsGuard.ts
│   │   ├── useRealtime.ts
│   │   ├── useRuleConfig.ts
│   │   ├── useSettings.ts
│   │   └── useWindowsNotification.ts
│   ├── layouts/
│   │   ├── auth-layout/
│   │   └── main-layout/
│   │       ├── Footer/
│   │       ├── Sidebar/
│   │       └── Topbar/
│   ├── pages/           # Page components
│   │   ├── about/
│   │   ├── alerts/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   ├── error/
│   │   ├── policies/
│   │   ├── realtime/
│   │   ├── rules/
│   │   └── settings/
│   ├── providers/       # React context providers
│   │   ├── BreakpointsProvider.tsx
│   │   ├── DashboardSnapshotProvider.tsx
│   │   └── ThemeProvider.tsx     # Dark/Light mode
│   ├── routes/          # React Router config
│   ├── services/        # API services
│   │   └── kds-guard-api.ts      # WebSocket & HTTP API
│   ├── theme/           # MUI theme customization
│   │   ├── colors.ts
│   │   ├── palette.ts
│   │   ├── typography.ts
│   │   ├── breakpoints.ts
│   │   ├── spacing.ts
│   │   ├── shape.ts
│   │   ├── theme.ts
│   │   ├── component-overrides.ts
│   │   ├── components/  # MUI component overrides
│   │   └── styles/       # Additional styles
│   ├── types/           # TypeScript interfaces
│   ├── App.tsx          # Root component
│   └── main.tsx         # Entry point
├── ws_bridge.py         # Python WebSocket bridge
├── kds_guard.exe        # Rust engine (build output)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── electron-builder.json
```

---

## Các tính năng chính

### 1. Dashboard chính
- **Risk Score Chart** — Biểu đồ điểm rủi ro theo thời gian
- **Threat Level Gauge** — Đồng hồ mức độ đe dọa
- **System Overview** — Thông tin tổng quan hệ thống
- **Activity Timeline** — Dòng thời gian hoạt động
- **Recent Alerts** — Cảnh báo gần đây
- **Detection Rules** — Trạng thái các quy tắc phát hiện
- **Event Log** — Nhật ký sự kiện
- **Keystroke Metrics** — Chỉ số keystroke dynamics

### 2. Giám sát thiết bị (Devices)
- Liệt kê USB/HID devices đang kết nối
- Phân loại: Keyboard, Mouse, Hub, USB Device
- Đánh giá mức độ tin cậy (trusted, monitoring, suspicious, blocked)
- Parse VID/PID từ InstanceId
- Refresh tự động mỗi 30 giây

### 3. Quy tắc phát hiện (Detection Rules)
- 8 quy tắc có thể bật/tắt (R1-R8)
- Lưu trạng thái vào localStorage
- Tổng số rule đang enabled

### 4. Realtime Monitor
- Kết nối WebSocket tới ws_bridge
- Hiển thị key events theo thời gian thực
- Biểu đồ feature vectors
- Kết nối tự động reconnect

### 5. Alerts
- Danh sách cảnh báo với phân trang
- Filter theo mức độ risk
- Thông tin chi tiết: timestamp, risk score, reasons, action

### 6. Policies
- Cấu hình Policy Actions
- Allow, LogOnly, Alert, SoftBlock, Challenge

### 7. Settings
- Cấu hình detector thresholds
- Ngưỡng Medium/High/Critical

### 8. System Tray (Electron)
- Chạy nền trong system tray
- Thay đổi icon theo mức risk
- Context menu với Quick actions
- Native notifications cho cảnh báo cao

---

## Công nghệ sử dụng

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.2.2 | Type safety |
| Vite | 5.2.0 | Build tool |
| MUI (Material UI) | 5.15.19 | Component library |
| React Router | 6.23.1 | Routing |
| ECharts | 5.5.0 | Charts |
| SimpleBar | 3.2.6 | Custom scrollbars |
| Swiper | 11.1.4 | Carousel |

### Desktop (Electron)
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Electron | 42.0.1 | Desktop app framework |
| electron-builder | 26.8.1 | Packaging |

### Backend
| Component | Ngôn ngữ | Mục đích |
|-----------|----------|----------|
| kds_guard | Rust | Keystroke dynamics analysis |
| ws_bridge | Python | WebSocket bridge |

---

## API & Backend

### WebSocket Protocol

Dashboard kết nối tới `ws://localhost:8765` (ws_bridge).

#### Message Types (Renderer → Bridge)

```json
// Key event capture
{ "type": "key_event", "data": { ... } }

// Engine config update
{ "type": "config_update", "data": { ... } }
```

#### Message Types (Bridge → Renderer)

```json
// Detection result (từ Rust engine)
{
  "type": "detection",
  "result": {
    "risk_level": "NORMAL",
    "risk_score": 0.04,
    "rule_score": 0.0,
    "reasons": [],
    "window_start_ms": 0,
    "window_end_ms": 5000
  },
  "timestamp": "2026-04-19T19:43:08.000Z"
}
```

### REST API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/status` | GET | System status |
| `/api/config` | GET | Detector configuration |
| `/api/detection/latest` | GET | Latest detection result |
| `/api/alerts` | GET | Alert history |
| `/api/features` | GET | Features dataset |

### IPC Channels (Electron)

| Channel | Direction | Mục đích |
|---------|-----------|----------|
| `detection-update` | Renderer → Main | Gửi detection update |
| `get-app-path` | Renderer → Main | Lấy đường dẫn app |
| `get-usb-devices` | Renderer → Main | Liệt kê USB devices |

---

## Dark/Light Mode

Ứng dụng hỗ trợ chuyển đổi giữa **Dark Mode** (mặc định) và **Light Mode**.

### Cách sử dụng

1. Nhấn biểu tượng **Mặt trời/Trăng** ở góc phải Topbar
2. Trạng thái được **lưu vào localStorage** — không cần đặt lại khi reload

### Theme Provider

```typescript
// src/providers/ThemeProvider.tsx
import { useThemeMode } from 'providers/ThemeProvider';

// Trong component:
const { mode, toggleMode } = useThemeMode();
// mode = 'dark' | 'light'
```

### Màu sắc theo chế độ

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Background | `#0a0e1a` | `#F6F6FF` |
| Paper | `#171821` | `#FFFFFF` |
| Text Primary | `#F6F6FF` | `#171821` |
| Text Secondary | `#CAC9D7` | `#4D4D59` |
| Primary | `#3AB4A4` | `#3AB4A4` |
| Scrollbar | `#3AB4A4` | `#CAC9D7` |

---

## Build & Package

### Build Web (chỉ frontend)

```bash
npm run build
```

Output: `dist/` và `dist-electron/`

### Build Electron App

```bash
npm run electron:build
```

Output:
- NSIS Installer: `C:\Temp\KDSGuard2\release\KDS Guard Setup x.x.x.exe`
- Portable: `C:\Temp\KDSGuard2\release\win-unpacked\KDS Guard.exe`

### Build Directory Only (không tạo installer)

```bash
npm run electron:build:dir
```

Output: `C:\Temp\KDSGuard2\release\win-unpacked\`

### Electron Builder Config

Xem `electron-builder.json`:

```json
{
  "appId": "com.kdsguard.app",
  "productName": "KDS Guard",
  "directories": {
    "output": "C:\\Temp\\KDSGuard2\\release"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*",
    "package.json",
    "ws_bridge.py",
    "public/**/*"
  ],
  "win": {
    "target": [{ "target": "nsis", "arch": "x64" }]
  }
}
```

---

## Xử lý sự cố

### Lỗi TypeScript

```bash
npm run build
```

Kiểm tra các lỗi TypeScript trước khi build.

### WebSocket không kết nối được

1. Kiểm tra `ws_bridge.py` đang chạy: `python ws_bridge.py`
2. Kiểm tra Python websocket-client: `pip install websocket-client`
3. Kiểm tra port 8765 không bị chiếm: `netstat -an | findstr 8765`

### Electron không mở

1. Kiểm tra Node.js version: `node --version` (cần 18+)
2. Chạy dev mode: `npm run dev`
3. Kiểm tra DevTools console logs

### USB Devices không hiển thị

1. Chạy PowerShell command thủ công:
   ```powershell
   Get-PnpDevice -Class Keyboard,HIDClass,HidDevice -Status OK
   ```
2. Kiểm tra quyền truy cập PowerShell
3. Thử chạy Electron với quyền Administrator

### Build thất bại

1. Xóa `node_modules` và cài lại: `rm -rf node_modules && npm install`
2. Kiểm tra `npm run build` trước
3. Kiểm tra disk space (cần ~500MB)

### System Tray không hiển thị

1. Kiểm tra `public/electron-icon.png` tồn tại
2. Chạy thử trong dev mode: `npm run electron:dev`

---

## License

Copyright 2026 — KDS Guard Project

---

## Liên hệ / Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Console logs trong DevTools (F12)
2. Output terminal khi chạy dev mode
3. Electron log files trong `%APPDATA%`
