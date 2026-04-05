# THUTHAP.md — Quy trình Thu thập & Xử lý Dữ liệu KDS Guard

> Tài liệu trình bày chi tiết toàn bộ pipeline: từ thu thập sự kiện bàn phím thô → trích xuất đặc trưng → phát hiện bất thường → kết quả đầu ra cuối cùng.

---

## 1. Tổng quan Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐    ┌───────────┐
│ Bàn phím     │───→│ input_capture│───→│ feature.rs   │───→│detector.rs│───→│ policy.rs │
│ (Keyboard)   │    │ Thu thập thô │    │ Trích đặc    │    │ 8 Rules  │    │ Phản hồi  │
│              │    │              │    │ trưng (22)   │    │ Chấm điểm│    │           │
└──────────────┘    └──────┬───────┘    └──────────────┘    └──────────┘    └─────┬─────┘
                           │                                                      │
                           ▼                                                      ▼
                    ┌──────────────┐                                  ┌────────────────────┐
                    │ logger.rs    │                                  │ response.rs        │
                    │ Ghi CSV thô  │                                  │ Block / Alert      │
                    └──────────────┘                                  └────────────────────┘
```

---

## 2. Bước 1 — Thu thập thô (`input_capture.rs`)

### 2.1 Thu thập những gì?

Hệ thống sử dụng thư viện **rdev** (Rust) để hook vào **low-level keyboard events** của hệ điều hành. Mỗi khi người dùng nhấn hoặc nhả một phím, hệ thống ghi nhận:

| Trường | Kiểu | Mô tả | Ví dụ |
|--------|------|-------|-------|
| `timestamp_ms` | `f64` | Thời điểm xảy ra sự kiện (ms kể từ khi khởi động) | `12345.67` |
| `key_code` | `String` | Tên phím cụ thể | `"KeyA"`, `"Return"`, `"ShiftLeft"` |
| `event_type` | `String` | Loại sự kiện | `"down"` (nhấn) hoặc `"up"` (nhả) |
| `key_class` | `String` | Phân loại nhóm phím | `"alpha"`, `"digit"`, `"modifier"`, `"special"`, `"function"`, `"navigation"`, `"other"` |
| `is_modifier` | `bool` | Có phải phím modifier không | `true` cho Shift/Ctrl/Alt/Win |

### 2.2 Phân loại phím (Key Classification)

```
┌─────────────────────────────────────────────────────────────┐
│ alpha     : A-Z, Space                                      │
│ digit     : 0-9                                             │
│ modifier  : Shift(L/R), Ctrl(L/R), Alt, AltGr, Win(L/R)   │
│ special   : Esc, Tab, Enter, Delete, Backspace, CapsLock   │
│ function  : F1–F12                                          │
│ navigation: ↑ ↓ ← →                                        │
│ other     : Tất cả phím còn lại                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Cơ chế hoạt động

- **Cách hook**: `rdev::listen()` đăng ký global callback bắt tất cả KeyPress/KeyRelease.
- **Timestamp**: Tính bằng `Instant::now().elapsed()` — độ chính xác đến micro-giây.
- **Gửi dữ liệu**: Qua `std::sync::mpsc::Sender` sang thread xử lý chính.
- **Auto-restart**: Nếu listener crash → tự động retry tối đa 5 lần, nghỉ 500ms giữa mỗi lần.

### 2.4 Ví dụ dòng dữ liệu thô

Khi gõ chữ "Hi":

```
timestamp_ms   key_code    event_type  key_class  is_modifier
-----------    --------    ----------  ---------  -----------
1000.00        ShiftLeft   down        modifier   true
1020.00        KeyH        down        alpha      false
1080.00        ShiftLeft   up          modifier   true
1100.00        KeyH        up          alpha      false
1200.00        KeyI        down        alpha      false
1280.00        KeyI        up          alpha      false
```

---

## 3. Bước 2 — Ghi log CSV (`logger.rs`)

### Lưu gì?

Mỗi sự kiện thô được ghi vào file CSV với format:

```
timestamp_ms,key_code,event_type,key_class,is_modifier,session_id,user_id
1000.00,ShiftLeft,down,modifier,true,20260405_210000,user_001
1020.00,KeyH,down,alpha,false,20260405_210000,user_001
```

- **File path**: `data/keystroke_log_{session_id}.csv`
- **Session ID**: Tự tạo theo thời gian khởi động (`YYYYMMDD_HHMMSS`)
- **Tùy chọn `--log-keys`**: Nếu tắt, chỉ ghi `key_class` thay vì `key_code` (bảo mật privacy)

---

## 4. Công cụ thu thập (`collector_tool/`)

Hệ thống có **2 công cụ thu thập song song** và **2 script batch** hướng dẫn người dùng đóng góp dữ liệu:

### 4.1 Cấu trúc thư mục

```
collector_tool/
├── collect_keystrokes.py   # Thu thập bằng Python (pynput)
├── kds_guard.exe           # Thu thập bằng Rust (--collect-only)
├── thu_thap.bat            # Script batch hướng dẫn — Python
├── thu_thap_rust.bat       # Script batch hướng dẫn — Rust
├── KDS_Guard_ThuThap.zip   # Gói đóng sẵn gửi người tham gia
└── package/                # Gói tối giản phân phối
    ├── kds_guard.exe
    ├── thu_thap.bat
    └── HUONGDAN.md
```

### 4.2 Cách 1: Python Collector (`collect_keystrokes.py`)

- **Thư viện**: `pynput` (hook bàn phím)
- **Timestamp**: `time.perf_counter()` — độ chính xác micro-giây
- **Phân loại phím**: Cùng logic 7 nhóm như Rust (alpha, digit, modifier, special, function, navigation, other)

```bash
# Thu thập cơ bản
python collect_keystrokes.py -u user_001 -s 1 --duration 180

# Không ghi key_code (bảo mật — chỉ ghi key_class)
python collect_keystrokes.py -u user_001 --no-log-keys

# Xem hướng dẫn chi tiết
python collect_keystrokes.py --guide
```

### 4.3 Cách 2: Rust Collector (`kds_guard.exe --collect-only`)

```bash
# Chỉ thu thập, không chạy detection
kds_guard.exe --collect-only --log-keys -u le_hiep_s1 -o data/raw/rust -d 120
```

- **Ưu điểm so với Python**: Timestamp chính xác hơn (Instant::now), không bị Python GIL delay
- **Nhược điểm**: Cần build từ Rust, file .exe chỉ chạy trên Windows

### 4.4 Script batch hướng dẫn (`thu_thap.bat`, `thu_thap_rust.bat`)

Cả 2 script batch đều tự động hóa quy trình thu thập **3 sessions/người**:

| Session | Nội dung | Thời gian |
|---------|---------|-----------|
| **Session 1** | Gõ lại đoạn văn tiếng Việt hiển thị trên màn hình | 2-3 phút |
| **Session 2** | Gõ chuỗi ký tự ngẫu nhiên (`x7Kp2mN9bT`, `P@ssw0rd123!`...) | 1.5-2 phút |
| **Session 3** | Gõ tự do (chat, email, code...) | 1.5-2 phút |

**Đoạn văn mẫu Session 1:**
> "Trường Đại học Công Nghệ Hutech là một trong những trường đại học hàng đầu Việt Nam về đào tạo và nghiên cứu trong lĩnh vực công nghệ thông tin và truyền thông."

### 4.5 Phân phối cho người tham gia

Gói `package/` chứa 3 file tối giản:
1. `kds_guard.exe` — chạy trực tiếp, không cần cài đặt
2. `thu_thap.bat` — double-click, tự hướng dẫn từng bước
3. `HUONGDAN.md` — hướng dẫn chi tiết

Người tham gia chỉ cần: **Giải nén → Double-click `thu_thap.bat` → Gõ theo hướng dẫn → Gửi lại thư mục `data/`**

### 4.6 Metadata ghi kèm mỗi session

| Trường | Ví dụ | Mục đích |
|--------|-------|---------|
| `user_id` | `le_hiep_s1` | Định danh ẩn danh |
| `session_id` | `20260308_114203` | Phiên thu thập (timestamp) |
| Loại bàn phím | laptop / cơ / màng | Ảnh hưởng đến hold time |
| Layout | QWERTY / Telex / VNI | Ảnh hưởng đến flight time |

---

## 5. Dữ liệu thực tế đã thu thập

### 5.1 File CSV thô — `data/raw/rust/`

**28 file CSV** thu thập ngày 08/03/2026, từ nhiều người thật:

| User | Sessions | Tổng events | File lớn nhất |
|------|----------|-------------|--------------|
| `test_user` | 1 | ~12 events | 893 bytes |
| `le_hiep` | 3 (s1, s2, s3) | ~750 events | 50KB |
| Nhiều user khác | 2-3 mỗi người | Hàng trăm events | ~146KB |

**Tổng: 28 files, ~730KB raw data**

### 5.2 Mẫu dữ liệu thật (user `le_hiep_s1`)

```csv
timestamp_ms,key_code,event_type,key_class,is_modifier,session_id,user_id
6758.13,ShiftLeft,down,modifier,true,20260308_114203,le_hiep_s1
6910.03,MetaLeft,down,modifier,true,20260308_114203,le_hiep_s1
7118.15,KeyS,down,alpha,false,20260308_114203,le_hiep_s1
7269.72,KeyS,up,alpha,false,20260308_114203,le_hiep_s1
13294.48,KeyT,down,alpha,false,20260308_114203,le_hiep_s1
13366.33,KeyR,down,alpha,false,20260308_114203,le_hiep_s1
13397.75,KeyT,up,alpha,false,20260308_114203,le_hiep_s1
```

**Quan sát từ dữ liệu thật:**
- Flight time (T→R): `13366 - 13294 = 72ms` — gõ nhanh vừa
- Hold time (T): `13397 - 13294 = 103ms` — giữ phím bình thường
- Có overlap: R nhấn (13366) trước T nhả (13397) → gõ tự nhiên, ngón chồng
- CapsLock lặp nhiều → người dùng gõ tiếng Việt bằng CapsLock thay Shift

### 5.3 Dataset đã xử lý — `data/`

| File | Kích thước | Nội dung |
|------|-----------|---------|
| `features_dataset.csv` | 5.7MB | **21,035 mẫu** (feature vectors đã trích xuất) |
| `features_cmu.csv` | 5.9MB | Features từ CMU Keystroke Dynamics Dataset (51+ users) |
| `features_injection.csv` | 91KB | Features từ mẫu BadUSB mô phỏng |
| `features_self_collected.csv` | 777B | Features từ dữ liệu tự thu thập |
| `keystroke_log_demo.csv` | 1.9MB | Raw log dùng cho demo |

### 5.4 Nguồn dữ liệu tổng hợp

```
features_dataset.csv (21,035 mẫu)
├── Nguồn 1: CMU Dataset (51+ users) → 20,803 mẫu normal
├── Nguồn 2: Tự thu thập (data/raw/rust/) → bổ sung
└── Nguồn 3: simulate_injection.py → 232 mẫu attack
```

---

## 6. Bước 3 — Ghép cặp phím (Key Pairing)

Trước khi trích đặc trưng, hệ thống **ghép sự kiện down và up** thành từng cặp:

```
KeyEvent(down, KeyH, 1020ms) + KeyEvent(up, KeyH, 1100ms)
                    ↓
           KeyPair {
               key_code: "KeyH",
               key_class: "alpha",
               is_modifier: false,
               down_time: 1020.0,    ← thời điểm nhấn
               up_time: Some(1100.0) ← thời điểm nhả
           }
```

**Ghép bằng cách**: Khi nhận event `up`, tìm event `down` gần nhất cùng `key_code` chưa có `up_time` (dùng `rposition` — tìm từ cuối lên).

### Từ đây tính ra 2 đại lượng gốc:

| Đại lượng | Công thức | Ý nghĩa |
|-----------|-----------|---------|
| **Hold Time** | `up_time – down_time` | Thời gian ngón tay giữ phím (ms) |
| **Flight Time** | `down_time[i+1] – down_time[i]` | Khoảng cách giữa 2 lần nhấn liên tiếp (ms) |

**Lọc nhiễu**:
- Hold Time: chỉ giữ nếu `0 < ht < 2000ms` (loại phím bị kẹt)
- Flight Time: chỉ giữ nếu `0 < ft < 5000ms` (loại khoảng dừng quá dài)

---

## 7. Bước 4 — Trích xuất 22 đặc trưng (`feature.rs`)

### 5.1 Cửa sổ trượt (Sliding Window)

```
Phím:   [1] [2] [3] ... [38] [39] [40] [41] [42] ...
         └────── Cửa sổ 1 (40 phím) ──────┘
                    └──── Cửa sổ 2 (trượt 20 phím) ────→
```

- **Window size** = 40 phím (mặc định)
- **Slide step** = 20 phím (overlap 50%)
- **Early Warning** = 30 phím (cửa sổ sớm để cảnh báo nhanh)

### 5.2 Bảng 22 đặc trưng

#### Nhóm A: Hold Time (4 đặc trưng)

| # | Đặc trưng | Công thức | Ý nghĩa |
|---|-----------|-----------|---------|
| 1 | `mean_hold_time` | `Σ(ht) / n` | Trung bình thời gian giữ phím |
| 2 | `std_hold_time` | `√(Σ(ht - mean)² / n)` | Độ lệch chuẩn — người thật dao động nhiều |
| 3 | `median_hold_time` | Phân vị 50% | Giá trị trung vị — ít bị ảnh hưởng bởi outlier |
| 4 | `iqr_hold_time` | `Q3 – Q1` | Khoảng liên phân vị — đo độ phân tán |

#### Nhóm B: Flight Time (8 đặc trưng)

| # | Đặc trưng | Công thức | Ý nghĩa |
|---|-----------|-----------|---------|
| 5 | `mean_flight_time` | `Σ(ft) / n` | TB khoảng cách giữa các phím |
| 6 | `std_flight_time` | `√(Σ(ft - mean)² / n)` | Độ dao động flight time |
| 7 | `median_flight_time` | Phân vị 50% | Trung vị flight time |
| 8 | `iqr_flight_time` | `Q3 – Q1` | Độ phân tán flight time |
| 9 | `cv_flight_time` | `std / mean` | **Hệ số biến thiên** — người thật > 0.3, máy < 0.15 |
| 10 | `min_flight_time` | `min(ft)` | Flight time nhỏ nhất — máy có thể < 5ms |
| 11 | `p5_flight_time` | Phân vị 5% | Đuôi dưới phân phối |
| 12 | `p95_flight_time` | Phân vị 95% | Đuôi trên phân phối |

#### Nhóm C: Hành vi tổng hợp (7 đặc trưng)

| # | Đặc trưng | Công thức | Ý nghĩa |
|---|-----------|-----------|---------|
| 13 | `typing_speed` | `num_keys / (window_duration_s)` | Tốc độ gõ (keys/s) |
| 14 | `modifier_ratio` | `modifier_count / total_keys` | Tỷ lệ phím Ctrl/Alt/Shift/Win |
| 15 | `special_ratio` | `special_count / total_keys` | Tỷ lệ phím Esc/Tab/Enter/Delete |
| 16 | `has_burst` | `max_burst ≥ 10 phím liên tục < 50ms` | Có chuỗi phím nhanh liên tục không |
| 17 | `max_burst_length` | Chuỗi dài nhất `ft < 50ms` liên tiếp | Đếm burst dài nhất |
| 18 | `window_start_ms` | Timestamp phím đầu cửa sổ | Mốc bắt đầu cửa sổ |
| 19 | `window_end_ms` | Timestamp phím cuối cửa sổ | Mốc kết thúc cửa sổ |

#### Nhóm D: Injection Fingerprint (3 đặc trưng)

| # | Đặc trưng | Công thức | Ý nghĩa |
|---|-----------|-----------|---------|
| 20 | `inter_command_pause_count` | Số lần `ft > 80ms` ngay sau cụm `ft < 50ms` | Đếm "khoảng nghỉ giữa burst" |
| 21 | `pause_regularity` | CV các khoảng nghỉ (CV = std/mean) | Máy nghỉ đều (CV < 0.3), người nghỉ lộn xộn (CV > 0.5) |
| 22 | `enter_after_burst` | `enter_count / burst_end_count` | Tỷ lệ Enter xuất hiện ngay sau burst — dấu hiệu chạy script từng dòng |

### 5.3 Burst Detection — thuật toán chi tiết

```
flight_times = [15, 20, 18, 22, 15, 12, 120, 18, 20, 15, ...]
                ↑ ──────── burst 1 ──↑    ↑ ── burst 2 ──↑
                < 50ms liên tiếp           < 50ms liên tiếp

Nếu burst liên tục ≥ 10 phím → has_burst = true
max_burst_length = chuỗi dài nhất
```

### 5.4 Injection Fingerprint — thuật toán chi tiết

```
BadUSB payload thường có pattern:

[gõ nhanh 30ms, 25ms, 20ms] → [nghỉ 100ms] → [gõ nhanh 28ms, 22ms] → [Enter] → [nghỉ 100ms] → [gõ nhanh...]
      burst 1                     pause 1            burst 2              ↑          pause 2
                                                                    enter_after

1. Đếm pause_count: mỗi lần chuyển từ "ft < 50ms" sang "ft > 80ms" = 1 pause
2. Tính pause_regularity: CV(pause_1, pause_2, ...) — máy nghỉ đều → CV thấp
3. Tính enter_after_burst: % số lần phím cuối burst là Enter
```

---

## 8. Bước 5 — Phát hiện bất thường (`detector.rs`)

### 6.1 Bảng 8 Detection Rules

Mỗi rule kiểm tra 1 đặc trưng và cộng **trọng số** vào `risk_score`:

| Rule | Điều kiện | Trọng số | Giải thích |
|------|-----------|----------|------------|
| **R1** | `mean_flight_time < 30ms` | +0.30 | Người bình thường TB 100-250ms. < 30ms = máy chắc chắn |
| **R2** | `cv_flight_time < 0.15` | +0.25 | Máy gõ cực đều (CV ≈ 0). Người thật CV ≈ 0.3–0.6 |
| **R3** | `typing_speed > 20 keys/s` **AND** `mean_ft < 50ms` | +0.20~0.35 | Dual condition — tránh false positive người gõ nhanh |
| **R4** | `max_burst_length ≥ 15` | +0.20 | 15+ phím liên tiếp < 50ms = không tự nhiên |
| **R5** | `iqr_hold_time < 5ms` | +0.15 | Thời gian giữ phím quá đều = máy |
| **R6** | `modifier_ratio > 40%` | +0.10 | > 40% phím là Ctrl/Alt/Win = script shortcut |
| **R7** | `min_flight_time < 5ms` | +0.10 | Flight time dưới 5ms = chỉ máy mới làm được |
| **R8** | `pause_count ≥ 2` **AND** `pause_regularity < 0.3` | +0.15~0.25 | Injection fingerprint: nghỉ đều giữa burst + Enter |

### 6.2 Tính Risk Score

```
risk_score = Σ(trọng số các rule bị trigger)

                clamp tối đa 1.0
                      ↓
risk_score ∈ [0.0, 1.0]
```

### 6.3 Phân mức rủi ro

| Risk Score | Mức | Hành động |
|-----------|------|-----------|
| `< 0.1` | 🟢 Normal | Cho phép, không ghi log |
| `0.1 – 0.3` | 🔵 Low | Ghi log, tiếp tục giám sát |
| `0.3 – 0.6` | 🟡 Medium | Hiện cảnh báo Windows notification |
| `0.6 – 0.8` | 🟠 High | Chặn input tối đa 2s + cảnh báo |
| `≥ 0.8` | 🔴 Critical | Chặn input tối đa 5s + cảnh báo (timeout cứng) |

---

## 9. Bước 6 — Phản hồi (`policy.rs` + `response.rs`)

### 7.1 Policy Engine quyết định hành động

| Mức | Hành động |
|-----|-----------|
| Normal | `Allow` — không làm gì |
| Low | `LogOnly` — ghi log chi tiết |
| Medium | `Alert` — hiện MessageBox Windows (có cooldown 5s) |
| High | `SoftBlock` — gọi `BlockInput(TRUE)` tối đa 2s |
| Critical | `Alert` hoặc `Challenge` — popup yêu cầu gõ chuỗi xác minh (VD: "K7X") |

### 7.2 Challenge Mode (nếu bật)

```
Khi Critical:
  1. Hiện popup: "Nhập chuỗi xác minh: K7X"
  2. BadUSB không đọc được popup → không gõ được
  3. Người thật đọc và gõ "K7X" → xác minh thành công → mở khóa
```

---

## 10. Ví dụ minh họa End-to-End

### 8.1 Người gõ bình thường (gõ "hello")

```
Dữ liệu thô:
  KeyH down 0ms → KeyH up 80ms → KeyE down 200ms → KeyE up 290ms → ...

Hold Times:  [80, 90, 85, 75, 95] ms
Flight Times: [200, 180, 220, 170] ms

Đặc trưng:
  mean_hold_time = 85ms
  mean_flight_time = 192.5ms
  cv_flight_time = 0.42
  typing_speed = 5.2 keys/s
  has_burst = false
  iqr_hold_time = 15ms

Rules triggered: 0/8
risk_score = 0.00 → ✅ NORMAL → Allow
```

### 8.2 BadUSB (inject "powershell -c ...")

```
Dữ liệu thô:
  KeyP down 0ms → KeyP up 10ms → KeyO down 20ms → KeyO up 30ms → ...

Hold Times:  [10, 10, 10, 10, 10, ...] ms
Flight Times: [20, 20, 20, 20, 20, ...] ms

Đặc trưng:
  mean_hold_time = 10ms
  mean_flight_time = 20ms
  cv_flight_time = 0.05
  typing_speed = 50 keys/s
  has_burst = true, max_burst = 35
  iqr_hold_time = 0.5ms
  min_flight_time = 18ms
  pause_count = 5, pause_regularity = 0.08, enter_after = 60%

Rules triggered: R1(+0.30) + R2(+0.25) + R3(+0.35) + R4(+0.20) + R5(+0.15) + R7(+0.10) + R8(+0.25)
risk_score = 1.0 (capped) → 🔴 CRITICAL → Block input + Alert
```

---

## 11. Output cuối cùng

### 9.1 File CSV thô
```
data/keystroke_log_20260405_210000.csv
```

### 9.2 Console log (verbose)
```
[14:23:05] 🔴 CRITICAL | score=0.95 | rules=[R1+R2+R3+R4+R5+R8] | speed=50.0kps cv=0.05 ft=20.0ms
```

### 9.3 JSON output (cho WebSocket bridge)
```json
{
  "risk_score": 0.95,
  "risk_level": "CRITICAL",
  "rule_score": 0.95,
  "reasons": ["Flight time trung bình rất thấp: 20.0ms", "..."],
  "features": { "mean_flight_time": 20.0, "cv_flight_time": 0.05, ... }
}
```

### 9.4 Windows Notification
Hiện MessageBox cảnh báo với chi tiết rule + score.

### 9.5 BlockInput
Gọi Windows API `BlockInput(TRUE)` chặn bàn phím + chuột tạm thời (tối đa 5s, timeout cứng).

---

## 12. Tóm tắt

```
Bàn phím
  │
  ▼
[Thu thập thô] → 5 trường: timestamp, key_code, event_type, key_class, is_modifier
  │
  ▼
[Ghép cặp Down-Up] → Tính Hold Time + Flight Time
  │
  ▼
[Cửa sổ 40 phím] → Trích xuất 22 đặc trưng (4 HT + 8 FT + 7 Behavior + 3 Injection FP)
  │
  ▼
[8 Detection Rules] → Chấm điểm 0.0 – 1.0
  │
  ▼
[Phân mức] → Normal / Low / Medium / High / Critical
  │
  ▼
[Phản hồi] → Allow / Log / Alert / Block / Challenge
```

---

*KDS Guard – Đồ án Cơ sở 2026*
