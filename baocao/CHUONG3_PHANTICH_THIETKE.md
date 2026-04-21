# CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

---

## 3.1. Mô hình kiến trúc tổng thể

### 3.1.1. Các thành phần chính của hệ thống

Hệ thống KDS Guard được xây dựng theo kiến trúc **pipeline xử lý sự kiện** (event-driven pipeline), bao gồm 5 thành phần chính hoạt động nối tiếp nhau. Mỗi thành phần đảm nhận một nhiệm vụ riêng biệt, nhận đầu vào từ thành phần trước và chuyển kết quả cho thành phần sau.

**Bảng 3.1 — Các thành phần chính của hệ thống KDS Guard**

| STT | Thành phần | Module (Rust) | Chức năng |
|:---:|------------|---------------|-----------|
| 1 | **Collector** (Thu thập) | `input_capture.rs` | Bắt toàn bộ sự kiện bàn phím từ hệ điều hành thông qua thư viện `rdev`, ghi nhận thời điểm chính xác (millisecond) của mỗi lần nhấn xuống (*key down*) và nhả ra (*key up*). |
| 2 | **Logger** (Ghi log) | `logger.rs` | Lưu trữ dữ liệu sự kiện bàn phím vào file CSV theo thời gian thực. Hỗ trợ hai chế độ: ghi đầy đủ (bao gồm mã phím cụ thể) và ghi ẩn danh (chỉ ghi phân loại phím, bảo vệ quyền riêng tư). |
| 3 | **Feature Extractor** (Trích xuất đặc trưng) | `feature.rs` | Áp dụng kỹ thuật **cửa sổ trượt** (sliding window) với kích thước mặc định 40 phím, trượt mỗi 20 phím. Từ mỗi cửa sổ, trích xuất **22 đặc trưng thống kê** mô tả hành vi gõ phím. |
| 4 | **Detector** (Phát hiện) | `detector.rs` | Áp dụng **8 quy tắc phát hiện** (rule-based detection) lên vector đặc trưng, tính toán **risk score** trong khoảng [0, 1] và phân loại mức độ rủi ro thành 5 cấp: Normal, Low, Medium, High, Critical. |
| 5 | **Policy Engine + Response** (Quyết định & Phản hồi) | `policy.rs`, `response.rs` | Dựa vào mức rủi ro, quyết định hành động phản hồi: cho phép (Allow), ghi log (LogOnly), cảnh báo popup Windows (Alert), chặn input tạm thời (SoftBlock), hoặc yêu cầu xác minh (Challenge). |

Ngoài 5 thành phần lõi bằng Rust, hệ thống còn có các thành phần phụ trợ:

| Thành phần phụ trợ | Công nghệ | Chức năng |
|---------------------|-----------|-----------|
| **WebSocket Bridge** | Python (`ws_bridge.py`) | Nhận JSON output từ Rust engine qua stdout, chuyển tiếp qua WebSocket (port 8765) đến Dashboard. |
| **Dashboard** | React + TypeScript + MUI + ECharts | Giao diện web giám sát thời gian thực: hiển thị risk score, biểu đồ, bảng quy tắc, timeline cảnh báo. |
| **Collector Tool** | Python (`collector_tool/`) | Công cụ thu thập dữ liệu gõ phím từ người tham gia để xây dựng dataset thực nghiệm. |
| **Scripts phân tích** | Python (`scripts/`) | Bộ script hỗ trợ: trích xuất đặc trưng, huấn luyện mô hình ML, đánh giá ngưỡng, mô phỏng tấn công, tạo biểu đồ. |

**Bảng 3.2 — Công nghệ sử dụng**

| Thành phần | Công nghệ | Lý do lựa chọn |
|-----------|-----------|-----------------|
| Engine chính | **Rust 1.70+** | Hiệu năng cao tương đương C/C++, đảm bảo an toàn bộ nhớ (memory safety), phù hợp cho phần mềm system-level chạy nền liên tục. |
| Bắt sự kiện phím | **rdev** (Rust crate) | Thư viện cross-platform cho keyboard capture, sử dụng `SetWindowsHookExW` (WH_KEYBOARD_LL) trên Windows. |
| Chặn input | **winapi** – `BlockInput` API | Gọi trực tiếp Windows API để chặn toàn bộ input bàn phím và chuột, không cần cài driver bổ sung. |
| Thông báo | **winapi** – `MessageBoxW` | Hiển thị popup hệ thống với flag `MB_TOPMOST | MB_SYSTEMMODAL`, luôn hiện trên cùng, không bị đè bởi cửa sổ khác. |
| Dashboard | **React + TypeScript + MUI + ECharts** | Giao diện chuyên nghiệp, thư viện biểu đồ hiệu năng cao, phù hợp hiển thị dữ liệu real-time. |
| Phân tích dữ liệu | **Python 3.9+** (pandas, matplotlib, scikit-learn) | Hệ sinh thái phong phú cho xử lý dữ liệu CSV, thống kê, và huấn luyện mô hình học máy. |

---

### 3.1.2. Sơ đồ luồng hoạt động

Hệ thống KDS Guard hoạt động theo luồng xử lý sự kiện liên tục (event-driven pipeline) với **2 tầng phát hiện chạy song song**: Early Warning Layer (cửa sổ 30 phím) và Main Analysis (cửa sổ 40 phím).

**Luồng xử lý chính:**

```
                 ┌─────────────────────────────────────────┐
                 │       Early Warning Layer (30 phím)     │──→ Cảnh báo sớm (~0.6s)
                 └─────────────────────────────────────────┘
  Keyboard → Collector → Feature Extractor → Detector (8 rules) → Policy → Response
                 │                                                           │
                 └─────── Cửa sổ chính (40 phím) ───────────────────────────┘
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

**Mô tả chi tiết luồng xử lý:**

1. **Thu thập sự kiện bàn phím:** Module `input_capture.rs` sử dụng thư viện `rdev` để đăng ký hook toàn cục (global keyboard hook) trên Windows. Mỗi khi người dùng (hoặc thiết bị USB) nhấn hoặc nhả một phím, hệ thống ghi lại 5 thông tin: `timestamp_ms` (thời điểm chính xác tính bằng millisecond, sử dụng đồng hồ đơn điệu — monotonic clock), `key_code` (mã phím), `event_type` (down/up), `key_class` (phân loại: alpha/digit/modifier/special/function/navigation/other), và `is_modifier` (có phải phím điều khiển Ctrl/Alt/Shift/Win không).

2. **Ghi log:** Module `logger.rs` ghi ngay sự kiện vào file CSV (`data/keystroke_log_<user>_<session>_<timestamp>.csv`). Hỗ trợ chế độ ẩn danh (mặc định) — không ghi mã phím cụ thể, chỉ ghi phân loại phím.

3. **Trích xuất đặc trưng (2 tầng song song):**
   - **Early Warning (30 phím, trượt 15):** Kích hoạt sớm hơn, phát hiện payload BadUSB ngắn trước khi hoàn tất.
   - **Main Analysis (40 phím, trượt 20):** Phân tích chính xác hơn với nhiều dữ liệu hơn, xác nhận kết quả Early Warning.
   
   Mỗi cửa sổ trượt trích xuất 22 đặc trưng thống kê gồm: Hold Time (mean, std, median, IQR), Flight Time (mean, std, median, IQR, CV, p5, p95, min), tốc độ gõ, tỷ lệ modifier/special, burst pattern, và 3 đặc trưng Injection Fingerprint.

4. **Phát hiện bất thường:** Module `detector.rs` chạy 8 quy tắc phát hiện trên vector đặc trưng, tính tổng risk score (giới hạn [0, 1]), và phân loại thành 5 mức rủi ro.

5. **Quyết định và phản hồi:** Module `policy.rs` ánh xạ mức rủi ro thành hành động cụ thể. Module `response.rs` thực thi hành động: gọi `BlockInput` API để chặn input (cần quyền Administrator), hiển thị `MessageBoxW` cảnh báo, hoặc kết hợp cả hai.

**Bảng 3.3 — Thời gian phản hồi của hệ thống**

| Giai đoạn | Thời gian | Ghi chú |
|-----------|:---------:|---------|
| Thu đủ 30 phím (Early Warning, ở 50 keys/s) | ~0.6 giây | Phát hiện sớm nhất |
| Thu đủ 40 phím (Main Analysis, ở 50 keys/s) | ~0.8 giây | Phát hiện chính xác |
| Trích xuất + phân tích 8 rules | < 1 ms | Chỉ phép so sánh số học |
| Gọi BlockInput API | < 1 ms | Windows API trực tiếp |
| **Tổng thời gian phản hồi (Early Warning)** | **~0.6 giây** | Đủ nhanh chặn payload ngắn (30–50 phím) |

---

## 3.2. Xây dựng dữ liệu thực nghiệm cục bộ

### 3.2.1. Mẫu dữ liệu khảo sát từ sinh viên tại HUTECH

Để xây dựng tập dữ liệu (dataset) phản ánh chính xác hành vi gõ phím của người dùng thực tế, nhóm đã tiến hành thu thập dữ liệu từ sinh viên tại Trường Đại học Công nghệ TP.HCM (HUTECH).

#### a) Quy trình thu thập

Công cụ thu thập được đóng gói trong thư mục `collector_tool/`, bao gồm 2 phương thức:

| Phương thức | File chạy | Yêu cầu | Ưu điểm |
|-------------|-----------|----------|---------|
| **Python Collector** (Nguồn 2) | `collector_tool/thu_thap.bat` | Python + `pynput` | Tự động chia 3 session, hiện text gợi ý |
| **Rust Collector** (Nguồn 3) | `collector_tool/thu_thap_rust.bat` | Không cần cài thêm | Hiệu năng cao, nhẹ, portable |

**Quy trình thu thập cho mỗi người tham gia (~7 phút):**

1. **Session 1 (3 phút) — Gõ đoạn văn:** Người tham gia nhìn một đoạn văn mẫu tiếng Việt và gõ lại. Mục đích: thu thập hành vi gõ phím ở chế độ "sao chép", phản ánh tốc độ đọc-gõ bình thường.

2. **Session 2 (2 phút) — Gõ chuỗi ngẫu nhiên:** Người tham gia gõ các chuỗi ký tự ngẫu nhiên bao gồm chữ hoa, chữ thường, số, và ký tự đặc biệt (ví dụ: `x7Kp2mN9bT`, `P@ssw0rd123!`). Mục đích: thu thập hành vi gõ khi cần tập trung cao, chuỗi không quen thuộc.

3. **Session 3 (2 phút) — Gõ tự do:** Người tham gia gõ bất kỳ nội dung nào: chat, email, code, ghi chú... Mục đích: thu thập hành vi gõ phím tự nhiên nhất, phản ánh thói quen cá nhân.

#### b) Cấu trúc dữ liệu thu thập

Mỗi sự kiện bàn phím được ghi thành 1 dòng trong file CSV, với 7 trường thông tin:

```csv
timestamp_ms,key_code,event_type,key_class,is_modifier,session_id,user_id
6758.13,ShiftLeft,down,modifier,true,20260405_210000,nguyen_van_a_s1
7118.15,KeyS,down,alpha,false,20260405_210000,nguyen_van_a_s1
7215.30,KeyS,up,alpha,false,20260405_210000,nguyen_van_a_s1
```

**Giải thích các trường:**

| Trường | Kiểu dữ liệu | Ý nghĩa |
|--------|:------------:|---------|
| `timestamp_ms` | `float` | Thời điểm xảy ra sự kiện, tính bằng millisecond kể từ khi bắt đầu session. Sử dụng đồng hồ đơn điệu (monotonic clock) để đảm bảo tính chính xác, không bị ảnh hưởng bởi đồng bộ thời gian hệ thống. |
| `key_code` | `string` | Mã phím (ví dụ: `KeyA`, `Space`, `ControlLeft`, `Return`). |
| `event_type` | `string` | Loại sự kiện: `down` (nhấn xuống) hoặc `up` (nhả ra). |
| `key_class` | `string` | Phân loại phím: `alpha` (chữ cái + Space), `digit` (số), `modifier` (Ctrl/Alt/Shift/Win), `special` (Esc/Tab/Enter/Delete/Backspace/CapsLock), `function` (F1–F12), `navigation` (mũi tên), `other`. |
| `is_modifier` | `bool` | `true` nếu là phím điều khiển (Ctrl, Alt, Shift, Win), `false` nếu không. |
| `session_id` | `string` | Mã phiên thu thập, định dạng `YYYYMMDD_HHMMSS`. |
| `user_id` | `string` | Mã người dùng ẩn danh (ví dụ: `user_001`, `nguyen_van_a`). |

#### c) Quy mô dataset

**Bảng 3.4 — Thống kê tổng hợp dataset**

| Nguồn dữ liệu | Số mẫu (feature vectors) | Số người dùng | Mô tả |
|----------------|:------------------------:|:-------------:|-------|
| CMU Benchmark (Nguồn 1) | ~20,400 | 51 | Dữ liệu chuẩn keystroke dynamics từ Carnegie Mellon University |
| Sinh viên HUTECH (Nguồn 2, 3) | ~400 | ~10 | Thu thập tự thực hiện, 2–3 sessions/người |
| Mẫu tấn công injection (mô phỏng) | 232 | — | Tạo bằng `simulate_injection.py` và `generate_demo_data.py` |
| **Tổng cộng** | **21,035** | **51+** | **20,803 mẫu người thật + 232 mẫu tấn công** |

#### d) Metadata người tham gia

Với mỗi người tham gia, nhóm ghi nhận các thông tin bổ sung trong file `data/participants.csv`:

| Trường | Mô tả | Giá trị mẫu |
|--------|-------|-------------|
| `user_id` | Mã người dùng | `nguyen_van_a` |
| `keyboard_type` | Loại bàn phím | `laptop` / `mechanical` / `membrane` |
| `layout` | Phương pháp gõ tiếng Việt | `QWERTY+Telex` / `QWERTY+VNI` |
| `experience` | Tốc độ gõ tự đánh giá | `slow` / `average` / `fast` |
| `age_group` | Nhóm tuổi | `18–20` / `20–25` / `25–30` |
| `time_of_day` | Thời điểm thu thập | `morning` / `afternoon` / `evening` |

#### e) Bảo vệ quyền riêng tư

Quy trình thu thập tuân thủ các nguyên tắc bảo vệ dữ liệu cá nhân:

- Người tham gia được thông báo và **đồng ý** trước khi thu thập.
- Sử dụng tên ẩn danh (user_001, nguyen_van_a...).
- Chế độ thu thập mặc định **không ghi nội dung phím cụ thể**, chỉ ghi thời gian và phân loại phím.
- Người tham gia có quyền yêu cầu xóa dữ liệu bất cứ lúc nào.
- File CSV **không được upload** lên repository công khai.

---

### 3.2.2. Tính toán ngưỡng thời gian giữ phím (Dwell Time) và thời gian giữa hai lần nhấn phím (Flight Time)

Hai đại lượng thời gian cốt lõi mà hệ thống sử dụng để phân biệt giữa người thật và thiết bị tiêm phím tự động là **Dwell Time** (thời gian giữ phím, còn gọi là Hold Time) và **Flight Time** (thời gian bay giữa hai phím liên tiếp).

#### a) Định nghĩa và công thức tính

**Dwell Time (Hold Time)** — Thời gian giữ phím:

Là khoảng thời gian từ lúc một phím được nhấn xuống (key down) đến lúc phím đó được nhả ra (key up).

```
Hold Time = t_up(key_i) − t_down(key_i)
```

Ví dụ: Nếu phím A được nhấn xuống tại thời điểm 1000.0 ms và nhả ra tại 1085.2 ms, thì:

```
Hold Time(A) = 1085.2 − 1000.0 = 85.2 ms
```

**Flight Time** — Thời gian bay giữa hai phím liên tiếp:

Là khoảng thời gian từ lúc nhấn phím trước (key down) đến lúc nhấn phím sau (key down). Đây là phương pháp tính **Down-Down interval**.

```
Flight Time = t_down(key_{i+1}) − t_down(key_i)
```

Ví dụ: Nếu phím A nhấn tại 1000.0 ms và phím B nhấn tại 1150.5 ms, thì:

```
Flight Time(A→B) = 1150.5 − 1000.0 = 150.5 ms
```

#### b) Bộ lọc dữ liệu

Trong quá trình tính toán, hệ thống áp dụng bộ lọc để loại bỏ các giá trị bất thường (outliers):

- **Hold Time**: chỉ giữ lại giá trị trong khoảng `(0, 2000)` ms. Giá trị ≤ 0 là lỗi đo, giá trị ≥ 2000 ms (2 giây) là trường hợp người dùng vô tình giữ phím quá lâu, không phản ánh hành vi gõ phím bình thường.
- **Flight Time**: chỉ giữ lại giá trị trong khoảng `(0, 5000)` ms. Giá trị ≥ 5000 ms (5 giây) thường là trường hợp người dùng tạm dừng suy nghĩ giữa các đoạn gõ.

#### c) Các đặc trưng thống kê được trích xuất

Từ tập hợp Hold Time và Flight Time trong mỗi cửa sổ trượt, hệ thống tính toán các đặc trưng thống kê sau:

**Bảng 3.5 — 22 đặc trưng thống kê trích xuất từ mỗi cửa sổ trượt**

| # | Đặc trưng | Công thức / Ý nghĩa | Người thật (TB) | BadUSB (TB) | Chênh lệch |
|:-:|-----------|---------------------|:---------------:|:-----------:|:-----------:|
| 1 | `mean_hold_time` | Trung bình cộng của Hold Time | 80–120 ms | 5–15 ms | ~8× |
| 2 | `std_hold_time` | Độ lệch chuẩn của Hold Time | 20–40 ms | 0.5–2 ms | ~20× |
| 3 | `median_hold_time` | Trung vị của Hold Time | 75–110 ms | 5–15 ms | ~8× |
| 4 | `iqr_hold_time` | IQR = Q3 − Q1 của Hold Time | 20–50 ms | 1–3 ms | **19.3×** |
| 5 | `mean_flight_time` | Trung bình cộng của Flight Time | 120–300 ms | 10–25 ms | **7.7×** |
| 6 | `std_flight_time` | Độ lệch chuẩn của Flight Time | 50–120 ms | 0.5–3 ms | ~40× |
| 7 | `median_flight_time` | Trung vị của Flight Time | 100–250 ms | 10–25 ms | ~10× |
| 8 | `iqr_flight_time` | IQR = Q3 − Q1 của Flight Time | 30–80 ms | 1–5 ms | ~16× |
| 9 | `cv_flight_time` | CV = std / mean (hệ số biến thiên) | 0.3–0.6 | < 0.15 | **5.6×** |
| 10 | `typing_speed` | Số phím / thời gian cửa sổ (keys/s) | 3–10 | 30–100 | **10.4×** |
| 11 | `modifier_ratio` | Tỷ lệ phím modifier / tổng phím | 3–8% | 10–60% | ~5× |
| 12 | `special_ratio` | Tỷ lệ phím special / tổng phím | 1–5% | 5–20% | ~4× |
| 13 | `has_burst` | Có chuỗi gõ nhanh liên tiếp? (bool) | false | true | — |
| 14 | `max_burst_length` | Số phím liên tiếp có Flight Time < 50ms | 0–3 | 15–200+ | **∞** |
| 15 | `min_flight_time` | Flight Time nhỏ nhất trong cửa sổ | 40–80 ms | 1–5 ms | ~16× |
| 16 | `p5_flight_time` | Percentile 5% của Flight Time | 50–90 ms | 5–20 ms | ~5× |
| 17 | `p95_flight_time` | Percentile 95% của Flight Time | 300–500 ms | 20–30 ms | ~15× |
| 18 | `window_start_ms` | Thời điểm bắt đầu cửa sổ | — | — | — |
| 19 | `window_end_ms` | Thời điểm kết thúc cửa sổ | — | — | — |
| 20 | `inter_command_pause_count` | Số khoảng nghỉ > 80ms nằm giữa 2 burst | 0 | 3–10 | — |
| 21 | `pause_regularity` | CV của khoảng nghỉ giữa các burst | > 0.5 | < 0.15 | — |
| 22 | `enter_after_burst` | Tỷ lệ Enter xuất hiện ngay sau burst | 0% | 40–80% | — |

*Ghi chú: Đặc trưng 20–22 thuộc nhóm **Injection Fingerprint** — phát hiện dấu vân tay đặc trưng của script injection.*

#### d) Cơ sở lý thuyết cho ngưỡng phân biệt

Các ngưỡng phân biệt giữa người thật và BadUSB được xác định dựa trên hai cơ sở:

**Cơ sở 1 — Giới hạn sinh lý học con người:**

- **Flight Time tối thiểu ~50–60 ms:** Nghiên cứu về tốc độ xử lý thần kinh cho thấy thời gian phản ứng khoảng cách giữa hai lần nhấn phím (inter-key interval) tối thiểu của con người vào khoảng 50–60 ms. Hệ thống đặt ngưỡng **30 ms** để có biên an toàn, tránh false positive với người gõ rất nhanh.

- **Tốc độ gõ tối đa ~12.5 ký tự/giây:** Kỷ lục gõ phím thế giới đạt khoảng 750 CPM (characters per minute), tương đương ~12.5 ký tự/giây. Hệ thống đặt ngưỡng **20 keys/s** kết hợp điều kiện `mean_flight_time < 50ms` để giảm false positive.

- **Hệ số biến thiên CV > 0.2:** Nghiên cứu về Keystroke Dynamics chỉ ra rằng hệ số biến thiên (CV) của nhịp gõ người bình thường luôn > 0.2, do tính biến thiên tự nhiên của hệ thần kinh vận động. Hệ thống đặt ngưỡng **CV < 0.15** cho phát hiện bất thường.

**Cơ sở 2 — Phân tích dữ liệu thực nghiệm (21,035 mẫu):**

**Bảng 3.6 — So sánh thực tế giữa người thật và BadUSB**

| Chỉ số | Người gõ bình thường (TB) | BadUSB (TB) | Chênh lệch |
|--------|:------------------------:|:-----------:|:-----------:|
| `mean_flight_time` | 154.2 ms | 20 ms | **7.7×** |
| `cv_flight_time` | 0.42 | 0.075 | **5.6×** |
| `typing_speed` | 4.8 keys/s | 50 keys/s | **10.4×** |
| `max_burst_length` | 0 phím | 35 phím | **∞** |
| `iqr_hold_time` | 38.5 ms | 2 ms | **19.3×** |

> **Nhận xét:** Sự khác biệt giữa người thật và BadUSB là rất lớn (5–20 lần) trên tất cả các đặc trưng quan trọng. Điều này cho thấy phương pháp rule-based với ngưỡng cố định đã đủ hiệu quả để phát hiện tấn công, chưa cần thiết phải sử dụng mô hình học máy phức tạp.

---

## 3.3. Thiết kế phần mềm giám sát bộ đệm phím bằng Rust

### a) Kiến trúc module

Phần mềm KDS Guard engine được viết hoàn toàn bằng ngôn ngữ Rust, bao gồm 7 module nằm trong thư mục `kds_guard/src/`:

```
kds_guard/src/
├── main.rs            # Entry point, vòng lặp xử lý chính, Early Warning Layer
├── input_capture.rs   # Thu thập sự kiện bàn phím (rdev + Windows Hook)
├── feature.rs         # Trích xuất 22 đặc trưng từ cửa sổ trượt
├── detector.rs        # 8 quy tắc phát hiện, tính risk score
├── policy.rs          # Quyết định hành động theo mức rủi ro
├── response.rs        # BlockInput API + MessageBox notification
└── logger.rs          # Ghi dữ liệu ra file CSV
```

**Bảng 3.7 — Chi tiết các module Rust**

| Module | Dòng code | Chức năng chính | Thư viện bên ngoài |
|--------|:---------:|-----------------|---------------------|
| `main.rs` | ~353 | Phân tích tham số CLI (`clap`), khởi tạo pipeline, vòng lặp nhận sự kiện và điều phối xử lý, JSON output cho WebSocket bridge. | `clap`, `chrono`, `serde_json`, `env_logger` |
| `input_capture.rs` | ~143 | Đăng ký global keyboard hook, bắt sự kiện `KeyPress`/`KeyRelease`, phân loại phím thành 7 nhóm, retry tự động khi listener crash (tối đa 5 lần). | `rdev` |
| `feature.rs` | ~389 | Ghép cặp key down/up, tính Hold Time & Flight Time, cửa sổ trượt, tính 22 đặc trưng thống kê (mean, std, median, IQR, CV, percentile, burst, injection fingerprint). | — (pure Rust) |
| `detector.rs` | ~308 | 8 quy tắc phát hiện với ngưỡng cấu hình được, tính risk score tổng hợp (giới hạn [0, 1]), phân loại 5 mức rủi ro. | — (pure Rust) |
| `policy.rs` | ~176 | Ánh xạ risk level → PolicyAction (Allow/LogOnly/Alert/SoftBlock/Challenge), cơ chế cooldown tránh cảnh báo liên tục, Challenge mode tạo chuỗi xác minh ngẫu nhiên. | — (pure Rust) |
| `response.rs` | ~161 | Gọi Windows API `BlockInput(TRUE/FALSE)` để chặn input với timeout cứng, hiển thị `MessageBoxW` cảnh báo trên thread riêng, phân biệt icon theo mức rủi ro. | `winapi` |
| `logger.rs` | ~150 | Ghi sự kiện vào file CSV, hỗ trợ chế độ ẩn danh và đầy đủ, tự tạo file mới theo session. | `csv`, `chrono` |

### b) Module thu thập sự kiện — `input_capture.rs`

Module này chịu trách nhiệm bắt **toàn bộ sự kiện bàn phím** trên hệ thống Windows thông qua thư viện `rdev`:

- **Hook toàn cục:** Sử dụng hàm `rdev::listen()` để đăng ký callback nhận sự kiện `EventType::KeyPress` và `EventType::KeyRelease`. Trên Windows, `rdev` sử dụng API `SetWindowsHookExW` với hook type `WH_KEYBOARD_LL` (low-level keyboard hook) để bắt mọi sự kiện bàn phím trước khi chúng đến ứng dụng đích.

- **Timestamp chính xác:** Sử dụng `std::time::Instant` (đồng hồ đơn điệu — monotonic clock) thay vì đồng hồ hệ thống. Đồng hồ đơn điệu chỉ chạy tiến, không bao giờ nhảy lùi, đảm bảo tính chính xác của phép tính thời gian giữa các sự kiện, không bị ảnh hưởng bởi đồng bộ NTP.

- **Phân loại phím:** Mỗi phím được phân loại thành 1 trong 7 nhóm: `alpha` (A–Z, Space), `digit` (0–9), `modifier` (Ctrl, Alt, Shift, Win), `special` (Esc, Tab, Enter, Delete, Backspace, CapsLock), `function` (F1–F12), `navigation` (mũi tên), `other`.

- **Cơ chế tự phục hồi:** Nếu listener crash, module tự restart sau 500ms, tối đa 5 lần thử, đảm bảo hệ thống luôn hoạt động liên tục.

### c) Module trích xuất đặc trưng — `feature.rs`

**Cửa sổ trượt (Sliding Window):**

Hệ thống sử dụng kỹ thuật cửa sổ trượt với 2 tầng:

| Tầng | Kích thước cửa sổ | Bước trượt | Mục đích |
|------|:-----------------:|:----------:|---------|
| **Early Warning** | 30 phím | 15 phím | Phát hiện nhanh payload ngắn (~0.6s) |
| **Main Analysis** | 40 phím (mặc định, `-w`) | 20 phím (mặc định, `-s`) | Phát hiện chính xác, xác nhận kết quả |

**Quy trình ghép cặp phím (Key Pairing):**

1. Khi nhận sự kiện `down`, tạo `KeyPair` mới với `down_time` = timestamp, `up_time = None`, thêm vào danh sách `pending_downs`.
2. Khi nhận sự kiện `up`, tìm `KeyPair` tương ứng (cùng `key_code`, chưa có `up_time`), cập nhật `up_time`, chuyển vào hàng đợi `completed_pairs`.
3. Khi `completed_pairs` đạt đủ `window_size` và đã tích lũy đủ `slide_step` phím mới → kích hoạt trích xuất đặc trưng.

**Phát hiện Burst (Chuỗi gõ nhanh):**

Burst được định nghĩa là chuỗi phím liên tiếp có Flight Time < 50ms (cấu hình qua `burst_threshold_ms`). Hệ thống quét qua danh sách Flight Time, đếm chuỗi liên tiếp dài nhất thỏa điều kiện. Ngưỡng phát hiện: burst ≥ 10 phím liên tiếp (cấu hình qua `burst_min_keys`).

**Phát hiện Injection Fingerprint (Dấu vân tay injection):**

Nhóm 3 đặc trưng mới được thiết kế đặc biệt để phát hiện pattern đặc trưng của script injection — payload BadUSB thường có cấu trúc: *gõ nhanh cụm lệnh → nghỉ đều ~100ms → gõ nhanh cụm tiếp → Enter*. Cụ thể:

1. **`inter_command_pause_count`**: Đếm số lần có khoảng nghỉ > 80ms **nằm giữa 2 cụm gõ nhanh** (burst → nghỉ → burst). Điều kiện: Flight Time trước khoảng nghỉ < 50ms (đang trong burst), Flight Time tại khoảng nghỉ ≥ 80ms. Người bình thường không tạo burst nên dù dừng nghỉ cũng không thỏa điều kiện.

2. **`pause_regularity`**: Hệ số biến thiên (CV) của các khoảng nghỉ giữa burst. Máy nghỉ đều (CV < 0.15), người nghỉ không đều (CV > 0.5). Chỉ tính khi có ≥ 3 khoảng nghỉ để đảm bảo ý nghĩa thống kê (2 điểm dữ liệu không đủ tin cậy).

3. **`enter_after_burst`**: Tỷ lệ phím Enter xuất hiện ngay tại cuối burst — dấu hiệu đang chạy script từng dòng lệnh. Tính bằng: số lần Enter ở cuối burst / tổng số lần kết thúc burst.

### d) Tham số dòng lệnh (CLI)

Hệ thống hỗ trợ cấu hình linh hoạt qua tham số dòng lệnh:

| Tham số | Mặc định | Mô tả |
|---------|:--------:|-------|
| `-w` (window size) | 40 | Kích thước cửa sổ phân tích (số phím) |
| `-s` (slide step) | 20 | Bước trượt cửa sổ |
| `-u` (user id) | `anonymous` | ID người dùng |
| `-o` (output dir) | `data` | Thư mục output cho file log |
| `-d` (duration) | 0 | Thời gian chạy (giây, 0 = vô hạn) |
| `-v` (verbose) | false | Chế độ log chi tiết |
| `--collect-only` | false | Chỉ thu thập, không detect |
| `--log-keys` | false | Ghi key_code chi tiết (tắt mặc định để bảo vệ quyền riêng tư) |
| `--json-output` | false | Xuất JSON ra stdout cho WebSocket bridge |

Ví dụ lệnh chạy:

```bat
:: Chế độ phát hiện (cần quyền Administrator cho BlockInput)
kds_guard.exe -w 40 -s 20 -u user_001

:: Chế độ thu thập dữ liệu
kds_guard.exe --collect-only --log-keys -d 60 -u user_001

:: Chế độ real-time dashboard
kds_guard.exe --json-output -w 40 -s 20 | python ws_bridge.py
```

---

## 3.4. Thiết kế logic phân tích và ra quyết định

### 3.4.1. Cơ chế so khớp chuỗi lệnh độc hại

Hệ thống KDS Guard **không sử dụng** phương pháp so khớp chuỗi lệnh độc hại truyền thống (signature-based detection) như antivirus. Lý do:

- BadUSB gõ ra các **lệnh Windows hợp lệ** (ví dụ: `powershell`, `cmd`, `net user`...) — không phải virus hay malware.
- Danh sách đen (blacklist) lệnh sẽ luôn bị lỗi thời khi kẻ tấn công sử dụng lệnh mới hoặc mã hóa payload.
- VID:PID (Vendor ID : Product ID) của thiết bị USB có thể bị giả mạo (spoof) dễ dàng.

Thay vào đó, hệ thống sử dụng **phân tích hành vi** (behavioral analysis) — phát hiện dựa trên **cách gõ** chứ không phải **nội dung gõ**. Cụ thể, hệ thống áp dụng bộ **8 quy tắc phát hiện** (detection rules) dựa trên đặc trưng thống kê của hành vi gõ phím.

**Bảng 3.8 — Bộ 8 quy tắc phát hiện**

| Rule | Tên quy tắc | Điều kiện kích hoạt | Trọng số (điểm tối đa) | Cơ sở khoa học |
|:----:|-------------|---------------------|:----------------------:|----------------|
| **R1** | Flight Time thấp | `mean_flight_time < 30ms` | **+0.30** | Con người không thể gõ 2 phím cách nhau < 30ms liên tục. BadUSB gõ với delay cố định 10–20ms. |
| **R2** | CV thấp | `cv_flight_time < 0.15` | **+0.25** | Con người có nhịp gõ biến thiên tự nhiên (CV 0.3–0.6). Máy gõ đều → CV gần 0. |
| **R3** | Tốc độ vượt ngưỡng | `typing_speed > 20 keys/s` **AND** `mean_flight_time < 50ms` | **+0.20 ~ 0.35** | Kỷ lục gõ phím thế giới ~12.5 keys/s. Kết hợp thêm điều kiện Flight Time < 50ms để tránh false positive. Điểm cộng tỷ lệ thuận với mức vượt ngưỡng: `min(0.2 × (speed/20), 0.35)`. |
| **R4** | Burst dài | `max_burst_length ≥ 15` phím liên tiếp < 50ms | **+0.20** | Người thường có pause tự nhiên giữa các từ. Script injection gõ không nghỉ. |
| **R5** | Hold Time đều | `iqr_hold_time < 5ms` | **+0.15** | Người nhấn giữ phím với thời gian khác nhau (IQR 20–50ms). Máy nhấn-thả cực nhanh, đều (IQR < 5ms). |
| **R6** | Modifier ratio cao | `modifier_ratio > 40%` | **+0.10** | Payload thường dùng nhiều tổ hợp phím (Win+R, Ctrl+C...). Gõ bình thường chỉ ~5% modifier. |
| **R7** | Min Flight Time cực thấp | `min_flight_time < 5ms` | **+0.10** | Dưới 5ms giữa 2 phím gần như không thể là con người. |
| **R8** | Injection Fingerprint | `inter_command_pause_count ≥ 3` **AND** `pause_regularity < 0.3` | **+0.15 ~ 0.25** | Khoảng nghỉ đều đặn giữa 2 burst + Enter sau burst = script chạy từng dòng lệnh. Cộng thêm +0.10 nếu `enter_after_burst > 0.3`. |

**Công thức tính Risk Score:**

```
rule_score = Σ(contribution của các rule bị kích hoạt)
rule_score = min(rule_score, 1.0)           # Giới hạn tối đa 1.0

risk_score = rule_weight × rule_score       # rule_weight = 1.0 (hiện tại)
```

> **Tổng trọng số tối đa khi tất cả 8 rules kích hoạt: 1.70 → giới hạn ở 1.0.**

**Hiệu quả của từng rule (đánh giá trên 232 mẫu tấn công):**

| Rule | Tên | Tỷ lệ kích hoạt |
|:----:|-----|:----------------:|
| R2 | CV thấp | **100%** |
| R5 | Hold Time đều | 97.4% |
| R3 | Tốc độ cao | 87.5% |
| R4 | Burst dài | 76.3% |
| R1 | Flight Time thấp | 52.2% |

> **Nhận xét:** Rule R2 (CV thấp) là quy tắc hiệu quả nhất — 100% mẫu tấn công đều kích hoạt. Đây là đặc trưng khó giả mạo nhất, vì để BadUSB qua mặt R2, nó phải thêm jitter ngẫu nhiên vào thời gian giữa các phím, làm giảm đáng kể tốc độ và hiệu quả tấn công.

---

### 3.4.2. Cơ chế đánh giá vi phạm ngưỡng giới hạn sinh học

Từ risk score tổng hợp, hệ thống phân loại thành **5 mức rủi ro** (Risk Level):

**Bảng 3.9 — Phân loại mức rủi ro**

| Risk Score | Mức rủi ro | Ký hiệu | Ý nghĩa |
|:----------:|:----------:|:--------:|---------|
| 0.00 – 0.10 | **NORMAL** | ✅ | Hành vi gõ phím hoàn toàn bình thường, không có quy tắc nào bị vi phạm. |
| 0.10 – 0.30 | **LOW** | 🔵 | Có 1 quy tắc bị vi phạm nhẹ. Có thể do người dùng gõ nhanh bất thường hoặc dùng phím tắt nhiều. Chưa đủ để kết luận là tấn công. |
| 0.30 – 0.60 | **MEDIUM** | 🟡 | Có 2–3 quy tắc bị vi phạm. Hành vi đáng ngờ, cần theo dõi. Một người gõ nhanh bất thường có thể trigger R3 nhưng CV vẫn cao → chỉ đạt LOW, không bị chặn. |
| 0.60 – 0.80 | **HIGH** | 🟠 | Có 3–4 quy tắc bị vi phạm đồng thời. Rất có thể là tấn công HID injection. |
| 0.80 – 1.00 | **CRITICAL** | 🔴 | Hầu hết quy tắc đều vi phạm. Gần chắc chắn là thiết bị tiêm phím tự động (BadUSB). |

**Nguyên tắc thiết kế ngưỡng:**

- **Giảm thiểu False Positive (FP):** Ngưỡng MEDIUM (0.30) được chọn sao cho người gõ bình thường — kể cả người gõ rất nhanh — không đạt đến mức này. Kết quả đánh giá trên 20,803 mẫu người thật: **FPR = 0.0%** (0 false positive).

- **Tối đa hóa True Positive (TP):** Với ngưỡng 0.30, hệ thống phát hiện 229/232 mẫu tấn công → **TPR = 98.7%**. Ba mẫu bị bỏ sót là dạng injection chậm (`badusb_medium`) với tốc độ gõ gần giống người thật.

- **Cần nhiều rules đồng thời:** Để đạt mức HIGH (≥ 0.60), cần ít nhất 3–4 rules kích hoạt đồng thời. Một người gõ nhanh bất thường có thể trigger R3 (+0.20) nhưng CV (R2) vẫn cao, burst (R4) vẫn thấp → chỉ đạt +0.20, ở mức LOW, không bị chặn.

**Bảng 3.10 — Kết quả đánh giá với các ngưỡng khác nhau (21,035 mẫu)**

| Ngưỡng | TP | FP | TN | FN | TPR (Recall) | FPR | F1 |
|:------:|:--:|:--:|:--:|:--:|:------------:|:---:|:--:|
| 0.1 | 232 | 123 | 20,680 | 0 | 100% | 0.6% | 79.0% |
| 0.2 | 232 | 1 | 20,802 | 0 | 100% | 0.0% | 99.8% |
| **0.3** | **229** | **0** | **20,803** | **3** | **98.7%** | **0.0%** | **99.3%** |
| 0.5 | 200 | 0 | 20,803 | 32 | 86.2% | 0.0% | 92.6% |
| 0.8 | 177 | 0 | 20,803 | 55 | 76.3% | 0.0% | 86.6% |

> **Kết luận:** Ngưỡng 0.3 (mức MEDIUM) được chọn làm ngưỡng chính thức vì đạt **cân bằng tối ưu**: phát hiện 98.7% BadUSB với 0% báo nhầm.

---

### 3.4.3. Cơ chế cảnh báo và ngắt kết nối thiết bị

#### a) Ánh xạ mức rủi ro → hành động phản hồi

Module `policy.rs` thực hiện ánh xạ từ mức rủi ro sang hành động cụ thể, được triển khai dưới dạng enum `PolicyAction`:

**Bảng 3.11 — Chính sách phản hồi theo mức rủi ro**

| Mức rủi ro | PolicyAction | Mô tả hành động |
|:----------:|:------------:|-----------------|
| ✅ NORMAL | `Allow` | Không làm gì, tiếp tục giám sát bình thường. |
| 🔵 LOW | `LogOnly` | Ghi log sự kiện kèm risk score và lý do để theo dõi. Không thông báo cho người dùng. |
| 🟡 MEDIUM | `Alert` | Gọi `response::show_windows_notification()` hiển thị popup cảnh báo trên Windows với icon cảnh báo (⚠️), nội dung gồm risk score và các lý do vi phạm. |
| 🟠 HIGH | `SoftBlock` | Chặn toàn bộ input bàn phím + chuột trong tối đa **2 giây** + hiển thị popup cảnh báo với icon lỗi (❌). |
| 🔴 CRITICAL | `SoftBlock` (tăng cường) | Chặn toàn bộ input trong tối đa **5 giây** + hiển thị popup cảnh báo khẩn với thông điệp yêu cầu rút thiết bị USB đáng ngờ. |

#### b) Cơ chế chặn input — BlockInput API

Khi risk score đạt mức HIGH hoặc CRITICAL, hệ thống gọi Windows API `BlockInput(TRUE)` để chặn toàn bộ input từ bàn phím và chuột. Sau thời gian chặn, gọi `BlockInput(FALSE)` để mở lại.

**Cơ chế an toàn:**

| Biện pháp | Mô tả |
|-----------|-------|
| **Timeout cứng tối đa 5 giây** | Dù bất kỳ trường hợp nào (crash, treo), sau tối đa 5 giây, input **luôn được mở lại tự động**. Đảm bảo người dùng không bị khóa hoàn toàn. |
| **Thời gian chặn phân tầng** | HIGH: tối đa 3 giây. CRITICAL: tối đa 10 giây (với `block_duration_ms.max(3000).min(10000)`). |
| **Yêu cầu quyền Administrator** | `BlockInput` API cần quyền Administrator. Nếu không có quyền, hệ thống chỉ hiển thị cảnh báo mà không chặn input — ghi log lỗi `"BlockInput that bai - can quyen Administrator"`. |
| **Chạy trên thread riêng** | `MessageBoxW` được gọi trên thread riêng (`thread::spawn`) để không chặn vòng lặp xử lý chính. |

#### c) Cơ chế cảnh báo popup Windows

Module `response.rs` sử dụng Windows API `MessageBoxW` với các flag:

- `MB_TOPMOST`: Đảm bảo popup luôn hiện trên cùng.
- `MB_SYSTEMMODAL`: Chặn tất cả cửa sổ khác cho đến khi người dùng đóng popup.
- `MB_ICONWARNING` (MEDIUM) hoặc `MB_ICONERROR` (HIGH/CRITICAL): Phân biệt mức độ nghiêm trọng bằng icon.

Nội dung popup bao gồm:
- Risk score (phần trăm).
- Danh sách lý do vi phạm (các quy tắc bị kích hoạt).
- Thời gian chặn input (nếu có).
- Khuyến nghị hành động (ví dụ: "Vui long rut thiet bi USB dang ngo").

#### d) Cơ chế cooldown (tránh cảnh báo liên tục)

Module `policy.rs` triển khai cơ chế cooldown: sau mỗi lần cảnh báo Alert, hệ thống đợi tối thiểu **5 giây** (`alert_cooldown_ms = 5000`) trước khi cảnh báo lần tiếp theo. Nếu trong thời gian cooldown có detection mới, chỉ ghi log, không hiển thị popup — tránh spam cảnh báo làm phiền người dùng.

#### e) Pipeline phản hồi hoàn chỉnh — ví dụ minh họa

**Ví dụ 1: Người gõ bình thường**
```
Gõ phím bình thường → features: speed=5.5 k/s, CV=0.45, burst=2
→ Không rule nào vi phạm → risk_score = 0.00
→ NORMAL → Allow (không làm gì)
→ Tiếp tục giám sát...
```

**Ví dụ 2: BadUSB cắm vào và tấn công**
```
BadUSB gõ "powershell -exec bypass..." cực nhanh
→ features: speed=50 k/s, CV=0.075, burst=35, ft=20ms, IQR=2ms
→ R1(+0.30) + R2(+0.25) + R3(+0.35) + R4(+0.20) + R5(+0.15) + R7(+0.10) = 1.35
→ risk_score = min(1.35, 1.0) = 1.00
→ CRITICAL → SoftBlock (5 giây) + Popup cảnh báo khẩn
→ Input bị chặn hoàn toàn trong 5 giây
→ Hiện popup: "PHAT HIEN TAN CONG HID INJECTION! Risk Score: 100%"
→ Sau 5 giây, input tự động mở lại
```

#### f) JSON Output và kết nối Dashboard

Khi chạy với flag `--json-output`, engine xuất JSON mỗi cửa sổ phân tích ra stdout:

```json
{
  "type": "detection",
  "timestamp": "2026-04-17T21:30:00.123",
  "features": {
    "mean_flight_time": 20.5,
    "cv_flight_time": 0.075,
    "typing_speed": 48.8,
    "max_burst_length": 35,
    ...
  },
  "result": {
    "risk_score": 0.95,
    "rule_score": 0.95,
    "risk_level": "CRITICAL",
    "reasons": ["Flight time trung bình rất thấp: 20.5ms", ...]
  }
}
```

Module `ws_bridge.py` (Python) đọc JSON lines từ stdin, chuyển tiếp qua WebSocket (`ws://localhost:8765`) đến Dashboard React. Dashboard nhận dữ liệu real-time và cập nhật giao diện: biểu đồ risk score, bảng detection rules, gauge chart mức đe dọa, timeline cảnh báo.

```
Rust engine (--json-output)  →  stdout (JSON lines)
                                      ↓
Python ws_bridge.py          →  WebSocket server (port 8765)
                                      ↓
Dashboard (browser)          →  subscribe + update real-time
```
