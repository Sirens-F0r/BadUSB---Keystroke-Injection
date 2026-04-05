# Tao bieu do phan tich keystroke dynamics

import os
import sys
import argparse

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import seaborn as sns

# Thiết lập style chung
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

FIGURE_DPI = 150
FIGURE_SIZE = (12, 8)


def setup_vietnamese_font():
    """Cấu hình font hỗ trợ tiếng Việt."""
    plt.rcParams['font.family'] = 'DejaVu Sans'
    plt.rcParams['axes.unicode_minus'] = False


def plot_distribution_comparison(df: pd.DataFrame, output_dir: str):
    """Biểu đồ phân phối Hold Time & Flight Time: Human vs Injection."""
    if 'label' not in df.columns:
        print("⚠️ Cần cột 'label' để so sánh")
        return

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Keystroke Dynamics: Human vs Injection', fontsize=16, fontweight='bold')

    features = [
        ('mean_hold_time', 'Mean Hold Time (ms)'),
        ('mean_flight_time', 'Mean Flight Time (ms)'),
        ('cv_flight_time', 'CV Flight Time'),
        ('typing_speed', 'Typing Speed (keys/s)'),
    ]

    for idx, (col, title) in enumerate(features):
        ax = axes[idx // 2][idx % 2]
        if col in df.columns:
            for label in df['label'].unique():
                subset = df[df['label'] == label][col].dropna()
                ax.hist(subset, bins=30, alpha=0.6, label=label, density=True)
            ax.set_title(title, fontsize=12)
            ax.set_xlabel(title)
            ax.set_ylabel('Density')
            ax.legend()

    plt.tight_layout()
    path = os.path.join(output_dir, 'distribution_comparison.png')
    plt.savefig(path, dpi=FIGURE_DPI, bbox_inches='tight')
    plt.close()
    print(f"  ✅ {path}")


def plot_scatter_cv_speed(df: pd.DataFrame, output_dir: str):
    """Scatter plot: CV vs Typing Speed (vùng phát hiện injection)."""
    if 'cv_flight_time' not in df.columns or 'typing_speed' not in df.columns:
        return

    fig, ax = plt.subplots(figsize=(10, 8))

    if 'label' in df.columns:
        colors = {'human': '#2ecc71', 'injection': '#e74c3c'}
        for label in df['label'].unique():
            subset = df[df['label'] == label]
            color = colors.get(label, '#3498db')
            ax.scatter(
                subset['cv_flight_time'], subset['typing_speed'],
                c=color, label=label, alpha=0.6, s=50, edgecolors='white', linewidth=0.5
            )
    else:
        ax.scatter(
            df['cv_flight_time'], df['typing_speed'],
            c='#3498db', alpha=0.6, s=50
        )

    # Vùng nghi ngờ injection
    ax.axhline(y=15, color='orange', linestyle='--', alpha=0.5, label='Speed threshold (15 k/s)')
    ax.axvline(x=0.15, color='orange', linestyle='--', alpha=0.5, label='CV threshold (0.15)')

    # Highlight vùng injection
    ax.fill_between([0, 0.15], [15, 15], [100, 100], alpha=0.1, color='red', label='Danger Zone')

    ax.set_xlabel('Coefficient of Variation (CV) - Flight Time', fontsize=12)
    ax.set_ylabel('Typing Speed (keys/second)', fontsize=12)
    ax.set_title('CV vs Typing Speed: Injection Detection Space', fontsize=14, fontweight='bold')
    ax.legend(loc='upper right')

    plt.tight_layout()
    path = os.path.join(output_dir, 'scatter_cv_speed.png')
    plt.savefig(path, dpi=FIGURE_DPI, bbox_inches='tight')
    plt.close()
    print(f"  ✅ {path}")


def plot_boxplot_comparison(df: pd.DataFrame, output_dir: str):
    """Boxplot so sánh features giữa human và injection."""
    if 'label' not in df.columns:
        return

    features = ['mean_hold_time', 'mean_flight_time', 'std_flight_time',
                'cv_flight_time', 'typing_speed', 'max_burst_length']
    available = [f for f in features if f in df.columns]

    if not available:
        return

    fig, axes = plt.subplots(2, 3, figsize=(16, 10))
    fig.suptitle('Feature Comparison: Human vs Injection', fontsize=16, fontweight='bold')

    palette = {'human': '#2ecc71', 'injection': '#e74c3c'}

    for idx, col in enumerate(available):
        ax = axes[idx // 3][idx % 3]
        sns.boxplot(data=df, x='label', y=col, ax=ax, palette=palette)
        ax.set_title(col.replace('_', ' ').title(), fontsize=11)
        ax.set_xlabel('')

    # Ẩn subplot thừa
    for idx in range(len(available), 6):
        axes[idx // 3][idx % 3].set_visible(False)

    plt.tight_layout()
    path = os.path.join(output_dir, 'boxplot_comparison.png')
    plt.savefig(path, dpi=FIGURE_DPI, bbox_inches='tight')
    plt.close()
    print(f"  ✅ {path}")


def plot_correlation_heatmap(df: pd.DataFrame, output_dir: str):
    """Heatmap tương quan giữa các features."""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    feature_cols = [c for c in numeric_cols if c not in
                    ['window_start_ms', 'window_end_ms', 'num_keys']]

    if len(feature_cols) < 3:
        return

    corr = df[feature_cols].corr()

    fig, ax = plt.subplots(figsize=(12, 10))
    mask = np.triu(np.ones_like(corr, dtype=bool))

    sns.heatmap(
        corr, mask=mask, annot=True, fmt='.2f', cmap='RdBu_r',
        center=0, square=True, linewidths=0.5, ax=ax,
        cbar_kws={'shrink': 0.8}
    )
    ax.set_title('Feature Correlation Heatmap', fontsize=14, fontweight='bold')

    plt.tight_layout()
    path = os.path.join(output_dir, 'correlation_heatmap.png')
    plt.savefig(path, dpi=FIGURE_DPI, bbox_inches='tight')
    plt.close()
    print(f"  ✅ {path}")


def plot_timeline_risk(df: pd.DataFrame, output_dir: str):
    """Timeline risk score theo thời gian."""
    if 'window_start_ms' not in df.columns:
        return

    fig, axes = plt.subplots(3, 1, figsize=(14, 10), sharex=True)
    fig.suptitle('Typing Behavior Over Time', fontsize=16, fontweight='bold')

    time_s = (df['window_start_ms'] - df['window_start_ms'].min()) / 1000.0

    # Typing speed
    if 'typing_speed' in df.columns:
        axes[0].plot(time_s, df['typing_speed'], color='#3498db', linewidth=1.5)
        axes[0].axhline(y=15, color='red', linestyle='--', alpha=0.5, label='Threshold')
        axes[0].set_ylabel('Speed (keys/s)')
        axes[0].set_title('Typing Speed')
        axes[0].legend()

    # CV Flight Time
    if 'cv_flight_time' in df.columns:
        axes[1].plot(time_s, df['cv_flight_time'], color='#e67e22', linewidth=1.5)
        axes[1].axhline(y=0.15, color='red', linestyle='--', alpha=0.5, label='Threshold')
        axes[1].set_ylabel('CV')
        axes[1].set_title('CV Flight Time')
        axes[1].legend()

    # Mean Flight Time
    if 'mean_flight_time' in df.columns:
        axes[2].plot(time_s, df['mean_flight_time'], color='#2ecc71', linewidth=1.5)
        axes[2].axhline(y=30, color='red', linestyle='--', alpha=0.5, label='Threshold')
        axes[2].set_ylabel('Mean FT (ms)')
        axes[2].set_title('Mean Flight Time')
        axes[2].legend()

    axes[2].set_xlabel('Time (seconds)')

    plt.tight_layout()
    path = os.path.join(output_dir, 'timeline_behavior.png')
    plt.savefig(path, dpi=FIGURE_DPI, bbox_inches='tight')
    plt.close()
    print(f"  ✅ {path}")


def plot_roc_pr_curves(output_dir: str, model_dir: str = 'models'):
    """Vẽ ROC và PR curves từ metadata."""
    import json
    meta_path = os.path.join(model_dir, 'training_metadata.json')
    if not os.path.exists(meta_path):
        print("⚠️ Không tìm thấy training metadata")
        return

    with open(meta_path, 'r') as f:
        metadata = json.load(f)

    results = metadata.get('results', [])
    if not results:
        return

    # Bar chart so sánh models
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    fig.suptitle('Model Comparison', fontsize=16, fontweight='bold')

    model_names = [r['model_name'] for r in results]
    metrics_to_plot = {
        'F1-Score': [r.get('f1_score', 0) for r in results],
        'AUC-ROC': [r.get('auc_roc', 0) for r in results],
    }

    # F1 & AUC bar chart
    x = np.arange(len(model_names))
    width = 0.35

    axes[0].bar(x - width/2, metrics_to_plot['F1-Score'], width, label='F1-Score', color='#3498db')
    axes[0].bar(x + width/2, metrics_to_plot['AUC-ROC'], width, label='AUC-ROC', color='#e74c3c')
    axes[0].set_xlabel('Model')
    axes[0].set_ylabel('Score')
    axes[0].set_title('F1-Score & AUC-ROC')
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(model_names, rotation=15)
    axes[0].legend()
    axes[0].set_ylim(0, 1.1)

    # Precision & Recall
    precision = [r.get('precision_injection', 0) for r in results]
    recall = [r.get('recall_injection', 0) for r in results]

    axes[1].bar(x - width/2, precision, width, label='Precision', color='#2ecc71')
    axes[1].bar(x + width/2, recall, width, label='Recall', color='#f39c12')
    axes[1].set_xlabel('Model')
    axes[1].set_ylabel('Score')
    axes[1].set_title('Precision & Recall (Injection class)')
    axes[1].set_xticks(x)
    axes[1].set_xticklabels(model_names, rotation=15)
    axes[1].legend()
    axes[1].set_ylim(0, 1.1)

    plt.tight_layout()
    path = os.path.join(output_dir, 'model_comparison.png')
    plt.savefig(path, dpi=FIGURE_DPI, bbox_inches='tight')
    plt.close()
    print(f"  ✅ {path}")


def generate_all_plots(data_dir: str = 'data', output_dir: str = 'plots', model_dir: str = 'models'):
    """Tạo tất cả biểu đồ."""
    os.makedirs(output_dir, exist_ok=True)
    setup_vietnamese_font()

    print("=" * 46)
    print("  KDS Guard - Visualization")
    print("=" * 46)
    print()

    # Tìm features dataset
    features_path = os.path.join(data_dir, 'features_dataset.csv')
    if not os.path.exists(features_path):
        print(f"❌ Không tìm thấy {features_path}")
        print("   Hãy chạy feature_extraction.py trước!")
        return

    df = pd.read_csv(features_path)
    print(f"📂 Loaded {len(df)} samples")
    if 'label' in df.columns:
        print(f"   Labels: {df['label'].value_counts().to_dict()}")
    print()

    print("📊 Generating plots:")

    # 1. Distribution comparison
    plot_distribution_comparison(df, output_dir)

    # 2. Scatter CV vs Speed
    plot_scatter_cv_speed(df, output_dir)

    # 3. Boxplot comparison
    plot_boxplot_comparison(df, output_dir)

    # 4. Correlation heatmap
    plot_correlation_heatmap(df, output_dir)

    # 5. Timeline behavior
    plot_timeline_risk(df, output_dir)

    # 6. Model comparison (nếu có)
    plot_roc_pr_curves(output_dir, model_dir)

    print(f"\n✅ Tất cả biểu đồ đã lưu vào {output_dir}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Visualization")
    parser.add_argument('-d', '--data-dir', default='data')
    parser.add_argument('-o', '--output-dir', default='plots')
    parser.add_argument('-m', '--model-dir', default='models')

    args = parser.parse_args()
    generate_all_plots(args.data_dir, args.output_dir, args.model_dir)
