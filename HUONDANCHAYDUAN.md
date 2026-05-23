# Hướng Dẫn Chạy Dự Án KDS Guard

> **Mục tiêu:** Giúp người mới hoàn toàn có thể chạy được toàn bộ hệ thống từ đầu, test thử mọi chức năng, và hiểu hệ thống đang hoạt động ra sao.

---

## Mục lục

1. [Hệ thống gồm những gì?](#1-hệ-thống-gồm-những-gì)
2. [Yêu cầu trước khi chạy](#2-yêu-cầu-trước-khi-chạy)
3. [Cách 1: Chỉ xem Dashboard (nhanh nhất)](#3-cách-1-chỉ-xem-dashboard-nhanh-nhất)
4. [Cách 2: Chạy Dashboard + Bridge (đầy đủ)](#4-cách-2-chạy-dashboard--bridge-đầy-đủ)
5. [Cách 3: Chạy đầy đủ với Engine Rust](#5-cách-3-chạy-đầy-đủ-với-engine-rust)
6. [Kiểm tra hệ thống hoạt động đúng](#6-kiểm-tra-hệ-thống-hoạt-động-đúng)
7. [Test từng chức năng Dashboard](#7-test-từng-chức-năng-dashboard)
8. [Test phát hiện BadUSB (giả lập)](#8-test-phát-hiện-badusb-giả-lập)
9. [Xem log chi tiết](#9-xem-log-chi-tiết)
10. [Xử lý lỗi thường gặp](#10-xử-lý-lỗi-thường-gặp)

---

## 1. Hệ thống gồm những gì?

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard (Trình duyệt)                                │
│  http://localhost:3000                                  │
│  Hiển thị: biểu đồ, cảnh báo, cấu hình              │
└─────────────────────┬───────────────────────────────────┘
                      │ WebSocket (ws://localhost:8765)
┌─────────────────────▼───────────────────────────────────┐
│  ws_bridge.py (Python)                                 │
│  Nhận dữ liệu từ engine → gửi cho Dashboard          │
└─────────────────────┬───────────────────────────────────┘
                      │ JSON stdout
┌─────────────────────▼───────────────────────────────────┐
│  kds_guard.exe (Rust Engine)                            │
│  Thu thập phím → Trích đặc trưng → Phát hiện → Phản hồi │
└─────────────────────────────────────────────────────────┘
```

- **Dashboard:** Giao diện web (React) — xem biểu đồ, cảnh báo, cấu hình
- **ws_bridge.py:** Cầu nối Python — chuyển dữ liệu từ engine sang Dashboard qua WebSocket
- **kds_guard.exe:** Engine Rust — bắt phím thật, phân tích, đưa ra cảnh báo

---

## 2. Yêu cầu trước khi chạy

### 2.1 Cài đặt Node.js

1. Tải Node.js từ https://nodejs.org (chọn phiên bản LTS)
2. Cài đặt bình thường
3. Kiểm tra: mở PowerShell, gõ:
   ```powershell
   node --version
   npm --version
   ```
   → Nếu hiện số phiên bản (vd: `v20.x.x`, `10.x.x`) là OK

### 2.2 Cài đặt Python

1. Tải Python từ https://www.python.org (chọn phiên bản 3.9+)
2. **Quan trọng:** Khi cài đặt, tick ✅ **Add Python to PATH**
3. Kiểm tra:
   ```powershell
   python --version
   pip --version
   ```

### 2.3 Cài đặt Rust (chỉ cần nếu muốn build engine)

1. Tải Rust từ https://rustup.rs
2. Cài đặt bình thường (chọn `1) Proceed with default installation`)
3. Kiểm tra:
   ```powershell
   rustc --version
   cargo --version
   ```

### 2.4 Cài thư viện Python

Mở PowerShell, chạy:

```powershell
pip install websockets
```

---

## 3. Cách 1: Chỉ xem Dashboard (nhanh nhất)

Dùng khi: bạn chỉ muốn xem giao diện, không cần engine thật.

### Bước 1: Mở PowerShell

```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds-guard-dashboard"
```

### Bước 2: Cài thư viện (chỉ cần chạy 1 lần)

```powershell
npm install
```

### Bước 3: Chạy Dashboard

```powershell
npm run dev
```

### Bước 4: Mở trình duyệt

```
http://localhost:3000
```

> **Kết quả:** Dashboard hiển thị với dữ liệu mẫu (mock data). Tất cả biểu đồ, bảng, cấu hình đều hoạt động nhưng không có dữ liệu thời gian thực từ bàn phím.

### Cách tắt Dashboard

Nhấn `Ctrl+C` trong terminal đang chạy `npm run dev`.

---

## 4. Cách 2: Chạy Dashboard + Bridge (đầy đủ)

Dùng khi: bạn muốn xem dữ liệu thời gian thực nhưng chưa có engine Rust.

ws_bridge.py sẽ tự tạo dữ liệu mẫu và gửi cho Dashboard.

### Bước 1: Chạy Dashboard (Terminal 1)

```powershell
# Terminal 1
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds-guard-dashboard"
npm run dev
```

### Bước 2: Chạy Bridge (Terminal 2)

```powershell
# Terminal 2
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
python ws_bridge.py
```

### Bước 3: Mở Dashboard

```
http://localhost:3000
```

> **Kết quả:** Dashboard nhận dữ liệu realtime từ bridge. Trang **Realtime Monitor** hiển thị biểu đồ cập nhật liên tục.

### Cách tắt

`Ctrl+C` trong cả 2 terminal.

---

## 5. Cách 3: Chạy đầy đủ với Engine Rust

Dùng khi: bạn muốn engine thật phát hiện BadUSB khi gõ phím trên máy.

### Bước 1: Build Engine Rust (chỉ cần chạy 1 lần)

```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds_guard"
cargo build --release
```

> Thời gian: **5-15 phút** lần đầu (Rust tải và biên dịch thư viện).
> Các lần sau: ~10-30 giây.

File `kds_guard.exe` sẽ nằm ở:
```
C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds_guard\target\release\kds_guard.exe
```

### Bước 2: Chạy Dashboard (Terminal 1)

```powershell
# Terminal 1
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds-guard-dashboard"
npm run dev
```

### Bước 3: Chạy Bridge + Engine (Terminal 2)

```powershell
# Terminal 2
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
python ws_bridge.py
```

ws_bridge.py sẽ tự khởi động `kds_guard.exe --json-output`.

### Bước 4: Mở Dashboard

```
http://localhost:3000
```

### Bước 5: Gõ phím trên bàn phím

> ⚠️ **Quan trọng:** Dashboard phải đang mở ở **cửa sổ khác** (không phải cửa sổ đang gõ).
> Nếu Dashboard chiếm focus, gõ phím vào Dashboard thay vì toàn hệ thống.

Khi gõ:
- Dashboard trang **Realtime Monitor** → cập nhật liên tục
- Terminal 2 hiển thị: `[BRIDGE] >> NORMAL (score=0.05) -> 1 clients`
- Nếu gõ cực nhanh (giả lập BadUSB) → cảnh báo xuất hiện

### Cách tắt

`Ctrl+C` trong cả 2 terminal.

---

## 6. Kiểm tra hệ thống hoạt động đúng

Sau khi chạy xong, kiểm tra từng thành phần:

### 6.1 Dashboard mở được không?

```
http://localhost:3000
```
✅ Thấy giao diện Dashboard
❌ Lỗi "Cannot connect" → chạy `npm run dev` lại

### 6.2 WebSocket Bridge kết nối được không?

Mở trình duyệt, nhấn **F12** → tab **Console**, gõ:

```javascript
ws = new WebSocket('ws://localhost:8765')
```

✅ Thấy log `[KDS Guard WS] Connected` trong Console
❌ Lỗi `WebSocket connection failed` → chạy `python ws_bridge.py`

### 6.3 Engine Rust có chạy không?

Nhìn Terminal 2 đang chạy `ws_bridge.py`:

✅ Thấy: `[BRIDGE] Khoi dong: ...kds_guard.exe --json-output -u test`
❌ Thấy: `[BRIDGE] Khong tim thay: ...kds_guard.exe` → chạy `cargo build --release`

### 6.4 Dữ liệu realtime có đến Dashboard không?

1. Mở Dashboard → trang **Realtime Monitor**
2. Gõ vài ký tự trên bàn phím
3. ✅ Thấy điểm trên biểu đồ di chuyển theo thời gian
4. ✅ Mục "Connection Status" hiển thị: **Connected**

---

## 7. Test từng chức năng Dashboard

### 7.1 Dashboard chính

1. Mở: http://localhost:3000
2. Xem: Risk Score, Threat Level, Activity Timeline, Recent Alerts
3. ✅ Biểu đồ ECharts hiển thị dữ liệu mẫu

### 7.2 Realtime Monitor

1. Mở: http://localhost:3000/realtime
2. Gõ phím → thấy biểu đồ cập nhật mỗi 2 giây
3. ✅ Điểm dữ liệu xuất hiện trên chart

### 7.3 Detection Rules

1. Mở: http://localhost:3000/rules
2. Bật/tắt các rule (Enable/Disable switch)
3. ✅ Switch hoạt động, trạng thái được ghi nhớ

### 7.4 Alerts

1. Mở: http://localhost:3000/alerts
2. Xem danh sách cảnh báo
3. ✅ Có dữ liệu mẫu hiển thị

### 7.5 Devices

1. Mở: http://localhost:3000/devices
2. Nhấn **Refresh** → danh sách thiết bị cập nhật
3. ✅ Danh sách hiển thị

### 7.6 Settings

1. Mở: http://localhost:3000/settings
2. Kéo thanh trượt **Detection Threshold**
3. ✅ Giá trị thay đổi theo thời gian thực
4. Nhấn **Save Settings**
5. ✅ Snackbar thông báo đã lưu

### 7.7 About

1. Mở: http://localhost:3000/about
2. ✅ Hiển thị thông tin dự án

### 7.8 Dark/Light Mode

1. Nhấn nút 🌙/☀️ trên thanh topbar
2. ✅ Giao diện chuyển đổi giữa tối/sáng ngay lập tức

### 7.9 Sidebar Navigation

1. Nhấn các icon trong sidebar
2. ✅ Chuyển trang mượt, đường dẫn URL thay đổi

---

## 8. Test phát hiện BadUSB (giả lập)

Nếu muốn xem hệ thống phát hiện BadUSB mà không có thiết bị thật:

### 8.1 Dùng Python simulator

```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\DOANCOSO\scripts"
python simulate_badusb.py
```

> Simulator gửi các phím với tốc độ 50-100 phím/giây (giống BadUSB thật).

### 8.2 Quan sát kết quả

Trong Dashboard trang **Realtime Monitor**:

| Loại gõ | Tốc độ | Kết quả |
|----------|--------|---------|
| Gõ tay bình thường | 3-10 phím/giây | ✅ NORMAL (score < 0.2) |
| Gõ nhanh giả lập | 20-30 phím/giây | ⚠️ MEDIUM (score 0.2-0.6) |
| BadUSB simulator | 50-100 phím/giây | 🔴 HIGH/CRITICAL (score > 0.6) |

### 8.3 Xem cảnh báo chi tiết

1. Mở F12 → Console trong trình duyệt
2. Gõ nhanh liên tục
3. ✅ Thấy log: `[KDS Guard WS] Connected` và dữ liệu detection liên tục

---

## 9. Xem log chi tiết

### Log của Dashboard

Mở F12 → Console trong trình duyệt, lọc:
- `[KDS Guard WS]` — WebSocket messages
- `[KDS Guard API]` — API calls

### Log của Bridge (Terminal 2)

```
[BRIDGE] WebSocket server dang chay tai ws://localhost:8765
[BRIDGE] Khoi dong: ...kds_guard.exe --json-output -u test
[BRIDGE] >> NORMAL (score=0.05) -> 1 clients
[BRIDGE] >> MEDIUM (score=0.32) -> 1 clients
```

### Log của Engine Rust (trong Terminal 2)

Engine ghi log vào console khi khởi động:

```
╔══════════════════════════════════════════════════╗
║  KDS Guard v0.1.0                                ║
║  BadUSB Detection via Keystroke Dynamics          ║
╠══════════════════════════════════════════════════╣
║  Mode: Detection Active                          ║
║  User: test                                      ║
╚══════════════════════════════════════════════════╝
```

Khi phát hiện nguy hiểm:
```
╔══════════════════════════════════════════════════╗
║  🔴 CRITICAL CANH BAO - Risk Score: 0.85         ║
╠══════════════════════════════════════════════════╣
║  - Flight time trung binh rat thap: 18.5ms       ║
║  - Toc do go bat thuong: 55.0 keys/s            ║
╚══════════════════════════════════════════════════╝
```

---

## 10. Xử lý lỗi thường gặp

### Lỗi: `npm run dev` bị lỗi "Cannot find module"

```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds-guard-dashboard"
npm install
npm run dev
```

### Lỗi: `python ws_bridge.py` bị lỗi "No module named 'websockets'"

```powershell
pip install websockets
```

### Lỗi: `cargo build` bị lỗi trên Windows

1. Cài Visual Studio Build Tools:
   - Tải https://visualstudio.microsoft.com/downloads/
   - Chọn "Tools for Visual Studio" → "Build Tools for Visual Studio 2022"
   - Tick ✅ "Desktop development with C++"

2. Sau khi cài xong, chạy lại:
   ```powershell
   cargo build --release
   ```

### Lỗi: Dashboard mở trắng (blank page)

1. Nhấn F12 → Console → xem lỗi
2. Thử xóa cache: `Ctrl+Shift+R` (hard reload)
3. Khởi động lại: `Ctrl+C` rồi `npm run dev`

### Lỗi: WebSocket không kết nối được

1. Đảm bảo port 8765 chưa bị chiếm:
   ```powershell
   netstat -ano | findstr 8765
   ```
2. Tắt ứng dụng khác đang dùng port đó
3. Khởi động lại ws_bridge.py

### Lỗi: Engine không bắt được phím

- ⚠️ **rdev** (thư viện bắt phím của Rust) **không hoạt động khi chạy với quyền Administrator**
- Nếu cần BlockInput (chặn phím thật), chạy Terminal 2 với quyền Admin:
  ```powershell
  # Chuột phải vào PowerShell → "Run as administrator"
  cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
  python ws_bridge.py
  ```

### Lỗi: `[ws_bridge ERROR] opening handshake failed`

Lỗi này **không ảnh hưởng** đến hoạt động. Electron app kết nối rồi ngắt nhanh, bridge đã được sửa để xử lý. Bỏ qua lỗi này.

### Lỗi: `cargo run` treo, không có output

1. Nhấn `Ctrl+C` để dừng
2. Chạy với timeout:
   ```powershell
   cargo run --release -- --json-output -u test --duration 10
   ```
   → Engine tự tắt sau 10 giây

---

## Tóm tắt nhanh

| Mục tiêu | Lệnh cần chạy |
|-----------|--------------|
| Chỉ xem Dashboard | `npm run dev` (1 terminal) |
| Dashboard + Bridge giả | `npm run dev` + `python ws_bridge.py` (2 terminal) |
| Đầy đủ (engine thật) | `npm run dev` + `python ws_bridge.py` + `cargo build --release` trước |
| Test BadUSB giả | `python scripts/simulate_badusb.py` |
| Kiểm tra build engine | `cargo build --release` trong folder `kds_guard` |

> **Nguyên tắc vàng:** Luôn mở Dashboard ở cửa sổ khác với cửa sổ đang gõ phím để engine bắt được sự kiện toàn hệ thống.

---

## 11. Test với BadUSB thật (thiết bị vật lý)

> **Cảnh báo:** Phần này chỉ dành cho mục đích kiểm thử bảo mật có kiểm soát. Không sử dụng BadUSB để tấn công máy tính không thuộc quyền kiểm soát của bạn.

### 11.1 Thiết bị cần chuẩn bị

| Thiết bị | Mô tả | Giá tham khảo |
|----------|--------|----------------|
| USB Armory | BadUSB có thể lập trình | ~$110 |
| Hak5 USB Rubber Ducky | Thiết bị BadUSB phổ biến nhất | ~$50 |
| Digispark ATtiny85 | BadUSB rẻ nhất, dùng Arduino | ~$3 |
| STM32 BluePill | BadUSB DIY với STM32 | ~$5 |
| Flipper Zero | Thiết bị pentest đa năng | ~$169 |

### 11.2 Chuẩn bị Payload cho BadUSB

**Payload mẫu — mở Notepad và gõ lệnh nguy hiểm:**

`
DELAY 1000
GUI r
DELAY 500
STRING notepad
ENTER
DELAY 1000
STRING This attack was blocked by KDS Guard!
ENTER
STRING Checking keystroke dynamics...
ENTER
STRING Detecting anomaly pattern...
ENTER
STRING ALERT: BadUSB injection detected!
ENTER
`

Lưu file payload thành payload.txt (định dạng Rubber Ducky).

### 11.3 Chuẩn bị KDS Guard trước khi cắm

**Bước 1:** Build engine với quyền Administrator (cần thiết cho BlockInput):

`powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds_guard"
cargo build --release
`

**Bước 2:** Chạy Dashboard và Bridge:

`powershell
# Terminal 1 - Dashboard
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds-guard-dashboard"
npm run dev

# Terminal 2 - Bridge + Engine (CHẠY VỚI QUYỀN ADMIN)
# Chuột phải vào PowerShell → "Run as Administrator"
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
python ws_bridge.py
`

**Bước 3:** Mở Dashboard tại http://localhost:3000, chuyển sang tab **Realtime Monitor**.

**Bước 4:** Đảm bảo Dashboard **không chiếm focus** cửa sổ hiện tại (BadUSB gửi phím đến cửa sổ đang active).

### 11.4 Các kịch bản demo

#### Kịch bản 1: Tấn công mở Notepad (an toàn nhất)

1. Cắm BadUSB vào cổng USB
2. BadUSB tự động chạy payload
3. Quan sát Dashboard:

| Giai đoạn | Dashboard hiển thị | Giải thích |
|-----------|-------------------|------------|
| 0-2s | Status: "ĐANG BẢO VỆ" màu xanh | Hệ thống bắt đầu thu thập |
| 2-5s | Risk Score tăng dần 0.1 → 0.3 | Phát hiện tốc độ bất thường |
| 5-8s | Risk Score 0.5 → 0.7, màu cam | Ngưỡng MEDIUM bị vượt |
| 8-10s | Risk Score 0.8+, màu đỏ | Ngưỡng CRITICAL — phát hiện BadUSB |

#### Kịch bản 2: Tấn công thực thi lệnh (cảnh báo)

Payload thực thi lệnh nguy hiểm:

`
DELAY 1000
GUI r
DELAY 300
STRING cmd
ENTER
DELAY 800
STRING netsh interface show interface
ENTER
`

**Phản ứng của KDS Guard:**

`
╔══════════════════════════════════════════════════╗
║  🔴 CRITICAL CANH BAO — Risk Score: 0.85         ║
╠══════════════════════════════════════════════════╣
║  Flight time trung binh rat thap: 18.5ms         ║
║  Toc do go bat thuong: 55.0 keys/s              ║
║  Muc do: CRITICAL                               ║
╠══════════════════════════════════════════════════╣
║  Hanh dong: SoftBlock (5s) + Challenge           ║
╚══════════════════════════════════════════════════╝
`

#### Kịch bản 3: Tấn công nhanh với Digispark ($3)

Digispark gửi ~500 keys/giây — hệ thống phát hiện gần như ngay lập tức:

1. Cắm Digispark
2. Payload chạy
3. **Trong vòng 500ms**: Dashboard hiển thị CRITICAL
4. **BlockInput kích hoạt**: phím BadUSB bị chặn 5 giây
5. **Notification Windows**: cảnh báo popup xuất hiện
6. **Alert log**: ghi nhận sự kiện vào hệ thống

### 11.5 Đọc kết quả trên Dashboard

#### Realtime Monitor

- **Biểu đồ Risk Score**: đường tăng vọt từ 0 → 0.8+ trong 2-5 giây
- **Bảng Detection**: hiển thị rule R3 (CV flight time) và R7 (typing speed) triggered
- **Connection Status**: vẫn "Connected" trong suốt tấn công

#### Alerts Page

- Alert mới xuất hiện với:
  - Risk Level: CRITICAL
  - Risk Score: 0.85
  - Reasons: ["Abnormal CV flight time: 0.05", "Typing speed 55 keys/s exceeds 12 keys/s limit"]
  - Action: SoftBlock 5000ms

#### Console trình duyệt (F12)

`
[KDS Guard WS] Connected to ws://localhost:8765
[KDS Guard] Detection: { risk_level: "CRITICAL", risk_score: 0.85, reasons: [...] }
[KDS Guard] Policy action: SoftBlock 5000ms
[KDS Guard] BlockInput activated
`

### 11.6 So sánh phát hiện giữa BadUSB thật và giả lập

| Tiêu chí | BadUSB giả lập (simulate_badusb.py) | BadUSB thật |
|----------|------------------------------------|-------------|
| Tốc độ gõ | 50-100 keys/s | 50-1000 keys/s |
| Thời gian phát hiện | 3-5 giây | 0.5-3 giây |
| Risk Score đạt được | 0.6-0.8 (HIGH) | 0.8-1.0 (CRITICAL) |
| BlockInput | Có thể có | Có (nếu chạy Admin) |
| Độ chính xác | Cao | Rất cao |

### 11.7 Các lưu ý quan trọng

> **⚠️ Cảnh báo pháp lý:**
> - Chỉ thử nghiệm trên máy tính của bạn hoặc được ủy quyền
> - BadUSB là hành vi phạm pháp trong nhiều quốc gia nếu dùng không đúng mục đích
> - KDS Guard được thiết kế cho mục đích phòng thủ và giáo dục

> **🔒 Bảo mật khi test:**
> - Không kết nối USB không rõ nguồn gốc vào máy tính thật
> - Sử dụng máy ảo (VM) để test nếu có thể
> - Ngắt mạng máy ảo trước khi test payload nguy hiểm
> - Luôn theo dõi Dashboard khi cắm BadUSB

> **🛡️ Khi phát hiện BadUSB thật:**
> 1. Không rút USB ngay lập tức (có thể kích hoạt anti-forensic)
> 2. Chụp ảnh màn hình Dashboard
> 3. Ghi log: thời gian, risk score, payload (nếu biết)
> 4. Khóa máy: Win + L
> 5. Báo cáo cho quản trị hệ thống

### 11.8 Tạo BadUSB payload hiệu quả để test

**Payload tốt nhất để test KDS Guard:**

`
REM KDS Guard Test Payload - BENIGN
REM Khong lam thiet hai, chi test detection
DELAY 1000
GUI r
DELAY 300
STRING notepad
ENTER
DELAY 500
STRING KDS Guard is protecting this system.
ENTER
STRING Keystroke dynamics monitoring active.
ENTER
DELAY 2000
ALT F4
`

Payload này:
- ✅ An toàn (chỉ mở Notepad, không gây hại)
- ✅ Đủ nhanh để kích hoạt cảnh báo
- ✅ Dễ quan sát trên Dashboard
- ✅ Không gây mất dữ liệu

