# KDS Guard – Tài liệu kỹ thuật cốt lõi

> File này tổng hợp các thành phần quan trọng nhất của dự án để review.
> Ai đọc file này sẽ hiểu được dự án phát hiện BadUSB bằng cách nào, dựa vào cơ sở gì.

---

## 1. Bài toán đang giải quyết

**BadUSB** là một dạng tấn công mà thiết bị USB giả dạng bàn phím, tự động gõ lệnh vào máy tính nạn nhân. Vì hệ điều hành tin tưởng bàn phím USB tuyệt đối, các phần mềm antivirus không thể phát hiện.

**Ý tưởng giải pháp:** Con người gõ phím có nhịp riêng (nhanh-chậm không đều, giữ phím lâu hơn máy). BadUSB gõ cực nhanh, cực đều, không có sự biến thiên tự nhiên. Dựa vào sự khác biệt này, ta phát hiện được.

**Tên lĩnh vực:** Keystroke Dynamics – phân tích hành vi gõ phím.

---

## 2. Pipeline xử lý (từ A đến Z)

```
Cắm USB → Thu thập keystroke → Trích xuất đặc trưng → Phát hiện bất thường → Phản hồi
              (input_capture.rs)      (feature.rs)          (detector.rs)        (response.rs)
```

### Bước 1: Thu thập sự kiện gõ phím (`input_capture.rs`)

Dùng Windows API `SetWindowsHookExW` để bắt **mọi sự kiện bàn phím** toàn hệ thống.

Mỗi sự kiện gồm:
- `key_code`: phím nào (A, Enter, Ctrl...)
- `event_type`: "down" hay "up"
- `timestamp_ms`: thời điểm chính xác (ms)
- `is_modifier`: có phải Ctrl/Alt/Shift/Win không
- `key_class`: "printable" / "modifier" / "special" / "navigation"

### Bước 2: Trích xuất đặc trưng (`feature.rs`)

Dùng **cửa sổ trượt** (sliding window): mặc định lấy **40 phím** gần nhất, trượt mỗi 20 phím (cấu hình được qua tham số `-w` và `-s`).

> **⚡ Early Warning Layer:** Song song với cửa sổ chính, hệ thống chạy thêm một cửa sổ nhỏ **30 phím** (trượt mỗi 15 phím) để phát hiện sớm payload ngắn. Payload BadUSB chỉ cần 30-50 phím là xong (VD: `Win+R → powershell -c "..." → Enter`), nên cửa sổ nhỏ phát hiện **sớm hơn đáng kể**.

Từ mỗi cửa sổ, trích xuất ra **22 đặc trưng thống kê:**

| # | Đặc trưng | Ý nghĩa | Người thường | BadUSB |
|---|-----------|---------|:------------:|:------:|
| 1 | `mean_hold_time` | Thời gian giữ phím trung bình | 80-120 ms | 5-15 ms |
| 2 | `std_hold_time` | Độ lệch chuẩn thời gian giữ | 20-40 ms | 0.5-2 ms |
| 3 | `median_hold_time` | Trung vị thời gian giữ | 75-110 ms | 5-15 ms |
| 4 | `iqr_hold_time` | Khoảng tứ phân vị thời gian giữ | 20-50 ms | 1-3 ms |
| 5 | **`mean_flight_time`** | Thời gian bay TB (down→down) | 120-300 ms | **10-25 ms** |
| 6 | `std_flight_time` | Độ lệch chuẩn thời gian bay | 50-120 ms | 0.5-3 ms |
| 7 | `median_flight_time` | Trung vị thời gian bay | 100-250 ms | 10-25 ms |
| 8 | `iqr_flight_time` | IQR thời gian bay | 30-80 ms | 1-5 ms |
| 9 | **`cv_flight_time`** | Hệ số biến thiên (std/mean) | 0.3-0.6 | **< 0.15** |
| 10 | **`typing_speed`** | Tốc độ gõ (phím/giây) | 3-10 | **30-100** |
| 11 | `modifier_ratio` | Tỷ lệ phím Ctrl/Alt/Shift/Win | 3-8% | 10-60% |
| 12 | `special_ratio` | Tỷ lệ phím đặc biệt (Enter, Tab...) | 1-5% | 5-20% |
| 13 | **`has_burst`** | Có chuỗi gõ nhanh liên tiếp? | false | **true** |
| 14 | **`max_burst_length`** | Số phím liên tiếp < 50ms | 0-3 | **15-200+** |
| 15 | **`min_flight_time`** | Flight time nhỏ nhất | 40-80 ms | **1-5 ms** |
| 16 | `p5_flight_time` | Percentile 5% flight time | 50-90 ms | 5-20 ms |
| 17 | `p95_flight_time` | Percentile 95% flight time | 300-500 ms | 20-30 ms |
| 18 | `window_start_ms` | Thời điểm bắt đầu cửa sổ | - | - |
| 19 | `window_end_ms` | Thời điểm kết thúc cửa sổ | - | - |
| 20 | **`inter_command_pause_count`** | Số khoảng nghỉ > 80ms giữa các cụm gõ nhanh | 0 | **3-10** |
| 21 | **`pause_regularity`** | CV của khoảng nghỉ (máy nghỉ đều, người không đều) | > 0.5 | **< 0.15** |
| 22 | **`enter_after_burst`** | Tỷ lệ Enter ngay sau burst (dấu hiệu gõ lệnh) | 0% | **40-80%** |

**Các đặc trưng in đậm là quan trọng nhất** – tạo ra sự khác biệt rõ rệt nhất giữa người và máy.

> Đặc trưng 20-22 là **Injection Fingerprint** — phát hiện dấu vân tay đặc trưng của script injection: khoảng nghỉ đều đặn giữa các dòng lệnh và Enter kết thúc mỗi câu lệnh.

### Bước 3: Phát hiện bất thường (`detector.rs`) – ⭐ QUAN TRỌNG NHẤT

Dùng **8 rules** (luật) để đánh giá. Mỗi rule có **ngưỡng** và **trọng số đóng góp** vào risk score:

| Rule | Tên | Điều kiện kích hoạt | Trọng số | Cơ sở khoa học |
|------|-----|---------------------|----------|----------------|
| **R1** | Flight Time thấp | `mean_flight_time < 30ms` | **+0.30** | Con người không thể gõ 2 phím cách nhau < 30ms liên tục. BadUSB gõ với delay cố định 10-20ms |
| **R2** | CV thấp | `cv_flight_time < 0.15` | **+0.25** | Con người có nhịp gõ biến thiên tự nhiên (CV 0.3-0.6). Máy gõ đều → CV gần 0 |
| **R3** | Tốc độ vượt ngưỡng | `typing_speed > 20 keys/s AND mean_ft < 50ms` | **+0.20~0.35** | Kỷ lục gõ phím thế giới ~12.5 keys/s. Kết hợp thêm điều kiện flight_time < 50ms để tránh false positive với người gõ quen |
| **R4** | Burst Pattern | `max_burst >= 15 phím` liên tiếp < 50ms | **+0.20** | Người thường có pause tự nhiên giữa các từ. Script injection gõ không nghỉ |
| **R5** | Hold Time đồng đều | `iqr_hold_time < 5ms` | **+0.15** | Người nhấn giữ phím với thời gian khác nhau. Máy nhấn-thả cực nhanh, đều |
| **R6** | Modifier ratio cao | `modifier_ratio > 40%` | **+0.10** | Payload thường dùng nhiều Ctrl/Alt/Win cho shortcut (VD: Win+R, Ctrl+C) |
| **R7** | Min flight time cực thấp | `min_flight_time < 5ms` | **+0.10** | Dưới 5ms gần như không thể là con người |
| **R8** | Injection Fingerprint | `pause_count ≥ 2 AND pause_regularity < 0.3` | **+0.15~0.25** | Khoảng nghỉ **giữa 2 burst** (không phải pause bình thường) với độ đều cao + Enter sau burst = script chạy từng dòng |

> **Lưu ý về R8:** "Pause" ở đây **không phải** việc người dùng dừng suy nghĩ khi gõ. Điều kiện kích hoạt yêu cầu pause **nằm giữa 2 cụm gõ nhanh** (burst → nghỉ → burst). Người bình thường không có burst (gõ liên tục < 50ms), nên dù có dừng suy nghĩ cũng không thỏa điều kiện "nghỉ giữa 2 burst". Ngoài ra, `pause_regularity < 0.3` đòi hỏi các khoảng nghỉ phải đều đặn như máy — người thật nghỉ ngẫu nhiên.

### Công thức tính Risk Score

```
rule_score = Σ(contribution của các rule bị kích hoạt), giới hạn [0, 1]

risk_score = rule_weight × rule_score    (hiện tại rule_weight = 1.0)
```

### Phân loại mức rủi ro

| Risk Score | Mức | Hành động |
|:----------:|:----:|-----------|
| 0.00 – 0.10 | ✅ NORMAL | Không làm gì |
| 0.10 – 0.30 | 🔵 LOW | Ghi log |
| 0.30 – 0.60 | 🟡 MEDIUM | Hiện thông báo popup |
| 0.60 – 0.80 | 🟠 HIGH | **Chặn input tối đa 2 giây** + thông báo |
| 0.80 – 1.00 | 🔴 CRITICAL | **Chặn input tối đa 5 giây** + cảnh báo khẩn |

> **An toàn BlockInput:** Mọi lần chặn đều có **timeout cứng tối đa 5 giây** — dù bất kỳ lý do gì (crash, treo), sau 5 giây input luôn được mở lại tự động. Đây là giới hạn cứng được thiết kế để tránh trường hợp người dùng bị khóa hoàn toàn. Thời gian 2-5 giây đủ để ngắn phần lớn payload BadUSB nhưng không gây mất dữ liệu.

### Bước 4: Phản hồi tấn công (`response.rs`)

Dùng 2 Windows API:

1. **`BlockInput(TRUE/FALSE)`** – chặn hoàn toàn bàn phím + chuột trong thời gian nhất định. Cần **quyền Administrator**.

2. **`MessageBoxW`** – hiện popup cảnh báo ngay trên desktop với flag `MB_TOPMOST | MB_SYSTEMMODAL` (luôn ở trên cùng, không bị đè).

---

## 3. Dữ liệu thực nghiệm

### Dataset: `data/features_dataset.csv`
- **21,035 mẫu** (mỗi mẫu = 1 lần trích xuất từ cửa sổ phím)
- **51+ người dùng** gõ bình thường
- **Mẫu BadUSB** được tạo từ `simulate_injection.py` và ESP32-S2

### So sánh thực tế

| Chỉ số | Người gõ bình thường (TB) | BadUSB (TB) | Chênh lệch |
|--------|:-------------------------:|:-----------:|:-----------:|
| mean_flight_time | 154.2 ms | 20 ms | **7.7x** |
| cv_flight_time | 0.42 | 0.075 | **5.6x** |
| typing_speed | 4.8 keys/s | 50 keys/s | **10.4x** |
| max_burst_length | 0 phím | 35 phím | **∞** |
| iqr_hold_time | 38.5 ms | 2 ms | **19.3x** |

→ **Sự khác biệt là rất lớn** (5-20 lần), nên rule-based đã đủ hiệu quả, chưa cần machine learning.

---

## 4. Tại sao dùng Rule-Based mà không dùng Machine Learning?

| Tiêu chí | Rule-Based (đang dùng) | Machine Learning |
|----------|:---------------------:|:---------------:|
| Tốc độ phát hiện | **< 1ms** | 10-50ms |
| Giải thích được | **Có** (lý do cụ thể) | Khó (black box) |
| Cần dữ liệu training | **Không** | Cần nhiều |
| Độ chính xác | Cao (~95%+) | Rất cao (~99%) |
| Phù hợp đồ án cơ sở | **Rất phù hợp** | Phức tạp hơn cần thiết |

> Kết luận: Ở mức đồ án cơ sở, rule-based là lựa chọn hợp lý. ML có thể mở rộng ở đồ án chuyên ngành.

---

## 5. Tốc độ phản hồi

```text
Với cửa sổ chính (40 phím, mặc định):
  Cắm USB → Gõ phím đầu tiên: 0ms (hệ thống luôn sẵn sàng)
  Thu đủ 40 phím (ở 50 keys/s): ~0.8 giây  
  Trích xuất + phân tích: < 1ms
  Chặn input (BlockInput): < 1ms
                      ─────────────────
      Tổng: ~0.8 giây sau khi cắm USB

Với Early Warning (30 phím):
  Thu đủ 30 phím (ở 50 keys/s): ~0.6 giây  ← PHÁT HIỆN SỚM NHẤT
  Trích xuất + phân tích: < 1ms
                      ─────────────────
      Tổng: ~0.6 giây sau khi cắm USB
```

Với cửa sổ trượt (slide mỗi 20 phím), từ lần phát hiện thứ 2 trở đi chỉ cần thêm **~0.4 giây**.
Với Early Warning, payload ngắn (30-50 phím) bị phát hiện **trước khi hoàn tất**.

> **Ghi chú:** Kích thước cửa sổ có thể điều chỉnh qua tham số `-w` và `-s`. Mặc định `-w 40 -s 20` tối ưu cho cân bằng giữa tốc độ phát hiện và độ chính xác.

---

## 6. Kiến trúc mã nguồn

```text
kds_guard/src/
├── main.rs            # Điều phối: CLI → Collector → Detector → Response + Early Warning Layer
├── input_capture.rs   # Thu thập keystroke (Windows Hook API)
├── feature.rs         # Trích xuất 22 đặc trưng từ sliding window (40 + 30 phím)
├── detector.rs        # 8 rules + hybrid scoring → risk level
├── response.rs        # BlockInput API + MessageBox notification
├── policy.rs          # Quyết định hành động theo risk level
└── logger.rs          # Ghi dữ liệu ra file CSV

ws_bridge.py           # Python WebSocket bridge (Rust stdout → Dashboard)
```

**Ngôn ngữ:** Rust – chọn vì:
- Hiệu năng cao (tương đương C/C++)
- Memory safety (không crash do lỗi bộ nhớ)
- Dễ gọi Windows API qua crate `winapi`

**WebSocket Bridge:** Khi chạy `kds_guard.exe --json-output`, engine xuất JSON mỗi window. Python bridge đọc stdout và forward qua WebSocket (`ws://localhost:8765`) để Dashboard nhận dữ liệu real-time.

```text
Rust engine (--json-output)  →  stdout (JSON lines)
                                    ↓
Python ws_bridge.py          →  WebSocket server (port 8765)
                                    ↓
Dashboard (browser)          →  subscribe + update real-time
```

---

## 7. Câu hỏi phản biện thường gặp

### Q: "Nếu BadUSB gõ chậm lại thì sao?"
**A:** Nếu BadUSB giảm tốc độ xuống < 20 keys/s, R3 sẽ không kích hoạt – nhưng R2 (CV) và R5 (IQR Hold Time) vẫn phát hiện được, vì máy **gõ đều** còn người **gõ không đều**. Muốn qua mặt cả 8 rules, BadUSB phải mô phỏng sự biến thiên tự nhiên → rất khó và chậm đến mức không còn nguy hiểm.

### Q: "Tại sao ngưỡng 30ms, 0.15, 20 keys/s? Lấy từ đâu?"

**A:** Từ nghiên cứu về giới hạn sinh lý con người:
- **30ms flight time**: Nghiên cứu cho thấy inter-key interval tối thiểu của con người ~50-60ms. Đặt 30ms để có biên an toàn.
- **0.15 CV**: Nghiên cứu Keystroke Dynamics cho thấy CV của người bình thường luôn > 0.2. Đặt 0.15 để giảm false positive.
- **20 keys/s**: Kỷ lục gõ phím thế giới ~750 CPM ≈ 12.5 ký tự/giây. Ban đầu đặt 15, đã nâng lên 20 kết hợp điều kiện flight_time < 50ms để giảm false positive với cửa sổ 40 phím.

### Q: "Có false positive không?"
**A:** Rất hiếm. Cần ít nhất 3-4 rules đồng thời kích hoạt mới đạt mức HIGH. Một người gõ nhanh bất thường có thể trigger R3 (+0.2) nhưng CV vẫn cao → không trigger R2 → chỉ đạt LOW, không bị chặn.

### Q: "Tại sao không dùng whitelist VID:PID?"
**A:** VID:PID có thể bị giả mạo (spoof) dễ dàng. BadUSB thường clone VID:PID của bàn phím thật. Phân tích hành vi (behavioral analysis) không thể bị giả mạo.

### Q: "Dashboard chỉ dùng mock data, vậy có phải fake?"
**A:** Dashboard có 2 chế độ: (1) Mock data để demo giao diện, (2) Real-time qua WebSocket bridge (`ws_bridge.py`) nhận JSON trực tiếp từ Rust engine. Chạy `kds_guard.exe --json-output | python ws_bridge.py` để kết nối real-time.

### Q: "Tại sao thêm Early Warning mà không bỏ cửa sổ lớn?"
**A:** Hai cửa sổ bổ sung cho nhau: cửa sổ 30 phím phát hiện **nhanh** nhưng có thể false positive (ít dữ liệu). Cửa sổ chính (40 phím) phát hiện **chính xác** hơn (nhiều dữ liệu). Early Warning cảnh báo sớm, cửa sổ chính xác nhận.

### Q: "Rule R8 (Injection Fingerprint) hoạt động thế nào?"
**A:** BadUSB payload thường có pattern: gõ nhanh cụm lệnh → nghỉ đều ~100ms → gõ nhanh cụm tiếp → Enter. R8 đếm số lần có "nghỉ đều giữa burst" và kiểm tra Enter có xuất hiện sau burst không. Nếu cả hai điều kiện đúng → rất có thể là script injection.

---

## 8. Tham khảo

1. Keystroke Dynamics – biometric authentication qua hành vi gõ phím
2. Rubber Ducky / BadUSB – www.hak5.org/products/usb-rubber-ducky
3. Windows API: `SetWindowsHookExW` (WH_KEYBOARD_LL), `BlockInput`, `MessageBoxW`
4. Rust crate: `winapi`, `rdev`, `serde`, `serde_json`, `clap`, `csv`, `chrono`

---

## 9. Kết quả thực nghiệm (Confusion Matrix)

Đánh giá trên **21,035 mẫu** (20,803 human + 232 attack) với script `evaluate_thresholds.py`:

| Ngưỡng | TP | FP | TN | FN | TPR | FPR | F1 |
|:------:|:--:|:--:|:--:|:--:|:---:|:---:|:--:|
| 0.1 | 232 | 123 | 20,680 | 0 | 100% | 0.6% | 79.0% |
| 0.2 | 232 | 1 | 20,802 | 0 | 100% | 0.0% | 99.8% |
| **0.3** | **229** | **0** | **20,803** | **3** | **98.7%** | **0.0%** | **99.3%** |
| 0.5 | 200 | 0 | 20,803 | 32 | 86.2% | 0.0% | 92.6% |
| 0.8 | 177 | 0 | 20,803 | 55 | 76.3% | 0.0% | 86.6% |

> **Kết luận:** Với ngưỡng 0.3 (MEDIUM), hệ thống phát hiện **98.7% BadUSB** với **0% false positive**.

Phân bố rule kích hoạt (trên 232 mẫu attack):

| Rule | Tên | Tỷ lệ kích hoạt |
|------|-----|:----------------:|
| R2 | CV thấp | **100%** |
| R5 | Hold Time đều | 97.4% |
| R3 | Tốc độ cao | 87.5% |
| R4 | Burst dài | 76.3% |
| R1 | Flight Time thấp | 52.2% |

→ **R2 (CV) là rule hiệu quả nhất** — 100% mẫu attack đều trigger. Đây là đặc trưng khó giả mạo nhất.

---

## 10. Công cụ hỗ trợ

| Script | Chức năng |
|--------|-----------|
| `scripts/simulate_badusb.py` | Mô phỏng BadUSB bằng pyautogui (demo không cần USB thật) |
| `scripts/evaluate_thresholds.py` | Tính confusion matrix từ dataset 21,035 mẫu |
| `ws_bridge.py` | WebSocket bridge: Rust engine → Dashboard real-time |
