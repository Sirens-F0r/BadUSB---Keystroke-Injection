# Trich xuat dac trung Keystroke Dynamics tu file keystroke log
# Input: keystroke_log_*.csv -> Output: features_dataset.csv

import os
import glob
import argparse
from pathlib import Path

import pandas as pd
import numpy as np


def load_keystroke_data(filepath: str) -> pd.DataFrame:
    """Đọc file CSV keystroke log."""
    df = pd.read_csv(filepath)
    required_cols = ['timestamp_ms', 'key_code', 'event_type']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Thiếu cột '{col}' trong {filepath}")
    return df


def compute_hold_times(df: pd.DataFrame) -> list[float]:
    """Tính Hold Time cho từng phím (key_up - key_down)."""
    hold_times = []

    downs = df[df['event_type'] == 'down'].copy()
    ups = df[df['event_type'] == 'up'].copy()

    for _, down_row in downs.iterrows():
        # Tìm key_up tương ứng (cùng key_code, sau key_down)
        matching_ups = ups[
            (ups['key_code'] == down_row['key_code']) &
            (ups['timestamp_ms'] > down_row['timestamp_ms'])
        ]
        if not matching_ups.empty:
            first_up = matching_ups.iloc[0]
            ht = first_up['timestamp_ms'] - down_row['timestamp_ms']
            if 0 < ht < 2000:  # Lọc outlier
                hold_times.append(ht)
            # Xóa up đã ghép cặp
            ups = ups.drop(first_up.name)

    return hold_times


def compute_flight_times(df: pd.DataFrame) -> list[float]:
    """Tính Flight Time Down-Down (DD) liên tiếp."""
    downs = df[df['event_type'] == 'down'].copy()
    downs = downs.sort_values('timestamp_ms').reset_index(drop=True)

    flight_times = []
    for i in range(1, len(downs)):
        ft = downs.loc[i, 'timestamp_ms'] - downs.loc[i-1, 'timestamp_ms']
        if 0 < ft < 5000:  # Lọc outlier
            flight_times.append(ft)

    return flight_times


def compute_window_features(
    df: pd.DataFrame,
    window_size: int = 40,
    slide_step: int = 20,
    session_id: str = "unknown",
    user_id: str = "anonymous",
    label: str = "human"
) -> list[dict]:
    """Tính feature vector cho từng cửa sổ trượt."""
    downs = df[df['event_type'] == 'down'].copy()
    downs = downs.sort_values('timestamp_ms').reset_index(drop=True)

    features_list = []

    for start_idx in range(0, len(downs) - window_size + 1, slide_step):
        window = downs.iloc[start_idx:start_idx + window_size]

        # Lấy tất cả events (down + up) trong khoảng thời gian của window
        t_start = window.iloc[0]['timestamp_ms']
        t_end = window.iloc[-1]['timestamp_ms']
        window_events = df[
            (df['timestamp_ms'] >= t_start) &
            (df['timestamp_ms'] <= t_end + 500)  # Thêm margin cho key_up
        ]

        # Hold Times
        hold_times = compute_hold_times(window_events)

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
            modifier_ratio = window['is_modifier'].sum() / len(window)
        elif 'key_class' in window.columns:
            modifier_ratio = (window['key_class'] == 'modifier').sum() / len(window)
        else:
            modifier_ratio = 0.0

        # Special ratio
        if 'key_class' in window.columns:
            special_ratio = (window['key_class'] == 'special').sum() / len(window)
        else:
            special_ratio = 0.0

        # Burst detection
        burst_threshold = 50.0
        burst_min_keys = 10
        max_burst = 0
        current_burst = 0
        for f in ft:
            if f < burst_threshold:
                current_burst += 1
                max_burst = max(max_burst, current_burst)
            else:
                current_burst = 0

        # Typing speed
        duration_s = (t_end - t_start) / 1000.0
        typing_speed = len(window) / duration_s if duration_s > 0 else 0

        # CV
        cv_ft = np.std(ft) / np.mean(ft) if np.mean(ft) > 0 else 0

        features = {
            'window_start_ms': t_start,
            'window_end_ms': t_end,
            'num_keys': len(window),
            'session_id': session_id,
            'user_id': user_id,
            'label': label,

            # Hold Time
            'mean_hold_time': np.mean(ht),
            'std_hold_time': np.std(ht),
            'median_hold_time': np.median(ht),
            'iqr_hold_time': np.percentile(ht, 75) - np.percentile(ht, 25),
            'p5_hold_time': np.percentile(ht, 5),
            'p95_hold_time': np.percentile(ht, 95),

            # Flight Time
            'mean_flight_time': np.mean(ft),
            'std_flight_time': np.std(ft),
            'median_flight_time': np.median(ft),
            'iqr_flight_time': np.percentile(ft, 75) - np.percentile(ft, 25),
            'p5_flight_time': np.percentile(ft, 5),
            'p95_flight_time': np.percentile(ft, 95),
            'min_flight_time': np.min(ft),

            # Injection indicators
            'cv_flight_time': cv_ft,
            'typing_speed': typing_speed,
            'modifier_ratio': modifier_ratio,
            'special_ratio': special_ratio,
            'has_burst': max_burst >= burst_min_keys,
            'max_burst_length': max_burst,
        }

        features_list.append(features)

    return features_list


def process_all_logs(
    data_dir: str = "data",
    output_file: str = "features_dataset.csv",
    window_size: int = 40,
    slide_step: int = 20,
    label: str = "human"
):
    """Xử lý tất cả file keystroke log trong thư mục."""
    log_files = glob.glob(os.path.join(data_dir, "keystroke_log_*.csv"))

    if not log_files:
        print(f"❌ Không tìm thấy file log trong {data_dir}/")
        return

    print(f"📂 Tìm thấy {len(log_files)} file log")

    all_features = []

    for filepath in sorted(log_files):
        filename = os.path.basename(filepath)
        print(f"  📄 Đang xử lý: {filename}...")

        try:
            df = load_keystroke_data(filepath)

            # Lấy session_id và user_id từ file nếu có
            session_id = df['session_id'].iloc[0] if 'session_id' in df.columns else filename
            user_id = df['user_id'].iloc[0] if 'user_id' in df.columns else "unknown"

            features = compute_window_features(
                df,
                window_size=window_size,
                slide_step=slide_step,
                session_id=session_id,
                user_id=user_id,
                label=label
            )

            all_features.extend(features)
            print(f"     ✅ {len(features)} feature vectors extracted")

        except Exception as e:
            print(f"     ❌ Lỗi: {e}")

    if all_features:
        result_df = pd.DataFrame(all_features)
        output_path = os.path.join(data_dir, output_file)
        result_df.to_csv(output_path, index=False)
        print(f"\n✅ Đã lưu {len(result_df)} features vào {output_path}")
        print(f"📊 Columns: {list(result_df.columns)}")

        # In thống kê tóm tắt
        print("\n📈 Thống kê tóm tắt:")
        numeric_cols = ['mean_hold_time', 'mean_flight_time', 'cv_flight_time', 'typing_speed']
        for col in numeric_cols:
            if col in result_df.columns:
                print(f"  {col}: mean={result_df[col].mean():.2f}, "
                      f"std={result_df[col].std():.2f}, "
                      f"min={result_df[col].min():.2f}, "
                      f"max={result_df[col].max():.2f}")
    else:
        print("\n❌ Không trích xuất được feature nào.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Feature Extraction"
    )
    parser.add_argument('-d', '--data-dir', default='data',
                        help='Thư mục chứa file keystroke log')
    parser.add_argument('-o', '--output', default='features_dataset.csv',
                        help='Tên file output')
    parser.add_argument('-w', '--window-size', type=int, default=40,
                        help='Kích thước cửa sổ (số phím)')
    parser.add_argument('-s', '--slide-step', type=int, default=20,
                        help='Bước trượt')
    parser.add_argument('-l', '--label', default='human',
                        help='Nhãn dữ liệu (human/injection)')

    args = parser.parse_args()

    print("=" * 42)
    print("  KDS Guard - Feature Extraction")
    print("=" * 42)
    print()

    process_all_logs(
        data_dir=args.data_dir,
        output_file=args.output,
        window_size=args.window_size,
        slide_step=args.slide_step,
        label=args.label,
    )
