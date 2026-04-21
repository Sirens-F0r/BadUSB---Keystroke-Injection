"""
Dataset Integration Script cho KDS Guard
Tích hợp 3 nguồn dữ liệu keystroke dynamics:

  Nguồn 1: CMU Keystroke Dynamics Benchmark Dataset
    - 51 users, mỗi user 400 password entries
    - File: data/raw/DSL-StrongPasswordData.csv
    - Chạy: python scripts/integrate_datasets.py --cmu

  Nguồn 2: Tự thu thập bằng Python Collector (pynput)
    - File: data/keystroke_log_<user>_<session>_<ts>.csv
    - Thu thập: python scripts/collect_keystrokes.py -u user_001 -s 1 --duration 300
    - Chạy: python scripts/integrate_datasets.py --self-collect

  Nguồn 3: Thu thập bằng Rust Collector (kds_guard.exe)
    - File: data/raw/kds_rust_<user>_<session>_<ts>.csv  (đặt vào data/raw/rust/)
    - Thu thập: kds_guard.exe --collect-only --log-keys -u user_001 -o data
    - Chạy: python scripts/integrate_datasets.py --rust-collect

  Gộp tất cả:
    python scripts/integrate_datasets.py --all
    hoặc từng bước:
    python scripts/integrate_datasets.py --cmu --self-collect --rust-collect --merge
"""

import os
import sys
import glob
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional, List

# Fix Unicode output trên Windows CMD (cp1252 → utf-8)
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import pandas as pd
import numpy as np


# ─────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────

FEATURE_COLUMNS = [
    'mean_hold_time', 'std_hold_time', 'median_hold_time', 'iqr_hold_time',
    'p5_hold_time', 'p95_hold_time',
    'mean_flight_time', 'std_flight_time', 'median_flight_time', 'iqr_flight_time',
    'p5_flight_time', 'p95_flight_time', 'min_flight_time',
    'cv_flight_time', 'typing_speed',
    'modifier_ratio', 'special_ratio',
    'has_burst', 'max_burst_length',
]

META_COLUMNS = [
    'window_start_ms', 'window_end_ms', 'num_keys',
    'session_id', 'user_id', 'label', 'source',
]

DATA_DIR   = "data"
RAW_DIR    = "data/raw"
RUST_DIR   = "data/raw/rust"    # ← Rust collector output vào đây


# ─────────────────────────────────────────────────────────────
# HELPER: tính features từ hold_times + flight_times
# ─────────────────────────────────────────────────────────────

def _compute_features(ht: np.ndarray, ft: np.ndarray, meta: dict) -> dict:
    """Tính toán 22 feature vectors từ mảng hold_times và flight_times."""
    if len(ht) == 0:
        ht = np.array([100.0])
    if len(ft) == 0:
        ft = np.array([100.0])

    # Burst detection
    max_burst = 0
    current_burst = 0
    for f in ft:
        if f < 50:
            current_burst += 1
            max_burst = max(max_burst, current_burst)
        else:
            current_burst = 0

    total_time_s = ft.sum() / 1000.0
    typing_speed = len(ft) / total_time_s if total_time_s > 0 else 0
    cv_ft = float(np.std(ft) / np.mean(ft)) if np.mean(ft) > 0 else 0.0

    return {
        **meta,
        'mean_hold_time':   float(np.mean(ht)),
        'std_hold_time':    float(np.std(ht)),
        'median_hold_time': float(np.median(ht)),
        'iqr_hold_time':    float(np.percentile(ht, 75) - np.percentile(ht, 25)),
        'p5_hold_time':     float(np.percentile(ht, 5)),
        'p95_hold_time':    float(np.percentile(ht, 95)),
        'mean_flight_time':   float(np.mean(ft)),
        'std_flight_time':    float(np.std(ft)),
        'median_flight_time': float(np.median(ft)),
        'iqr_flight_time':    float(np.percentile(ft, 75) - np.percentile(ft, 25)),
        'p5_flight_time':     float(np.percentile(ft, 5)),
        'p95_flight_time':    float(np.percentile(ft, 95)),
        'min_flight_time':    float(np.min(ft)),
        'cv_flight_time':  cv_ft,
        'typing_speed':    typing_speed,
        'modifier_ratio':  meta.pop('_modifier_ratio', 0.0),
        'special_ratio':   meta.pop('_special_ratio', 0.0),
        'has_burst':       bool(max_burst >= 10),
        'max_burst_length': int(max_burst),
    }


# ─────────────────────────────────────────────────────────────
# 1. NGUỒN 1: CMU BENCHMARK DATASET
# ─────────────────────────────────────────────────────────────

def convert_cmu_dataset(
    input_path: Optional[str] = None,
    output_dir: str = DATA_DIR,
) -> pd.DataFrame:
    """
    Chuyển đổi CMU Keystroke Dynamics Benchmark Dataset.

    CMU format:
      subject, sessionIndex, rep,
      H.period  = Hold time key '.' (seconds)
      DD.period.t = Down-Down time '.' → 't' (seconds)
      UD.period.t = Up-Down time (seconds)
    """
    # Tìm file nếu không chỉ định
    if input_path is None:
        candidates = [
            os.path.join(RAW_DIR, "DSL-StrongPasswordData.csv"),
            os.path.join(RAW_DIR, "DSL-StrongPasswordNet.csv"),
            os.path.join(DATA_DIR, "DSL-StrongPasswordData.csv"),
        ]
        for c in candidates:
            if os.path.exists(c):
                input_path = c
                break

    if not input_path or not os.path.exists(input_path):
        print("❌ Không tìm thấy file CMU dataset!")
        print("   Hướng dẫn:")
        print("   1. Truy cập: https://www.cs.cmu.edu/~keystroke/")
        print("   2. Tải file: DSL-StrongPasswordData.csv")
        print(f"   3. Đặt vào: {RAW_DIR}/DSL-StrongPasswordData.csv")
        return pd.DataFrame()

    print(f"\n{'='*60}")
    print("📂 [NGUỒN 1] CMU Keystroke Dynamics Benchmark")
    print(f"{'='*60}")
    print(f"   File: {input_path}")

    try:
        df = pd.read_csv(input_path)
    except Exception as e:
        print(f"❌ Lỗi đọc file: {e}")
        return pd.DataFrame()

    print(f"   Rows: {len(df)}")
    print(f"   Users: {df['subject'].nunique()}")
    print(f"   Sessions/user: ~{df.groupby('subject').size().mean():.0f}")

    # Phân loại cột
    h_cols  = [c for c in df.columns if c.startswith('H.')]
    dd_cols = [c for c in df.columns if c.startswith('DD.')]

    print(f"   Hold cols: {len(h_cols)} | Down-Down cols: {len(dd_cols)}")

    features_list = []
    skipped: int = 0

    for _, row in df.iterrows():
        # CMU lưu giây → chuyển sang ms
        hold_times   = [row[c] * 1000 for c in h_cols  if pd.notna(row[c]) and row[c] > 0]
        flight_times = [row[c] * 1000 for c in dd_cols if pd.notna(row[c]) and row[c] > 0]

        if len(hold_times) < 3 or len(flight_times) < 3:
            skipped += 1
            continue

        ht = np.array(hold_times)
        ft = np.array(flight_times)

        meta = {
            'session_id':      f"cmu_{row['subject']}_{row.get('sessionIndex', 0)}_{row.get('rep', 0)}",
            'user_id':         f"cmu_{row['subject']}",
            'label':           'human',
            'source':          'cmu_benchmark',
            'window_start_ms': 0.0,
            'window_end_ms':   float(ft.sum()),
            'num_keys':        int(len(ht)),
            '_modifier_ratio': 0.0,   # CMU chỉ có password → không có modifier
            '_special_ratio':  0.0,
        }

        feat = _compute_features(ht, ft, meta)
        features_list.append(feat)

    result = pd.DataFrame(features_list)
    print(f"   ✅ Converted: {len(result)} feature vectors (skipped: {skipped})")

    # Lưu file
    output_path = os.path.join(output_dir, "features_cmu.csv")
    result.to_csv(output_path, index=False)
    print(f"   💾 Saved: {output_path}")

    return result


# ─────────────────────────────────────────────────────────────
# 2. NGUỒN 2: PYTHON COLLECTOR (pynput)
# ─────────────────────────────────────────────────────────────

def convert_self_collected(
    data_dir: str = DATA_DIR,
    output_dir: str = DATA_DIR,
) -> pd.DataFrame:
    """
    Convert dữ liệu tự thu thập bằng Python collector (pynput).
    Đọc tất cả file: data/keystroke_log_<user>_<session>_<ts>.csv
    (trừ injection/demo/test/badusb)

    Cách thu thập:
      python scripts/collect_keystrokes.py -u user_001 -s 1 --duration 300
      python scripts/collect_keystrokes.py -u user_001 -s 2 --duration 180
      python scripts/collect_keystrokes.py -u user_002 -s 1 --duration 300
    """
    print(f"\n{'='*60}")
    print("📂 [NGUỒN 2] Self-collected (Python pynput collector)")
    print(f"{'='*60}")

    log_files = glob.glob(os.path.join(data_dir, "keystroke_log_*.csv"))

    # Loại bỏ file injection / demo / test
    exclude_kw = ['injection', 'demo', 'test', 'badusb', 'synthetic']
    real_files = [
        f for f in log_files
        if not any(kw in os.path.basename(f).lower() for kw in exclude_kw)
    ]

    if not real_files:
        print("   ⚠️  Chưa có file keystroke log nào từ Python collector.")
        print("   ──────────────────────────────────────────────────")
        print("   Cách thu thập (pip install pynput trước):")
        print("   python scripts/collect_keystrokes.py -u user_001 -s 1 --duration 300")
        print("   python scripts/collect_keystrokes.py -u user_001 -s 2 --duration 180")
        print("   python scripts/collect_keystrokes.py -u user_001 -s 3 --duration 120")
        print("   ... lặp lại cho user_002, user_003, ...")
        print("   ──────────────────────────────────────────────────")
        print("   Sau đó chạy lại: python scripts/integrate_datasets.py --self-collect")
        return pd.DataFrame()

    print(f"   Found: {len(real_files)} file(s)")
    all_features = []

    for filepath in sorted(real_files):
        fname = os.path.basename(filepath)
        print(f"   📄 {fname} ...", end=" ")

        try:
            df = pd.read_csv(filepath)

            if len(df) < 80:
                print(f"⚠️  Too few events ({len(df)}), skip")
                continue

            session_id = df['session_id'].iloc[0] if 'session_id' in df.columns else fname
            user_id    = df['user_id'].iloc[0]    if 'user_id'    in df.columns else 'unknown'

            feats = _compute_window_features(df, session_id=session_id,
                                              user_id=user_id, label='human',
                                              source='self_collected_python')
            all_features.extend(feats)
            print(f"✅ {len(feats)} windows")

        except Exception as e:
            print(f"❌ Error: {e}")

    if not all_features:
        print("   ❌ Không extract được window nào.")
        return pd.DataFrame()

    result = pd.DataFrame(all_features)
    print(f"\n   ✅ Total: {len(result)} feature vectors (Python collector)")

    output_path = os.path.join(output_dir, "features_self_collected.csv")
    result.to_csv(output_path, index=False)
    print(f"   💾 Saved: {output_path}")

    return result


# ─────────────────────────────────────────────────────────────
# 3. NGUỒN 3: RUST COLLECTOR (kds_guard.exe)
# ─────────────────────────────────────────────────────────────

def convert_rust_collected(
    rust_dir: str = RUST_DIR,
    data_dir: str = DATA_DIR,
    output_dir: str = DATA_DIR,
) -> pd.DataFrame:
    """
    Convert dữ liệu thu thập bằng Rust collector (kds_guard.exe).
    Đọc file CSV từ thư mục: data/raw/rust/

    Cách thu thập (sau khi build Rust thành công):
      cd kds_guard
      cargo build --release

      # Thu thập (mỗi người dùng)
      target\\release\\kds_guard.exe --collect-only --log-keys -u user_001 -o ../data/raw/rust
      target\\release\\kds_guard.exe --collect-only --log-keys -u user_002 -o ../data/raw/rust

    Format file Rust giống Python collector:
      timestamp_ms, key_code, event_type, key_class, is_modifier, session_id, user_id
    """
    print(f"\n{'='*60}")
    print("📂 [NGUỒN 3] Rust Collector (kds_guard.exe)")
    print(f"{'='*60}")

    # Tạo thư mục nếu chưa có
    os.makedirs(rust_dir, exist_ok=True)

    # Tìm file CSV trong thư mục rust
    rust_files = glob.glob(os.path.join(rust_dir, "*.csv"))
    # Cũng quét file keystroke_log từ data_dir có suffix _rust
    rust_files += glob.glob(os.path.join(data_dir, "keystroke_log_rust_*.csv"))
    rust_files = list(set(rust_files))  # deduplicate

    if not rust_files:
        print(f"   ⚠️  Chưa có file nào từ Rust collector.")
        print(f"   ──────────────────────────────────────────────────")
        print(f"   Thư mục chờ file: {os.path.abspath(rust_dir)}")
        print(f"   Cách thu thập (cần build Rust trước):")
        print(f"   1. cd kds_guard && cargo build --release")
        print(f"   2. target\\release\\kds_guard.exe --collect-only --log-keys -u user_001 -o {rust_dir}")
        print(f"   3. Lặp lại cho user_002, user_003, ...")
        print(f"   ──────────────────────────────────────────────────")
        print(f"   Sau đó chạy lại: python scripts/integrate_datasets.py --rust-collect")
        return pd.DataFrame()

    print(f"   Found: {len(rust_files)} file(s)")
    all_features = []

    for filepath in sorted(rust_files):
        fname = os.path.basename(filepath)
        print(f"   📄 {fname} ...", end=" ")

        try:
            df = pd.read_csv(filepath)

            # ── Auto-detect format thay thế ──
            if _is_alternative_format(df):
                print(f"(alt format detected) ", end="")
                df = _convert_alternative_format(df, filename=fname)

            if len(df) < 80:
                print(f"⚠️  Too few events ({len(df)}), skip")
                continue

            session_id = df['session_id'].iloc[0] if 'session_id' in df.columns else fname
            user_id    = df['user_id'].iloc[0]    if 'user_id'    in df.columns else 'unknown'

            feats = _compute_window_features(df, session_id=session_id,
                                              user_id=user_id, label='human',
                                              source='self_collected_rust')
            all_features.extend(feats)
            print(f"✅ {len(feats)} windows")

        except Exception as e:
            print(f"❌ Error: {e}")

    if not all_features:
        print("   ❌ Không extract được window nào.")
        return pd.DataFrame()

    result = pd.DataFrame(all_features)
    print(f"\n   ✅ Total: {len(result)} feature vectors (Rust collector)")

    output_path = os.path.join(output_dir, "features_rust_collected.csv")
    result.to_csv(output_path, index=False)
    print(f"   💾 Saved: {output_path}")

    return result


# ─────────────────────────────────────────────────────────────
# HELPER: Auto-detect & convert alternative CSV formats
# (format từ web collector / tool khác của bạn bè)
# ─────────────────────────────────────────────────────────────

# Danh sách modifier keys để phân loại
_MODIFIER_KEYS = {
    'shift_l', 'shift_r', 'shift', 'ctrl_l', 'ctrl_r', 'control',
    'alt_l', 'alt_r', 'alt', 'win_l', 'win_r', 'meta', 'meta_l', 'meta_r',
    'capslock', 'caps_lock', 'numlock', 'scrolllock',
}

_SPECIAL_KEYS = {
    'backspace', 'tab', 'enter', 'return', 'escape', 'esc',
    'delete', 'insert', 'home', 'end', 'pageup', 'pagedown',
    'up', 'down', 'left', 'right',
    'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
    'space', 'semicolon', 'comma', 'period', 'slash', 'backslash',
    'bracketleft', 'bracketright', 'quote', 'backquote', 'minus', 'equal',
    'printscreen', 'pause', 'menu',
}


def _convert_alternative_format(df: pd.DataFrame, filename: str = "") -> pd.DataFrame:
    """
    Chuyển đổi format CSV thay thế sang format chuẩn.

    Format thay thế (từ web collector / tool bạn bè):
      Lan_Go, Key, Event_Type, Dwell_Time_ms, Flight_Time_ms, Timestamp

    Format chuẩn (hệ thống yêu cầu):
      timestamp_ms, key_code, event_type, key_class, is_modifier, session_id, user_id
    """
    converted = pd.DataFrame()

    # Timestamp → timestamp_ms
    converted['timestamp_ms'] = df['Timestamp'].astype(float)

    # Key → key_code (giữ nguyên tên phím)
    converted['key_code'] = df['Key'].astype(str).str.strip()

    # Event_Type: KeyDown→down, KeyUp→up
    converted['event_type'] = df['Event_Type'].str.replace('KeyDown', 'down').str.replace('KeyUp', 'up')

    # Phân loại key_class dựa trên tên phím
    def classify_key(key: str) -> str:
        k = key.lower().strip()
        if k in _MODIFIER_KEYS:
            return 'modifier'
        if k in _SPECIAL_KEYS:
            return 'special'
        if len(k) == 1 and k.isdigit():
            return 'digit'
        if len(k) == 1 and k.isalpha():
            return 'alpha'
        return 'special'

    converted['key_class'] = converted['key_code'].apply(classify_key)

    # is_modifier
    converted['is_modifier'] = converted['key_code'].apply(
        lambda k: k.lower().strip() in _MODIFIER_KEYS
    )

    # session_id từ cột Lan_Go
    lan_go = df['Lan_Go'].astype(str).iloc[0] if 'Lan_Go' in df.columns else '1'
    # user_id từ tên file (loại bỏ extension)
    user_id = Path(filename).stem if filename else 'unknown'
    # Làm sạch user_id
    user_id = user_id.strip().replace(' ', '_').lower()

    converted['session_id'] = f"{user_id}_lan{lan_go}"
    converted['user_id'] = user_id

    # Sort theo timestamp
    converted = converted.sort_values('timestamp_ms').reset_index(drop=True)

    return converted


def _is_alternative_format(df: pd.DataFrame) -> bool:
    """Kiểm tra xem file CSV có phải format thay thế không."""
    alt_columns = {'Lan_Go', 'Key', 'Event_Type', 'Timestamp'}
    return alt_columns.issubset(set(df.columns))


# ─────────────────────────────────────────────────────────────
# HELPER: Sliding window feature extraction
# (dùng chung cho Nguồn 2 và Nguồn 3)
# ─────────────────────────────────────────────────────────────

def _compute_window_features(
    df: pd.DataFrame,
    window_size: int = 40,
    slide_step:  int = 20,
    session_id:  str = "unknown",
    user_id:     str = "unknown",
    label:       str = "human",
    source:      str = "self_collected",
) -> list:
    """
    Tính features theo cửa sổ trượt từ raw keystroke log CSV.

    Hỗ trợ 2 format:
      Format chuẩn: timestamp_ms, key_code, event_type (down/up), ...
      Format thay thế: Lan_Go, Key, Event_Type (KeyDown/KeyUp), Dwell_Time_ms, Flight_Time_ms, Timestamp
    """
    required = ['timestamp_ms', 'event_type']
    for col in required:
        if col not in df.columns:
            print(f"      ❌ Missing column: {col}")
            return []

    downs = df[df['event_type'] == 'down'].copy().sort_values('timestamp_ms').reset_index(drop=True)
    ups   = df[df['event_type'] == 'up'].copy().sort_values('timestamp_ms').reset_index(drop=True)

    features_list = []

    for start_idx in range(0, max(1, len(downs) - window_size + 1), slide_step):
        window = downs.iloc[start_idx : start_idx + window_size]
        if len(window) < window_size:
            continue

        t_start = window.iloc[0]['timestamp_ms']
        t_end   = window.iloc[-1]['timestamp_ms']

        # ── Hold Times ──
        hold_times = []
        for _, row in window.iterrows():
            if 'key_code' not in df.columns:
                continue
            matching = ups[
                (ups['key_code'] == row['key_code']) &
                (ups['timestamp_ms'] > row['timestamp_ms'])
            ]
            if not matching.empty:
                ht = matching.iloc[0]['timestamp_ms'] - row['timestamp_ms']
                if 0 < ht < 2000:
                    hold_times.append(ht)

        # ── Flight Times (Down-Down) ──
        timestamps = window['timestamp_ms'].values
        flight_times = [
            timestamps[i+1] - timestamps[i]
            for i in range(len(timestamps) - 1)
            if 0 < timestamps[i+1] - timestamps[i] < 5000
        ]

        if not hold_times or not flight_times:
            continue

        # ── Modifier & Special ratio ──
        mod_ratio  = 0.0
        spec_ratio = 0.0
        if 'is_modifier' in window.columns:
            try:
                mod_ratio = window['is_modifier'].astype(bool).sum() / len(window)
            except Exception:
                pass
        if 'key_class' in window.columns:
            spec_ratio = (window['key_class'] == 'special').sum() / len(window)

        duration_s   = (t_end - t_start) / 1000.0
        typing_speed = len(window) / duration_s if duration_s > 0 else 0

        meta = {
            'window_start_ms': float(t_start),
            'window_end_ms':   float(t_end),
            'num_keys':        int(len(window)),
            'session_id':      session_id,
            'user_id':         user_id,
            'label':           label,
            'source':          source,
            '_modifier_ratio': mod_ratio,
            '_special_ratio':  spec_ratio,
        }

        feat = _compute_features(
            np.array(hold_times),
            np.array(flight_times),
            meta
        )
        # typing_speed override (window-based)
        feat['typing_speed'] = typing_speed
        features_list.append(feat)

    return features_list


# ─────────────────────────────────────────────────────────────
# MERGE: Gộp tất cả dataset
# ─────────────────────────────────────────────────────────────

def merge_all_datasets(
    data_dir: str = DATA_DIR,
    output_file: str = "features_dataset.csv",
) -> pd.DataFrame:
    """
    Gộp tất cả nguồn dữ liệu thành 1 file features_dataset.csv.

    Thứ tự ưu tiên:
      1. features_cmu.csv          (CMU Benchmark)
      2. features_self_collected.csv  (Python collector)
      3. features_rust_collected.csv  (Rust collector)
      4. features_demo.csv / features_dataset_demo.csv (synthetic)
      5. features_injection.csv    (injection simulation)
    """
    print(f"\n{'='*60}")
    print("🔄 Merging all datasets...")
    print(f"{'='*60}")

    all_dfs = []

    def _try_load(path: str, label: str):
        if os.path.exists(path):
            try:
                d = pd.read_csv(path)
                print(f"   ✅ {label}: {len(d)} rows  ← {os.path.basename(path)}")
                return d
            except Exception as e:
                print(f"   ❌ {label}: Error reading ({e})")
        else:
            print(f"   ℹ️  {label}: Not found ({os.path.basename(path)})")
        return None

    # 1. CMU
    d = _try_load(os.path.join(data_dir, "features_cmu.csv"), "CMU Benchmark")
    if d is not None:
        all_dfs.append(d)

    # 2. Python collector
    d = _try_load(os.path.join(data_dir, "features_self_collected.csv"), "Python Collector")
    if d is not None:
        all_dfs.append(d)

    # 3. Rust collector
    d = _try_load(os.path.join(data_dir, "features_rust_collected.csv"), "Rust Collector")
    if d is not None:
        all_dfs.append(d)

    # 4. Synthetic/demo
    for demo_name in ["features_demo.csv", "features_dataset_demo.csv"]:
        d = _try_load(os.path.join(data_dir, demo_name), "Demo/Synthetic")
        if d is not None:
            if 'source' not in d.columns:
                d['source'] = 'demo_synthetic'
            all_dfs.append(d)
            break

    # 5. Injection
    d = _try_load(os.path.join(data_dir, "features_injection.csv"), "Injection Simulated")
    if d is not None:
        all_dfs.append(d)

    if not all_dfs:
        print("\n   ❌ Không có dataset nào để gộp!")
        print("   Hãy chạy ít nhất 1 trong các lệnh sau trước:")
        print("     python scripts/integrate_datasets.py --cmu")
        print("     python scripts/integrate_datasets.py --self-collect")
        print("     python scripts/integrate_datasets.py --rust-collect")
        return pd.DataFrame()

    # Merge
    merged = pd.concat(all_dfs, ignore_index=True)

    # Đảm bảo cột label
    if 'label' not in merged.columns:
        merged['label'] = 'human'

    # Backup file cũ
    output_path = os.path.join(data_dir, output_file)
    if os.path.exists(output_path):
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = output_path.replace('.csv', f'_backup_{ts}.csv')
        os.rename(output_path, backup)
        print(f"\n   📦 Backup: {os.path.basename(backup)}")

    merged.to_csv(output_path, index=False)

    print(f"\n   ✅ Merged → {output_path}")
    print(f"   Total samples: {len(merged)}")

    print(f"\n   Labels:")
    for lbl, cnt in merged['label'].value_counts().items():
        pct = cnt / len(merged) * 100
        print(f"      {lbl}: {cnt:,} ({pct:.1f}%)")

    if 'source' in merged.columns:
        print(f"\n   Sources:")
        for src, cnt in merged['source'].value_counts().items():
            print(f"      {src}: {cnt:,}")

    return merged


# ─────────────────────────────────────────────────────────────
# HELPER: Tách injection từ features_dataset.csv cũ nếu cần
# ─────────────────────────────────────────────────────────────

def prepare_existing_dataset(data_dir: str = DATA_DIR):
    """
    Tách features_dataset.csv hiện tại thành:
      - features_demo.csv        (human synthetic)
      - features_injection.csv   (injection)
    Để merge function có thể dùng lại.
    """
    existing = os.path.join(data_dir, "features_dataset.csv")
    if not os.path.exists(existing):
        return

    df = pd.read_csv(existing)
    if 'label' not in df.columns:
        return

    # Tách injection
    inj = df[df['label'] == 'injection'].copy()
    demo = df[df['label'] == 'human'].copy()

    inj_path  = os.path.join(data_dir, "features_injection.csv")
    demo_path = os.path.join(data_dir, "features_demo.csv")

    if not os.path.exists(inj_path) and len(inj) > 0:
        if 'source' not in inj.columns:
            inj['source'] = 'injection_simulated'
        inj.to_csv(inj_path, index=False)
        print(f"   📤 Extracted injection: {len(inj)} rows → {inj_path}")

    if not os.path.exists(demo_path) and len(demo) > 0:
        if 'source' not in demo.columns:
            demo['source'] = 'demo_synthetic'
        demo.to_csv(demo_path, index=False)
        print(f"   📤 Extracted demo human: {len(demo)} rows → {demo_path}")


# ─────────────────────────────────────────────────────────────
# STATUS: Hiển thị trạng thái hiện tại
# ─────────────────────────────────────────────────────────────

def show_status(data_dir: str = DATA_DIR):
    """Hiển thị trạng thái dataset hiện tại."""
    print(f"\n{'='*60}")
    print("📊 Dataset Status")
    print(f"{'='*60}")

    files = {
        "features_dataset.csv":       "🗂️  Dataset CHÍNH (merged)",
        "features_cmu.csv":           "1️⃣  CMU Benchmark",
        "features_self_collected.csv":"2️⃣  Python Collector",
        "features_rust_collected.csv":"3️⃣  Rust Collector",
        "features_demo.csv":          "🎭 Demo/Synthetic (human)",
        "features_injection.csv":     "💉 Injection Simulated",
    }

    for fname, label in files.items():
        fpath = os.path.join(data_dir, fname)
        if os.path.exists(fpath):
            try:
                df = pd.read_csv(fpath)
                lbl_info = ""
                if 'label' in df.columns:
                    lbl_info = " | " + " + ".join(
                        f"{k}:{v}" for k, v in df['label'].value_counts().items()
                    )
                print(f"   {label}: {len(df):,} rows{lbl_info}")
            except Exception:
                print(f"   {label}: [ERROR reading file]")
        else:
            print(f"   {label}: ─ (chưa có)")

    print()
    # Kiểm tra raw rust dir
    rust_files = glob.glob(os.path.join(RUST_DIR, "*.csv"))
    print(f"   Rust raw files in {RUST_DIR}/: {len(rust_files)} file(s)")
    py_files = glob.glob(os.path.join(data_dir, "keystroke_log_*.csv"))
    exclude_kw = ['injection', 'demo', 'test', 'badusb']
    real_py = [f for f in py_files if not any(kw in f.lower() for kw in exclude_kw)]
    print(f"   Python collector files in {data_dir}/: {len(real_py)} file(s)")
    print(f"{'='*60}\n")


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="🔗 KDS Guard – Dataset Integration (3 nguồn)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ:
  # Xem trạng thái
  python scripts/integrate_datasets.py --status

  # Chuyển đổi CMU và gộp
  python scripts/integrate_datasets.py --cmu --merge

  # Chuyển đổi Python collector và gộp
  python scripts/integrate_datasets.py --self-collect --merge

  # Chuyển đổi Rust collector và gộp
  python scripts/integrate_datasets.py --rust-collect --merge

  # Chạy tất cả
  python scripts/integrate_datasets.py --all
        """
    )

    parser.add_argument('--cmu',          action='store_true',
                        help='[Nguồn 1] Chuyển đổi CMU dataset')
    parser.add_argument('--cmu-path',     default=None,
                        help='Đường dẫn file CMU CSV (mặc định: data/raw/DSL-StrongPasswordData.csv)')
    parser.add_argument('--self-collect', action='store_true',
                        help='[Nguồn 2] Chuyển đổi Python collector logs')
    parser.add_argument('--rust-collect', action='store_true',
                        help='[Nguồn 3] Chuyển đổi Rust collector logs (từ data/raw/rust/)')
    parser.add_argument('--merge',        action='store_true',
                        help='Gộp tất cả dataset thành features_dataset.csv')
    parser.add_argument('--all',          action='store_true',
                        help='Chạy tất cả: --cmu + --self-collect + --rust-collect + --merge')
    parser.add_argument('--status',       action='store_true',
                        help='Hiển thị trạng thái dataset hiện tại')
    parser.add_argument('-d', '--data-dir', default=DATA_DIR,
                        help=f'Thư mục dữ liệu (mặc định: {DATA_DIR})')

    args = parser.parse_args()

    print("╔════════════════════════════════════════════════════╗")
    print("║  🔗 KDS Guard – Dataset Integration               ║")
    print("║  3 nguồn: CMU | Python Collector | Rust Collector ║")
    print("╚════════════════════════════════════════════════════╝")

    os.makedirs(args.data_dir, exist_ok=True)
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(RUST_DIR, exist_ok=True)

    # Tách dataset cũ nếu cần
    prepare_existing_dataset(args.data_dir)

    if args.status or (not any([args.cmu, args.self_collect, args.rust_collect, args.merge, args.all])):
        show_status(args.data_dir)
        print("Dùng --help để xem các tùy chọn.\n")
        return

    if args.all:
        args.cmu = args.self_collect = args.rust_collect = args.merge = True

    if args.cmu:
        convert_cmu_dataset(input_path=args.cmu_path, output_dir=args.data_dir)

    if args.self_collect:
        result = convert_self_collected(data_dir=args.data_dir, output_dir=args.data_dir)

    if args.rust_collect:
        result = convert_rust_collected(rust_dir=RUST_DIR, data_dir=args.data_dir, output_dir=args.data_dir)

    if args.merge:
        merge_all_datasets(data_dir=args.data_dir)

    show_status(args.data_dir)

    print("\n✅ Hoàn tất!")
    print("\nBước tiếp theo:")
    print("  python scripts/train_model.py    # Retrain model")
    print("  python scripts/evaluate.py       # Đánh giá lại")
    print("  python scripts/visualize.py      # Tạo biểu đồ mới")


if __name__ == "__main__":
    main()
