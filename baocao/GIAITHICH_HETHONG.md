# GIẢI THÍCH CÁCH HỆ THỐNG KDS GUARD HOẠT ĐỘNG

> Tài liệu giải thích chi tiết từng bước: thu thập → trích xuất → phát hiện → ngăn chặn

---

## 1. Ý TƯỞNG CỐT LÕI — TẠI SAO CÓ THỂ PHÁT HIỆN ĐƯỢC BADUSB?

Khi bạn cắm một thiết bị BadUSB (ví dụ Rubber Ducky) vào máy tính, nó tự nhận mình là bàn phím rồi **gõ tự động** các lệnh nguy hiểm. Nhưng cái cách nó "gõ" khác hoàn toàn so với con người:

| Đặc điểm | Người thật | BadUSB |
|-----------|-----------|--------|
| Tốc độ gõ | 3–8 phím/giây | 20–200 phím/giây |
| Nhịp gõ | Lung tung, không đều | Rất đều, như máy đếm nhịp |
| Thời gian giữ phím | Dao động nhiều (80–200ms) | Cố định (5–15ms) |
| Gõ sai/xóa | Thường xuyên gõ nhầm | Không bao giờ sai |
| Phím đặc biệt | Ít dùng Ctrl/Alt/Win | Dùng rất nhiều (Win+R, Ctrl+C...) |
| Tạm dừng | Hay dừng để suy nghĩ | Không dừng, gõ liên tục |

**Ý tưởng:** Hệ thống theo dõi **thời gian** của mỗi lần nhấn/thả phím, tính ra các con số mô tả "kiểu gõ", rồi dùng các con số đó để phân biệt. Nếu kiểu gõ giống máy → cảnh báo.

---

## 2. TỔNG QUAN LUỒNG XỬ LÝ

Hệ thống hoạt động theo 5 bước nối tiếp nhau:

```
Bước 1          Bước 2          Bước 3          Bước 4          Bước 5
Bắt phím   →   Ghi log    →   Tính feature  →  Chấm điểm  →  Phản ứng
(Collector)     (Logger)       (Extractor)      (Detector)     (Policy)

Mỗi khi bạn nhấn/thả phím → hệ thống chạy cả 5 bước này
```

Tất cả xảy ra **gần như tức thì** trong khi bạn đang gõ.

---

## 3. BƯỚC 1 — THU THẬP SỰ KIỆN BÀN PHÍM (Collector)

**File:** `kds_guard/src/input_capture.rs`

### Tool thu thập cái gì?

Mỗi khi bạn **nhấn một phím xuống** hoặc **thả phím ra**, hệ thống ghi lại **5 thông tin**:

| Thông tin | Ý nghĩa | Ví dụ |
|-----------|---------|-------|
| `timestamp_ms` | Thời điểm xảy ra (mili giây) | `1523.45` |
| `key_code` | Phím nào | `KeyA`, `Space`, `ControlLeft` |
| `event_type` | Nhấn xuống hay thả ra | `down` hoặc `up` |
| `key_class` | Phân loại phím | `alpha`, `digit`, `modifier`, `special` |
| `is_modifier` | Có phải phím điều khiển không | `true` (Ctrl, Alt, Shift, Win) / `false` |

### Dữ liệu thô trông như thế nào?

Giả sử bạn gõ chữ "ab":

```
timestamp_ms,  key_code,  event_type,  key_class,  is_modifier
1000.00,       KeyA,      down,        alpha,      false        ← nhấn phím A
1085.20,       KeyA,      up,          alpha,      false        ← thả phím A
1150.50,       KeyB,      down,        alpha,      false        ← nhấn phím B
1230.80,       KeyB,      up,          alpha,      false        ← thả phím B
```

### Cách phân loại phím

Hệ thống chia phím thành 7 nhóm:

| Nhóm | Gồm những phím | Tại sao cần phân loại |
|------|----------------|----------------------|
| **alpha** | A-Z, Space | Phím gõ chữ bình thường |
| **digit** | 0-9 | Phím số |
| **modifier** | Ctrl, Alt, Shift, Win | BadUSB hay dùng rất nhiều |
| **special** | Esc, Tab, Enter, Delete, Backspace | BadUSB hay dùng để chạy lệnh |
| **function** | F1-F12 | Phím chức năng |
| **navigation** | Mũi tên lên/xuống/trái/phải | Phím di chuyển |
| **other** | Còn lại | Các phím khác |

### Timestamp hoạt động thế nào?

Hệ thống dùng **đồng hồ đơn điệu** (monotonic clock) — đồng hồ chỉ chạy tiến, không bao giờ nhảy lùi. Khi tool bắt đầu chạy, đồng hồ bắt đầu đếm từ 0. Mỗi event được ghi lại đã trôi qua bao nhiêu mili giây kể từ lúc bắt đầu.

**Tại sao dùng đồng hồ đơn điệu?** Vì đồng hồ hệ thống (giờ thực) có thể bị thay đổi (do đồng bộ NTP chẳng hạn), còn đồng hồ đơn điệu thì không → tính toán thời gian chính xác hơn.

---

## 4. BƯỚC 2 — GHI LOG (Logger)

**File:** `kds_guard/src/logger.rs`

Sau khi bắt được event, hệ thống ghi ngay vào file CSV. Mục đích:
- **Lưu dữ liệu** để phân tích sau (offline)
- **Tạo dataset** cho việc huấn luyện mô hình học máy
- **Làm bằng chứng** khi cần xem lại lịch sử

### Bảo vệ quyền riêng tư

Hệ thống có 2 chế độ:
- **Chế độ đầy đủ** (`--log-keys`): ghi cả tên phím → dùng khi tự test
- **Chế độ ẩn danh** (mặc định): chỉ ghi loại phím (alpha/digit/...), **không ghi phím cụ thể** → không biết bạn gõ chữ gì, chỉ biết thời gian

Ví dụ chế độ ẩn danh: thay vì ghi `KeyA` thì chỉ ghi `alpha`. Người đọc file không biết bạn gõ gì, chỉ biết bạn gõ một phím chữ cái vào lúc nào.

---

## 5. BƯỚC 3 — TRÍCH XUẤT ĐẶC TRƯNG (Feature Extraction)

**File:** `kds_guard/src/feature.rs`

Đây là **bước quan trọng nhất**. Từ dữ liệu thô (danh sách nhấn/thả phím), hệ thống tính ra **16 con số** mô tả "kiểu gõ" trong một khoảng thời gian.

### 5.1 Ghép cặp phím

Trước tiên, hệ thống ghép mỗi lần "nhấn xuống" với lần "thả ra" tương ứng:

```
Phím A nhấn lúc 1000ms  ←┐
                          ├── Cặp phím A: giữ 85.2ms
Phím A thả lúc 1085.2ms ←┘

Phím B nhấn lúc 1150.5ms ←┐
                           ├── Cặp phím B: giữ 80.3ms
Phím B thả lúc 1230.8ms  ←┘
```

### 5.2 Hai đại lượng thời gian cốt lõi

**Hold Time (thời gian giữ phím):**

```
Hold Time = lúc thả phím - lúc nhấn phím

Ví dụ phím A: 1085.2 - 1000.0 = 85.2ms
```

Giải thích: khi bạn nhấn phím A, ngón tay đè xuống một lúc rồi mới nhấc lên. Khoảng thời gian đè đó là hold time. Người thật hold time dao động (lúc nhanh lúc chậm), máy thì hold time gần như cố định.

**Flight Time (thời gian giữa 2 phím liên tiếp):**

```
Flight Time = lúc nhấn phím sau - lúc nhấn phím trước

Ví dụ A → B: 1150.5 - 1000.0 = 150.5ms
```

Giải thích: khoảng thời gian từ lúc bạn nhấn phím này đến lúc nhấn phím kế tiếp. Người thật flight time rất lung tung (có lúc gõ nhanh, có lúc dừng suy nghĩ), máy thì flight time rất đều.

### 5.3 Cửa sổ trượt (Sliding Window)

Hệ thống không tính trên toàn bộ dữ liệu mà **chia thành từng cửa sổ nhỏ** — mỗi cửa sổ chứa khoảng 40 phím.

```
Cửa sổ 1: phím 1  → phím 40    ← tính 16 feature
Cửa sổ 2: phím 21 → phím 60    ← tính 16 feature (trượt 20 phím)
Cửa sổ 3: phím 41 → phím 80    ← tính 16 feature (trượt thêm 20)
...
```

**Tại sao làm vậy?**
- Nếu đợi gõ hết rồi mới phân tích → phát hiện quá chậm, BadUSB đã chạy xong lệnh
- 40 phím ≈ 2-5 giây gõ bình thường → đủ dữ liệu để tính thống kê tin cậy
- Cửa sổ trượt 20 phím → cứ gõ thêm 20 phím là phân tích lại → phát hiện nhanh

### 5.4 Danh sách 16 đặc trưng

Mỗi cửa sổ 40 phím, hệ thống tính ra **16 con số**:

#### Nhóm 1 — Hold Time (4 feature)

| # | Feature | Ý nghĩa | Người thật | BadUSB |
|---|---------|---------|-----------|--------|
| 1 | `mean_hold_time` | Hold time trung bình | 80–150ms | 5–15ms |
| 2 | `std_hold_time` | Độ lệch chuẩn hold time | 20–50ms | 1–3ms |
| 3 | `median_hold_time` | Giá trị giữa của hold time | 75–140ms | 5–15ms |
| 4 | `iqr_hold_time` | Khoảng tứ phân vị (mức dao động) | 15–60ms | 1–5ms |

**Giải thích đơn giản:**
- **Trung bình** = tổng chia cho số lượng → người giữ phím lâu hơn máy
- **Độ lệch chuẩn** = các giá trị dao động nhiều hay ít → người dao động nhiều, máy rất đều
- **Trung vị** = giá trị ở giữa khi sắp xếp → ít bị ảnh hưởng bởi giá trị quá lớn/nhỏ
- **IQR** = khoảng cách giữa 25% thấp nhất và 25% cao nhất → đo mức dao động, máy thì IQR gần 0

#### Nhóm 2 — Flight Time (8 feature)

| # | Feature | Ý nghĩa | Người thật | BadUSB |
|---|---------|---------|-----------|--------|
| 5 | `mean_flight_time` | Flight time trung bình | 100–250ms | 5–25ms |
| 6 | `std_flight_time` | Độ lệch chuẩn flight time | 40–120ms | 0.5–3ms |
| 7 | `median_flight_time` | Giá trị giữa flight time | 90–200ms | 5–25ms |
| 8 | `iqr_flight_time` | Dao động flight time | 30–100ms | 1–5ms |
| 9 | `p5_flight_time` | Percentile 5% (tốc độ nhanh nhất) | 50–80ms | 3–20ms |
| 10 | `p95_flight_time` | Percentile 95% (tốc độ chậm nhất) | 300–800ms | 25–35ms |
| 11 | `min_flight_time` | Flight time nhỏ nhất | 30–60ms | 1–5ms |
| 12 | `cv_flight_time` | **Hệ số biến thiên** (CV = std/mean) | 0.3–0.8 | 0.02–0.10 |

**CV (Coefficient of Variation)** là feature quan trọng nhất:
- CV = độ lệch chuẩn ÷ trung bình
- Nếu CV cao (0.3–0.8) → nhịp gõ hỗn loạn → **người thật**
- Nếu CV thấp (0.02–0.1) → nhịp gõ đều như metronome → **rất có thể là máy**

**Percentile 5 và 95** là gì?
- p5: "5% số lần gõ nhanh nhất nhanh đến mức nào" → người thật vẫn không đạt tốc độ máy
- p95: "5% số lần gõ chậm nhất chậm đến mức nào" → người thật hay dừng suy nghĩ nên p95 cao lắm, máy thì không

#### Nhóm 3 — Hành vi gõ (4 feature)

| # | Feature | Ý nghĩa | Người thật | BadUSB |
|---|---------|---------|-----------|--------|
| 13 | `typing_speed` | Tốc độ gõ (phím/giây) | 3–8 | 20–200 |
| 14 | `modifier_ratio` | Tỉ lệ phím Ctrl/Alt/Shift/Win | 2–10% | 15–50% |
| 15 | `special_ratio` | Tỉ lệ phím Esc/Tab/Enter/Delete | 1–5% | 10–30% |
| 16 | `max_burst_length` | Chuỗi phím gõ siêu nhanh liên tục dài nhất | 0–5 | 15–40+ |

**Giải thích:**
- **Tốc độ gõ:** người bình thường gõ 3–8 phím/giây, người gõ nhanh nhất cũng khó vượt 15. BadUSB gõ 50–200/giây
- **Tỉ lệ modifier:** BadUSB hay dùng tổ hợp phím (Win+R mở Run, Ctrl+C copy lệnh) nên tỉ lệ phím modifier cao bất thường
- **Burst:** chuỗi phím liên tiếp mà mỗi phím cách nhau dưới 50ms. Người thật khó gõ hơn 5 phím liên tục dưới 50ms, BadUSB thì cả dòng lệnh đều dưới 50ms

---

## 6. BƯỚC 4 — PHÁT HIỆN (Detection)

**File:** `kds_guard/src/detector.rs`

Sau khi có 16 feature, hệ thống chạy **7 luật kiểm tra** để tính **điểm rủi ro** (risk score) từ 0.0 đến 1.0.

### 7 Luật phát hiện

| # | Luật | Điều kiện | Điểm cộng | Tại sao? |
|---|------|----------|-----------|---------|
| 1 | Flight time quá nhanh | mean_flight_time < 30ms | +0.30 | Người không thể gõ nhanh đến mức mỗi phím chỉ cách nhau 30ms |
| 2 | Nhịp gõ quá đều | cv_flight_time < 0.15 | +0.25 | Người thật nhịp gõ lung tung (CV > 0.3), máy rất đều (CV < 0.15) |
| 3 | Tốc độ siêu nhanh | typing_speed > 15 phím/s | +0.20–0.35 | 15 phím/giây là giới hạn con người, vượt quá = không phải người |
| 4 | Burst dài | burst ≥ 15 phím liên tiếp < 50ms | +0.20 | Người không thể gõ 15 phím liên tục mà mỗi phím chỉ cách 50ms |
| 5 | Hold time quá đều | iqr_hold_time < 5ms | +0.15 | Người giữ phím lúc lâu lúc nhanh, IQR < 5ms = giữ đều như robot |
| 6 | Nhiều phím modifier | modifier_ratio > 40% | +0.10 | Gõ bình thường chỉ ~5% là Ctrl/Alt, 40% = đang chạy tổ hợp phím liên tục |
| 7 | Flight time cực nhỏ | min_flight_time < 5ms | +0.10 | 5ms giữa 2 phím = không thể là người |

### Cách tính điểm

Mỗi luật nếu đúng thì cộng thêm điểm. Tổng điểm bị giới hạn tối đa là 1.0.

**Ví dụ — người gõ bình thường:**
```
Luật 1: mean_flight_time = 180ms  → KHÔNG vi phạm → +0
Luật 2: cv_flight_time = 0.45     → KHÔNG vi phạm → +0
Luật 3: typing_speed = 5.5 k/s    → KHÔNG vi phạm → +0
Luật 4: burst = 2 phím             → KHÔNG vi phạm → +0
Luật 5: iqr_hold_time = 35ms      → KHÔNG vi phạm → +0
Luật 6: modifier_ratio = 5%       → KHÔNG vi phạm → +0
Luật 7: min_flight_time = 65ms    → KHÔNG vi phạm → +0

Tổng điểm rủi ro = 0.00 → BÌNH THƯỜNG ✅
```

**Ví dụ — BadUSB tấn công:**
```
Luật 1: mean_flight_time = 20ms   → VI PHẠM → +0.30
Luật 2: cv_flight_time = 0.075    → VI PHẠM → +0.25
Luật 3: typing_speed = 50 k/s     → VI PHẠM → +0.35
Luật 4: burst = 35 phím            → VI PHẠM → +0.20
Luật 5: iqr_hold_time = 2ms       → VI PHẠM → +0.15
Luật 6: modifier_ratio = 10%      → KHÔNG vi phạm → +0
Luật 7: min_flight_time = 2ms     → VI PHẠM → +0.10

Tổng = 1.0 (giới hạn max) → NGUY HIỂM 🔴
```

### 5 Mức rủi ro

| Mức | Điểm | Ý nghĩa |
|-----|------|---------|
| ✅ NORMAL | 0 – 0.1 | Bình thường, không có gì đáng ngờ |
| 🔵 LOW | 0.1 – 0.3 | Hơi lạ nhưng chưa chắc là tấn công |
| 🟡 MEDIUM | 0.3 – 0.6 | Đáng ngờ, cần theo dõi |
| 🟠 HIGH | 0.6 – 0.8 | Rất có thể là tấn công |
| 🔴 CRITICAL | 0.8 – 1.0 | Gần chắc chắn là tấn công |

---

## 7. BƯỚC 5 — PHẢN ỨNG (Policy Engine)

**File:** `kds_guard/src/policy.rs`

Sau khi có mức rủi ro, hệ thống quyết định làm gì:

| Mức rủi ro | Hành động | Giải thích |
|-----------|----------|-----------|
| ✅ NORMAL | **Cho qua** (Allow) | Không làm gì |
| 🔵 LOW | **Ghi log** (LogOnly) | Ghi lại để theo dõi, không thông báo cho người dùng |
| 🟡 MEDIUM | **Cảnh báo** (Alert) | Hiện thông báo: "Phát hiện hành vi gõ phím đáng ngờ!" |
| 🟠 HIGH | **Chặn mềm** (SoftBlock) | Dừng nhận phím trong 2 giây |
| 🔴 CRITICAL | **Yêu cầu xác minh** (Challenge) | Hiện chuỗi 3 ký tự ngẫu nhiên, yêu cầu người dùng gõ lại để chứng minh là người thật |

### Cơ chế Challenge (xác minh người thật)

Khi phát hiện tấn công mức CRITICAL, hệ thống tạo chuỗi 3 ký tự ngẫu nhiên (ví dụ: `A7K`) và yêu cầu người dùng gõ lại. BadUSB không thể thấy được chuỗi này trên màn hình nên không thể gõ đúng → **bị chặn**.

### Cooldown (tránh spam)

Nếu hệ thống liên tục phát hiện → không cảnh báo liên tục mà đợi ít nhất 5 giây giữa các lần cảnh báo. Tránh làm phiền người dùng.

---

## 8. PIPELINE ĐẦY ĐỦ — TỪ NHẤN PHÍM ĐẾN CẢNH BÁO

```
Bạn nhấn phím "A"
        ↓
[input_capture.rs] Bắt được: {timestamp: 1000ms, key: KeyA, type: down, class: alpha}
        ↓
[logger.rs] Ghi vào file CSV
        ↓
[feature.rs] Ghép cặp nhấn/thả → tính hold time
             Khi đủ 40 phím → tính 16 feature
        ↓
[detector.rs] Chạy 7 luật → tính risk score = 0.05
        ↓
[policy.rs] Score 0.05 → NORMAL → Allow (không làm gì)
        ↓
(tiếp tục theo dõi...)


=== Nếu BadUSB cắm vào ===

BadUSB gõ "powershell -exec bypass..." cực nhanh
        ↓
[input_capture.rs] Bắt hàng loạt event: mỗi phím cách nhau 10ms
        ↓
[logger.rs] Ghi vào file CSV
        ↓
[feature.rs] Đủ 40 phím → feature: speed=100k/s, CV=0.05, burst=40
        ↓
[detector.rs] 6/7 luật vi phạm → risk score = 1.0 → CRITICAL
        ↓
[policy.rs] Score 1.0 → CRITICAL → 🔴 CẢNH BÁO + CHẶN!
        ↓
╔══════════════════════════════════════════════════╗
║  🔴 PHÁT HIỆN TẤN CÔNG HID INJECTION!           ║
║  Risk Score: 1.00                                ║
║  • Flight time trung bình rất thấp: 10.0ms       ║
║  • Hệ số biến thiên CV rất thấp: 0.050           ║
║  • Tốc độ gõ bất thường: 100.0 keys/s            ║
║  • Burst pattern: 40 phím liên tiếp < 50ms       ║
╚══════════════════════════════════════════════════╝
```

---

## 9. CÁC CHẾ ĐỘ CHẠY

Hệ thống có 2 chế độ chính:

### Chế độ 1: Chỉ thu thập dữ liệu

```bat
kds_guard.exe --collect-only --log-keys -v
```

- Chỉ bắt phím và ghi vào CSV
- **Không** phân tích hay cảnh báo
- Dùng khi thu thập dữ liệu từ người dùng để tạo dataset

### Chế độ 2: Phát hiện tấn công

```bat
kds_guard.exe --log-keys -v
```

- Bắt phím + ghi log + phân tích + cảnh báo
- Chạy toàn bộ pipeline 5 bước
- Dùng khi muốn bảo vệ máy tính

---

## 10. PHẦN MỞ RỘNG — HỌC MÁY (Machine Learning)

Ngoài 7 luật cố định (rule-based), hệ thống còn có thêm phần học máy bằng Python:

### Tại sao cần học máy?

Rule-based đơn giản nhưng có hạn chế:
- Ngưỡng cố định (30ms, 0.15, 15 k/s...) có thể không phù hợp với mọi người
- BadUSB tinh vi có thể cố tình chạy chậm hơn để tránh bị phát hiện

Học máy **tự tìm pattern** từ dữ liệu, linh hoạt hơn.

### 3 mô hình đã huấn luyện

| Mô hình | Cách hoạt động | Kết quả |
|---------|---------------|---------|
| **Isolation Forest** | Tìm điểm dữ liệu "lạc đàn" — BadUSB nhiều feature bất thường nên dễ bị tách ra | AUC 0.995 |
| **One-Class SVM** | Học vùng "bình thường" từ dữ liệu người thật, nếu nằm ngoài vùng → bất thường | AUC 0.997 |
| **Random Forest** | Phân loại trực tiếp: cho ăn cả dữ liệu người + máy, tự học cách phân biệt | Accuracy 100% |

### Kết hợp Rule + ML (Hybrid)

```
Điểm cuối cùng = 0.6 × điểm_rule + 0.4 × điểm_ML
```

Rule bắt nhanh các trường hợp rõ ràng, ML bắt các trường hợp tinh vi hơn.

---

## 11. TÓM TẮT

```
                    KDS Guard — Cách hoạt động
                    ==========================

  ┌─────────────────────────────────────────────────────────┐
  │  BƯỚC 1: Bắt phím         → Ghi nhận thời gian nhấn/thả│
  │  BƯỚC 2: Ghi log          → Lưu vào CSV (ẩn danh)       │
  │  BƯỚC 3: Tính 16 feature  → Mô tả "kiểu gõ" bằng số    │
  │  BƯỚC 4: Chấm điểm rủi ro → 7 luật, thang 0.0–1.0      │
  │  BƯỚC 5: Phản ứng         → Cho qua / Cảnh báo / Chặn   │
  └─────────────────────────────────────────────────────────┘

  Nguyên lý cốt lõi:
     Người thật gõ     → CHẬM + KHÔNG ĐỀU + HAY SAI
     BadUSB gõ         → NHANH + RẤT ĐỀU + KHÔNG SAI
     → Đo thời gian là phân biệt được
```
