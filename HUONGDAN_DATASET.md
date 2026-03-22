# 📖 HƯỚNG DẪN BỔ SUNG DATASET THẬT

> Hướng dẫn thu thập dữ liệu keystroke dynamics thật cho đồ án KDS Guard.

---

## 🎯 Mục tiêu

- Thu thập **50-100 người** (mỗi người 2-3 sessions × 3-5 phút)
- Có dataset **đa dạng**: nhiều tốc độ gõ, loại bàn phím, ngữ cảnh
- Kết hợp thêm **dataset công khai** (CMU Benchmark)

---

## 📋 3 NGUỒN DỮ LIỆU

### Nguồn 1: Dataset CMU (nhanh nhất, đã có sẵn)

**CMU Keystroke Dynamics Benchmark Dataset** - 51 users, 400 entries/user.

```
Bước 1: Tải dataset
  - Truy cập: https://www.cs.cmu.edu/~keystroke/
  - Tải file: DSL-StrongPasswordNet.csv
  - Đặt vào: data/raw/DSL-StrongPasswordNet.csv

Bước 2: Chuyển đổi format
  python scripts/integrate_datasets.py --cmu data/raw/DSL-StrongPasswordNet.csv

Bước 3: Gộp vào dataset chính
  python scripts/integrate_datasets.py --merge
```

**Kết quả:** ~20,000 feature vectors từ 51 users (người thật).

---

### Nguồn 2: Tự thu thập bằng Python Collector

**Không cần build Rust!** Dùng Python collector với pynput.

#### Chuẩn bị

```bash
pip install pynput
```

#### Thu thập từng người

```bash
# Xem hướng dẫn chi tiết
python scripts/collect_keystrokes.py --guide

# === NGƯỜI 1 ===
# Session 1: Gõ đoạn văn (5 phút)
python scripts/collect_keystrokes.py -u user_001 -s 1 --duration 300

# Session 2: Gõ chuỗi ngẫu nhiên (3 phút)
python scripts/collect_keystrokes.py -u user_001 -s 2 --duration 180

# Session 3: Gõ tự do (2 phút)
python scripts/collect_keystrokes.py -u user_001 -s 3 --duration 120

# === NGƯỜI 2 ===
python scripts/collect_keystrokes.py -u user_002 -s 1 --duration 300
python scripts/collect_keystrokes.py -u user_002 -s 2 --duration 180
python scripts/collect_keystrokes.py -u user_002 -s 3 --duration 120

# ... tiếp tục đến user_050
```

#### Kịch bản gõ (in ra giấy hoặc hiển thị trên màn hình)

**Session 1 - Đoạn văn tiếng Việt:**

```
Trường Đại học Công nghệ là một trong những trường đại học 
hàng đầu Việt Nam về đào tạo và nghiên cứu trong lĩnh vực công nghệ 
thông tin và truyền thông. Sinh viên được trang bị kiến thức chuyên 
sâu về lập trình, mạng máy tính, an toàn thông tin và trí tuệ nhân tạo.
```

**Session 2 - Chuỗi ngẫu nhiên:**

```
x7Kp2mN9bT   aB3cD5eF7g   P@ssw0rd123!   Str0ng#Key2024
hJ8kL4mN6p   qR2sT5uV8w   W3bS3cur1ty!   D4t4Sc13nc3
```

**Session 3 - Gõ tự do**: Chat, viết email, code, bất kỳ điều gì.

#### Xử lý sau thu thập

```bash
# Convert sang features
python scripts/integrate_datasets.py --self-collect

# Gộp tất cả
python scripts/integrate_datasets.py --merge

# Retrain model
python scripts/train_model.py

# Đánh giá lại
python scripts/evaluate.py
```

---

### Nguồn 3: Dùng Rust Collector (hiệu năng cao hơn)

```bash
# Build Rust project
cd kds_guard
cargo build --release

# Thu thập (mỗi người)
target/release/kds_guard.exe --collect-only --log-keys -u user_001 -o ../data
target/release/kds_guard.exe --collect-only --log-keys -u user_002 -o ../data
```

---

## 📊 METADATA CẦN THU THẬP

Tạo file `data/participants.csv` với thông tin:

| user_id | keyboard_type | layout | os | experience | age_group | time_of_day |
|---------|--------------|--------|-----|------------|-----------|-------------|
| user_001 | laptop | QWERTY+Telex | Windows | fast | 20-25 | morning |
| user_002 | mechanical | QWERTY+VNI | Windows | average | 20-25 | afternoon |
| user_003 | membrane | QWERTY+Telex | Linux | slow | 25-30 | evening |

---

## ⚠️ CHECKLIST QUYỀN RIÊNG TƯ

Trước khi thu thập, đảm bảo:

- [ ] **Consent form**: Người tham gia ký đồng ý
- [ ] **Ẩn danh**: Chỉ dùng user_001, user_002, ...
- [ ] **Không lưu nội dung**: Dùng `--no-log-keys` nếu lo ngại
- [ ] **Quyền rút**: Người tham gia có thể yêu cầu xóa dữ liệu
- [ ] **Chỉ lưu timing**: Không lưu screenshot, password thật
- [ ] **Bảo mật file**: Không upload lên public repo

---

## 🔢 TÍNH TOÁN SỐ LƯỢNG

| Hạng mục | Số lượng |
|----------|----------|
| Người tham gia | 50 |
| Sessions/người | 3 |
| Phút/session | 4 (trung bình) |
| Phím/phút (ước tính) | 150 |
| **Tổng events** | **50 × 3 × 4 × 150 × 2 = 180,000** |
| **Windows (40 phím, slide 20)** | **~4,500** |

Kết hợp với CMU (~20,000 windows) → **Tổng: ~25,000 feature vectors** ✅

---

## 🔄 PIPELINE SAU KHI CÓ DỮ LIỆU

```bash
# 1. Tích hợp dataset mới
python scripts/integrate_datasets.py --self-collect --merge

# 2. Retrain model với dữ liệu mới
python scripts/train_model.py

# 3. Đánh giá
python scripts/evaluate.py

# 4. Tạo biểu đồ mới
python scripts/visualize.py

# 5. Mở dashboard
streamlit run dashboard/dashboard.py
```

---

## 💡 TIPS

1. **Thu thập lúc khác nhau**: sáng/chiều/tối → dữ liệu đa dạng hơn
2. **Nhiều loại bàn phím**: laptop, cơ, màng → robust hơn
3. **Bao gồm fast typists**: để giảm false positive
4. **Gõ cả tiếng Việt**: có dấu (Telex/VNI) → đặc thù riêng
5. **Minimum 5 phút/session**: để có đủ windows cho thống kê
