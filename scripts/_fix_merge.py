"""Script tam: tach injection, merge lai dung cach."""
import pandas as pd
import os

data_dir = "data"

# 1. Doc features_dataset.csv hien tai (demo data 634 rows)
demo_path = os.path.join(data_dir, "features_dataset.csv")
df_demo = pd.read_csv(demo_path)
print(f"[1] Demo data: {len(df_demo)} rows")
print(f"    Labels: {df_demo['label'].value_counts().to_dict()}")

# 2. Tach injection ra file rieng
inj = df_demo[df_demo['label'] == 'injection'].copy()
if 'source' not in inj.columns:
    inj['source'] = 'injection_simulated'
inj.to_csv(os.path.join(data_dir, "features_injection.csv"), index=False)
print(f"[2] Saved features_injection.csv: {len(inj)} rows")

# 3. Tach demo human ra file rieng
human_demo = df_demo[df_demo['label'] == 'human'].copy()
if 'source' not in human_demo.columns:
    human_demo['source'] = 'demo_synthetic'
human_demo.to_csv(os.path.join(data_dir, "features_demo.csv"), index=False)
print(f"[3] Saved features_demo.csv: {len(human_demo)} rows")

# 4. Doc CMU data
cmu_path = os.path.join(data_dir, "features_cmu.csv")
df_cmu = pd.read_csv(cmu_path)
print(f"[4] CMU data: {len(df_cmu)} rows")

# 5. Doc self-collected
self_path = os.path.join(data_dir, "features_self_collected.csv")
dfs = []
if os.path.exists(self_path):
    df_self = pd.read_csv(self_path)
    dfs.append(df_self)
    print(f"[5] Self-collected: {len(df_self)} rows")
else:
    print("[5] No self-collected data yet")

# 6. Merge tat ca
dfs = [df_cmu, human_demo, inj] + dfs
merged = pd.concat(dfs, ignore_index=True)

# Dam bao label
if 'label' not in merged.columns:
    merged['label'] = 'human'

merged.to_csv(os.path.join(data_dir, "features_dataset.csv"), index=False)

print(f"\n=== MERGED DATASET ===")
print(f"Total: {len(merged)} samples")
print(f"Labels:")
for label, count in merged['label'].value_counts().items():
    pct = count / len(merged) * 100
    print(f"  {label}: {count} ({pct:.1f}%)")
if 'source' in merged.columns:
    print(f"Sources:")
    for src, count in merged['source'].value_counts().items():
        print(f"  {src}: {count}")
print("\nDone!")
