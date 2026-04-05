# KDS Guard

Phát hiện & ngăn chặn tấn công chèn phím giả mạo (BadUSB) bằng phân tích động học gõ phím (Keystroke Dynamics).

## Tổng quan

KDS Guard giám sát hành vi gõ phím theo thời gian thực, phân biệt giữa người thật và thiết bị tiêm phím tự động (BadUSB/Rubber Ducky). Khi phát hiện bất thường, hệ thống sẽ cảnh báo qua Windows notification và có thể chặn input tạm thời.

## Cấu trúc dự án

```
DOANCOSO/
├── kds_guard/              # Rust engine (core)
│   └── src/
│       ├── main.rs         # Entry point, pipeline chính
│       ├── input_capture.rs# Thu thập sự kiện bàn phím
│       ├── feature.rs      # Trích xuất đặc trưng (sliding window)
│       ├── detector.rs     # Rule-based detection (7 rules)
│       ├── policy.rs       # Quyết định phản hồi
│       ├── response.rs     # BlockInput API + Windows notification
│       └── logger.rs       # Ghi log CSV
├── kds-guard-dashboard/    # React dashboard (TypeScript + MUI)
├── collector_tool/         # Tool thu thập dữ liệu Python
├── scripts/                # Scripts phân tích & xử lý
├── data/                   # Dataset keystroke logs + features
├── baocao/                 # Tài liệu báo cáo đồ án
└── models/                 # Mô hình (nếu có)
```

## Pipeline xử lý

```
Keyboard → Collector → Feature Extractor → Detector → Policy → Response
                                              │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                          Allow           Alert/Log      Block + Notify
```

## Đặc trưng phân tích

| Đặc trưng | Mô tả |
|-----------|-------|
| Flight Time | Thời gian giữa 2 phím liên tiếp |
| Hold Time | Thời gian giữ phím |
| CV Flight Time | Hệ số biến thiên (người thật > 0.3, máy < 0.15) |
| Typing Speed | Tốc độ gõ (keys/s) |
| Burst Detection | Chuỗi phím liên tiếp cực nhanh |
| Modifier Ratio | Tỷ lệ phím Ctrl/Alt/Win/Shift |
| IQR Hold Time | Độ phân tán hold time |

## Mức phản hồi

| Risk Level | Hành động |
|------------|-----------|
| Normal | Cho phép, tiếp tục giám sát |
| Low | Ghi log |
| Medium | Hiện cảnh báo Windows |
| High | Chặn input 2-3 giây + cảnh báo |
| Critical | Chặn input 3-10 giây + cảnh báo |

## Cài đặt & Chạy

### Yêu cầu
- Rust 1.70+
- Node.js 18+ (cho dashboard)
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

# Chỉ thu thập dữ liệu (không detect)
kds_guard.exe --collect-only -d 60 -u user_001
```

### Chạy dashboard
```bash
cd kds-guard-dashboard
npm install
npm run dev
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

## Công nghệ

- **Rust** – Engine chính (performance, memory safety)
- **winapi** – BlockInput API, Windows MessageBox
- **rdev** – Cross-platform keyboard capture
- **React + TypeScript + MUI** – Dashboard giám sát
- **Python** – Scripts phân tích dữ liệu

## Đồ án Cơ sở – 2026