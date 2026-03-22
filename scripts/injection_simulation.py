"""
Injection Simulation Script cho KDS Guard
Tạo dữ liệu mô phỏng BadUSB injection để test hệ thống.

Tạo các pattern:
  1. Constant speed (20ms/key) - BadUSB phổ biến nhất
  2. Low variance (30ms ± 2ms) - BadUSB tinh vi hơn
  3. Burst typing (rất nhanh, pause, rất nhanh)
  4. Script typing (biến thiên thấp, có pause giữa commands)
"""

import os
import random
import argparse

import pandas as pd
import numpy as np


def generate_constant_injection(
    text: str = "powershell -ep bypass -c IEX(New-Object Net.WebClient).DownloadString",
    speed_ms: float = 20.0,
    hold_time_ms: float = 10.0,
    session_id: str = "injection_constant",
    user_id: str = "badusb"
) -> pd.DataFrame:
    """
    Mô phỏng BadUSB gõ với tốc độ cố định.
    Pattern: tốc độ siêu đều, hold time siêu ngắn.
    """
    events = []
    current_time = 0.0

    for char in text:
        key_code = f"Key{char.upper()}" if char.isalpha() else f"Char_{char}"
        key_class = "alpha" if char.isalpha() else "special"

        # Key down
        events.append({
            'timestamp_ms': current_time,
            'key_code': key_code,
            'event_type': 'down',
            'key_class': key_class,
            'is_modifier': False,
            'session_id': session_id,
            'user_id': user_id,
        })

        # Key up (hold time cố định)
        events.append({
            'timestamp_ms': current_time + hold_time_ms,
            'key_code': key_code,
            'event_type': 'up',
            'key_class': key_class,
            'is_modifier': False,
            'session_id': session_id,
            'user_id': user_id,
        })

        current_time += speed_ms

    return pd.DataFrame(events)


def generate_low_variance_injection(
    text: str = "net user hacker P@ssw0rd123 /add && net localgroup administrators hacker /add",
    mean_speed_ms: float = 35.0,
    speed_std_ms: float = 3.0,
    mean_hold_ms: float = 12.0,
    hold_std_ms: float = 2.0,
    session_id: str = "injection_lowvar",
    user_id: str = "badusb_smart"
) -> pd.DataFrame:
    """
    Mô phỏng BadUSB tinh vi hơn: có chút jitter nhưng vẫn đều bất thường.
    """
    events = []
    current_time = 0.0

    for char in text:
        key_code = f"Key{char.upper()}" if char.isalpha() else f"Char_{char}"
        key_class = "alpha" if char.isalpha() else "special"

        # Key down
        events.append({
            'timestamp_ms': current_time,
            'key_code': key_code,
            'event_type': 'down',
            'key_class': key_class,
            'is_modifier': False,
            'session_id': session_id,
            'user_id': user_id,
        })

        # Hold time với variance thấp
        ht = max(5.0, np.random.normal(mean_hold_ms, hold_std_ms))
        events.append({
            'timestamp_ms': current_time + ht,
            'key_code': key_code,
            'event_type': 'up',
            'key_class': key_class,
            'is_modifier': False,
            'session_id': session_id,
            'user_id': user_id,
        })

        # Flight time với variance thấp
        ft = max(10.0, np.random.normal(mean_speed_ms, speed_std_ms))
        current_time += ft

    return pd.DataFrame(events)


def generate_burst_injection(
    commands: list[str] = None,
    burst_speed_ms: float = 15.0,
    pause_ms: float = 500.0,
    session_id: str = "injection_burst",
    user_id: str = "badusb_burst"
) -> pd.DataFrame:
    """
    Mô phỏng BadUSB gửi từng lệnh nhanh, pause giữa các lệnh.
    Pattern: burst rất nhanh + pause + burst.
    """
    if commands is None:
        commands = [
            "cmd /c ",
            "whoami",
            "ipconfig /all",
            "netstat -an",
        ]

    events = []
    current_time = 0.0

    for cmd in commands:
        for char in cmd:
            key_code = f"Key{char.upper()}" if char.isalpha() else f"Char_{char}"
            key_class = "alpha" if char.isalpha() else "special"

            events.append({
                'timestamp_ms': current_time,
                'key_code': key_code,
                'event_type': 'down',
                'key_class': key_class,
                'is_modifier': False,
                'session_id': session_id,
                'user_id': user_id,
            })

            ht = 8.0
            events.append({
                'timestamp_ms': current_time + ht,
                'key_code': key_code,
                'event_type': 'up',
                'key_class': key_class,
                'is_modifier': False,
                'session_id': session_id,
                'user_id': user_id,
            })

            current_time += burst_speed_ms

        # Enter sau mỗi command
        events.append({
            'timestamp_ms': current_time,
            'key_code': 'Return',
            'event_type': 'down',
            'key_class': 'special',
            'is_modifier': False,
            'session_id': session_id,
            'user_id': user_id,
        })
        events.append({
            'timestamp_ms': current_time + 8.0,
            'key_code': 'Return',
            'event_type': 'up',
            'key_class': 'special',
            'is_modifier': False,
            'session_id': session_id,
            'user_id': user_id,
        })

        # Pause giữa các lệnh
        current_time += pause_ms

    return pd.DataFrame(events)


def generate_all_injection_data(output_dir: str = "data"):
    """Tạo tất cả các loại dữ liệu injection."""
    os.makedirs(output_dir, exist_ok=True)

    print("╔══════════════════════════════════════════╗")
    print("║  🎭 KDS Guard - Injection Simulation      ║")
    print("╚══════════════════════════════════════════╝")
    print()

    # 1. Constant speed injection
    print("📌 Tạo dữ liệu constant speed injection...")
    df1 = generate_constant_injection()
    path1 = os.path.join(output_dir, "keystroke_log_injection_constant.csv")
    df1.to_csv(path1, index=False)
    print(f"   ✅ {len(df1)} events → {path1}")

    # 2. Low variance injection
    print("📌 Tạo dữ liệu low variance injection...")
    df2 = generate_low_variance_injection()
    path2 = os.path.join(output_dir, "keystroke_log_injection_lowvar.csv")
    df2.to_csv(path2, index=False)
    print(f"   ✅ {len(df2)} events → {path2}")

    # 3. Burst injection
    print("📌 Tạo dữ liệu burst injection...")
    df3 = generate_burst_injection()
    path3 = os.path.join(output_dir, "keystroke_log_injection_burst.csv")
    df3.to_csv(path3, index=False)
    print(f"   ✅ {len(df3)} events → {path3}")

    # 4. Kết hợp tất cả
    print("\n📊 Tổng hợp:")
    print(f"   Constant: {len(df1)} events, mean_ft ≈ 20ms")
    print(f"   Low var:  {len(df2)} events, mean_ft ≈ 35ms")
    print(f"   Burst:    {len(df3)} events, burst pattern")
    print(f"\n✅ Hoàn tất! Dữ liệu lưu tại {output_dir}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="🎭 KDS Guard - Injection Data Simulation"
    )
    parser.add_argument('-d', '--data-dir', default='data',
                        help='Thư mục lưu dữ liệu')

    args = parser.parse_args()
    generate_all_injection_data(output_dir=args.data_dir)
