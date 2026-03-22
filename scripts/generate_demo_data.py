"""
Demo Data Generator cho KDS Guard
Tạo bộ dữ liệu demo hoàn chỉnh (human + injection) để test toàn bộ pipeline.

Tạo:
  - 10 "người dùng" ảo với các kiểu gõ khác nhau
  - 3 loại injection pattern
  - Feature extraction tự động
  - Dataset sẵn sàng cho training
"""

import os
import argparse
from pathlib import Path

import pandas as pd
import numpy as np


# === Typing Profiles (mô phỏng người thật) ===
TYPING_PROFILES = {
    'slow_typist': {
        'description': 'Người gõ chậm, thiếu kinh nghiệm',
        'mean_flight_time': 350.0,
        'std_flight_time': 120.0,
        'mean_hold_time': 150.0,
        'std_hold_time': 50.0,
        'error_rate': 0.08,
    },
    'average_typist': {
        'description': 'Người gõ trung bình',
        'mean_flight_time': 180.0,
        'std_flight_time': 70.0,
        'mean_hold_time': 100.0,
        'std_hold_time': 35.0,
        'error_rate': 0.04,
    },
    'fast_typist': {
        'description': 'Người gõ nhanh, thành thạo',
        'mean_flight_time': 100.0,
        'std_flight_time': 40.0,
        'mean_hold_time': 70.0,
        'std_hold_time': 20.0,
        'error_rate': 0.02,
    },
    'touch_typist': {
        'description': '10-finger typist chuyên nghiệp',
        'mean_flight_time': 70.0,
        'std_flight_time': 25.0,
        'mean_hold_time': 55.0,
        'std_hold_time': 15.0,
        'error_rate': 0.01,
    },
    'hunt_peck': {
        'description': 'Gõ kiểu mổ cò (hunt & peck)',
        'mean_flight_time': 500.0,
        'std_flight_time': 200.0,
        'mean_hold_time': 180.0,
        'std_hold_time': 70.0,
        'error_rate': 0.06,
    },
}

# === Injection Profiles ===
INJECTION_PROFILES = {
    'badusb_fast': {
        'description': 'BadUSB tốc độ cao, cố định',
        'mean_flight_time': 20.0,
        'std_flight_time': 1.0,
        'mean_hold_time': 10.0,
        'std_hold_time': 0.5,
        'error_rate': 0.0,
    },
    'badusb_medium': {
        'description': 'BadUSB tốc độ vừa, có jitter nhỏ',
        'mean_flight_time': 35.0,
        'std_flight_time': 3.0,
        'mean_hold_time': 12.0,
        'std_hold_time': 2.0,
        'error_rate': 0.0,
    },
    'script_typing': {
        'description': 'Script automation (macro)',
        'mean_flight_time': 50.0,
        'std_flight_time': 5.0,
        'mean_hold_time': 15.0,
        'std_hold_time': 3.0,
        'error_rate': 0.0,
    },
    'rubber_ducky': {
        'description': 'USB Rubber Ducky (popular BadUSB)',
        'mean_flight_time': 25.0,
        'std_flight_time': 2.0,
        'mean_hold_time': 8.0,
        'std_hold_time': 1.0,
        'error_rate': 0.0,
    },
}

# Đoạn văn mẫu (chỉ dùng các ký tự cơ bản)
SAMPLE_TEXTS = [
    "the quick brown fox jumps over the lazy dog near the river bank",
    "programming in rust is safe fast and concurrent for building systems",
    "cybersecurity involves protecting computer systems from digital attacks",
    "artificial intelligence machine learning deep neural networks are advancing",
    "data science requires statistics programming and domain knowledge skills",
    "operating systems manage hardware resources and provide services to users",
    "network protocols define rules for communication between computer systems",
    "encryption transforms readable data into an encoded format for security",
    "database management systems store organize and retrieve large data sets",
    "software engineering applies engineering principles to software development",
]

# Lệnh injection mẫu (đã sanitize - chỉ mô phỏng pattern, không phải lệnh thật)
INJECTION_COMMANDS = [
    "powershell command execution example test string input output",
    "net user admin password add localgroup administrators change settings",
    "cmd command prompt directory listing file copy move delete operation",
    "systeminfo hostname ipconfig netstat tasklist query system information",
    "reg add modify delete registry key value data type string dword binary",
]


def generate_human_session(
    profile: dict,
    text: str,
    user_id: str,
    session_id: str,
    keyboard_type: str = "laptop",
) -> pd.DataFrame:
    """Tạo dữ liệu mô phỏng một phiên gõ của người thật."""
    events = []
    current_time = np.random.uniform(100, 500)  # Start offset ngẫu nhiên

    for i, char in enumerate(text):
        key_code = f"Key{char.upper()}" if char.isalpha() else (
            "Space" if char == ' ' else f"Char_{char}"
        )
        key_class = "alpha" if char.isalpha() else ("alpha" if char == ' ' else "other")

        # Mô phỏng lỗi gõ (backspace): người thật hay gõ sai
        if np.random.random() < profile['error_rate'] and i > 0:
            # Gõ phím sai
            wrong_key = f"Key{chr(np.random.randint(65, 91))}"
            ht_wrong = max(20, np.random.normal(profile['mean_hold_time'] * 0.7,
                                                  profile['std_hold_time']))
            events.append({
                'timestamp_ms': current_time,
                'key_code': wrong_key,
                'event_type': 'down',
                'key_class': 'alpha',
                'is_modifier': False,
                'session_id': session_id,
                'user_id': user_id,
            })
            events.append({
                'timestamp_ms': current_time + ht_wrong,
                'key_code': wrong_key,
                'event_type': 'up',
                'key_class': 'alpha',
                'is_modifier': False,
                'session_id': session_id,
                'user_id': user_id,
            })

            # Pause nhận ra lỗi
            current_time += np.random.uniform(200, 600)

            # Backspace
            events.append({
                'timestamp_ms': current_time,
                'key_code': 'Backspace',
                'event_type': 'down',
                'key_class': 'special',
                'is_modifier': False,
                'session_id': session_id,
                'user_id': user_id,
            })
            events.append({
                'timestamp_ms': current_time + 50,
                'key_code': 'Backspace',
                'event_type': 'up',
                'key_class': 'special',
                'is_modifier': False,
                'session_id': session_id,
                'user_id': user_id,
            })

            current_time += np.random.uniform(100, 300)

        # Hold time (biến thiên tự nhiên)
        hold_time = max(20, np.random.normal(
            profile['mean_hold_time'],
            profile['std_hold_time']
        ))

        # Thêm biến thiên theo vị trí phím (người thật gõ phím xa chậm hơn)
        if char in 'zxcvbnm':
            hold_time *= np.random.uniform(1.0, 1.3)

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

        # Key up
        events.append({
            'timestamp_ms': current_time + hold_time,
            'key_code': key_code,
            'event_type': 'up',
            'key_class': key_class,
            'is_modifier': False,
            'session_id': session_id,
            'user_id': user_id,
        })

        # Flight time (biến thiên tự nhiên)
        flight_time = max(30, np.random.normal(
            profile['mean_flight_time'],
            profile['std_flight_time']
        ))

        # Pause tự nhiên sau dấu cách (nghỉ giữa từ)
        if char == ' ':
            flight_time *= np.random.uniform(1.2, 2.0)

        # Pause ngẫu nhiên (nghỉ suy nghĩ)
        if np.random.random() < 0.02:
            flight_time += np.random.uniform(500, 2000)

        current_time += flight_time

    return pd.DataFrame(events)


def generate_injection_session(
    profile: dict,
    text: str,
    session_id: str,
) -> pd.DataFrame:
    """Tạo dữ liệu mô phỏng injection."""
    events = []
    current_time = 0.0

    for char in text:
        key_code = f"Key{char.upper()}" if char.isalpha() else (
            "Space" if char == ' ' else f"Char_{char}"
        )
        key_class = "alpha" if char.isalpha() else ("alpha" if char == ' ' else "special")
        is_modifier = key_code in ['ControlLeft', 'ShiftLeft', 'Alt', 'MetaLeft']

        # Hold time (rất đều)
        hold_time = max(3, np.random.normal(
            profile['mean_hold_time'],
            profile['std_hold_time']
        ))

        events.append({
            'timestamp_ms': current_time,
            'key_code': key_code,
            'event_type': 'down',
            'key_class': key_class,
            'is_modifier': is_modifier,
            'session_id': session_id,
            'user_id': 'injection',
        })

        events.append({
            'timestamp_ms': current_time + hold_time,
            'key_code': key_code,
            'event_type': 'up',
            'key_class': key_class,
            'is_modifier': is_modifier,
            'session_id': session_id,
            'user_id': 'injection',
        })

        flight_time = max(5, np.random.normal(
            profile['mean_flight_time'],
            profile['std_flight_time']
        ))
        current_time += flight_time

    return pd.DataFrame(events)


def compute_window_features_simple(
    df: pd.DataFrame,
    window_size: int = 40,
    slide_step: int = 20,
    label: str = "human",
) -> list[dict]:
    """Tính features cho mỗi cửa sổ trượt (phiên bản đơn giản)."""
    downs = df[df['event_type'] == 'down'].copy().sort_values('timestamp_ms').reset_index(drop=True)
    ups = df[df['event_type'] == 'up'].copy().sort_values('timestamp_ms').reset_index(drop=True)

    features_list = []

    for start_idx in range(0, max(1, len(downs) - window_size + 1), slide_step):
        window = downs.iloc[start_idx:start_idx + window_size]

        if len(window) < window_size:
            continue

        t_start = window.iloc[0]['timestamp_ms']
        t_end = window.iloc[-1]['timestamp_ms']

        # Hold Times - ghép cặp down/up
        hold_times = []
        for _, row in window.iterrows():
            matching = ups[(ups['key_code'] == row['key_code']) &
                          (ups['timestamp_ms'] > row['timestamp_ms'])]
            if not matching.empty:
                ht = matching.iloc[0]['timestamp_ms'] - row['timestamp_ms']
                if 0 < ht < 2000:
                    hold_times.append(ht)

        # Flight Times (Down-Down)
        timestamps = window['timestamp_ms'].values
        flight_times = [timestamps[i+1] - timestamps[i]
                        for i in range(len(timestamps)-1)
                        if 0 < timestamps[i+1] - timestamps[i] < 5000]

        if not hold_times or not flight_times:
            continue

        ht = np.array(hold_times)
        ft = np.array(flight_times)

        # Modifier ratio
        if 'is_modifier' in window.columns:
            mod_ratio = window['is_modifier'].sum() / len(window)
        else:
            mod_ratio = 0.0

        # Special ratio
        if 'key_class' in window.columns:
            spec_ratio = (window['key_class'] == 'special').sum() / len(window)
        else:
            spec_ratio = 0.0

        # Burst detection
        max_burst = 0
        current_burst = 0
        for f in ft:
            if f < 50:
                current_burst += 1
                max_burst = max(max_burst, current_burst)
            else:
                current_burst = 0

        duration_s = (t_end - t_start) / 1000.0
        typing_speed = len(window) / duration_s if duration_s > 0 else 0
        cv_ft = np.std(ft) / np.mean(ft) if np.mean(ft) > 0 else 0

        session_id = window.iloc[0].get('session_id', 'unknown')
        user_id = window.iloc[0].get('user_id', 'unknown')

        features_list.append({
            'window_start_ms': t_start,
            'window_end_ms': t_end,
            'num_keys': len(window),
            'session_id': session_id,
            'user_id': user_id,
            'label': label,

            'mean_hold_time': np.mean(ht),
            'std_hold_time': np.std(ht),
            'median_hold_time': np.median(ht),
            'iqr_hold_time': np.percentile(ht, 75) - np.percentile(ht, 25),
            'p5_hold_time': np.percentile(ht, 5),
            'p95_hold_time': np.percentile(ht, 95),

            'mean_flight_time': np.mean(ft),
            'std_flight_time': np.std(ft),
            'median_flight_time': np.median(ft),
            'iqr_flight_time': np.percentile(ft, 75) - np.percentile(ft, 25),
            'p5_flight_time': np.percentile(ft, 5),
            'p95_flight_time': np.percentile(ft, 95),
            'min_flight_time': np.min(ft),

            'cv_flight_time': cv_ft,
            'typing_speed': typing_speed,
            'modifier_ratio': mod_ratio,
            'special_ratio': spec_ratio,
            'has_burst': max_burst >= 10,
            'max_burst_length': max_burst,
        })

    return features_list


def generate_full_demo_dataset(output_dir: str = "data", n_users: int = 20):
    """Tạo bộ dữ liệu demo hoàn chỉnh."""
    os.makedirs(output_dir, exist_ok=True)

    print("╔════════════════════════════════════════════════════╗")
    print("║  🎮 KDS Guard - Demo Dataset Generator             ║")
    print("╚════════════════════════════════════════════════════╝")
    print()

    np.random.seed(42)  # Reproducible

    all_features = []
    all_raw_events = []

    # === 1. Tạo dữ liệu HUMAN ===
    print("👤 Generating HUMAN data...")

    profile_names = list(TYPING_PROFILES.keys())

    for user_idx in range(n_users):
        # Chọn profile ngẫu nhiên cho mỗi user
        profile_name = profile_names[user_idx % len(profile_names)]
        profile = TYPING_PROFILES[profile_name].copy()

        # Thêm biến thiên giữa người dùng
        profile['mean_flight_time'] *= np.random.uniform(0.8, 1.2)
        profile['mean_hold_time'] *= np.random.uniform(0.8, 1.2)

        user_id = f"user_{user_idx + 1:03d}"

        # Mỗi user 2-3 sessions
        n_sessions = np.random.randint(2, 4)

        for session_idx in range(n_sessions):
            session_id = f"{user_id}_s{session_idx + 1}"

            # Chọn 2-3 đoạn text ngẫu nhiên
            n_texts = np.random.randint(2, 4)
            texts = np.random.choice(SAMPLE_TEXTS, n_texts, replace=False)
            full_text = " ".join(texts)

            keyboard_type = np.random.choice(
                ['laptop', 'mechanical', 'membrane'],
                p=[0.5, 0.3, 0.2]
            )

            df_session = generate_human_session(
                profile, full_text, user_id, session_id, keyboard_type
            )

            all_raw_events.append(df_session)

            # Extract features
            features = compute_window_features_simple(
                df_session, window_size=40, slide_step=20, label='human'
            )
            all_features.extend(features)

        if (user_idx + 1) % 5 == 0:
            print(f"   ✅ {user_idx + 1}/{n_users} users ({profile_name})")

    print(f"   Total human feature windows: {len(all_features)}")

    # === 2. Tạo dữ liệu INJECTION ===
    print("\n🎭 Generating INJECTION data...")

    injection_count_before = len(all_features)

    for inj_name, inj_profile in INJECTION_PROFILES.items():
        print(f"   📌 {inj_name}: {inj_profile['description']}")

        # Mỗi loại injection: 5-8 sessions
        n_sessions = np.random.randint(5, 9)

        for session_idx in range(n_sessions):
            session_id = f"inj_{inj_name}_s{session_idx + 1}"

            # Chọn injection text
            n_cmds = np.random.randint(2, 5)
            commands = np.random.choice(INJECTION_COMMANDS, n_cmds, replace=True)
            full_text = " ".join(commands)

            df_session = generate_injection_session(
                inj_profile, full_text, session_id
            )

            all_raw_events.append(df_session)

            features = compute_window_features_simple(
                df_session, window_size=40, slide_step=20, label='injection'
            )
            all_features.extend(features)

    injection_features = len(all_features) - injection_count_before
    print(f"   Total injection feature windows: {injection_features}")

    # === 3. Lưu raw events ===
    print("\n💾 Saving data...")

    raw_df = pd.concat(all_raw_events, ignore_index=True)
    raw_path = os.path.join(output_dir, "keystroke_log_demo.csv")
    raw_df.to_csv(raw_path, index=False)
    print(f"   📄 Raw events: {raw_path} ({len(raw_df)} events)")

    # === 4. Lưu features dataset ===
    features_df = pd.DataFrame(all_features)
    features_path = os.path.join(output_dir, "features_dataset.csv")
    features_df.to_csv(features_path, index=False)
    print(f"   📄 Features: {features_path} ({len(features_df)} windows)")

    # === 5. Thống kê tóm tắt ===
    print(f"\n{'='*55}")
    print("📊 DATASET SUMMARY")
    print(f"{'='*55}")
    print(f"   Total users:     {n_users} (human)")
    print(f"   Injection types: {len(INJECTION_PROFILES)}")
    print(f"   Total events:    {len(raw_df):,}")
    print(f"   Feature windows: {len(features_df):,}")

    if 'label' in features_df.columns:
        label_counts = features_df['label'].value_counts()
        for label, count in label_counts.items():
            pct = count / len(features_df) * 100
            print(f"   {label:>12}: {count:5d} ({pct:.1f}%)")

    print(f"\n   Feature columns: {len(features_df.columns)}")

    # In thống kê key features
    print(f"\n   Key feature stats:")
    for col in ['mean_flight_time', 'cv_flight_time', 'typing_speed']:
        if col in features_df.columns:
            for label in features_df['label'].unique():
                subset = features_df[features_df['label'] == label][col]
                print(f"   {label:>12} {col}: "
                      f"mean={subset.mean():.1f}, std={subset.std():.1f}")

    print(f"\n✅ Demo dataset generated successfully!")
    print(f"   Next steps:")
    print(f"   1. python scripts/train_model.py")
    print(f"   2. python scripts/evaluate.py")
    print(f"   3. python scripts/visualize.py")
    print(f"   4. streamlit run dashboard/dashboard.py")

    return features_df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="🎮 Generate demo dataset")
    parser.add_argument('-d', '--data-dir', default='data',
                        help='Output directory')
    parser.add_argument('-n', '--n-users', type=int, default=20,
                        help='Number of simulated human users')
    parser.add_argument('--seed', type=int, default=42,
                        help='Random seed')

    args = parser.parse_args()
    np.random.seed(args.seed)

    generate_full_demo_dataset(
        output_dir=args.data_dir,
        n_users=args.n_users,
    )
