"""Extract real data stats for dashboard replacement."""
import pandas as pd
import numpy as np
import json
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

df = pd.read_csv('data/features_dataset.csv')

rust = df[df['source'] == 'self_collected_rust']
human = df[df['label'] == 'human']
inj = df[df['label'] == 'injection']

print('=== REAL DATA STATS ===')

print('\n--- Per User (Rust Collected) ---')
for uid, g in rust.groupby('user_id'):
    mft = g['mean_flight_time'].mean()
    mht = g['mean_hold_time'].mean()
    spd = g['typing_speed'].mean()
    cv = g['cv_flight_time'].mean()
    burst = g['max_burst_length'].mean()
    mod = g['modifier_ratio'].mean() * 100
    iqr = g['iqr_hold_time'].mean()
    print(f"  {uid}: {len(g)}w | ft={mft:.1f} ht={mht:.1f} spd={spd:.1f} cv={cv:.3f} burst={burst:.0f} mod={mod:.1f}% iqr={iqr:.1f}")

print('\n--- Human Average (all) ---')
h = human
cols = ['mean_flight_time', 'mean_hold_time', 'typing_speed', 'cv_flight_time',
        'max_burst_length', 'modifier_ratio', 'iqr_hold_time', 'min_flight_time',
        'median_hold_time', 'std_flight_time', 'std_hold_time']
for c in cols:
    v = h[c].mean()
    print(f"  {c}: {v:.4f}")

print('\n--- Rust Human Average ---')
for c in cols:
    v = rust[c].mean()
    print(f"  {c}: {v:.4f}")

print('\n--- Injection Average ---')
for c in cols:
    v = inj[c].mean()
    print(f"  {c}: {v:.4f}")

print('\n--- Dataset Composition ---')
for src, cnt in df['source'].value_counts().items():
    print(f"  {src}: {cnt}")

print(f"\nTotal unique users: {df['user_id'].nunique()}")
print(f"Rust users: {rust['user_id'].nunique()}")
print(f"Total samples: {len(df)}")
print(f"Human: {len(human)}, Injection: {len(inj)}")

# Eval report
try:
    with open('data/evaluation_report.json') as f:
        report = json.load(f)
    print('\n--- Evaluation Report ---')
    print(json.dumps(report, indent=2))
except:
    print("No evaluation report found")
