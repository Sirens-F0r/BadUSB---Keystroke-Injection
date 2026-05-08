# 🛡️ KDS Guard — BadUSB Detection via Keystroke Dynamics

Phát hiện & ngăn chặn tấn công chèn phím giả mạo (BadUSB) bằng phân tích động học gõ phím (Keystroke Dynamics).

---

## 📑 Mục lục

- [Tổng quan](#tổng-quan)
- [Kết quả thực nghiệm](#kết-quả-thực-nghiệm)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Pipeline xử lý](#pipeline-xử-lý)
- [🚀 Hướng dẫn cài đặt & chạy từ A-Z](#-hướng-dẫn-cài-đặt--chạy-từ-a-z)
  - [Bước 0: Clone dự án](#bước-0-clone-dự-án)
  - [Bước 1: Cài đặt công cụ cần thiết](#bước-1-cài-đặt-công-cụ-cần-thiết)
  - [Bước 2: Cài đặt Python dependencies](#bước-2-cài-đặt-python-dependencies)
  - [Bước 3: Build Rust engine](#bước-3-build-rust-engine)
  - [Bước 4: Cài đặt Dashboard](#bước-4-cài-đặt-dashboard)
  - [Bước 5: Xử lý dữ liệu thô & tích hợp dataset](#bước-5-xử-lý-dữ-liệu-thô--tích-hợp-dataset)
  - [Bước 6: Huấn luyện model & đánh giá](#bước-6-huấn-luyện-model--đánh-giá)
  - [Bước 7: Chạy hệ thống hoàn chỉnh](#bước-7-chạy-hệ-thống-hoàn-chỉnh)
- [Chạy Demo nhanh](#chạy-demo-nhanh)
- [8 Detection Rules](#8-detection-rules)
- [22 Đặc trưng](#22-đặc-trưng)
- [Mức phản hồi](#mức-phản-hồi)
- [Tham số CLI](#tham-số-cli)
- [Cấu hình nâng cao](#cấu-hình-nâng-cao)
- [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)
- [Công nghệ](#công-nghệ)
- [Tài liệu](#tài-liệu)

---

## Tổng quan

KDS Guard giám sát hành vi gõ phím theo thời gian thực, phân biệt giữa người thật và thiết bị tiêm phím tự động (BadUSB/Rubber Ducky). Khi phát hiện bất thường, hệ thống cảnh báo qua Windows notification và chặn input tạm thời.

### Kết quả thực nghiệm

Đánh giá trên **21,035 mẫu** (20,803 người thật + 232 tấn công):

| Chỉ số | Giá trị |
|--------|---------|
| **TPR (Recall)** | **98.7%** |
| **FPR** | **0.0%** |
| **F1 Score** | **99.3%** |

## Cấu trúc dự án

```
DOANCOSO/
├── kds_guard/              # Rust engine (core)
│   └── src/
│       ├── main.rs         # Entry point + Early Warning Layer + JSON output
│       ├── input_capture.rs# Thu thập sự kiện bàn phím
│       ├── feature.rs      # Trích xuất 22 đặc trưng (sliding window)
│       ├── detector.rs     # Rule-based detection (8 rules)
│       ├── policy.rs       # Quyết định phản hồi + Challenge mode
│       ├── response.rs     # BlockInput API + Windows notification
│       └── logger.rs       # Ghi log CSV
├── ws_bridge.py            # WebSocket bridge (Rust → Dashboard real-time)
├── kds-guard-dashboard/    # React dashboard (TypeScript + MUI + ECharts)
├── collector_tool/         # Tool thu thập dữ liệu
├── scripts/                # Scripts phân tích & demo
│   ├── simulate_badusb.py  # Mô phỏng BadUSB (demo không cần USB thật)
│   ├── evaluate_thresholds.py # Confusion matrix từ dataset
│   ├── simulate_injection.py  # 4 loại injection pattern
│   └── ...                 # generate_demo_data, feature_extraction, train_model
├── data/                   # Dataset (21,035 samples)
├── baocao/                 # Tài liệu báo cáo đồ án
└── models/                 # ML models (RF, IF, OCSVM)
```

## Pipeline xử lý

```
               ┌─────────────────────────────────────────┐
               │           Early Warning (30 phím)       │──→ Cảnh báo sớm (~0.6s)
               └─────────────────────────────────────────┘
Keyboard → Collector → Feature Extractor → Detector (8 rules) → Policy → Response
               │                                                            │
               └─────── Cửa sổ chính (40 phím) ────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                Allow          Alert/Log      Block + Notify
                                                    │
                              ┌─────────────────────┤
                              ▼                     ▼
                      --json-output          ws_bridge.py
                              └────→ Dashboard (WebSocket)
```

---

## 🚀 Hướng dẫn cài đặt & chạy từ A-Z

> **Dành cho người mới clone dự án từ GitHub.** Làm theo từng bước, từ trên xuống dưới.

### ⚠️ Yêu cầu hệ thống

| Thành phần | Phiên bản tối thiểu | Ghi chú |
|-----------|---------------------|---------|
| **Hệ điều hành** | Windows 10/11 | Bắt buộc Windows (dùng WinAPI BlockInput) |
| **Rust** | 1.70+ | Để build engine phát hiện |
| **Node.js** | 18+ | Để chạy React dashboard |
| **Python** | 3.9+ | Để chạy scripts & WebSocket bridge |
| **Git** | 2.x | Để clone dự án |

---

### Bước 0: Clone dự án

```bash
git clone https://github.com/Sirens-F0r/BadUSB---Keystroke-Injection.git
cd BadUSB---Keystroke-Injection
```

> 📝 Nếu clone chậm, có thể dùng `--depth 1` để clone nhanh (chỉ lấy commit mới nhất):
> ```bash
> git clone --depth 1 https://github.com/Sirens-F0r/BadUSB---Keystroke-Injection.git
> ```

---

### Bước 1: Cài đặt công cụ cần thiết

#### 1.1. Cài đặt Rust

Truy cập [https://rustup.rs](https://rustup.rs), tải `rustup-init.exe` và chạy.

Sau khi cài xong, mở **PowerShell mới** và kiểm tra:

```powershell
rustc --version
# Kết quả mong đợi: rustc 1.7x.x (hoặc cao hơn)

cargo --version
# Kết quả mong đợi: cargo 1.7x.x
```

#### 1.2. Cài đặt Python

Tải từ [https://www.python.org/downloads/](https://www.python.org/downloads/) (chọn bản 3.9 trở lên).

> ⚠️ **Quan trọng:** Khi cài đặt, **BẮT BUỘC** tick ✅ `Add Python to PATH`.

Kiểm tra:

```powershell
python --version
# Kết quả mong đợi: Python 3.9.x (hoặc cao hơn)

pip --version
# Kết quả mong đợi: pip 2x.x
```

#### 1.3. Cài đặt Node.js

Tải từ [https://nodejs.org](https://nodejs.org) (chọn bản LTS).

Kiểm tra:

```powershell
node --version
# Kết quả mong đợi: v18.x.x (hoặc cao hơn)

npm --version
# Kết quả mong đợi: 9.x.x (hoặc cao hơn)
```

---

### Bước 2: Cài đặt Python dependencies

Mở **PowerShell** hoặc **Command Prompt**, `cd` vào thư mục dự án:

```bash
pip install -r requirements.txt
```

Cài thêm thư viện cho WebSocket bridge:

```bash
pip install websockets
```

> 💡 **Khuyến nghị:** Dùng virtual environment để tránh xung đột:
> ```bash
> python -m venv venv
> venv\Scripts\activate    # Windows
> pip install -r requirements.txt
> pip install websockets
> ```

---

### Bước 3: Build Rust engine

#### Cách 1: Dùng script có sẵn (đơn giản nhất)

```bash
build_rust.bat
```

Script này sẽ tự động build cả phiên bản `debug` và `release`.

#### Cách 2: Build thủ công

```bash
cd kds_guard
cargo build --release
```

Sau khi build xong, file thực thi nằm tại:

```
kds_guard/target/release/kds_guard.exe
```

> ⏱️ **Thời gian build:** Lần đầu tiên khoảng 2-5 phút (tải dependencies). Các lần sau nhanh hơn (~30s).

Kiểm tra build thành công:

```bash
kds_guard\target\release\kds_guard.exe --help
```

Nếu hiện menu trợ giúp với các tham số `-w`, `-s`, `-u`, `-d`... thì build thành công ✅.

---

### Bước 4: Cài đặt Dashboard

```bash
cd kds-guard-dashboard
npm install
```

> ⏱️ Lần đầu chạy `npm install` mất khoảng 1-3 phút.

Kiểm tra bằng cách chạy thử:

```bash
npm run dev
```

Dashboard sẽ chạy tại `http://localhost:3000`. Mở trình duyệt truy cập để kiểm tra, sau đó nhấn `Ctrl+C` trong terminal để dừng.

---

### Bước 5: Xử lý dữ liệu thô & tích hợp dataset

Đây là bước **quan trọng nhất** — chuyển đổi dữ liệu gõ phím thô từ bạn bè thành feature vectors để huấn luyện model.

#### 5.1. Dữ liệu thô là gì?

Dữ liệu được thu thập bằng tool `KDS_Guard_ThuThap.zip` (nằm trong `collector_tool/`). Bạn gửi file zip này cho bạn bè, họ chạy `thu_thap_rust.bat`, sau đó gửi lại **các file CSV**.

Mỗi file CSV có format:

```csv
Lan_Go,Key,Event_Type,Dwell_Time_ms,Flight_Time_ms,Timestamp
1,s,KeyDown,,0,1776546218472.67
1,s,KeyUp,107.88,,1776546218580.55
1,i,KeyDown,,82.03,1776546218662.58
```

| Cột | Ý nghĩa |
| --- | --- |
| `Lan_Go` | Số thứ tự session (lần gõ) |
| `Key` | Phím được nhấn |
| `Event_Type` | `KeyDown` hoặc `KeyUp` |
| `Dwell_Time_ms` | Thời gian giữ phím (ms) — chỉ có ở KeyUp |
| `Flight_Time_ms` | Thời gian giữa 2 phím liên tiếp (ms) — chỉ có ở KeyDown |
| `Timestamp` | Thời điểm sự kiện (epoch ms) |

> 💡 Script `integrate_datasets.py` **tự động nhận diện** format này và chuyển đổi sang format chuẩn nội bộ.

#### 5.2. Đặt file vào đâu?

Copy **tất cả file CSV** từ bạn bè vào thư mục:

```
data/raw/rust/
```

Cấu trúc sau khi copy:

```
data/
└── raw/
    ├── DSL-StrongPasswordData.csv    ← Dataset CMU Benchmark (có sẵn)
    └── rust/
        ├── hiep.csv                  ← File từ bạn bè
        ├── Nhất Duy.csv
        ├── Phan Quốc Huy.csv
        ├── Trần Bảo.csv
        ├── trần minh thắng.csv
        └── ... (thêm file mới vào đây)
```

> ⚠️ **Lưu ý:** Cứ copy thêm file mới vào, **không cần xóa file cũ**. Tên file sẽ được dùng làm `user_id`.

#### 5.3. Chạy xử lý dữ liệu

**Bước 3.1 — Xem trạng thái dataset hiện tại:**

```bash
python scripts/integrate_datasets.py --status
```

Output mẫu:

```
📊 Dataset Status
============================================================
   🗂️  Dataset CHÍNH (merged): 21,035 rows | human:20803 + injection:232
   1️⃣  CMU Benchmark: 20,400 rows
   3️⃣  Rust Collector: 403 rows
   💉 Injection Simulated: 232 rows
   Rust raw files in data/raw/rust/: 5 file(s)
============================================================
```

**Bước 3.2 — Chuyển đổi dữ liệu thô Rust → features:**

```bash
python scripts/integrate_datasets.py --rust-collect
```

Lệnh này sẽ:
1. Quét tất cả file CSV trong `data/raw/rust/`
2. Tự động nhận diện format (chuẩn hoặc format thay thế từ tool bạn bè)
3. Chuyển đổi mỗi file thành format chuẩn: `timestamp_ms, key_code, event_type, key_class, is_modifier, session_id, user_id`
4. Trích xuất features theo cửa sổ trượt (window_size=40, slide_step=20)
5. Lưu kết quả vào `data/features_rust_collected.csv`

Output mẫu:

```
📂 [NGUỒN 3] Rust Collector (kds_guard.exe)
============================================================
   Found: 5 file(s)
   📄 hiep.csv ... (alt format detected) ✅ 12 windows
   📄 Nhất Duy.csv ... (alt format detected) ✅ 18 windows
   📄 Phan Quốc Huy.csv ... (alt format detected) ✅ 14 windows
   📄 Trần Bảo.csv ... (alt format detected) ✅ 22 windows
   📄 trần minh thắng.csv ... (alt format detected) ✅ 28 windows

   ✅ Total: 94 feature vectors (Rust collector)
   💾 Saved: data/features_rust_collected.csv
```

**Bước 3.3 — (Tùy chọn) Chuyển đổi dataset CMU Benchmark:**

```bash
python scripts/integrate_datasets.py --cmu
```

**Bước 3.4 — Gộp tất cả nguồn dữ liệu:**

```bash
python scripts/integrate_datasets.py --merge
```

Lệnh `--merge` sẽ gộp các file:
- `features_cmu.csv` (CMU Benchmark — 20,400 samples human)
- `features_rust_collected.csv` (Rust Collector — dữ liệu bạn bè)
- `features_self_collected.csv` (Python Collector — nếu có)
- `features_demo.csv` (Synthetic — nếu có)
- `features_injection.csv` (Injection simulated — 232 samples)

→ Thành **1 file duy nhất**: `data/features_dataset.csv`

**Hoặc chạy tất cả 1 lệnh:**

```bash
python scripts/integrate_datasets.py --rust-collect --merge
```

**Hoặc dùng script tích hợp:**

```bash
integrate_all.bat
```

#### 5.4. Sơ đồ pipeline xử lý dữ liệu

```
Bạn bè gõ phím → thu_thap_rust.bat → CSV files (format thay thế)
                                          │
                            gửi lại bạn   │
                                          ▼
                               data/raw/rust/ ← copy vào đây
                                          │
          python integrate_datasets.py --rust-collect --merge
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
              Auto-detect            Chuyển đổi            Trích xuất
              format CSV        → format chuẩn          features (22 đặc trưng)
                                                              │
                                                              ▼
                                              features_dataset.csv (cập nhật)
                                                              │
                                  ┌───────────────────────────┼───────────┐
                                  ▼                           ▼           ▼
                           train_model.py              evaluate.py  visualize.py
                                  │
                                  ▼
                          models/ (RF, IF, OCSVM)
```

---

### Bước 6: Huấn luyện model & đánh giá

Sau khi đã có `data/features_dataset.csv` từ Bước 5, tiến hành huấn luyện model ML.

#### 6.1. Huấn luyện model

```bash
python scripts/train_model.py -d data -m models
```

Script sẽ tự động:
1. Đọc `data/features_dataset.csv`
2. Tách train/test (80/20)
3. Huấn luyện **3 model**:
   - 🌲 **Isolation Forest** — Anomaly detection (unsupervised)
   - 🔮 **One-Class SVM** — Anomaly detection (unsupervised)
   - 🌳 **Random Forest** — Classification (supervised)
4. Đánh giá từng model trên test set
5. Lưu model tốt nhất vào `models/model.pkl`

Output mẫu:

```
🌲 Training Isolation Forest...
   Samples: 16828, Features: 16
   ✅ Done

🌳 Training Random Forest (Supervised)...
   Samples: 16828, Features: 16
   ✅ Done

🏆 Best model: Random Forest (F1: 0.9932)

✅ Models saved to models/
   - model.pkl (best)
   - scaler.pkl
   - training_metadata.json
```

Các file được tạo trong `models/`:

| File | Nội dung |
| --- | --- |
| `model.pkl` | Model tốt nhất (tự động chọn) |
| `isolation_forest.pkl` | Isolation Forest model |
| `oneclass_svm.pkl` | One-Class SVM model |
| `random_forest.pkl` | Random Forest model |
| `scaler.pkl` | StandardScaler (chuẩn hóa features) |
| `training_metadata.json` | Thông tin training (timestamp, metrics) |

#### 6.2. Đánh giá hệ thống

```bash
python scripts/evaluate.py -d data -m models
```

Script đánh giá 4 phương pháp:
1. **Rule-based** — 8 rules tự viết
2. **Isolation Forest** — ML anomaly detection
3. **One-Class SVM** — ML anomaly detection
4. **Random Forest** — ML supervised
5. **Hybrid** — Kết hợp Rule + ML

Kết quả lưu vào `data/evaluation_report.json`.

#### 6.3. Đánh giá ngưỡng (confusion matrix chi tiết)

```bash
python scripts/evaluate_thresholds.py
```

#### 6.4. Tạo biểu đồ trực quan

```bash
python scripts/visualize.py -d data -o plots -m models
```

Biểu đồ được lưu trong thư mục `plots/`.

#### 6.5. Chạy tất cả tự động (1 lệnh)

```bash
# Cách 1: Dùng script Python
python scripts/run_pipeline.py

# Cách 2: Dùng script BAT
run_pipeline.bat
```

---

### Bước 7: Chạy hệ thống hoàn chỉnh

Sau khi đã build engine (Bước 3), cài dashboard (Bước 4), và có model (Bước 6), chạy hệ thống real-time gồm **3 thành phần** song song.

Mở **3 terminal riêng biệt**:

#### Terminal 1 — Rust Engine + WebSocket Bridge

```bash
# Cách A: Tự động (ws_bridge tự chạy kds_guard.exe)
python ws_bridge.py

# Cách B: Pipe thủ công
kds_guard\target\release\kds_guard.exe --json-output | python ws_bridge.py
```

> ⚠️ **Quyền Administrator:** Nếu muốn bật tính năng chặn input (BlockInput), hãy mở terminal với quyền **Run as Administrator**.

Nếu chạy thành công, bạn sẽ thấy:

```
==================================================
  KDS Guard WebSocket Bridge
  Dashboard ket noi tai: ws://localhost:8765
==================================================

[BRIDGE] WebSocket server dang chay tai ws://localhost:8765
[BRIDGE] Tu dong chay kds_guard.exe...
```

#### Terminal 2 — React Dashboard

```bash
cd kds-guard-dashboard
npm run dev
```

Sau khi chạy, mở trình duyệt tại: **http://localhost:3000**

Dashboard sẽ tự động kết nối WebSocket tại `ws://localhost:8765` và hiển thị dữ liệu real-time.

#### Terminal 3 — (Tùy chọn) Mô phỏng BadUSB

```bash
python scripts/simulate_badusb.py --speed 50
```

Hoặc dùng injection simulator:

```bash
python scripts/simulate_injection.py --type fast --delay 2
```

> 📊 Sau khi chạy, quan sát Dashboard: Risk Level sẽ chuyển từ **NORMAL** → **CRITICAL** khi phát hiện injection.

---

## Chạy Demo nhanh

Dùng script demo tích hợp sẵn, bao gồm 3 kịch bản:

```bash
demo.bat
```

| Demo | Mô tả | Kết quả mong đợi |
| --- | --- | --- |
| **Demo 1** | Người gõ bình thường → Notepad | Risk: **NORMAL** ✅ |
| **Demo 2** | Injection simulator gõ siêu nhanh | Risk: **CRITICAL** 🔴 |
| **Demo 3** | Dashboard Streamlit (phân tích) | Hiển thị biểu đồ 📊 |

---

## 8 Detection Rules

| # | Rule | Điều kiện | Trọng số |
|---|------|-----------|----------|
| R1 | Flight Time thấp | mean_flight_time < 30ms | +0.30 |
| R2 | CV thấp | cv_flight_time < 0.15 | +0.25 |
| R3 | Tốc độ cao | speed > 20 keys/s AND ft < 50ms | +0.20~0.35 |
| R4 | Burst dài | max_burst ≥ 15 phím < 50ms | +0.20 |
| R5 | Hold Time đều | iqr_hold_time < 5ms | +0.15 |
| R6 | Modifier nhiều | modifier_ratio > 40% | +0.10 |
| R7 | Min Flight cực thấp | min_flight_time < 5ms | +0.10 |
| R8 | Injection Fingerprint | pause giữa burst + CV < 0.3 | +0.15~0.25 |

## 22 Đặc trưng

- **Hold Time**: mean, std, median, IQR
- **Flight Time**: mean, std, median, IQR, p5, p95, min, CV
- **Behavioral**: typing_speed, modifier_ratio, special_ratio, max_burst_length
- **Window**: window_start_ms, window_end_ms
- **Injection Fingerprint**: inter_command_pause_count, pause_regularity, enter_after_burst

## Mức phản hồi

| Risk Level | Hành động |
|------------|-----------|
| Normal | Cho phép, tiếp tục giám sát |
| Low | Ghi log |
| Medium | Hiện cảnh báo Windows |
| High | Chặn input tối đa 2 giây + cảnh báo |
| Critical | Chặn input tối đa 5 giây + cảnh báo (timeout cứng) |

## Tham số CLI

| Tham số | Mặc định | Mô tả |
|---------|----------|-------|
| `-w` | 40 | Kích thước cửa sổ phân tích (số phím) |
| `-s` | 20 | Bước trượt cửa sổ |
| `-u` | anonymous | User ID |
| `-o` | data | Thư mục output |
| `-d` | 0 | Thời gian thu thập (giây, 0 = vô hạn) |
| `-v` | false | Verbose logging |
| `--collect-only` | false | Chỉ thu thập, không detect |
| `--log-keys` | false | Ghi key_code chi tiết |
| `--json-output` | false | Xuất JSON ra stdout (cho WebSocket bridge) |

## Cấu hình nâng cao

File cấu hình: `kds_guard/config.toml`

```toml
[collector]
log_key_code = true          # Ghi key_code chi tiết
output_dir = "data"          # Thư mục output

[feature]
window_size = 40             # Kích thước cửa sổ trượt
slide_step = 20              # Bước trượt
burst_threshold_ms = 50.0    # Ngưỡng burst (ms)

[detector]
ft_mean_threshold_ms = 30.0  # Ngưỡng flight time trung bình
ft_cv_threshold = 0.15       # Ngưỡng CV flight time
max_human_speed = 20.0       # Tốc độ gõ tối đa (keys/s)

[detector.thresholds]
medium = 0.3                 # Ngưỡng risk score medium
high = 0.6                   # Ngưỡng risk score high
critical = 0.8               # Ngưỡng risk score critical

[policy]
enable_alerts = true         # Bật cảnh báo Windows
enable_soft_block = false    # Bật chặn input tạm thời
soft_block_duration_ms = 2000 # Thời gian chặn (ms)
```

---

## Xử lý lỗi thường gặp

### ❌ `rustc: command not found`
**Nguyên nhân:** Chưa cài Rust hoặc chưa restart terminal sau khi cài.  
**Cách sửa:**
1. Cài Rust: [https://rustup.rs](https://rustup.rs)
2. Đóng và mở lại terminal (hoặc restart máy)

### ❌ `cargo build` lỗi linker
**Nguyên nhân:** Thiếu Visual Studio Build Tools (MSVC).  
**Cách sửa:**
1. Tải [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Chọn workload **"Desktop development with C++"**
3. Cài đặt xong, chạy lại `cargo build --release`

### ❌ `npm install` lỗi
**Nguyên nhân:** Node.js phiên bản cũ hoặc lỗi cache.  
**Cách sửa:**
```bash
npm cache clean --force
npm install
```

### ❌ `ModuleNotFoundError: No module named 'websockets'`
**Cách sửa:**
```bash
pip install websockets
```

### ❌ `pip install` lỗi permission
**Cách sửa:**
```bash
pip install -r requirements.txt --user
# Hoặc dùng virtual environment (khuyến nghị):
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### ❌ Dashboard không hiển thị dữ liệu real-time
**Nguyên nhân:** WebSocket bridge chưa chạy hoặc Rust engine chưa khởi động.  
**Cách sửa:**
1. Đảm bảo `ws_bridge.py` đang chạy ở Terminal 1
2. Đảm bảo thấy log `[BRIDGE] WebSocket server dang chay tai ws://localhost:8765`
3. Refresh lại trang Dashboard

### ❌ `Access Denied` khi chạy kds_guard.exe
**Nguyên nhân:** Tính năng BlockInput cần quyền Administrator.  
**Cách sửa:** Click phải Command Prompt/PowerShell → **Run as Administrator**

---

## Công nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Engine chính | Rust (performance, memory safety) |
| Bắt phím | rdev (cross-platform keyboard capture) |
| Chặn input | winapi – BlockInput API |
| Dashboard | React + TypeScript + MUI + ECharts |
| Real-time | WebSocket bridge (Python websockets) |
| Phân tích | Python (pandas, matplotlib, scikit-learn) |

## Tài liệu

| File | Nội dung |
|------|---------|
| `baocao/BAOCAO.md` | Báo cáo trình bày dự án A-Z |
| `baocao/RESEARCH.md` | Tài liệu kỹ thuật cốt lõi |
| `baocao/TIENDO.md` | Theo dõi tiến độ chi tiết |

---

## 📄 License

Đồ án Cơ sở – 2026

---

> 🙋 **Có vấn đề khi cài đặt?** Tạo [Issue](https://github.com/Sirens-F0r/BadUSB---Keystroke-Injection/issues) trên GitHub hoặc liên hệ nhóm phát triển.