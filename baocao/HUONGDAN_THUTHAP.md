# 📖 HƯỚNG DẪN THU THẬP DỮ LIỆU — Nguồn 2 & Nguồn 3

> Hướng dẫn chi tiết từng bước để thu thập dữ liệu keystroke dynamics cho đồ án KDS Guard.
> Cập nhật: 2026-03-08

---

## 🎯 Mục tiêu

Thu thập dữ liệu gõ phím từ **50–100 người dùng thật** để:

- Train model phát hiện BadUSB chính xác hơn
- Có dataset thật cho báo cáo đồ án
- Đa dạng: nhiều tốc độ, loại bàn phím, ngữ cảnh

**Thời gian:** ~7 phút/người × 50 người = **~6 tiếng** (chia ra nhiều buổi)

---

## 📋 BẠN CÓ 2 CÁCH THU THẬP

| | Nguồn 2: Python Collector | Nguồn 3: Rust Collector |
|---|---|---|
| **File chạy** | `collector_tool\thu_thap.bat` | `collector_tool\thu_thap_rust.bat` |
| **Yêu cầu** | Python + pynput | Không cần cài gì thêm |
| **Ưu điểm** | Dễ dùng, tự chia 3 sessions | Hiệu năng cao, nhẹ |
| **Khi nào dùng** | Máy đã có Python | Máy không có Python |

> **Khuyến nghị:** Dùng **Nguồn 2** (Python) vì tự động chia 3 sessions, hiện text gợi ý cho người gõ.

---

## 🚀 CÁCH 1: Thu thập bằng Python (Nguồn 2)

### Bước 1 — Chuẩn bị (chỉ cần làm 1 lần)

```bat
:: Kiểm tra Python đã cài chưa
python --version

:: Cài thư viện pynput (nếu chưa có)
pip install pynput
```

### Bước 2 — Thu thập từng người

**Mở Command Prompt (CMD), chạy:**

```bat
cd "C:\Users\LOQ\OneDrive\Tài liệu\DOANCOSO"
collector_tool\thu_thap.bat
```

**Khi chạy, chương trình sẽ:**

1. Hỏi tên người dùng (nhập dạng `nguyen_van_a`, không dấu, dùng `_`)
2. **Session 1** (3 phút): Hiện đoạn văn → người dùng gõ lại
3. **Session 2** (2 phút): Hiện chuỗi ngẫu nhiên → người dùng gõ lại
4. **Session 3** (2 phút): Gõ tự do (chat, email, code...)
5. Nhấn **ESC** để kết thúc sớm bất kỳ session nào

**File output tự động lưu tại:** `data\keystroke_log_<tên>_s<n>_<ngày>.csv`

### Bước 3 — Lặp lại cho người tiếp theo

```bat
:: Chạy lại bat file, nhập tên người mới
collector_tool\thu_thap.bat
```

> 💡 **Mẹo:** Bạn có thể copy cả thư mục `collector_tool\` sang USB, mang đến phòng máy / lớp học, cho từng người chạy `thu_thap.bat` trên máy của họ, rồi copy file CSV về.

---

## 🚀 CÁCH 2: Thu thập bằng Rust (Nguồn 3)

### Bước 1 — Chạy (không cần cài gì)

```bat
cd "C:\Users\LOQ\OneDrive\Tài liệu\DOANCOSO"
collector_tool\thu_thap_rust.bat
```

### Bước 2 — Gõ phím

1. Nhập tên người dùng
2. Gõ phím bình thường 3–5 phút
3. Nhấn **Ctrl+C** để dừng

**File output tự động lưu tại:** `data\raw\rust\keystroke_log_<tên>_<ngày>.csv`

### Bước 3 — Lặp lại

```bat
collector_tool\thu_thap_rust.bat
:: Nhập tên người mới
```

---

## 📦 SAU KHI THU THẬP XONG — Xử lý dữ liệu

### Bước 1 — Tích hợp dữ liệu mới

```bat
cd "C:\Users\LOQ\OneDrive\Tài liệu\DOANCOSO"

:: Xử lý file Python collector (Nguồn 2)
python -X utf8 scripts\integrate_datasets.py --self-collect

:: Xử lý file Rust collector (Nguồn 3)
python -X utf8 scripts\integrate_datasets.py --rust-collect

:: Gộp tất cả thành 1 file
python -X utf8 scripts\integrate_datasets.py --merge
```

**Hoặc chạy tất cả 1 lần:**

```bat
python -X utf8 scripts\integrate_datasets.py --self-collect --rust-collect --merge
```

### Bước 2 — Retrain model

```bat
python -X utf8 scripts\train_model.py
```

### Bước 3 — Đánh giá lại

```bat
python -X utf8 scripts\evaluate.py
```

### Bước 4 — Tạo biểu đồ mới

```bat
python -X utf8 scripts\visualize.py
```

### Bước 5 — Kiểm tra kết quả

```bat
:: Xem trạng thái dataset
python -X utf8 scripts\integrate_datasets.py --status
```

---

## 📝 KỊCH BẢN GÕ CHO NGƯỜI THAM GIA

### Session 1 — Đoạn văn (in ra giấy hoặc hiện trên màn hình)

```
Trường Đại học Công nghệ là một trong những trường đại học
hàng đầu Việt Nam về đào tạo và nghiên cứu trong lĩnh vực công nghệ
thông tin và truyền thông. Sinh viên được trang bị kiến thức chuyên
sâu về lập trình, mạng máy tính, an toàn thông tin và trí tuệ nhân tạo.
Đây là nền tảng quan trọng để xây dựng sự nghiệp trong ngành công nghệ.
```

### Session 2 — Chuỗi ngẫu nhiên

```
x7Kp2mN9bT   aB3cD5eF7g   P@ssw0rd123!   Str0ng#Key2024
hJ8kL4mN6p   qR2sT5uV8w   W3bS3cur1ty!   D4t4Sc13nc3
Abc123!@#    MyP@ss2024   S3cur3Key!!    T3stP@ss99
```

### Session 3 — Gõ tự do

Người tham gia gõ bất kỳ thứ gì: chat, viết email, code, ghi chú...

---

## 📊 GHI NHẬN METADATA (tùy chọn nhưng nên làm)

Tạo file `data\participants.csv` ghi thông tin mỗi người:

```csv
user_id,keyboard_type,layout,os,experience,age_group,time_of_day
nguyen_van_a,laptop,QWERTY+Telex,Windows,fast,20-25,morning
tran_thi_b,mechanical,QWERTY+VNI,Windows,average,20-25,afternoon
le_van_c,membrane,QWERTY+Telex,Windows,slow,25-30,evening
```

| Trường | Giải thích | Giá trị mẫu |
|--------|-----------|-------------|
| `user_id` | Tên đã nhập khi thu thập | `nguyen_van_a` |
| `keyboard_type` | Loại bàn phím | `laptop` / `mechanical` / `membrane` |
| `layout` | Cách gõ tiếng Việt | `QWERTY+Telex` / `QWERTY+VNI` |
| `os` | Hệ điều hành | `Windows` / `Linux` / `macOS` |
| `experience` | Tốc độ gõ tự đánh giá | `slow` / `average` / `fast` |
| `age_group` | Nhóm tuổi | `18-20` / `20-25` / `25-30` |
| `time_of_day` | Thời điểm thu thập | `morning` / `afternoon` / `evening` |

---

## ⚠️ CHÚ Ý QUAN TRỌNG

### Quyền riêng tư

- ✅ Người tham gia phải **đồng ý** trước khi thu thập
- ✅ Dùng tên ẩn danh (user_001, nguyen_van_a...)
- ✅ Người tham gia có quyền **yêu cầu xóa** dữ liệu
- ✅ Chỉ lưu timing (thời gian giữa các phím)
- ❌ **KHÔNG** upload file CSV lên repo công khai

### Chất lượng dữ liệu

- ⏱️ Mỗi session tối thiểu **2 phút** (cần ~80 events = 40 phím down + 40 up)
- 🔄 Mỗi người nên gõ **2-3 sessions**
- 🎯 Cố gắng thu **đa dạng**: nhiều loại bàn phím, tốc độ khác nhau
- 🕐 Thu thập ở **nhiều thời điểm** (sáng/chiều/tối) càng tốt

---

## 📐 TÍNH TOÁN SỐ LƯỢNG

| Hạng mục | Số lượng |
|----------|---------|
| Đã có (CMU Benchmark) | **20,400 vectors** (51 users) |
| Cần thu thêm (Nguồn 2+3) | **50 người** × 3 sessions |
| Thời gian/người | ~7 phút |
| Ước tính feature vectors mới | ~4,500 |
| **TỔNG dataset sau thu thập** | **~25,000+** |

---

## 🔄 QUY TRÌNH TỔNG HỢP (checklist)

```
□ 1. Chuẩn bị: pip install pynput
□ 2. Thu thập 10 người đầu tiên (thử pilot)
□ 3. Chạy integrate → kiểm tra dữ liệu OK
□ 4. Thu thập 40 người tiếp theo
□ 5. Chạy integrate + merge + retrain
□ 6. Chạy evaluate + visualize
□ 7. Cập nhật TIENDO.md
□ 8. Lưu evaluation_report.json cho báo cáo
```

### Lệnh tổng hợp cuối cùng

```bat
cd "C:\Users\LOQ\OneDrive\Tài liệu\DOANCOSO"

:: Tất cả trong 1
python -X utf8 scripts\integrate_datasets.py --all
python -X utf8 scripts\train_model.py
python -X utf8 scripts\evaluate.py
python -X utf8 scripts\visualize.py
```

---

## ❓ XỬ LÝ SỰ CỐ

### "Too few events, skip"

→ File quá ít dữ liệu (< 80 events). Cần gõ **ít nhất 2 phút liên tục**.

### "pynput not found"

→ Chạy: `pip install pynput`

### File CSV nằm sai thư mục

→ Nguồn 2: file phải nằm trong `data\` (tự động)
→ Nguồn 3: file phải nằm trong `data\raw\rust\` (tự động)

### Muốn xem trạng thái

```bat
python -X utf8 scripts\integrate_datasets.py --status
```

---

**Chúc thu thập thành công! 🎉**
