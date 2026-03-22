# KDS Guard - Thu Thập Dữ Liệu Gõ Phím

## Mục đích
Thu thập dữ liệu nhịp gõ phím (keystroke dynamics) phục vụ nghiên cứu 
phát hiện thiết bị BadUSB. Chương trình CHỈ ghi lại tốc độ và nhịp gõ,
KHÔNG ghi lại nội dung bạn gõ.

## Cách sử dụng

1. Mở Notepad trước
2. Click đúp vào file **thu_thap.bat**
3. Nhập tên của bạn (không dấu, dùng _ thay khoảng trắng)
4. Làm theo hướng dẫn trên màn hình:
   - **Session 1**: Gõ lại đoạn văn hiển thị (2 phút)
   - **Session 2**: Gõ các chuỗi ngẫu nhiên (90 giây)
   - **Session 3**: Gõ tự do bất kỳ (90 giây)
5. Mỗi session sẽ TỰ ĐỘNG DỪNG khi hết giờ
6. Sau khi xong, gửi lại thư mục **data/** cho người nghiên cứu

## Lưu ý quan trọng
- Mở **Notepad mới** (Ctrl+N) trước mỗi session
- Gõ bình thường trong Notepad, không cần gõ trong cửa sổ đen
- Chương trình thu thập chạy ở nền, không ảnh hưởng máy tính
- Dữ liệu hoàn toàn ẩn danh, chỉ lưu nhịp gõ

## Cấu trúc thư mục
```
KDS_Guard_ThuThap/
├── thu_thap.bat      ← Click đúp để chạy
├── kds_guard.exe     ← Chương trình thu thập
├── HUONGDAN.md       ← File này
└── data/             ← Dữ liệu thu thập (tự tạo)
    ├── keystroke_log_xxx_s1.csv
    ├── keystroke_log_xxx_s2.csv
    └── keystroke_log_xxx_s3.csv
```

## Liên hệ
Nếu gặp lỗi, liên hệ: [Người gửi =))]
