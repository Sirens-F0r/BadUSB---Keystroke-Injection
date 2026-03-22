# 📋 TIẾN ĐỘ DỰ ÁN: KDS Guard - BadUSB Detection via Keystroke Dynamics

> **Cập nhật lần cuối:** 2026-03-16 07:30

---

## Tổng quan giai đoạn

| # | Giai đoạn | Trạng thái | Ghi chú |
|---|-----------|------------|---------|
| 1 | Keystroke Collector (Rust) | ✅ Hoàn thành | 6 modules (main + 5 src) · build 2MB |
| 2 | Feature Extraction (Python) | ✅ Hoàn thành | 16 features chuẩn hóa |
| 3 | Demo Dataset Generator | ✅ Hoàn thành | 20 users + 4 injection types |
| 4 | Tạo dữ liệu injection | ✅ Hoàn thành | 3 loại pattern riêng |
| 5 | Detection Engine (Rule-based) | ✅ Hoàn thành | 7 rules |
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

---

## Cấu trúc dự án hoàn chỉnh

```
DOANCOSO/
├── 📄 README.md                           # Mô tả đề tài chi tiết
├── 📄 PLAN.md                             # Kế hoạch triển khai
├── 📄 KEHOACH.md                          # Kế hoạch 6 giai đoạn
├── 📄 TIENDO.md                           # Theo dõi tiến độ (file này)
├── 📄 HUONGDAN_DATASET.md                 # Hướng dẫn tích hợp dataset
├── 📄 HUONGDAN_THUTHAP.md                 # Hướng dẫn thu thập Nguồn 2 + 3
├── 📄 requirements.txt                    # Python dependencies
├── 📄 .gitignore                          # Git ignore rules
├── 📄 run_pipeline.bat                    # Chạy toàn bộ pipeline
├── 📄 build_rust.bat                      # Build Rust project
├── 📄 integrate_all.bat                   # 1-click tích hợp 3 nguồn dataset
├── 📄 demo.bat                            # Demo Suite (3 scenarios)
│
├── 🦀 kds_guard/                          # === RUST PROJECT ===
│   ├── Cargo.toml                         # Dependencies
│   ├── Cargo.lock                         # Lock file
│   ├── config.toml                        # Cấu hình hệ thống
│   ├── target/release/kds_guard.exe       # Binary (2 MB)
│   └── src/
│       ├── main.rs                        # Entry point + pipeline (9.7 KB)
│       ├── input_capture.rs               # Thu thập sự kiện bàn phím (5.7 KB)
│       ├── logger.rs                      # Ghi log CSV ẩn danh (6.0 KB)
│       ├── feature.rs                     # Trích xuất 16 đặc trưng (12.4 KB)
│       ├── detector.rs                    # Rule-based detection 7 rules (11.0 KB)
│       └── policy.rs                      # Response engine 5 actions (6.9 KB)
│
├── 🐍 scripts/                            # === PYTHON SCRIPTS ===
│   ├── generate_demo_data.py              # Tạo dataset demo (20.1 KB)
│   ├── feature_extraction.py              # Tính features từ raw CSV (9.9 KB)
│   ├── injection_simulation.py            # Tạo dữ liệu injection (7.8 KB)
│   ├── simulate_injection.py              # Mô phỏng injection cho demo (7.5 KB)
│   ├── train_model.py                     # Huấn luyện ML IF/OCSVM/RF (13.5 KB)
│   ├── evaluate.py                        # Đánh giá Rule vs ML vs Hybrid (13.6 KB)
│   ├── visualize.py                       # Tạo 6 loại biểu đồ (12.0 KB)
│   ├── run_pipeline.py                    # Pipeline runner Python (4.7 KB)
│   ├── collect_keystrokes.py              # Thu thập keystroke pynput (10.4 KB)
│   ├── integrate_datasets.py              # Tích hợp 3 nguồn dataset (31.7 KB)
│   └── _fix_merge.py                      # Script tạm: tách injection & merge (2.1 KB)
│
├── 📊 dashboard/                          # === STREAMLIT DASHBOARD ===
│   └── dashboard.py                       # Dashboard 5 tabs (16.5 KB)
│
├── 🛡️ collector_tool/                     # === COLLECTOR PACKAGE ===
│   ├── kds_guard.exe                      # Binary copy 2MB
│   ├── collect_keystrokes.py              # Python collector copy
│   ├── thu_thap.bat                       # Batch thu thập Python
│   ├── thu_thap_rust.bat                  # Batch thu thập Rust
│   ├── KDS_Guard_ThuThap.zip             # Package phân phối
│   └── package/                           # Package nội dung
│       ├── kds_guard.exe
│       ├── thu_thap.bat
│       └── HUONGDAN.md
│
├── 📝 baocao/                             # === BÁO CÁO ĐỒ ÁN ===
│   ├── README.md                          # Cấu trúc báo cáo
│   ├── 00_TrangBia.md                     # Trang phụ bìa
│   ├── 01_LoiCamDoan.md                   # Lời cam đoan
│   ├── 02_MucLuc.md                       # Mục lục
│   ├── 03_DanhMuc.md                      # Danh mục viết tắt, bảng, hình
│   ├── Chuong1_TongQuan.md                # Chương 1: Tổng quan (6.9 KB)
│   ├── Chuong2_CoSoLyThuyet.md            # Chương 2: Cơ sở lý thuyết (17.7 KB)
│   ├── Chuong3_KetQuaThucNghiem.md        # Chương 3: Kết quả thực nghiệm (11.4 KB)
│   ├── Chuong4_KetLuan.md                 # Chương 4: Kết luận & kiến nghị (3.0 KB)
│   ├── 05_TaiLieuThamKhao.md              # Tài liệu tham khảo
│   ├── 06_PhuLuc.md                       # Phụ lục
│   └── images/                            # 10 hình minh họa
│       ├── hinh_2_1_kien_truc_he_thong.png
│       ├── hinh_2_2_luong_xu_ly.png
│       ├── hinh_2_3_feature_extraction.png
│       ├── hinh_2_4_detection_engine.png
│       ├── hinh_3_1_distribution.png
│       ├── hinh_3_2_scatter.png
│       ├── hinh_3_3_boxplot.png
│       ├── hinh_3_4_correlation.png
│       ├── hinh_3_5_timeline.png
│       └── hinh_3_6_model.png
│
├── 📁 data/                               # Dữ liệu
│   ├── features_dataset.csv               # Dataset chính (5.8 MB, 21,035 rows)
│   ├── features_cmu.csv                   # CMU vectors (5.9 MB, 20,400 rows)
│   ├── features_demo.csv                  # Demo human data (146 KB)
│   ├── features_injection.csv             # Injection data (91 KB)
│   ├── features_self_collected.csv        # Self-collected (777 B)
│   ├── keystroke_log_demo.csv             # Demo raw logs (1.9 MB)
│   ├── evaluation_report.json             # Evaluation kết quả
│   ├── keystroke_log_user_*.csv           # Raw logs từ Python collector
│   └── raw/
│       ├── DSL-StrongPasswordData.csv     # CMU raw (4.7 MB)
│       └── rust/                          # 28 file CSV từ Rust collector
│
├── 📁 models/                             # ML models
│   ├── isolation_forest.pkl               # IF model (1.8 MB)
│   ├── oneclass_svm.pkl                   # OCSVM model (249 KB)
│   ├── random_forest.pkl                  # RF model (132 KB)
│   ├── model.pkl                          # Best model copy (132 KB)
│   ├── scaler.pkl                         # StandardScaler (1.5 KB)
│   └── training_metadata.json             # Training info
│
└── 📁 plots/                              # 6 biểu đồ phân tích
    ├── distribution_comparison.png
    ├── scatter_cv_speed.png
    ├── boxplot_comparison.png
    ├── correlation_heatmap.png
    ├── timeline_behavior.png
    └── model_comparison.png
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

- 16 đặc trưng keystroke dynamics:
  - Hold Time: mean, std, median, IQR
  - Flight Time: mean, std, median, IQR, p5, p95, min, CV
  - Behavioral: typing_speed, modifier_ratio, special_ratio, max_burst_length
- Sliding window: ghép cặp key_down/key_up → Hold Time
- Flight Time Down-Down
- Thống kê: mean, std, median, IQR, percentiles

#### `detector.rs` (11.0 KB)

- 7 detection rules:
  1. Flight time trung bình < 30ms
  2. CV flight time < 0.15
  3. Typing speed > 15 keys/s
  4. Burst ≥ 15 phím liên tiếp < 50ms
  5. Hold time IQR < 5ms
  6. Modifier ratio > 40%
  7. Min flight time < 5ms
- Risk scoring: 0.0 → 1.0
- 5 mức: Normal → Low → Medium → High → Critical
- Chuẩn bị hybrid weights cho ML

#### `policy.rs` (6.9 KB)

- PolicyAction: Allow / LogOnly / Alert / SoftBlock / Challenge
- Cooldown tránh spam cảnh báo
- Challenge generation (random 3 chars)
- Configurable enable/disable per level

#### `main.rs` (9.7 KB)

- CLI bằng clap: output_dir, user_id, window_size, collect_only, log_keys, verbose, duration
- Pipeline: Collector → Logger → Feature Extractor → Detector → Policy → Action
- ASCII box cảnh báo đẹp mắt
- 2 chế độ: collect-only và detection

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

---

## ⏭️ Việc còn lại

### ✅ Đã hoàn thành

1. ✅ Tạo KEHOACH.md: Kế hoạch 6 giai đoạn chi tiết
2. ✅ Viết lại integrate_datasets.py: Hỗ trợ đầy đủ 3 nguồn
3. ✅ Tạo integrate_all.bat: Script 1 lần tích hợp toàn bộ
4. ✅ Build Rust: kds_guard.exe 2MB
5. ✅ CMU conversion: 20,400 vectors → features_cmu.csv
6. ✅ Merge dataset: 21,035 samples
7. ✅ Retrain model: RF 100%, IF AUC 99.4%, OCSVM AUC 99.6%
8. ✅ Demo Suite: demo.bat + simulate_injection.py
9. ✅ Viết báo cáo: 4 chương + phụ lục
10. ✅ Tạo collector package: KDS_Guard_ThuThap.zip

### 🔄 Có thể cải thiện (tùy chọn)

1. **⏳ Mở rộng dataset Nguồn 2 (Python)**: Thu thập thêm từ người dùng thật
   - File sẽ lưu tự động vào `data/keystroke_log_<user>_*.csv`
   - Xử lý: `python scripts\integrate_datasets.py --self-collect --merge`
2. **⏳ Mở rộng dataset Nguồn 3 (Rust)**: Thu thập thêm session
   - File đặt vào `data/raw/rust/`
   - Xử lý: `python scripts\integrate_datasets.py --rust-collect --merge`
3. **⏳ Quay demo video**: collector → gõ bình thường → injection → cảnh báo
4. **⏳ Điền thông tin sinh viên**: Cập nhật `baocao/00_TrangBia.md` và `baocao/README.md`

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
| Tổng file source code | 17 files |
| Rust modules | 6 files (51.7 KB) |
| Python scripts | 11 files (153.0 KB) |
| Báo cáo | 11 files + 10 hình |
| Dataset chính | 21,035 samples |
| ML models trained | 3 (IF + OCSVM + RF) |
| Best model accuracy | 100% (Random Forest) |
| Best model AUC-ROC | 1.000 (Random Forest) |
| Biểu đồ phân tích | 6 loại |
| Demo scenarios | 3 kịch bản |
