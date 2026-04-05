# Quy trình nhận và xử lý dữ liệu thật từ bạn bè

> Tài liệu hướng dẫn từng bước: từ lúc gửi tool thu thập → nhận dữ liệu → xử lý → ra kết quả.

---

## 1. Bạn bè gửi lại cho mình cái gì?

Gửi cho họ file `KDS_Guard_ThuThap.zip` (nằm trong `collector_tool/`). Sau khi họ chạy xong, **họ gửi lại thư mục `data/`** chứa:

```
data/
├── keystroke_log_<user>_s1_<timestamp>.csv    ← Session 1 (gõ đoạn văn)
├── keystroke_log_<user>_s2_<timestamp>.csv    ← Session 2 (gõ chuỗi ngẫu nhiên)
└── keystroke_log_<user>_s3_<timestamp>.csv    ← Session 3 (gõ tự do)
```

Mỗi file CSV có dạng:

```csv
timestamp_ms,key_code,event_type,key_class,is_modifier,session_id,user_id
6758.13,ShiftLeft,down,modifier,true,20260405_210000,nguyen_van_a_s1
7118.15,KeyS,down,alpha,false,20260405_210000,nguyen_van_a_s1
```

---

## 2. Để file vào đâu?

Copy **tất cả file CSV** họ gửi vào:

```
DOANCOSO/data/raw/rust/
```

Thư mục này hiện đã có 28 file từ đợt trước. **Cứ copy thêm vào, không cần xóa file cũ.**

---

## 3. Chạy lệnh gì để xử lý?

**Đợi đủ rồi chạy 1 lần** cho nhanh và nhất quán. Chỉ cần 3 lệnh:

```bash
# Bước 1: Convert raw CSV → features (xử lý tất cả file trong data/raw/rust/)
python scripts/integrate_datasets.py --rust --merge

# Bước 2: Train lại ML models (nếu muốn cập nhật so sánh)
python scripts/train_model.py

# Bước 3: Đánh giá lại hệ thống
python scripts/evaluate.py
```

Hoặc **chạy tất cả 1 phát**:

```bash
python scripts/run_pipeline.py
```

---

## 4. Kết quả ra ở đâu?

| Output | File | Nội dung |
|--------|------|----------|
| Features | `data/features_dataset.csv` | Gộp tất cả features (CMU + tự thu + injection) |
| Models | `models/` | RF, IF, OCSVM đã train |
| Evaluation | `data/evaluation_report.json` | TPR, FPR, F1, latency mới |
| Plots | `plots/` | Biểu đồ phân bố |

---

## 5. Tóm tắt flow

```
Bạn bè gõ phím → thu_thap.bat → CSV files
                                    │
                        gửi lại bạn │
                                    ▼
                          data/raw/rust/ ← copy vào đây
                                    │
        python integrate_datasets.py --rust --merge
                                    │
                                    ▼
                       features_dataset.csv (cập nhật)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              train_model.py   evaluate.py    visualize.py
```

---

## ⚠️ Lưu ý quan trọng

- **Tối thiểu nên có 5–10 người**, mỗi người 2–3 sessions
- File CSV từ **Rust collector** (`thu_thap.bat` / `kds_guard.exe`) cho vào `data/raw/rust/`
- File CSV từ **Python collector** (`collect_keystrokes.py`) cho vào `data/` (thư mục gốc)
- Script `integrate_datasets.py` tự phân biệt nguồn dựa trên thư mục

---

*KDS Guard – Đồ án Cơ sở 2026*
