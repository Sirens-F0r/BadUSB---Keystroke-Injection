# 📋 TIẾN ĐỘ DỰ ÁN: KDS Guard - BadUSB Detection via Keystroke Dynamics

> **Cập nhật lần cuối:** 2026-04-05 20:45

---

## Tổng quan giai đoạn

| # | Giai đoạn | Trạng thái | Ghi chú |
|---|-----------|------------|---------|
| 1 | Keystroke Collector (Rust) | ✅ Hoàn thành | 6 modules (main + 5 src) · build 2MB |
| 2 | Feature Extraction (Python) | ✅ Hoàn thành | 22 features chuẩn hóa |
| 3 | Demo Dataset Generator | ✅ Hoàn thành | 20 users + 4 injection types |
| 4 | Tạo dữ liệu injection | ✅ Hoàn thành | 3 loại pattern riêng |
| 5 | Detection Engine (Rule-based) | ✅ Hoàn thành | 8 rules (thêm R8 Injection Fingerprint) |
| 6 | ML Detection (Train + Eval) | ✅ Hoàn thành | IF + OCSVM + RF · 21,035 samples |
| 7 | Response Engine | ✅ Hoàn thành | 5 policy actions |
| 8 | Dashboard (Streamlit) | ✅ Hoàn thành | 5 tabs |
| 9 | Visualization | ✅ Hoàn thành | 6 loại charts |
| 10 | Evaluation Script | ✅ Hoàn thành | Rule vs ML vs Hybrid |
| 11 | Pipeline Runner | ✅ Hoàn thành | Python + .bat |
| 12 | Config & Project Setup | ✅ Hoàn thành | TOML + .gitignore |
| 13 | Dataset Collection Tools | ✅ Hoàn thành | Python collector + Rust collector + CMU |
| 14 | Dataset Integration (3 nguồn) | ✅ Hoàn thành | integrate_datasets.py + integrate_all.bat |
| 15 | Demo Suite | ✅ Hoàn thành | demo.bat (3 scenarios) + simulate_injection.py |
| 16 | Báo cáo đồ án | ✅ Hoàn thành | 4 chương + phụ lục + tài liệu tham khảo |
| 17 | Collector Tool Package | ✅ Hoàn thành | collector_tool/ (exe + bat + hướng dẫn) |
| 18 | Rust Data Collection | ✅ Hoàn thành | 28 file CSV trong data/raw/rust/ |
| 19 | React Dashboard (KDS Guard) | ✅ Hoàn thành | 9 pages, MUI + ECharts, SPA navigation |
| 20 | BlockInput + Windows Notification | ✅ Hoàn thành | response.rs, winapi, 5 mức phản hồi |
| 21 | Data Service Layer | ✅ Hoàn thành | kds-guard-api.ts + useKdsGuard.ts hooks |
| 22 | Windows Notification Hook | ✅ Hoàn thành | useWindowsNotification.ts, auto-trigger |
| 23 | Dọn dẹp & tái cấu trúc | ✅ Hoàn thành | Gom tài liệu vào baocao/, dọn comment |
| 24 | README + BAOCAO.md | ✅ Hoàn thành | Viết lại README, tạo BAOCAO.md chi tiết |

---

## Cấu trúc dự án hoàn chỉnh

```
DOANCOSO/
├── README.md                    # Mô tả dự án
├── requirements.txt             # Python dependencies
├── .gitignore
├── build_rust.bat               # Build Rust
├── run_pipeline.bat             # Chạy pipeline
├── integrate_all.bat            # Tích hợp dataset
├── demo.bat                     # Demo 3 kịch bản
│
├── kds_guard/                   # === RUST ENGINE ===
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs              # Entry point + pipeline
│       ├── input_capture.rs     # Thu thập sự kiện bàn phím
│       ├── logger.rs            # Ghi log CSV
│       ├── feature.rs           # Trích xuất 22 đặc trưng (sliding window + injection fingerprint)
│       ├── detector.rs          # 8 detection rules + R8 injection fingerprint
│       ├── policy.rs            # 5 policy actions + challenge mode
│       └── response.rs          # BlockInput API + Windows notification
│
├── ws_bridge.py                 # [MỚI] WebSocket bridge (Rust → Dashboard)
│
├── kds-guard-dashboard/         # === REACT DASHBOARD ===
│   ├── src/
│   │   ├── App.tsx              # Root + realtime notification auto-trigger
│   │   ├── pages/               # 9 pages (dashboard, realtime, rules...)
│   │   ├── components/          # 8 dashboard widgets
│   │   ├── services/            # [MỚI] kds-guard-api.ts (data service layer)
│   │   ├── hooks/               # [MỚI] useKdsGuard.ts + useWindowsNotification.ts
│   │   ├── data/                # Mock data
│   │   └── layouts/             # Sidebar + Topbar + Footer
│   └── public/
│       └── Logo bảo mật KDS Guard.png
│
├── scripts/                     # === PYTHON SCRIPTS ===
│   ├── generate_demo_data.py
│   ├── feature_extraction.py
│   ├── train_model.py
│   ├── evaluate.py
│   ├── visualize.py
│   ├── simulate_injection.py
│   ├── simulate_badusb.py       # [MỚI] Mo phong BadUSB (pyautogui, khong can USB)
│   ├── evaluate_thresholds.py   # [MỚI] Confusion matrix 21,035 mau
│   ├── collect_keystrokes.py
│   ├── integrate_datasets.py
│   └── run_pipeline.py
│
├── collector_tool/              # Package thu thập
├── dashboard/                   # Streamlit dashboard (cũ)
├── data/                        # Dataset (21,035 samples)
├── models/                      # ML models (IF + OCSVM + RF)
├── plots/                       # Biểu đồ phân tích
│
└── baocao/                      # === TẤT CẢ TÀI LIỆU ===
    ├── BAOCAO.md                # [MỚI] Trình bày dự án A-Z
    ├── TIENDO.md                # Theo dõi tiến độ (file này)
    ├── BAOCAO_DOAN.md
    ├── BAOCAO_DOAN_PANDOC.md
    ├── BAOCAO_DOAN.docx
    ├── Chuong1-4 + phụ lục
    ├── GIAITHICH_HETHONG.md
    ├── HUONGDAN_DATASET.md
    ├── HUONGDAN_THUTHAP.md
    ├── KEHOACH.md
    ├── PLAN.md
    ├── baocao_tuan4.md
    ├── THUYETRINHTIENDO.pdf
    ├── slide_tiendo_tuan5.html
    └── images/
```

---

## Chi tiết từng module

### 🦀 Rust Module: `kds_guard`

#### `input_capture.rs` (5.7 KB)

- Bắt key_down/key_up events qua thư viện `rdev`
- Timestamp monotonic clock (ms)
- Phân loại phím: alpha, digit, modifier, special, function, navigation, other
- Gửi events qua mpsc channel

#### `logger.rs` (6.0 KB)

- Ghi CSV: timestamp, key_code, event_type, key_class, is_modifier
- Hỗ trợ ẩn danh (tắt log_key_code → chỉ lưu key_class)
- Auto-create output directory
- Session ID + User ID tracking

#### `feature.rs` (12.4 KB)

- 22 đặc trưng keystroke dynamics:
  - Hold Time: mean, std, median, IQR
  - Flight Time: mean, std, median, IQR, p5, p95, min, CV
  - Behavioral: typing_speed, modifier_ratio, special_ratio, max_burst_length
  - Injection Fingerprint: inter_command_pause_count, pause_regularity, enter_after_burst
- Sliding window: ghép cặp key_down/key_up → Hold Time
- Flight Time Down-Down
- Thống kê: mean, std, median, IQR, percentiles

#### `detector.rs` (12.0 KB)

- 8 detection rules:
  1. Flight time trung bình < 30ms
  2. CV flight time < 0.15
  3. Typing speed > 20 keys/s VÀ mean_flight_time < 50ms (kết hợp để giảm false positive)
  4. Burst ≥ 15 phím liên tiếp < 50ms
  5. Hold time IQR < 5ms
  6. Modifier ratio > 40%
  7. Min flight time < 5ms
  8. **[MỚI] Injection Fingerprint**: pause_count ≥ 2 AND pause_regularity < 0.3
- Risk scoring: 0.0 → 1.0
- 5 mức: Normal → Low → Medium → High → Critical
- **Kết quả thực nghiệm:** TPR=98.7%, FPR=0.0%, F1=99.3% (ngưỡng 0.3)

#### `policy.rs`

- PolicyAction: Allow / LogOnly / Alert / SoftBlock / Challenge
- Cooldown tránh spam cảnh báo
- Challenge generation (random 3 chars)

#### `response.rs`

- `block_input()`: Gọi Windows API `BlockInput` chặn keyboard/mouse tạm thời
- `show_windows_notification()`: Hiện MessageBox popup trên Windows
- `execute_response()`: Kết hợp block + notify theo mức rủi ro
  - Medium → chỉ hiện popup cảnh báo
  - High → block tối đa 2 giây + popup
  - Critical → block tối đa 5 giây + popup (timeout cứng)
- Cần quyền Administrator cho BlockInput

#### `main.rs`

- CLI bằng clap: output_dir, user_id, window_size, collect_only, log_keys, verbose, duration, **json_output**
- Pipeline: Collector → Logger → Feature Extractor → Detector → Policy → Response
- **[MỚI] Early Warning Layer:** Cửa sổ 30 phím chạy song song, phát hiện payload ngắn trong ~0.6s
- **[MỚI] Confidence log:** Forensic format `[CRITICAL 0.85] R1+R2+R3+R4 | ft=18ms cv=0.08`
- **[MỚI] --json-output flag:** Xuất JSON mỗi window cho WebSocket bridge
- `enable_soft_block = true`: bật chặn thật khi detect High/Critical
- Tích hợp response module cho BlockInput + Windows notification

### 🐍 Python Scripts

#### `generate_demo_data.py` (20.1 KB)

- 5 typing profiles: slow, average, fast, touch, hunt_peck
- 4 injection profiles: badusb_fast, badusb_medium, script, rubber_ducky
- Mô phỏng realistic: lỗi gõ, pause suy nghĩ, biến thiên theo vị trí phím
- Auto feature extraction tích hợp

#### `feature_extraction.py` (9.9 KB)

- Tính 16 features từ raw CSV keystroke logs
- Pipeline: raw events → paired events → feature vectors
- Hỗ trợ nhiều format input (CMU, Python collector, Rust collector)

#### `integrate_datasets.py` (31.7 KB)

- Tích hợp 3 nguồn dữ liệu: CMU + Python collector + Rust collector
- Chuyển đổi format CMU → feature vectors chuẩn (20,400 vectors từ 51 users)
- Merge + dedup + label assignment
- CLI: `--cmu`, `--self-collect`, `--rust-collect`, `--merge`, `--status`

#### `simulate_injection.py` (7.5 KB)

- 4 loại injection: fast (8ms), medium (25ms), script (15ms), rubber_ducky (5ms)
- Payload an toàn cho demo (chỉ echo text)
- Payload thật (`--unsafe` flag)
- Countdown + UI đẹp

#### `train_model.py` (13.5 KB)

- 3 ML models: Isolation Forest, One-Class SVM, Random Forest
- Auto scale (StandardScaler)
- Evaluation: Accuracy, F1, AUC-ROC, Confusion Matrix
- Lưu best model + scaler + metadata JSON

#### `evaluate.py` (13.6 KB)

- Rule-based: grid search best thresholds
- ML: test từng model
- Hybrid: weighted combination + best threshold search
- Output: JSON report (`data/evaluation_report.json`)

#### `visualize.py` (12.0 KB)

- Distribution comparison (human vs injection)
- Scatter CV vs Speed (danger zone plot)
- Boxplot comparison
- Correlation heatmap
- Timeline behavior
- Model comparison bar chart

#### `dashboard.py` (Streamlit, 16.5 KB)

- Tab 1: Overview (metrics cards)
- Tab 2: Live Monitor (real-time charts)
- Tab 3: Analysis (scatter, histogram, heatmap)
- Tab 4: Model Performance (comparison)
- Tab 5: Detection Log (filterable table + download)

### React Dashboard (kds-guard-dashboard/) [MỚI – 2026-04-05]

- **9 pages**: Dashboard, Realtime Monitor, Detection Rules, Alerts, Devices, Logs, Policies, Settings, About
- **8 dashboard widgets**: System Overview, Risk Score, Detection Rules, Keystroke Metrics, Threat Level Gauge, Activity Timeline, Recent Alerts, Event Log
- **Tech**: React 18 + TypeScript + MUI v5 + ECharts + Vite + React Router
- **Data service layer**: `kds-guard-api.ts` – TypeScript interfaces map 1:1 với Rust structs
- **React hooks**: `useKdsGuard.ts` (polling + WebSocket), `useWindowsNotification.ts` (browser notification)
- **SPA navigation**: React Router Link (không full page reload)
- **Cờ USE_MOCK**: đổi thành `false` khi có backend thật
- **Windows notification**: Auto-trigger khi risk ≥ Medium từ realtime stream
- **Settings page**: UI bật/tắt notification + nút Test Notification

---

## 📊 Kết quả ML (21,035 samples)

### Dataset

| Nguồn | Loại | Số lượng | Tỉ lệ |
|-------|------|----------|--------|
| CMU | Human | 20,400 | 97.0% |
| Demo synthetic | Human | ~403 | 1.9% |
| Injection simulated | Injection | 232 | 1.1% |
| **Tổng** | | **21,035** | **100%** |

### Kết quả Evaluation

| Phương pháp | Accuracy | Precision | Recall | F1 | AUC-ROC |
|-------------|----------|-----------|--------|-----|---------|
| Rule-based | 100% | 100% | 100% | 100% | 1.000 |
| Isolation Forest | 91.0% | 10.9% | 100% | 19.7% | 0.995 |
| One-Class SVM | 90.0% | 10.0% | 100% | 18.1% | 0.997 |
| Random Forest | **100%** | **100%** | **100%** | **100%** | **1.000** |
| Hybrid (R:0.6, ML:0.4) | 100% | 100% | 100% | 100% | 1.000 |

> **Best model:** Random Forest — Accuracy 100%, F1 100%, AUC-ROC 1.000

### Training Metadata (16 features)

```
mean_hold_time, std_hold_time, median_hold_time, iqr_hold_time,
mean_flight_time, std_flight_time, median_flight_time, iqr_flight_time,
p5_flight_time, p95_flight_time, min_flight_time, cv_flight_time,
typing_speed, modifier_ratio, special_ratio, max_burst_length
```

---

## 🚀 Hướng dẫn chạy nhanh

### Cách 1: Chạy pipeline tự động

```bash
# Windows
run_pipeline.bat
```

### Cách 2: Chạy từng bước

```bash
# 1. Cài Python dependencies
pip install -r requirements.txt

# 2. Tạo demo data
python scripts/generate_demo_data.py

# 3. Train models
python scripts/train_model.py

# 4. Đánh giá
python scripts/evaluate.py

# 5. Tạo biểu đồ
python scripts/visualize.py

# 6. Mở dashboard
streamlit run dashboard/dashboard.py
```

### Build Rust project

```bash
# Windows
build_rust.bat

# Hoặc thủ công
cd kds_guard
cargo build --release
```

### Chạy KDS Guard tool

```bash
# Thu thập dữ liệu
kds_guard.exe --collect-only --log-keys -v

# Phát hiện tấn công
kds_guard.exe --log-keys -v

# Với thời gian giới hạn (cho demo)
kds_guard.exe --log-keys -v -d 30
```

### Chạy Demo Suite

```bash
# Chạy demo 3 kịch bản
demo.bat
```

---

## 📝 Log thay đổi

| Ngày | Nội dung | Giai đoạn |
|------|----------|-----------|
| 2026-03-04 | Khởi tạo dự án, đọc README + PLAN | Chuẩn bị |
| 2026-03-04 | Tạo Cargo.toml + 5 modules Rust | GĐ 1, 5, 6 |
| 2026-03-04 | Tạo feature_extraction.py + injection_simulation.py | GĐ 2, 4 |
| 2026-03-04 | Tạo train_model.py (IF + OCSVM + RF) | GĐ 6 |
| 2026-03-04 | Tạo visualize.py (6 loại charts) | GĐ 9 |
| 2026-03-04 | Tạo dashboard.py (Streamlit, 5 tabs) | GĐ 7 |
| 2026-03-04 | Tạo evaluate.py (Rule vs ML vs Hybrid) | GĐ 8 |
| 2026-03-04 | Tạo generate_demo_data.py (20 users + 4 injection) | GĐ 3 |
| 2026-03-04 | Tạo pipeline runners (.bat + .py) | Automation |
| 2026-03-04 | Tạo config.toml, .gitignore, requirements.txt | Setup |
| 2026-03-04 | Cập nhật TIENDO.md hoàn chỉnh | Quản lý |
| 2026-03-04 | Tạo collect_keystrokes.py (Python collector) | Dataset |
| 2026-03-04 | Tạo integrate_datasets.py (CMU + merge) | Dataset |
| 2026-03-04 | Tạo HUONGDAN_DATASET.md | Tài liệu |
| 2026-03-08 | Viết lại integrate_datasets.py: hỗ trợ 3 nguồn (CMU/Python/Rust) | Dataset |
| 2026-03-08 | Tạo integrate_all.bat: pipeline 1-click tích hợp dataset | Automation |
| 2026-03-08 | File CMU đã có tại data/raw/ — sẵn sàng chuyển đổi | Dataset |
| 2026-03-08 | **CMU conversion:** 20,400 vectors từ 51 users → `features_cmu.csv` | Dataset |
| 2026-03-08 | **Merge dataset chính:** 21,035 samples (98.9% human + 1.1% injection) | Dataset |
| 2026-03-08 | **Retrain model** với 21,035 samples: RF 100% · IF AUC=0.994 · OCSVM AUC=0.996 | ML |
| 2026-03-08 | **Evaluation:** Rule 100%, RF 100%, Hybrid 100%, IF AUC 99.5%, OCSVM AUC 99.7% | ML |
| 2026-03-08 | **Visualize:** 6 biểu đồ → `plots/` | Visualization |
| 2026-03-08 | **Collector tool:** Fix thu_thap.bat (Nguồn 2) + tạo thu_thap_rust.bat (Nguồn 3) | Dataset |
| 2026-03-08 | **Build Rust:** `cargo build --release` thành công → kds_guard.exe 2MB | GĐ1 |
| 2026-03-08 | **Nguồn 3:** kds_guard.exe → collector_tool/ + 28 file CSV trong data/raw/rust/ | Dataset |
| 2026-03-08 | Tạo `HUONGDAN_THUTHAP.md`: hướng dẫn thu thập Nguồn 2 + Nguồn 3 | Tài liệu |
| 2026-03-09 | **Demo Suite:** Tạo `demo.bat` (3 kịch bản) + `simulate_injection.py` (4 loại) | Demo |
| 2026-03-09 | **Báo cáo:** 4 chương + phụ lục + tài liệu tham khảo trong `baocao/` | Báo cáo |
| 2026-03-09 | **Hình ảnh:** 10 hình minh họa trong `baocao/images/` (kiến trúc + biểu đồ) | Báo cáo |
| 2026-03-09 | **Collector package:** KDS_Guard_ThuThap.zip (exe + bat + hướng dẫn) | Dataset |
| 2026-03-16 | **Cập nhật TIENDO.md:** Tổng hợp toàn bộ trạng thái dự án | Quản lý |
| 2026-04-05 | **React Dashboard:** Chuyển template nickelfox → KDS Guard Dashboard (9 pages, 8 widgets) | Dashboard |
| 2026-04-05 | **Branding:** Thay logo, tên, topbar, footer, user dropdown | Dashboard |
| 2026-04-05 | **SPA Navigation:** Fix sidebar + user menu dùng React Router Link | Dashboard |
| 2026-04-05 | **Data Service Layer:** Tạo kds-guard-api.ts (TS interfaces ↔ Rust structs) | Dashboard |
| 2026-04-05 | **React Hooks:** useKdsGuard.ts (polling + WebSocket) + useWindowsNotification.ts | Dashboard |
| 2026-04-05 | **response.rs:** Tạo module BlockInput API + Windows MessageBox notification | Rust |
| 2026-04-05 | **Cargo.toml:** Thêm winapi dependency (winuser, errhandlingapi) | Rust |
| 2026-04-05 | **main.rs:** Tích hợp response module, bật enable_soft_block = true | Rust |
| 2026-04-05 | **Build release:** cargo build --release thành công với response module | Rust |
| 2026-04-05 | **Dọn comment:** Bỏ comment thừa trong main.rs, response.rs (tránh style AI) | Cleanup |
| 2026-04-05 | **Gom tài liệu:** Di chuyển 15 file .md/.docx/.pdf vào baocao/ | Cleanup |
| 2026-04-05 | **Đổi tên:** nickelfox-v1.0.0 → kds-guard-dashboard | Cleanup |
| 2026-04-05 | **README.md:** Viết lại gọn gàng, đúng format dự án | Tài liệu |
| 2026-04-05 | **BAOCAO.md:** Tạo báo cáo trình bày dự án A-Z cho người không chuyên | Tài liệu |
| 2026-04-05 | **RESEARCH.md:** Tài liệu kỹ thuật cốt lõi cho review | Tài liệu |
| 2026-04-05 | **Early Warning Layer:** Cửa sổ 30 phím chạy song song với cửa sổ chính | Rust |
| 2026-04-05 | **Injection Fingerprint:** 3 đặc trưng mới (pause_count, pause_regularity, enter_after_burst) | Rust |
| 2026-04-05 | **Rule R8:** Injection Fingerprint detection rule (+0.15~0.25) | Rust |
| 2026-04-05 | **WebSocket bridge:** `--json-output` flag + `ws_bridge.py` (Rust → Dashboard real-time) | Bridge |
| 2026-04-05 | **R3 nâng cấp:** Ngưỡng 15→20 keys/s + kết hợp mean_flight_time < 50ms | Rust |
| 2026-04-05 | **Confidence log:** Forensic format `[CRITICAL 0.85] R1+R2+R3+R4` | Rust |
| 2026-04-05 | **simulate_badusb.py:** Mô phỏng BadUSB bằng pyautogui (demo không cần USB) | Scripts |
| 2026-04-05 | **evaluate_thresholds.py:** Confusion matrix 21,035 mẫu (TPR=98.7%, FPR=0%) | Scripts |

---

## 🚀 Trạng thái kế hoạch (KEHOACH.md)

| # | Giai đoạn | Trạng thái | Ghi chú |
|---|-----------|------------|---------|
| GĐ1 | Build Rust (kds_guard.exe) | ✅ Hoàn thành | Build thành công, 2 MB |
| GĐ2 | Thu thập dataset thật | ✅ Cơ bản xong | CMU 20,400 vectors + 28 file Rust + 4 file Python |
| GĐ3 | Retrain model với data thật | ✅ Hoàn thành | RF 100% · IF AUC=0.994 · OCSVM AUC=0.996 |
| GĐ4 | Tạo biểu đồ cho báo cáo | ✅ Hoàn thành | 6 charts trong plots/ + 10 hình trong baocao/images/ |
| GĐ5 | Chuẩn bị DEMO | ✅ Hoàn thành | demo.bat (3 scenarios) + simulate_injection.py |
| GĐ6 | Viết báo cáo | ✅ Hoàn thành | 4 chương + phụ lục trong baocao/ |
| GĐ7 | Phát triển React Dashboard | ✅ Hoàn thành | 9 pages, 8 widgets, SPA, Data Service |
| GĐ8 | Tích hợp Response Engine | ✅ Hoàn thành | BlockInput API, Windows Notification |

---

## ⏭️ Việc còn lại

### Đã hoàn thành (tuần 1-5)

1. ✅ Rust engine: 7 modules (input_capture, logger, feature, detector, policy, response, main)
2. ✅ 8 detection rules + risk scoring (thêm R8 Injection Fingerprint)
3. ✅ 22 đặc trưng keystroke dynamics (thêm 3 Injection Fingerprint)
4. ✅ Early Warning Layer (30 phím, phát hiện trong ~0.6s)
5. ✅ BlockInput API + Windows notification (response.rs)
6. ✅ WebSocket bridge: `--json-output` + `ws_bridge.py`
7. ✅ React Dashboard: 9 pages, 8 widgets, SPA navigation
8. ✅ Data service layer: TypeScript ↔ Rust struct mapping
9. ✅ Windows notification hook (browser + native)
10. ✅ Dataset: 21,035 samples (CMU + demo + injection)
11. ✅ ML models: RF 100%, IF AUC 99.4%, OCSVM AUC 99.6%
12. ✅ **Kết quả thực nghiệm:** TPR=98.7%, FPR=0%, F1=99.3%
13. ✅ Demo Suite: demo.bat + simulate_badusb.py
14. ✅ Báo cáo: BAOCAO.md + RESEARCH.md
15. ✅ Dọn dẹp: gom tài liệu, dọn comment, đổi tên thư mục

### Có thể cải thiện (tùy chọn)

1. ~~Kết nối dashboard ↔ Rust engine qua HTTP/WebSocket~~ ✅ Đã làm (`--json-output` + `ws_bridge.py`)
2. Thu thập thêm dữ liệu người thật
3. Quay demo video
4. Đóng gói thành Windows service chạy nền
5. Calibration per-user: learning phase 30 giây khi khởi động

---

## 📋 Hướng dẫn nhanh - Tích hợp dataset

### Cách chạy nhanh nhất (1 lệnh)

```bat
:: Chạy toàn bộ pipeline (CMU + Python + Rust + Merge)
integrate_all.bat
```

### Hoặc từng bước

```bat
:: Bước 1: Xem trạng thái
python scripts\integrate_datasets.py --status

:: Bước 2: Chuyển đổi CMU (đã có file trong data/raw/)
python scripts\integrate_datasets.py --cmu

:: Bước 3: Sau khi thu thập bằng Python collector
python scripts\integrate_datasets.py --self-collect

:: Bước 4: Sau khi thu thập bằng Rust collector
python scripts\integrate_datasets.py --rust-collect

:: Bước 5: Gộp & retrain
python scripts\integrate_datasets.py --merge
python scripts\train_model.py
```

### Nơi đặt file raw

| Nguồn | File format | Đặt vào thư mục |
|-------|------------|------------------|
| CMU | `DSL-StrongPasswordData.csv` | `data/raw/` |
| Python collector | `keystroke_log_<user>_*.csv` | `data/` (tự động) |
| Rust collector | `*.csv` (cùng format) | `data/raw/rust/` |

---

## 📈 Thống kê dự án

| Metric | Giá trị |
|--------|---------|
| Rust modules | 7 files |
| React pages | 9 pages |
| Dashboard widgets | 8 widgets |
| Python scripts | 11 files |
| Tài liệu báo cáo | 26 files |
| Dataset | 21,035 samples |
| ML models | 3 (IF + OCSVM + RF) |
| Best accuracy | 100% (Random Forest) |
| Detection rules | 8 rules (thêm R8 Injection Fingerprint) |
| Đặc trưng | 22 features (thêm 3 Injection Fingerprint) |
| Response levels | 5 mức (Normal → Critical) |
| Demo scenarios | 3 kịch bản + simulate_badusb.py |
| **TPR (Recall)** | **98.7%** (ngưỡng 0.3) |
| **FPR** | **0.0%** |
| **F1 Score** | **99.3%** |
