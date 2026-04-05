"""
Keystroke Collector bằng Python (bản thay thế cho Rust)
Dùng khi chưa build được kds_guard.exe

Cách dùng:
  python scripts/collect_keystrokes.py -u user_001
  python scripts/collect_keystrokes.py -u user_002 --session 2
  python scripts/collect_keystrokes.py -u user_003 --duration 180

Yêu cầu: pip install pynput
"""

import os
import csv
import time
import argparse
from datetime import datetime
from pathlib import Path

try:
    from pynput import keyboard
except ImportError:
    print("❌ Cần cài pynput:")
    print("   pip install pynput")
    exit(1)


class KeystrokeCollector:
    """Thu thập sự kiện bàn phím và ghi ra CSV."""

    def __init__(self, output_dir: str, user_id: str, session_id: str, log_keys: bool = True):
        self.output_dir = output_dir
        self.user_id = user_id
        self.session_id = session_id
        self.log_keys = log_keys

        self.start_time = time.perf_counter()
        self.events = []
        self.event_count = 0

        # Tạo thư mục output
        os.makedirs(output_dir, exist_ok=True)

        # Tạo file CSV
        self.filename = f"keystroke_log_{session_id}.csv"
        self.filepath = os.path.join(output_dir, self.filename)

        self.csv_file = open(self.filepath, 'w', newline='', encoding='utf-8')
        self.csv_writer = csv.writer(self.csv_file)
        self.csv_writer.writerow([
            'timestamp_ms', 'key_code', 'event_type',
            'key_class', 'is_modifier', 'session_id', 'user_id'
        ])

    def _get_timestamp_ms(self) -> float:
        """Timestamp tương đối (ms) từ lúc bắt đầu."""
        return (time.perf_counter() - self.start_time) * 1000.0

    def _classify_key(self, key) -> tuple:
        """Phân loại phím."""
        try:
            key_code = key.char if hasattr(key, 'char') and key.char else str(key)
        except AttributeError:
            key_code = str(key)

        # Clean up key code
        key_code = key_code.replace("Key.", "")

        # Phân loại
        modifier_keys = ['shift', 'shift_r', 'ctrl', 'ctrl_l', 'ctrl_r',
                         'alt', 'alt_l', 'alt_r', 'alt_gr', 'cmd', 'cmd_r']
        special_keys = ['enter', 'return', 'tab', 'backspace', 'delete',
                        'esc', 'caps_lock', 'space']
        function_keys = [f'f{i}' for i in range(1, 13)]
        nav_keys = ['up', 'down', 'left', 'right', 'home', 'end',
                    'page_up', 'page_down']

        key_lower = key_code.lower()

        if key_lower in modifier_keys:
            return key_code, 'modifier', True
        elif key_lower in special_keys:
            return key_code, 'special', False
        elif key_lower in function_keys:
            return key_code, 'function', False
        elif key_lower in nav_keys:
            return key_code, 'navigation', False
        elif len(key_code) == 1 and key_code.isdigit():
            return key_code, 'digit', False
        elif len(key_code) == 1 and key_code.isalpha():
            return key_code, 'alpha', False
        else:
            return key_code, 'other', False

    def _write_event(self, key, event_type: str):
        """Ghi một event vào CSV."""
        timestamp_ms = self._get_timestamp_ms()
        key_code, key_class, is_modifier = self._classify_key(key)

        # Nếu không log key code, thay bằng key class
        if not self.log_keys and key_class in ['alpha', 'digit']:
            key_code = key_class

        self.csv_writer.writerow([
            f"{timestamp_ms:.2f}",
            key_code,
            event_type,
            key_class,
            is_modifier,
            self.session_id,
            self.user_id,
        ])
        self.csv_file.flush()

        self.event_count += 1

        # Progress log
        if self.event_count % 50 == 0:
            elapsed = timestamp_ms / 1000.0
            print(f"   📊 {self.event_count} events | {elapsed:.1f}s elapsed", end='\r')

    def on_press(self, key):
        """Callback khi nhấn phím."""
        self._write_event(key, 'down')

    def on_release(self, key):
        """Callback khi thả phím."""
        self._write_event(key, 'up')

        # Dừng khi nhấn Esc
        if key == keyboard.Key.esc:
            return False

    def start(self, duration_seconds: int = 0):
        """Bắt đầu thu thập."""
        print(f"\n📝 File: {self.filepath}")
        print(f"👤 User: {self.user_id}")
        print(f"   Session: {self.session_id}")

        if duration_seconds > 0:
            print(f"⏱️  Duration: {duration_seconds}s")
        print(f"\n🎹 Bắt đầu gõ phím... (nhấn ESC để dừng)")
        print("-" * 50)

        with keyboard.Listener(
            on_press=self.on_press,
            on_release=self.on_release
        ) as listener:
            if duration_seconds > 0:
                listener.join(timeout=duration_seconds)
            else:
                listener.join()

        self.csv_file.close()
        elapsed = self._get_timestamp_ms() / 1000.0

        print(f"\n\n{'='*50}")
        print(f"✅ Thu thập hoàn tất!")
        print(f"   Events: {self.event_count}")
        print(f"   Duration: {elapsed:.1f}s")
        print(f"   File: {self.filepath}")
        print(f"{'='*50}")


def show_collection_guide():
    """Hiển thị hướng dẫn thu thập."""
    guide = """
╔════════════════════════════════════════════════════════════╗
║  📖 HƯỚNG DẪN THU THẬP DỮ LIỆU KEYSTROKE DYNAMICS        ║
╚════════════════════════════════════════════════════════════╝

📋 QUY TRÌNH THU THẬP:

  Mỗi người tham gia thực hiện 2-3 SESSIONS, mỗi session 3-5 phút.

  SESSION 1: Gõ đoạn văn tiếng Việt
  ─────────────────────────────────
  Hiển thị đoạn văn trên màn hình, người dùng nhìn và gõ lại.

  Gợi ý đoạn văn:
    "Trường Đại học Công Nghệ Hutech là một trong những trường
    đại học hàng đầu Việt Nam về đào tạo và nghiên cứu trong lĩnh
    vực công nghệ thông tin và truyền thông."

  SESSION 2: Gõ chuỗi ký tự ngẫu nhiên
  ─────────────────────────────────────
  Gõ các chuỗi như: x7Kp2mN9bT, aB3cD5eF7g, ...
  Hoặc gõ mật khẩu giả lập: P@ssw0rd123!, Str0ng#Key2024

  SESSION 3: Gõ tự do (Free typing)
  ──────────────────────────────────
  Người dùng gõ bất kỳ thứ gì: chat, email, code, ...
  Thời gian: 1-2 phút.

📝 METADATA CẦN GHI:
  - Loại bàn phím: laptop / cơ (mechanical) / màng (membrane)
  - Layout: QWERTY / Telex / VNI
  - Thời điểm: sáng / chiều / tối
  - Tự đánh giá tốc độ gõ: chậm / trung bình / nhanh

⚠️ LƯU Ý VỀ QUYỀN RIÊNG TƯ:
  - KHÔNG lưu nội dung gõ (dùng --no-log-keys nếu cần)
  - Hash/ẩn danh user ID
  - Người tham gia phải ĐỒNG Ý (consent)
  - Có quyền YÊU CẦU XÓA dữ liệu bất kỳ lúc nào

────────────────────────────────────────────────────

CÁCH CHẠY:

  # Session 1: Gõ văn bản (5 phút)
  python scripts/collect_keystrokes.py -u user_001 -s 1 --duration 300

  # Session 2: Gõ ngẫu nhiên (3 phút)
  python scripts/collect_keystrokes.py -u user_001 -s 2 --duration 180

  # Session 3: Gõ tự do (2 phút)
  python scripts/collect_keystrokes.py -u user_001 -s 3 --duration 120

  # Đổi người dùng
  python scripts/collect_keystrokes.py -u user_002 -s 1 --duration 300

  # Không lưu key code (bảo mật)
  python scripts/collect_keystrokes.py -u user_001 --no-log-keys
"""
    print(guide)


def main():
    parser = argparse.ArgumentParser(
        description="🎹 KDS Guard - Keystroke Collector (Python)"
    )
    parser.add_argument('-u', '--user-id', default='anonymous',
                        help='User ID (ẩn danh, ví dụ: user_001)')
    parser.add_argument('-s', '--session', type=int, default=1,
                        help='Session number (1, 2, 3)')
    parser.add_argument('-d', '--duration', type=int, default=0,
                        help='Duration in seconds (0 = manual stop with ESC)')
    parser.add_argument('-o', '--output-dir', default='data',
                        help='Output directory')
    parser.add_argument('--no-log-keys', action='store_true',
                        help='Không lưu key code (bảo mật)')
    parser.add_argument('--guide', action='store_true',
                        help='Hiển thị hướng dẫn thu thập')

    args = parser.parse_args()

    if args.guide:
        show_collection_guide()
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_id = f"{args.user_id}_s{args.session}_{timestamp}"

    print("╔════════════════════════════════════════════════════╗")
    print("║  🎹 KDS Guard - Keystroke Collector                ║")
    print("╚════════════════════════════════════════════════════╝")

    collector = KeystrokeCollector(
        output_dir=args.output_dir,
        user_id=args.user_id,
        session_id=session_id,
        log_keys=not args.no_log_keys,
    )

    collector.start(duration_seconds=args.duration)

    print(f"\nNext steps:")
    print(f"  python scripts/integrate_datasets.py --self-collect --merge")
    print(f"  python scripts/train_model.py")


if __name__ == "__main__":
    main()
