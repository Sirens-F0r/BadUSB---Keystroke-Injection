# KẾ HOẠCH TIẾP THEO (để đạt kết quả tốt nhất)

## Giai đoạn 1 — Build hệ thống hoàn chỉnh (1 ngày)

Mục tiêu: đảm bảo pipeline chạy thật sự được.

### Việc cần làm

**1️⃣ Build Rust**

```bat
build_rust.bat
```

hoặc

```bat
cd kds_guard
cargo build --release
```

**2️⃣ Test collector**

```bat
kds_guard.exe --collect-only --log-keys -v
```

gõ vài đoạn text.

**3️⃣ Kiểm tra file:**

```
data/raw/*.csv
```

**4️⃣ Chạy pipeline**

```bat
run_pipeline.bat
```

Nếu pipeline chạy được → hệ thống hoàn chỉnh.

---

## Giai đoạn 2 — Thu thập dataset thật (QUAN TRỌNG NHẤT)

> Trong file tiến độ cũng nói rõ bước này **TIENDO**.

Thu thập dữ liệu từ **50–100 người dùng**

Đây là phần giúp đề tài của bạn mạnh hơn 90% đồ án khác.

### Cách làm nhanh nhất

**Dataset cần:**

| loại | số lượng |
|------|----------|
| Human typing | 50–100 users |
| Injection simulation | 4 types |

**Thu thập human** — cho mỗi người:

gõ 3 đoạn:

```
The quick brown fox jumps over the lazy dog
powershell -ExecutionPolicy Bypass
cmd /c start
```

mỗi đoạn **5 lần**

**Thời gian:**

- 1 user ≈ 2 phút
- 50 users ≈ 2 giờ

**Bạn có thể:**

- nhờ bạn bè lớp
- nhờ phòng máy
- nhờ CLB IT

---

## Giai đoạn 3 — Retrain model

Sau khi có dataset thật.

**Chạy:**

```bash
python scripts/feature_extraction.py
python scripts/train_model.py
python scripts/evaluate.py
```

**Output sẽ có:**

- accuracy
- f1
- auc
- confusion matrix

Cái này rất quan trọng cho báo cáo.

---

## Giai đoạn 4 — Tạo biểu đồ cho báo cáo

**Chạy:**

```bash
python scripts/visualize.py
```

Bạn sẽ có:

- typing speed distribution
- CV vs speed scatter
- feature correlation
- model comparison
- injection detection timeline

Những biểu đồ này đưa thẳng vào **chương 4** báo cáo.

---

## Giai đoạn 5 — Chuẩn bị DEMO (giảng viên rất thích)

Demo nên có 3 bước.

**Demo 1 — Human typing**

```bat
kds_guard.exe
```

gõ bình thường.

Result:

```
Risk level: NORMAL
```

**Demo 2 — Fast injection**

chạy script injection.

Result:

```
Risk level: CRITICAL
Policy: BLOCK
```

**Demo 3 — Dashboard**

```bash
streamlit run dashboard/dashboard.py
```

show:

- charts
- detection log
- model comparison

---

## Giai đoạn 6 — Viết báo cáo

### Cấu trúc báo cáo nên như này

**Chương 1 — Tổng quan**

- BadUSB
- MITRE T1674
- FIN7

**Chương 2 — Cơ sở lý thuyết**

- USB
- HID
- Keystroke dynamics
- Rust

**Chương 3 — Thiết kế hệ thống**

Architecture:

```
USB Device
   ↓
Input Capture (Rust)
   ↓
Feature Extraction
   ↓
Detection Engine
   ↓
Policy Engine
   ↓
Alert / Block
```

**Chương 4 — Thực nghiệm**

Dataset:

```
Users: 50
Human samples: XXXX
Injection samples: XXXX
```

Model comparison:

| Model | Accuracy |
|-------|----------|
| Rule | 91% |
| IF | 94% |
| OCSVM | 92% |
| Hybrid | 96% |

**Chương 5 — Kết luận**

- phát hiện BadUSB
- detection realtime
- dataset tự xây dựng
