# KDS Guard – Báo Cáo Dự Án

## 1. Dự án này là gì?

KDS Guard là phần mềm bảo mật chạy trên Windows, có nhiệm vụ phát hiện và ngăn chặn tấn công **BadUSB** – một loại tấn công mà kẻ xấu cắm một thiết bị USB giả dạng bàn phím vào máy tính nạn nhân. Thiết bị này sẽ tự động "gõ" hàng loạt lệnh nguy hiểm với tốc độ siêu nhanh mà người dùng không kịp phản ứng.

KDS Guard giải quyết vấn đề này bằng cách **phân tích cách gõ phím** – con người gõ phím có nhịp điệu tự nhiên, còn máy gõ đều như robot. Phần mềm sẽ phân biệt được hai loại này và chặn lại nếu phát hiện "không phải người đang gõ".

## 2. Vấn đề cần giải quyết

### BadUSB là gì?

Khi bạn cắm một USB vào máy tính, hệ điều hành Windows sẽ tự động nhận diện nó. Nếu USB đó tự xưng là "bàn phím", Windows sẽ tin và cho phép nó gửi phím bấm vào máy – không cần cài driver, không cần xác nhận.

Kẻ tấn công lợi dụng điều này bằng cách lập trình sẵn các lệnh vào USB (ví dụ: mở PowerShell, tải malware, tắt antivirus...). Khi cắm vào, USB sẽ "gõ" toàn bộ lệnh trong vài giây.

### Tại sao antivirus không chặn được?

- Antivirus chặn **phần mềm độc hại**, nhưng BadUSB không phải phần mềm – nó là **phần cứng** giả dạng bàn phím
- Windows không phân biệt được bàn phím thật và bàn phím giả
- Các lệnh BadUSB gõ ra là các lệnh Windows hợp lệ, không phải virus

### Giải pháp của KDS Guard

Thay vì kiểm tra thiết bị USB, KDS Guard kiểm tra **hành vi gõ phím**. Ý tưởng đơn giản:

- Người thật gõ phím: **không đều**, có lúc nhanh lúc chậm, có lúc gõ nhầm
- BadUSB gõ phím: **siêu đều**, siêu nhanh, không bao giờ sai

## 3. Cách hệ thống hoạt động

### Pipeline xử lý

Mỗi lần bạn bấm một phím, hệ thống xử lý qua 5 bước:

```
Bàn phím → [1] Thu thập → [2] Trích đặc trưng → [3] Phát hiện → [4] Quyết định → [5] Phản hồi
```

**Bước 1 – Thu thập (Collector):**
Ghi lại thời điểm chính xác mỗi phím được nhấn xuống và nhả ra. Không ghi nội dung gõ, chỉ ghi thời gian.

**Bước 2 – Trích đặc trưng (Feature Extractor):**
Sau mỗi 40 phím (mặc định, cấu hình được qua `-w`), hệ thống tính toán các con số mô tả "kiểu gõ", ví dụ: gõ nhanh hay chậm, đều hay không đều...

**Bước 3 – Phát hiện (Detector):**
So sánh các con số vừa tính với 8 quy tắc phát hiện. Nếu vi phạm nhiều quy tắc → risk score cao.

**Bước 4 – Quyết định (Policy Engine):**
Dựa vào risk score, quyết định phản hồi: cho qua, cảnh báo, hay chặn.

**Bước 5 – Phản hồi (Response):**
Thực thi: hiện thông báo Windows và/hoặc chặn bàn phím tạm thời.

### Thời gian phản hồi

Hệ thống có **2 tầng phát hiện** chạy song song:

- **Early Warning (30 phím):** Phát hiện sớm trong **~0.6 giây**, đủ nhanh để chặn payload ngắn (30-50 phím) trước khi hoàn tất
- **Cửa sổ chính (40 phím, mặc định):** Phát hiện chính xác hơn trong **~0.8 giây**, xác nhận kết quả Early Warning

## 4. Các đặc trưng phân tích

Hệ thống đo 10 chỉ số từ cách gõ phím, chia 3 nhóm:

### 4.1. Flight Time (Thời gian bay)

Khoảng thời gian từ lúc nhả phím trước đến lúc nhấn phím sau. Người thật thường 80-200ms, BadUSB thường dưới 30ms.

### 4.2. Hold Time (Thời gian giữ phím)

Khoảng thời gian từ lúc nhấn đến lúc nhả một phím. Người thật thường 50-150ms và không đều nhau, BadUSB thường rất đều.

### 4.3. Hệ số biến thiên (CV)

Đo độ "đều" của nhịp gõ. CV = độ lệch chuẩn / trung bình. Người thật có CV > 0.3 (gõ không đều), BadUSB có CV < 0.15 (gõ đều như máy).

### 4.4. Tốc độ gõ

Số phím mỗi giây (keys/s). Người thật hiếm khi vượt 10-12 keys/s, BadUSB có thể đạt 20-500 keys/s. Hệ thống yêu cầu cả hai điều kiện: speed > 20 keys/s **và** mean flight time < 50ms để giảm false positive.

### 4.5. Burst (Chuỗi nhanh)

Phát hiện chuỗi dài phím liên tiếp cách nhau dưới 50ms. Người thật hiếm khi có burst > 5-8 phím, BadUSB thường có burst > 15 phím.

### 4.6. Tỷ lệ phím Modifier

Phần trăm phím Ctrl/Alt/Win/Shift trong cửa sổ. BadUSB thường dùng nhiều phím tổ hợp (Ctrl+R, Win+R...) nên tỷ lệ này cao bất thường.

### 4.7. Độ phân tán Hold Time (IQR)

Đo mức chênh lệch hold time giữa các phím. Người thật có IQR cao (phím nào giữ lâu phím nào giữ nhanh), BadUSB có IQR gần 0 (tất cả phím giữ cùng thời gian).

### 4.8. Injection Fingerprint — Nhóm đặc trưng mới

BadUSB payload thường có pattern đặc trưng: gõ nhanh một cụm lệnh → nghỉ đều ~100ms → gõ nhanh cụm tiếp → Enter. 3 đặc trưng mới:

- **inter_command_pause_count:** Số lần có khoảng nghỉ > 80ms **nằm giữa 2 cụm gõ nhanh** (burst → nghỉ → burst). Không phải mọi khoảng nghỉ đều được đếm — người bình thường dừng suy nghĩ không tạo ra burst trước/sau nên không trigger điều kiện này.
- **pause_regularity:** CV của các khoảng nghỉ giữa burst. Máy nghỉ đều (CV < 0.15), người nghỉ không đều (CV > 0.5).
- **enter_after_burst:** Tỷ lệ Enter xuất hiện ngay sau burst — dấu hiệu đang chạy script từng dòng lệnh.

## 5. Bộ quy tắc phát hiện (8 Rules)

Mỗi quy tắc kiểm tra một đặc trưng, nếu vi phạm sẽ cộng điểm vào risk score:

| # | Quy tắc | Ngưỡng | Điểm tối đa | Ý nghĩa |
|---|---------|--------|-------------|---------|
| 1 | Flight Time thấp | < 30ms | +0.30 | Gõ quá nhanh giữa các phím |
| 2 | CV thấp | < 0.15 | +0.25 | Nhịp gõ đều bất thường |
| 3 | Tốc độ cao | > 20 keys/s + ft < 50ms | +0.35 | Vượt tốc độ con người + flight time thấp |
| 4 | Burst dài | ≥ 15 phím | +0.20 | Chuỗi phím liên tiếp siêu nhanh |
| 5 | Hold Time đều | IQR < 5ms | +0.15 | Giữ phím đều như máy |
| 6 | Modifier nhiều | > 40% | +0.10 | Dùng nhiều phím tổ hợp |
| 7 | Min Flight cực thấp | < 5ms | +0.10 | Có phím gõ gần như đồng thời |
| 8 | Injection Fingerprint | pause_count ≥ 2 + CV < 0.3 | +0.15~0.25 | Khoảng nghỉ đều giữa burst + Enter sau burst |

**Tổng tối đa: 1.70 → giới hạn ở 1.0**

## 6. Mức phản hồi

Dựa vào tổng risk score, hệ thống phản hồi theo 5 mức:

| Risk Score | Mức | Hành động |
|-----------|-----|-----------|
| 0 – 0.10 | Normal | Không làm gì, tiếp tục giám sát |
| 0.10 – 0.30 | Low | Ghi vào log để theo dõi |
| 0.30 – 0.60 | Medium | Hiện cảnh báo popup trên Windows |
| 0.60 – 0.80 | High | Chặn bàn phím tối đa 2 giây + cảnh báo |
| 0.80 – 1.00 | Critical | Chặn bàn phím tối đa 5 giây + cảnh báo |

Khi chặn, hệ thống sử dụng Windows API `BlockInput` để tạm dừng toàn bộ input từ bàn phím và chuột. **Timeout cứng tối đa 5 giây** — dù bất kỳ trường hợp nào, sau 5 giây input luôn được mở lại tự động để tránh khóa người dùng hoàn toàn.

## 7. Cấu trúc mã nguồn

### 7.1. Rust Engine (kds_guard/)

Phần lõi của hệ thống, viết bằng Rust:

| File | Chức năng |
|------|-----------|
| `main.rs` | Điểm khởi chạy, vòng lặp xử lý chính, Early Warning Layer |
| `input_capture.rs` | Bắt sự kiện bàn phím từ hệ điều hành |
| `feature.rs` | Tính toán 22 đặc trưng từ cửa sổ trượt (bao gồm Injection Fingerprint) |
| `detector.rs` | 8 quy tắc phát hiện, tính risk score |
| `policy.rs` | Quyết định hành động (Allow/Log/Alert/Block/Challenge) |
| `response.rs` | Gọi BlockInput API và hiện MessageBox Windows |
| `logger.rs` | Ghi dữ liệu ra file CSV |

### 7.2. Dashboard (kds-guard-dashboard/)

Giao diện web giám sát, viết bằng React + TypeScript:

- Tổng quan hệ thống (system overview)
- Biểu đồ risk score theo thời gian
- Bảng 8 detection rules và trạng thái
- So sánh keystroke metrics
- Gauge chart mức đe dọa
- Timeline hoạt động
- Bảng cảnh báo gần đây
- Log chi tiết sự kiện

### 7.3. Thu thập dữ liệu (collector_tool/)

Tool Python hỗ trợ thu thập dữ liệu gõ phím từ người tham gia để xây dựng dataset.

### 7.4. Scripts phân tích và demo (scripts/)

| Script | Chức năng |
|--------|-----------|
| `simulate_badusb.py` | Mô phỏng BadUSB bằng pyautogui (demo không cần USB thật) |
| `evaluate_thresholds.py` | Tính confusion matrix từ dataset 21,035 mẫu |
| `simulate_injection.py` | Mô phỏng 4 loại injection pattern |
| `evaluate.py` | Đánh giá Rule vs ML vs Hybrid |
| Các script khác | generate_demo_data, feature_extraction, train_model, visualize |

## 8. Công nghệ sử dụng

| Thành phần | Công nghệ | Lý do chọn |
|-----------|-----------|------------|
| Engine chính | Rust | Hiệu năng cao, an toàn bộ nhớ, phù hợp system-level |
| Bắt phím | rdev (Rust) | Cross-platform keyboard capture |
| Chặn input | winapi – BlockInput | Windows API trực tiếp, không cần driver |
| Thông báo | winapi – MessageBoxW | Popup hệ thống, hiện trên mọi cửa sổ |
| Dashboard | React + TypeScript + MUI | Giao diện chuyên nghiệp, charts phong phú |
| Biểu đồ | ECharts | Thư viện chart hiệu năng cao |
| Phân tích | Python (pandas, matplotlib) | Xử lý dữ liệu CSV nhanh |

## 9. Dữ liệu

### Format dữ liệu thu thập

Mỗi sự kiện bàn phím được ghi thành 1 dòng CSV:

```
timestamp_ms, key_code, event_type, key_class, is_modifier, session_id, user_id
1712345678.123, KeyA, down, alpha, False, 20260405_183700, user_001
1712345678.225, KeyA, up, alpha, False, 20260405_183700, user_001
```

- `timestamp_ms`: thời điểm chính xác (millisecond)
- `event_type`: down (nhấn) hoặc up (nhả)
- `key_class`: phân loại phím (alpha/digit/modifier/special/function/navigation)
- Không ghi nội dung phím cụ thể khi tắt `--log-keys` (bảo vệ quyền riêng tư)

### Feature vector (sau khi trích xuất)

Mỗi cửa sổ 40 phím → 1 vector gồm 22 giá trị: mean/std/median/IQR của hold time và flight time, CV, typing speed, modifier ratio, special ratio, burst info, percentiles, injection fingerprint (3 đặc trưng mới).

## 10. Hướng dẫn sử dụng

### Cài đặt

```bash
# Build engine
cd kds_guard
cargo build --release

# Cài dashboard
cd kds-guard-dashboard
npm install
```

### Chạy phát hiện

```bash
# Cần chạy với quyền Administrator (cho BlockInput)
# Click chuột phải → Run as administrator

kds_guard.exe -w 40 -s 20 -u user_001
```

Các tham số:
- `-w 40`: cửa sổ phân tích 40 phím
- `-s 20`: trượt 20 phím mỗi lần phân tích
- `-u user_001`: ID người dùng
- `-d 60`: tự dừng sau 60 giây
- `--collect-only`: chỉ thu thập, không detect
- `-v`: hiện log chi tiết
- `--json-output`: xuất kết quả JSON ra stdout (cho WebSocket bridge)

### Chạy WebSocket bridge (kết nối Dashboard real-time)

```bash
# Cách 1: Pipe trực tiếp
kds_guard.exe --json-output | python ws_bridge.py

# Cách 2: Bridge tự chạy engine
python ws_bridge.py

# Dashboard kết nối tại ws://localhost:8765
```

### Chạy dashboard

```bash
cd kds-guard-dashboard
npm run dev
# Mở http://localhost:5173
```

## 11. Kịch bản demo

### Kịch bản 1: Người dùng bình thường
1. Chạy KDS Guard
2. Gõ phím bình thường
3. Kết quả: risk score thấp (0.00 – 0.10), hệ thống không cảnh báo

### Kịch bản 2: Mô phỏng BadUSB (không cần USB thật)
1. Chạy KDS Guard
2. Mở terminal khác, chạy `python scripts/simulate_badusb.py --speed 50`
3. Script sẽ gõ phím tự động với tốc độ 50 keys/s (giống BadUSB)
4. Kết quả: risk score cao (0.60+), hệ thống hiện popup cảnh báo và chặn input

### Kịch bản 3: Người gõ nhanh
1. Chạy KDS Guard
2. Người dùng gõ nhanh nhất có thể
3. Kết quả: risk score trung bình (0.10 – 0.30), hệ thống ghi log nhưng không chặn (vì vẫn có biến thiên tự nhiên)

## 11.1. Kết quả thực nghiệm

Đánh giá trên **21,035 mẫu** (20,803 người thật + 232 tấn công) bằng script `evaluate_thresholds.py`:

| Ngưỡng | TP | FP | TPR (Recall) | FPR | F1 |
|:------:|:--:|:--:|:------------:|:---:|:--:|
| 0.2 | 232 | 1 | 100% | 0.0% | 99.8% |
| **0.3** | **229** | **0** | **98.7%** | **0.0%** | **99.3%** |
| 0.5 | 200 | 0 | 86.2% | 0.0% | 92.6% |

> Với ngưỡng hiện tại (0.3): **98.7% BadUSB bị phát hiện, 0% người thật bị nhầm**.

## 12. Hạn chế

- BlockInput cần quyền **Administrator** – nếu không có quyền thì chỉ cảnh báo, không chặn được
- BlockInput chặn toàn hệ thống (không phân biệt từng thiết bị) – đã giảm thiểu bằng timeout cứng tối đa 5 giây
- Password manager tự động điền mật khẩu có thể bị nhận nhầm là BadUSB (false positive). **Hướng xử lý:** whitelist process name — nếu input đến từ process đã biết (KeePass, Bitwarden, 1Password, LastPass) thì suppress cảnh báo. Chưa triển khai nhưng có thể thêm bằng cách kiểm tra foreground window process trước khi ra quyết định
- Kẻ tấn công tinh vi có thể chèn delay ngẫu nhiên giữa các phím để mô phỏng người thật – nhưng R8 (Injection Fingerprint) vẫn phát hiện được vì khoảng nghỉ của máy đều đặn hơn người
- Hệ thống hiện tại chưa phân biệt được từng thiết bị USB riêng biệt

## 13. Hướng phát triển

- Tích hợp Machine Learning (One-Class SVM, Isolation Forest) để tự học hành vi từng người dùng
- Nhận diện thiết bị USB (device fingerprinting) để whitelist bàn phím tin cậy
- ~~WebSocket realtime giữa Rust engine và dashboard~~ ✅ Đã triển khai (`--json-output` + `ws_bridge.py`)
- Đóng gói thành service Windows chạy nền tự động khi khởi động
- Calibration per-user: learning phase 30 giây khi khởi động để đặt ngưỡng tùy chỉnh
- Block input phân tầng: chặn chỉ thiết bị USB mới thay vì toàn hệ thống
