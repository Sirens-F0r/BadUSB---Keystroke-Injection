# 🔌 Hướng Dẫn Nạp Payload BadUSB Vào ESP32-S2

## Thiết bị cần có

| # | Thiết bị | Ghi chú |
|---|----------|---------|
| 1 | **ESP32-S2 board** (RIRIHI / bất kỳ board ESP32-S2 nào có USB-OTG) | Đã mua ✅ |
| 2 | **Dây USB Type-C** (hoặc Micro-USB tùy board) | Để kết nối với máy tính |
| 3 | **Máy tính Windows 10/11** | Cài Arduino IDE |

> ⚠️ **LƯU Ý AN TOÀN**: Payload demo **hoàn toàn vô hại** — chỉ mở Notepad và gõ text. Không chạy lệnh nguy hiểm.

---

## Bước 1: Cài Arduino IDE + ESP32 Board Package

### 1.1 Tải Arduino IDE
- Vào https://www.arduino.cc/en/software
- Tải **Arduino IDE 2.x** (bản mới nhất)
- Cài đặt bình thường

### 1.2 Thêm ESP32 Board Manager URL
1. Mở Arduino IDE
2. Vào **File → Preferences** (hoặc `Ctrl + ,`)
3. Ở ô **"Additional Board Manager URLs"**, dán:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Nhấn **OK**

### 1.3 Cài ESP32 Board Package
1. Vào **Tools → Board → Board Manager**
2. Tìm kiếm: **esp32**
3. Chọn **"esp32 by Espressif Systems"** → nhấn **Install**
4. Đợi tải xong (khoảng 2–5 phút)

---

## Bước 2: Cấu hình Board trong Arduino IDE

### 2.1 Chọn Board
- Vào **Tools → Board → ESP32 Arduino** → chọn **"ESP32S2 Dev Module"**

### 2.2 Cấu hình USB (QUAN TRỌNG)
Vào **Tools** và đặt:

| Mục | Giá trị |
|-----|---------|
| **Board** | ESP32S2 Dev Module |
| **USB Mode** | **USB-OTG (TinyUSB)** ← BẮT BUỘC |
| **USB CDC On Boot** | Enabled |
| **Upload Mode** | Internal USB |
| **CPU Frequency** | 240MHz |
| **Flash Size** | 4MB (hoặc theo board) |
| **Partition Scheme** | Default 4MB |

> ⚠️ Nếu không thấy **"USB-OTG (TinyUSB)"** → bạn chưa cài đúng board package ESP32. Quay lại Bước 1.3.

---

## Bước 3: Mở File Payload

### 3.1 Mở file có sẵn trong dự án
1. Trong Arduino IDE, vào **File → Open**
2. Tìm đến:
   ```
   DOANCOSO/demo/esp32s2_demo_payload.ino
   ```
3. Mở file

### 3.2 Kiểm tra nội dung
Code sẽ hiển thị như sau — **KHÔNG CẦN SỬA GÌ**:

```cpp
#include "USB.h"
#include "USBHIDKeyboard.h"

USBHIDKeyboard Keyboard;

const int KEYSTROKE_DELAY = 10;    // 10ms giữa mỗi phím (siêu nhanh)
const int INITIAL_DELAY = 3000;    // Chờ 3 giây sau khi cắm USB

// ... phần còn lại tự động gõ text vào Notepad
```

### 3.3 (Tùy chọn) Điều chỉnh tốc độ gõ

Nếu muốn thay đổi tốc độ để demo các kịch bản khác nhau:

| Giá trị `KEYSTROKE_DELAY` | Tốc độ | KDS Guard phát hiện? |
|---------------------------|--------|---------------------|
| **10** (mặc định) | Siêu nhanh (~50 keys/s) | ✅ Phát hiện ngay (CRITICAL) |
| **30** | Nhanh (~17 keys/s) | ✅ Phát hiện (HIGH) |
| **50** | Vừa (~10 keys/s) | ✅ Phát hiện (MEDIUM) |
| **150** | Chậm (~3 keys/s) | ⚠️ Có thể không phát hiện |

---

## Bước 4: Đưa ESP32-S2 vào chế độ nạp code (Boot Mode)

### Cách 1 — Board có nút BOOT + RESET
1. **Giữ nút BOOT** (nút 0 / GPIO0)
2. **Nhấn nút RESET** 1 lần (trong khi vẫn giữ BOOT)
3. **Thả nút BOOT**
4. Board đã vào chế độ nạp code

### Cách 2 — Board chỉ có 1 nút
1. Rút USB ra
2. **Giữ nút BOOT**
3. **Cắm USB vào** (vẫn giữ BOOT)
4. **Thả nút BOOT** sau 1 giây
5. Board đã vào chế độ nạp code

> 💡 Khi vào Boot Mode thành công, Windows sẽ phát hiện thiết bị mới trong Device Manager.

---

## Bước 5: Nạp Code (Upload)

1. Chọn đúng **COM port**: 
   - **Tools → Port** → chọn port mới xuất hiện (VD: `COM5`)
   - Nếu không thấy port → kiểm tra lại Boot Mode (Bước 4)

2. Nhấn nút **Upload** (→) trong Arduino IDE

3. Đợi quá trình compile + upload (1–2 phút):
   ```
   Compiling sketch...
   Uploading...
   Hard resetting via RTS pin...
   ```

4. **Upload xong** → board tự reset

> ⚠️ Nếu lỗi upload: thử lại Bước 4 (vào Boot Mode) rồi Upload lại.

---

## Bước 6: Test Payload

### 6.1 Test đơn giản (không có KDS Guard)
1. **Rút ESP32-S2 ra**
2. Mở **Notepad** trên máy
3. **Cắm ESP32-S2 vào**
4. Chờ 3 giây → ESP32 sẽ:
   - Nhấn `Win+R` → mở Run dialog
   - Gõ `notepad` → Enter → mở Notepad mới
   - Gõ text demo vào Notepad
5. Quan sát: text tự xuất hiện siêu nhanh ✅

### 6.2 Test với KDS Guard (demo thực tế)
1. Mở **Terminal 1** (Run as Administrator):
   ```
   cd DOANCOSO
   kds_guard\target\release\kds_guard.exe --log-keys -v
   ```
2. **Cắm ESP32-S2 vào**
3. Chờ 3 giây → ESP32 bắt đầu gõ
4. **Quan sát KDS Guard**:
   ```
   🔴 CRITICAL - Risk Score: 0.85+
   Flight time trung bình rất thấp: 10ms
   Hệ số biến thiên CV rất thấp: 0.02
   Burst pattern detected: 30+ phím liên tiếp
   ⚠️ PHÁT HIỆN TẤN CÔNG HID INJECTION!
   ```
5. **Windows notification** xuất hiện + input bị chặn ✅

---

## Xử Lý Sự Cố

| Sự cố | Giải pháp |
|-------|-----------|
| Không thấy COM port | Cài driver: [CP210x](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) hoặc [CH340](http://www.wch-ic.com/downloads/CH341SER_EXE.html) |
| Upload failed | Vào Boot Mode lại (Bước 4), thử cắm cổng USB khác |
| Board không phản ứng sau upload | Nhấn nút RESET trên board |
| ESP32 gõ nhưng sai ký tự | Kiểm tra layout bàn phím Windows = English US |
| ESP32 không gõ gì | Kiểm tra USB Mode = **USB-OTG (TinyUSB)** trong Arduino IDE |
| KDS Guard không phát hiện | Kiểm tra KDS Guard đang chạy với quyền Admin |

---

## Tóm Tắt Nhanh

```
1. Cài Arduino IDE + ESP32 board package
2. Chọn Board: ESP32S2 Dev Module
3. Chọn USB Mode: USB-OTG (TinyUSB)     ← QUAN TRỌNG
4. Mở file: demo/esp32s2_demo_payload.ino
5. Vào Boot Mode (giữ BOOT + nhấn RESET)
6. Upload code
7. Rút ra, cắm lại → ESP32 tự gõ → KDS Guard phát hiện
```

> ⚠️ **Nhắc nhở**: Payload demo chỉ gõ text vô hại vào Notepad. **KHÔNG BAO GIỜ** nạp payload thực sự nguy hiểm (download malware, reverse shell, v.v.) — đây là công cụ học tập, không phải công cụ tấn công.
