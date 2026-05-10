# KDS Guard Dashboard

React Dashboard cho hệ thống phát hiện BadUSB. Hiển thị dữ liệu phát hiện realtime từ Rust engine qua WebSocket, cùng dữ liệu offline từ snapshot JSON.

---

## Tính năng

- **9 trang**: Dashboard, Realtime Monitor, Detection Rules, Alerts, Devices, Logs, Policies, Settings, About
- **8 dashboard widgets**: System Overview, Risk Score, Detection Rules, Keystroke Metrics, Threat Level, Activity Timeline, Recent Alerts, Event Log
- **Realtime**: WebSocket kết nối `ws://localhost:8765` nhận dữ liệu từ `ws_bridge.py`
- **Offline snapshot**: Polling `src/data/dashboard_snapshot.json` mỗi 15 giây (config qua `VITE_SNAPSHOT_POLL_MS`)
- **Windows Notification**: Auto-trigger khi risk ≥ Medium

---

## Giám sát thực (Realtime) ở đâu?

### Trang **Dashboard** (mặc định)

| Widget | Nội dung realtime |
|--------|----------------|
| **Risk Score Gauge** | Kim đồng hồ 0-100%, đổi màu theo risk level |
| **Threat Level** | Đồng hồ nửa tròn: NORMAL→LOW→MEDIUM→HIGH→CRITICAL |
| **Keystroke Metrics** | Biểu đồ radar 8 đặc trưng gõ phím |
| **Activity Timeline** | Phân bố hoạt động theo giờ |
| **Recent Alerts** | Bảng cảnh báo gần nhất |
| **Event Log** | Bảng sự kiện chi tiết |

### Trang **Realtime Monitor** (sidebar)

Trang riêng hiển thị:
- Biểu đồ **đặc trưng gõ theo thời gian thực** (flight time, speed, CV, burst...)
- Bảng **sự kiện gần đây** nhận từ Rust engine
- Trạng thái kết nối WebSocket (`ws://localhost:8765`)

---

## Công nghệ

- React 18 + TypeScript
- MUI v5 (Material UI)
- ECharts (biểu đồ)
- Vite (build tool)
- React Router v6 (SPA navigation)

---

## Cài đặt & Chạy

```bash
npm install
npm run dev
# Mo trinh duyet: http://localhost:3000
```

---

## Kết nối Rust Engine Realtime

```bash
# Terminal 1: ws_bridge.py (tu dong chay kds_guard.exe)
python ws_bridge.py

# Terminal 2: Dashboard
npm run dev
```

Dashboard tự động kết nối `ws://localhost:8765` — dữ liệu phát hiện realtime sẽ hiển thị ngay.

---

## Dữ liệu Offline Snapshot

Khi chạy **`npm run dev`**, Vite middleware tự động xử lý:

1. Nếu có file CSV mới trong **`data/raw/rust/`** (mới hơn `features_dataset.csv`) → chạy
   ```
   python scripts/integrate_datasets.py --rust-collect --merge
   ```
2. Sau đó → chạy
   ```
   python scripts/export_dashboard_snapshot.py
   ```
3. UI đọc snapshot và **polling** mỗi 15 giây (đổi bằng `VITE_SNAPSHOT_POLL_MS`)

**Polling interval:**
```bash
VITE_SNAPSHOT_POLL_MS=30000 npm run dev   # 30 giây
```

---

## Build Production

```bash
npm run build
npm run preview   # Xem bản production tai http://localhost:4173
```

Production build dùng file `src/data/dashboard_snapshot.json` đã bundle. Để cập nhật bản release, chạy export script rồi build lại:

```bash
python scripts/export_dashboard_snapshot.py
npm run build
```

---

## Chạy Dashboard lâu dài

### Cách 1 — 2 terminal riêng (khuyên dùng)

```bash
# Terminal 1: Dashboard
cd kds-guard-dashboard
npm run dev
# Mo trinh duyet: http://localhost:3000

# Terminal 2: Realtime bridge (neu can)
python ws_bridge.py
```

### Cách 2 — Dev server chạy nền (không chiếm terminal)

**PowerShell 7 (pwsh):**
```bash
cd kds-guard-dashboard
Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow:$false -RedirectStandardOutput "$env:TEMP\kds_dashboard.log"
```

**PowerShell 5 (powershell.exe):**
```powershell
cd kds-guard-dashboard
Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow
```

Kiểm tra log:
```bash
Get-Content "$env:TEMP\kds_dashboard.log" -Wait
```

### Cách 3 — Bản production (không cần dev server)

```bash
cd kds-guard-dashboard
npm run build
npm run preview   # http://localhost:4173
```

---

## Test với BadUSB thật

### Thiết bị cần

| Thiết bị | Mục đích |
|----------|----------|
| **Arduino / Seeed XIAO** nạp firmware `kds_guard.ino` | Thu keystroke + gửi qua serial |
| **Máy tính victim** chạy `kds_guard.exe` | Phát hiện tấn công |
| **Máy tính monitor** chạy Dashboard | Quan sát kết quả realtime |

### Luồng hoạt động

```
[BadUSB]  --(keystroke via USB)-->  [kds_guard.exe (victim)]
                                            |
                                      [phat hien injection]
                                            |
                                      [ws_bridge.py]
                                            |
                                      [Dashboard localhost:3000]
```

### Bước thực hiện

**1. Nạp firmware cho BadUSB:**
```bash
# Arduino IDE hoac arduino-cli
# File > Open > kds_guard.ino > Upload
```

**2. Victim machine — chạy engine:**
```bash
# Windows
.\kds_guard.exe --port COM3 --monitor

# Hoac chi chay ws_bridge (tu dong start kds_guard.exe)
python ws_bridge.py
```

**3. Monitor machine — chạy Dashboard:**
```bash
cd kds-guard-dashboard
npm run dev   # http://localhost:3000
```

**4. Kích hoạt BadUSB:**
```bash
# BadUSB tu dong thuc thi payload (VD: mo notepad, go chuoi)
# Kds_guard.exe phat hien anomalie
# Dashboard hien thi canh bao REAL-TIME
```

### Payload mẫu để test

Payload gõ tự động nhanh (tốc độ bất thường → dễ phát hiện):

```python
# simulate_badusb.py - chay truc tiep khong can BadUSB
python scripts/simulate_badusb.py
```

### Kiểm tra kết quả

- **Dashboard** → tab Alerts: thấy cảnh báo `injection` với confidence cao
- **Dashboard** → Realtime Monitor: thấy flight time < 20ms, speed > 12 k/s
- **Event Log**: ghi nhận timestamp + source device

---

## Đồ án Cơ sở – KDS Guard – 2026
