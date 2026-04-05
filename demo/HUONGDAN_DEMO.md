# Huong Dan Demo KDS Guard

## Thu muc nay chua gi?

| File | Chuc nang |
|------|-----------|
| `kds_guard.exe` | Engine phat hien (da build san) |
| `demo_detect.bat` | 1-click chay che do phat hien |
| `demo_collect.bat` | 1-click thu thap du lieu 30 giay |
| `simulate_injection.py` | Mo phong BadUSB bang phan mem |
| `esp32s2_demo_payload.ino` | Code nap vao ESP32-S2 (BadUSB that) |
| `USB_README.txt` | Huong dan nhanh cho USB nop bai |

## Kich ban demo

### Demo 1: Nguoi dung binh thuong

1. Click phai `demo_detect.bat` → **Run as administrator**
2. Go phim binh thuong 20-30 giay
3. Quan sat: risk score = 0.00-0.10, khong co canh bao
4. Nhan Ctrl+C de dung

### Demo 2: Mo phong BadUSB bang phan mem

1. Chay `demo_detect.bat` (Run as admin)
2. Mo them 1 terminal khac, chay:
   ```
   python simulate_injection.py
   ```
3. Quan sat: risk score tang len 0.6-0.9
4. KDS Guard hien popup canh bao + chan input

### Demo 3: BadUSB that (ESP32-S2)

1. Nap code `esp32s2_demo_payload.ino` vao ESP32-S2 (chi can 1 lan)
2. Chay `demo_detect.bat` (Run as admin)
3. Cam ESP32-S2 vao may
4. Sau 3 giay: ESP32 tu mo Notepad va go text
5. KDS Guard phat hien trong 0.2-0.5 giay:
   - Hien popup canh bao Windows
   - Chan keyboard/mouse input 3-10 giay
6. Rut ESP32-S2 ra

## Luu y

- **PHAI chay voi quyen Administrator** (click phai → Run as administrator)
- Neu khong co quyen admin: chi hien canh bao, khong chan duoc input
- `simulate_injection.py` can Python 3.8+
- ESP32-S2 can nap code bang Arduino IDE (chi 1 lan)
