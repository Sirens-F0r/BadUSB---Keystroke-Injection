# KDS Guard Dashboard

React Dashboard cho hệ thống phát hiện BadUSB. Hiển thị dữ liệu phát hiện real-time từ Rust engine qua WebSocket.

## Tính năng

- **9 trang**: Dashboard, Realtime Monitor, Detection Rules, Alerts, Devices, Logs, Policies, Settings, About
- **8 dashboard widgets**: System Overview, Risk Score, Detection Rules, Keystroke Metrics, Threat Level, Activity Timeline, Recent Alerts, Event Log
- **Real-time**: WebSocket kết nối `ws://localhost:8765` nhận dữ liệu từ `ws_bridge.py`
- **Windows Notification**: Auto-trigger khi risk ≥ Medium

## Công nghệ

- React 18 + TypeScript
- MUI v5 (Material UI)
- ECharts (biểu đồ)
- Vite (build tool)
- React Router v6 (SPA navigation)

## Cài đặt & Chạy

```bash
npm install
npm run dev
# Mở http://localhost:3000
```

## Kết nối Rust Engine

```bash
# Chạy engine với JSON output
kds_guard.exe --json-output | python ws_bridge.py

# Dashboard tự động nhận data qua ws://localhost:8765
```

## Đồ án Cơ sở – KDS Guard – 2026
