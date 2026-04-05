# KDS Guard

Phát hiện & ngăn chặn tấn công chèn phím giả mạo (BadUSB) bằng phân tích động học gõ phím (Keystroke Dynamics).

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

## Cài đặt & Chạy

### Yêu cầu
- Rust 1.70+
- Node.js 18+ (cho dashboard)
- Python 3.9+ (cho scripts)
- Windows 10/11

### Build Rust engine
```bash
cd kds_guard
cargo build --release
```

### Chạy detection
```bash
# Chạy với quyền Administrator (cần cho BlockInput)
kds_guard.exe -w 40 -s 20 -u user_001

# Với JSON output (cho WebSocket bridge)
kds_guard.exe --json-output -w 40 -s 20

# Chỉ thu thập dữ liệu
kds_guard.exe --collect-only -d 60 -u user_001
```

### Chạy WebSocket bridge (real-time Dashboard)
```bash
# Pipe từ engine
kds_guard.exe --json-output | python ws_bridge.py

# Dashboard kết nối tại ws://localhost:8765
```

### Demo BadUSB (không cần USB thật)
```bash
# Mở 2 terminal:
# Terminal 1: Chạy KDS Guard
kds_guard.exe -v

# Terminal 2: Mô phỏng BadUSB
python scripts/simulate_badusb.py --speed 50
```

### Chạy dashboard
```bash
cd kds-guard-dashboard
npm install
npm run dev
# Mở http://localhost:3000
```

### Đánh giá ngưỡng (confusion matrix)
```bash
python scripts/evaluate_thresholds.py
```

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

## Công nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Engine chính | Rust (performance, memory safety) |
| Bắt phím | rdev (cross-platform keyboard capture) |
| Chặn input | winapi – BlockInput API |
| Dashboard | React + TypeScript + MUI + ECharts |
| Real-time | WebSocket bridge (Python websockets) |
| Phân tích | Python (pandas, matplotlib) |

## Tài liệu

| File | Nội dung |
|------|---------|
| `baocao/BAOCAO.md` | Báo cáo trình bày dự án A-Z |
| `baocao/RESEARCH.md` | Tài liệu kỹ thuật cốt lõi |
| `baocao/TIENDO.md` | Theo dõi tiến độ chi tiết |

## Đồ án Cơ sở – 2026