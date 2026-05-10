# Huan luyen mo hinh ML phat hien BadUSB
import os
import sys
import argparse
import json
from pathlib import Path
from datetime import datetime

# Fix Unicode output trên Windows CMD
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import pandas as pd
import numpy as np
import joblib

from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.svm import OneClassSVM
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_recall_curve,
    roc_curve,
    f1_score,
    accuracy_score,
)


# === Các cột feature dùng cho training ===
FEATURE_COLUMNS = [
    'mean_hold_time', 'std_hold_time', 'median_hold_time', 'iqr_hold_time',
    'mean_flight_time', 'std_flight_time', 'median_flight_time', 'iqr_flight_time',
    'p5_flight_time', 'p95_flight_time', 'min_flight_time',
    'cv_flight_time', 'typing_speed',
    'modifier_ratio', 'special_ratio',
    'max_burst_length',
]


def load_features(filepath: str) -> pd.DataFrame:
    """Đọc features dataset."""
    df = pd.read_csv(filepath)
    print(f"📂 Loaded {len(df)} samples from {filepath}")

    # Kiểm tra cột
    missing_cols = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing_cols:
        print(f"⚠️ Thiếu cột: {missing_cols}")
        # Chỉ dùng cột có sẵn
        available = [c for c in FEATURE_COLUMNS if c in df.columns]
        return df, available

    return df, FEATURE_COLUMNS


def prepare_data(df: pd.DataFrame, feature_cols: list[str]):
    """Chuẩn bị dữ liệu: tách features, scale."""
    X = df[feature_cols].copy()

    # Xử lý NaN / Inf
    X = X.replace([np.inf, -np.inf], np.nan)
    X = X.fillna(X.median())

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, scaler


def train_isolation_forest(
    X_train: np.ndarray,
    contamination: float = 0.1,
    n_estimators: int = 200,
    random_state: int = 42,
) -> IsolationForest:
    """Huấn luyện Isolation Forest."""
    print("\n🌲 Training Isolation Forest...")
    print(f"   Samples: {X_train.shape[0]}, Features: {X_train.shape[1]}")
    print(f"   Contamination: {contamination}, Trees: {n_estimators}")

    model = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        max_samples='auto',
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(X_train)

    # In thông tin model
    scores = model.decision_function(X_train)
    print(f"   Score range: [{scores.min():.4f}, {scores.max():.4f}]")
    print(f"   Mean score: {scores.mean():.4f}")

    return model


def train_oneclass_svm(
    X_train: np.ndarray,
    nu: float = 0.1,
    kernel: str = 'rbf',
    gamma: str = 'scale',
) -> OneClassSVM:
    """Huấn luyện One-Class SVM."""
    print("\n🔮 Training One-Class SVM...")
    print(f"   Samples: {X_train.shape[0]}, Features: {X_train.shape[1]}")
    print(f"   Nu: {nu}, Kernel: {kernel}")

    model = OneClassSVM(
        nu=nu,
        kernel=kernel,
        gamma=gamma,
    )
    model.fit(X_train)

    scores = model.decision_function(X_train)
    print(f"   Score range: [{scores.min():.4f}, {scores.max():.4f}]")

    return model


def train_random_forest(
    X_train: np.ndarray,
    y_train: np.ndarray,
    n_estimators: int = 200,
    random_state: int = 42,
) -> RandomForestClassifier:
    """Huấn luyện Random Forest (supervised)."""
    print("\n🌳 Training Random Forest (Supervised)...")
    print(f"   Samples: {X_train.shape[0]}, Features: {X_train.shape[1]}")

    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=10,
        min_samples_split=5,
        random_state=random_state,
        n_jobs=-1,
        class_weight='balanced',
    )
    model.fit(X_train, y_train)

    # Feature importance
    importances = model.feature_importances_
    print(f"   Top features: ", end="")
    indices = np.argsort(importances)[::-1][:5]
    for idx in indices:
        print(f"{idx}({importances[idx]:.3f}) ", end="")
    print()

    return model


def evaluate_anomaly_model(
    model,
    X_test: np.ndarray,
    y_test: np.ndarray,
    model_name: str = "Model",
) -> dict:
    """Đánh giá mô hình anomaly detection."""
    print(f"\n📊 Evaluating {model_name}...")

    # Predict: 1 = normal, -1 = anomaly
    y_pred_raw = model.predict(X_test)
    # Chuyển đổi: 1 (normal) → 0 (human), -1 (anomaly) → 1 (injection)
    y_pred = np.where(y_pred_raw == -1, 1, 0)

    # Scores
    scores = model.decision_function(X_test)
    # Đảo ngược score: anomaly score cao = nghi ngờ
    anomaly_scores = -scores

    # Metrics
    report = classification_report(y_test, y_pred, target_names=['human', 'injection'], output_dict=True)
    cm = confusion_matrix(y_test, y_pred)

    try:
        auc = roc_auc_score(y_test, anomaly_scores)
    except ValueError:
        auc = 0.0

    print(f"\n   {'='*50}")
    print(f"   {model_name} Results:")
    print(f"   {'='*50}")
    print(f"   Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"   F1-Score:  {f1_score(y_test, y_pred):.4f}")
    print(f"   AUC-ROC:   {auc:.4f}")
    print(f"\n   Confusion Matrix:")
    print(f"                 Predicted")
    print(f"                 Human  Injection")
    print(f"   Actual Human    {cm[0][0]:5d}  {cm[0][1]:5d}")
    print(f"   Actual Inject   {cm[1][0]:5d}  {cm[1][1]:5d}")
    print(f"\n   Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['human', 'injection']))

    return {
        'model_name': model_name,
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'f1_score': float(f1_score(y_test, y_pred)),
        'auc_roc': float(auc),
        'precision_injection': float(report['injection']['precision']),
        'recall_injection': float(report['injection']['recall']),
        'confusion_matrix': cm.tolist(),
    }


def evaluate_supervised_model(
    model,
    X_test: np.ndarray,
    y_test: np.ndarray,
    model_name: str = "Random Forest",
) -> dict:
    """Đánh giá mô hình supervised."""
    print(f"\n📊 Evaluating {model_name}...")

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    cm = confusion_matrix(y_test, y_pred)

    try:
        auc = roc_auc_score(y_test, y_proba)
    except ValueError:
        auc = 0.0

    print(f"\n   {'='*50}")
    print(f"   {model_name} Results:")
    print(f"   {'='*50}")
    print(f"   Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"   F1-Score:  {f1_score(y_test, y_pred):.4f}")
    print(f"   AUC-ROC:   {auc:.4f}")
    print(f"\n   Confusion Matrix:")
    print(f"                 Predicted")
    print(f"                 Human  Injection")
    print(f"   Actual Human    {cm[0][0]:5d}  {cm[0][1]:5d}")
    print(f"   Actual Inject   {cm[1][0]:5d}  {cm[1][1]:5d}")
    print(f"\n   Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['human', 'injection']))

    return {
        'model_name': model_name,
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'f1_score': float(f1_score(y_test, y_pred)),
        'auc_roc': float(auc),
        'precision_injection': float(y_pred[y_test == 1].mean()) if (y_test == 1).any() else 0,
        'recall_injection': float(y_pred[y_test == 1].sum() / y_test.sum()) if y_test.sum() > 0 else 0,
        'confusion_matrix': cm.tolist(),
    }


def main():
    parser = argparse.ArgumentParser(description="ML Model Training")
    parser.add_argument('-d', '--data-dir', default='data',
                        help='Thư mục dữ liệu')
    parser.add_argument('-f', '--features-file', default='features_dataset.csv',
                        help='File features')
    parser.add_argument('-m', '--model-dir', default='models',
                        help='Thư mục lưu model')
    parser.add_argument('--contamination', type=float, default=0.1,
                        help='Tỉ lệ anomaly ước tính')
    parser.add_argument('--test-size', type=float, default=0.2,
                        help='Tỉ lệ test set')

    args = parser.parse_args()

    print("=" * 46)
    print("  KDS Guard - ML Model Training")
    print("=" * 46)
    print()

    # Load data
    features_path = os.path.join(args.data_dir, args.features_file)
    if not os.path.exists(features_path):
        print(f"❌ Không tìm thấy {features_path}")
        print("   Hãy chạy feature_extraction.py trước!")
        sys.exit(1)

    df, feature_cols = load_features(features_path)

    # Chuẩn bị dữ liệu
    X_scaled, scaler = prepare_data(df, feature_cols)

    # Tạo thư mục models
    os.makedirs(args.model_dir, exist_ok=True)

    # Kiểm tra có nhãn không
    has_labels = 'label' in df.columns and df['label'].nunique() > 1

    results = []

    if has_labels:
        print(f"\n📋 Dataset có nhãn: {df['label'].value_counts().to_dict()}")

        # Chuyển label thành binary: human=0, injection=1
        y = (df['label'] != 'human').astype(int).values

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=args.test_size,
            random_state=42, stratify=y
        )

        print(f"   Train: {len(X_train)} ({y_train.sum()} injection)")
        print(f"   Test:  {len(X_test)} ({y_test.sum()} injection)")

        # === Model 1: Isolation Forest ===
        iso_model = train_isolation_forest(X_train, contamination=args.contamination)
        iso_result = evaluate_anomaly_model(iso_model, X_test, y_test, "Isolation Forest")
        results.append(iso_result)

        # === Model 2: One-Class SVM (train only on human) ===
        X_train_human = X_train[y_train == 0]
        ocsvm_model = train_oneclass_svm(X_train_human, nu=args.contamination)
        ocsvm_result = evaluate_anomaly_model(ocsvm_model, X_test, y_test, "One-Class SVM")
        results.append(ocsvm_result)

        # === Model 3: Random Forest (supervised) ===
        rf_model = train_random_forest(X_train, y_train)
        rf_result = evaluate_supervised_model(rf_model, X_test, y_test, "Random Forest")
        results.append(rf_result)

        # Lưu model tốt nhất
        best_result = max(results, key=lambda r: r['f1_score'])
        print(f"\n🏆 Best model: {best_result['model_name']} (F1: {best_result['f1_score']:.4f})")

        # Lưu tất cả models
        joblib.dump(iso_model, os.path.join(args.model_dir, 'isolation_forest.pkl'))
        joblib.dump(ocsvm_model, os.path.join(args.model_dir, 'oneclass_svm.pkl'))
        joblib.dump(rf_model, os.path.join(args.model_dir, 'random_forest.pkl'))
        joblib.dump(scaler, os.path.join(args.model_dir, 'scaler.pkl'))

        # Lưu model tốt nhất riêng
        if best_result['model_name'] == 'Isolation Forest':
            joblib.dump(iso_model, os.path.join(args.model_dir, 'model.pkl'))
        elif best_result['model_name'] == 'One-Class SVM':
            joblib.dump(ocsvm_model, os.path.join(args.model_dir, 'model.pkl'))
        else:
            joblib.dump(rf_model, os.path.join(args.model_dir, 'model.pkl'))

    else:
        print("\n📋 Dataset không có nhãn → chỉ dùng Unsupervised")

        # Isolation Forest
        iso_model = train_isolation_forest(X_scaled, contamination=args.contamination)
        joblib.dump(iso_model, os.path.join(args.model_dir, 'isolation_forest.pkl'))
        joblib.dump(iso_model, os.path.join(args.model_dir, 'model.pkl'))
        joblib.dump(scaler, os.path.join(args.model_dir, 'scaler.pkl'))

        # One-Class SVM
        ocsvm_model = train_oneclass_svm(X_scaled, nu=args.contamination)
        joblib.dump(ocsvm_model, os.path.join(args.model_dir, 'oneclass_svm.pkl'))

    # Lưu metadata
    metadata = {
        'timestamp': datetime.now().isoformat(),
        'feature_columns': feature_cols,
        'n_samples': len(df),
        'has_labels': has_labels,
        'results': results,
        'contamination': args.contamination,
    }
    with open(os.path.join(args.model_dir, 'training_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"\n✅ Models saved to {args.model_dir}/")
    print(f"   - model.pkl (best)")
    print(f"   - scaler.pkl")
    print(f"   - training_metadata.json")


if __name__ == "__main__":
    main()
