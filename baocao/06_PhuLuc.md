# PHỤ LỤC

## Phụ lục A: Cấu trúc dự án

```text
DOANCOSO/
├── README.md                           # Mô tả đề tài
├── KEHOACH.md                          # Kế hoạch 6 giai đoạn
├── TIENDO.md                           # Theo dõi tiến độ
├── requirements.txt                    # Python dependencies
├── run_pipeline.bat                    # Chạy toàn bộ pipeline
├── build_rust.bat                      # Build Rust project
├── demo.bat                            # Chạy demo 3 scenarios
│
├── kds_guard/                          # === RUST PROJECT ===
│   ├── Cargo.toml
│   ├── config.toml
│   └── src/
│       ├── main.rs                     # Entry point + pipeline
│       ├── input_capture.rs            # Thu thập sự kiện bàn phím
│       ├── logger.rs                   # Ghi log CSV
│       ├── feature.rs                  # Trích xuất 19 đặc trưng
│       ├── detector.rs                 # Rule-based detection
│       └── policy.rs                   # Response engine
│
├── scripts/                            # === PYTHON SCRIPTS ===
│   ├── generate_demo_data.py           # Tạo dataset demo
│   ├── feature_extraction.py           # Tính features từ raw CSV
│   ├── injection_simulation.py         # Tạo dữ liệu injection
│   ├── train_model.py                  # Huấn luyện ML models
│   ├── evaluate.py                     # Đánh giá Rule vs ML vs Hybrid
│   ├── visualize.py                    # Tạo biểu đồ
│   ├── simulate_injection.py           # Mô phỏng injection cho demo
│   ├── collect_keystrokes.py           # Thu thập keystroke (Python)
│   └── integrate_datasets.py           # Tích hợp 3 nguồn dataset
│
├── dashboard/
│   └── dashboard.py                    # Streamlit Dashboard 5 tabs
│
├── data/                               # Dữ liệu (auto-generated)
├── models/                             # ML models (auto-generated)
├── plots/                              # Biểu đồ (auto-generated)
└── baocao/                             # Báo cáo đồ án
```

## Phụ lục B: Hướng dẫn cài đặt và chạy

### B.1. Cài đặt Python dependencies

```bash
pip install -r requirements.txt
```

### B.2. Build Rust project

```bash
cd kds_guard
cargo build --release
```

### B.3. Chạy pipeline tự động

```bash
run_pipeline.bat
```

### B.4. Chạy demo

```bash
demo.bat
```

### B.5. Mở Dashboard

```bash
streamlit run dashboard/dashboard.py
```

## Phụ lục C: Feature Vector — 19 đặc trưng

| # | Tên đặc trưng      | Đơn vị  | Mô tả                                  |
|---|---------------------|---------|-----------------------------------------|
| 1 | mean_hold_time      | ms      | Trung bình Hold Time                    |
| 2 | std_hold_time       | ms      | Độ lệch chuẩn Hold Time                |
| 3 | median_hold_time    | ms      | Median Hold Time                        |
| 4 | iqr_hold_time       | ms      | IQR Hold Time                           |
| 5 | mean_flight_time    | ms      | Trung bình Flight Time (DD)             |
| 6 | std_flight_time     | ms      | Độ lệch chuẩn Flight Time              |
| 7 | median_flight_time  | ms      | Median Flight Time                      |
| 8 | iqr_flight_time     | ms      | IQR Flight Time                         |
| 9 | p5_flight_time      | ms      | Percentile 5 Flight Time               |
| 10 | p95_flight_time    | ms      | Percentile 95 Flight Time              |
| 11 | min_flight_time    | ms      | Flight Time nhỏ nhất                    |
| 12 | cv_flight_time     | —       | Coefficient of Variation (std/mean)     |
| 13 | typing_speed       | keys/s  | Tốc độ gõ phím                          |
| 14 | modifier_ratio     | —       | Tỉ lệ phím modifier (0-1)              |
| 15 | special_ratio      | —       | Tỉ lệ phím special (0-1)               |
| 16 | has_burst          | bool    | Có burst pattern hay không              |
| 17 | max_burst_length   | phím    | Burst dài nhất (phím liên tiếp < 50ms)  |
| 18 | window_start_ms    | ms      | Timestamp bắt đầu cửa sổ               |
| 19 | window_end_ms      | ms      | Timestamp kết thúc cửa sổ              |
