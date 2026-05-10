# Danh gia he thong phat hien BadUSB

import os
import sys
import time
import json
import argparse
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

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    f1_score,
    accuracy_score,
    precision_score,
    recall_score,
)


# Feature columns (phải khớp với train_model.py)
FEATURE_COLUMNS = [
    'mean_hold_time', 'std_hold_time', 'median_hold_time', 'iqr_hold_time',
    'mean_flight_time', 'std_flight_time', 'median_flight_time', 'iqr_flight_time',
    'p5_flight_time', 'p95_flight_time', 'min_flight_time',
    'cv_flight_time', 'typing_speed',
    'modifier_ratio', 'special_ratio',
    'max_burst_length',
]


def rule_based_predict(df: pd.DataFrame,
                        ft_threshold: float = 30.0,
                        cv_threshold: float = 0.15,
                        speed_threshold: float = 15.0,
                        burst_threshold: int = 15) -> np.ndarray:
    """Áp dụng rule-based detection trên DataFrame."""
    scores = np.zeros(len(df))

    # Rule 1: Flight time thấp
    if 'mean_flight_time' in df.columns:
        mask = df['mean_flight_time'] < ft_threshold
        scores[mask] += 0.3

    # Rule 2: CV thấp
    if 'cv_flight_time' in df.columns:
        mask = df['cv_flight_time'] < cv_threshold
        scores[mask] += 0.25

    # Rule 3: Tốc độ cao
    if 'typing_speed' in df.columns:
        mask = df['typing_speed'] > speed_threshold
        scores[mask] += 0.25

    # Rule 4: Burst pattern
    if 'max_burst_length' in df.columns:
        mask = df['max_burst_length'] >= burst_threshold
        scores[mask] += 0.2

    # Rule 5: Hold time rất đều
    if 'iqr_hold_time' in df.columns:
        mask = df['iqr_hold_time'] < 5.0
        scores[mask] += 0.15

    scores = np.clip(scores, 0, 1)

    # Binary prediction: > 0.5 = injection
    predictions = (scores >= 0.5).astype(int)

    return predictions, scores


def evaluate_rule_based(df: pd.DataFrame, y_true: np.ndarray) -> dict:
    """Đánh giá rule-based detection."""
    print("\n" + "="*60)
    print("📏 RULE-BASED DETECTION EVALUATION")
    print("="*60)

    # Test nhiều threshold combinations
    best_f1 = 0
    best_params = {}

    for ft in [20, 25, 30, 35, 40]:
        for cv in [0.10, 0.12, 0.15, 0.18, 0.20]:
            for speed in [12, 15, 18, 20]:
                y_pred, scores = rule_based_predict(df, ft, cv, speed)
                f1 = f1_score(y_true, y_pred, zero_division=0)
                if f1 > best_f1:
                    best_f1 = f1
                    best_params = {'ft': ft, 'cv': cv, 'speed': speed}
                    best_pred = y_pred
                    best_scores = scores

    print(f"\n🏆 Best parameters:")
    print(f"   Flight Time threshold: {best_params['ft']} ms")
    print(f"   CV threshold: {best_params['cv']}")
    print(f"   Speed threshold: {best_params['speed']} k/s")

    # Metrics with best params
    cm = confusion_matrix(y_true, best_pred)
    acc = accuracy_score(y_true, best_pred)
    prec = precision_score(y_true, best_pred, zero_division=0)
    rec = recall_score(y_true, best_pred, zero_division=0)

    print(f"\n📊 Results:")
    print(f"   Accuracy:   {acc:.4f}")
    print(f"   Precision:  {prec:.4f}")
    print(f"   Recall:     {rec:.4f}")
    print(f"   F1-Score:   {best_f1:.4f}")

    try:
        auc = roc_auc_score(y_true, best_scores)
        print(f"   AUC-ROC:    {auc:.4f}")
    except ValueError:
        auc = 0.0

    print(f"\n   Confusion Matrix:")
    print(f"                  Predicted")
    print(f"                  Human  Injection")
    print(f"   Actual Human    {cm[0][0]:5d}  {cm[0][1]:5d}")
    print(f"   Actual Inject   {cm[1][0]:5d}  {cm[1][1]:5d}")

    return {
        'method': 'Rule-based',
        'accuracy': float(acc),
        'precision': float(prec),
        'recall': float(rec),
        'f1_score': float(best_f1),
        'auc_roc': float(auc),
        'best_params': best_params,
        'confusion_matrix': cm.tolist(),
    }


def evaluate_ml_model(df: pd.DataFrame, y_true: np.ndarray,
                       model_path: str, scaler_path: str,
                       model_name: str = "ML Model") -> dict:
    """Đánh giá ML model."""
    print(f"\n{'='*60}")
    print(f"🤖 {model_name.upper()} EVALUATION")
    print("="*60)

    if not os.path.exists(model_path):
        print(f"   ❌ Model not found: {model_path}")
        return {}

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    # Prepare features
    available_cols = [c for c in FEATURE_COLUMNS if c in df.columns]
    X = df[available_cols].copy()
    X = X.replace([np.inf, -np.inf], np.nan).fillna(X.median())
    X_scaled = scaler.transform(X)

    # Predict
    start_time = time.time()

    if hasattr(model, 'predict_proba'):
        # Supervised model
        y_pred = model.predict(X_scaled)
        y_scores = model.predict_proba(X_scaled)[:, 1]
    else:
        # Anomaly detection model
        y_pred_raw = model.predict(X_scaled)
        y_pred = np.where(y_pred_raw == -1, 1, 0)
        y_scores = -model.decision_function(X_scaled)

    elapsed = time.time() - start_time
    latency_per_sample = (elapsed / len(df)) * 1000  # ms

    # Metrics
    cm = confusion_matrix(y_true, y_pred)
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    try:
        auc = roc_auc_score(y_true, y_scores)
    except ValueError:
        auc = 0.0

    print(f"\n📊 Results:")
    print(f"   Accuracy:    {acc:.4f}")
    print(f"   Precision:   {prec:.4f}")
    print(f"   Recall:      {rec:.4f}")
    print(f"   F1-Score:    {f1:.4f}")
    print(f"   AUC-ROC:     {auc:.4f}")
    print(f"   Latency:     {latency_per_sample:.2f} ms/sample")

    print(f"\n   Confusion Matrix:")
    print(f"                  Predicted")
    print(f"                  Human  Injection")
    print(f"   Actual Human    {cm[0][0]:5d}  {cm[0][1]:5d}")
    print(f"   Actual Inject   {cm[1][0]:5d}  {cm[1][1]:5d}")

    return {
        'method': model_name,
        'accuracy': float(acc),
        'precision': float(prec),
        'recall': float(rec),
        'f1_score': float(f1),
        'auc_roc': float(auc),
        'latency_ms': float(latency_per_sample),
        'confusion_matrix': cm.tolist(),
    }


def evaluate_hybrid(df: pd.DataFrame, y_true: np.ndarray,
                     model_path: str, scaler_path: str,
                     rule_weight: float = 0.6,
                     ml_weight: float = 0.4) -> dict:
    """Đánh giá hybrid detection (rule + ML)."""
    print(f"\n{'='*60}")
    print("🔄 HYBRID DETECTION EVALUATION")
    print("="*60)
    print(f"   Weights: Rule={rule_weight}, ML={ml_weight}")

    # Rule-based scores
    _, rule_scores = rule_based_predict(df)

    # ML scores
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)

        available_cols = [c for c in FEATURE_COLUMNS if c in df.columns]
        X = df[available_cols].copy()
        X = X.replace([np.inf, -np.inf], np.nan).fillna(X.median())
        X_scaled = scaler.transform(X)

        if hasattr(model, 'predict_proba'):
            ml_scores = model.predict_proba(X_scaled)[:, 1]
        else:
            raw_scores = -model.decision_function(X_scaled)
            # Normalize to [0, 1]
            ml_scores = (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min() + 1e-8)
    else:
        print("   ⚠️ No ML model found, using rule-based only")
        ml_scores = np.zeros(len(df))
        rule_weight = 1.0
        ml_weight = 0.0

    # Hybrid score
    hybrid_scores = rule_weight * rule_scores + ml_weight * ml_scores

    # Find best threshold
    best_f1 = 0
    best_threshold = 0.5

    for threshold in np.arange(0.2, 0.8, 0.05):
        y_pred = (hybrid_scores >= threshold).astype(int)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = threshold

    y_pred = (hybrid_scores >= best_threshold).astype(int)

    cm = confusion_matrix(y_true, y_pred)
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)

    try:
        auc = roc_auc_score(y_true, hybrid_scores)
    except ValueError:
        auc = 0.0

    print(f"\n   Best threshold: {best_threshold:.2f}")
    print(f"\n📊 Results:")
    print(f"   Accuracy:    {acc:.4f}")
    print(f"   Precision:   {prec:.4f}")
    print(f"   Recall:      {rec:.4f}")
    print(f"   F1-Score:    {best_f1:.4f}")
    print(f"   AUC-ROC:     {auc:.4f}")

    print(f"\n   Confusion Matrix:")
    print(f"                  Predicted")
    print(f"                  Human  Injection")
    print(f"   Actual Human    {cm[0][0]:5d}  {cm[0][1]:5d}")
    print(f"   Actual Inject   {cm[1][0]:5d}  {cm[1][1]:5d}")

    return {
        'method': f'Hybrid (R:{rule_weight}, ML:{ml_weight})',
        'accuracy': float(acc),
        'precision': float(prec),
        'recall': float(rec),
        'f1_score': float(best_f1),
        'auc_roc': float(auc),
        'best_threshold': float(best_threshold),
        'confusion_matrix': cm.tolist(),
    }


def main():
    parser = argparse.ArgumentParser(description="System Evaluation")
    parser.add_argument('-d', '--data-dir', default='data')
    parser.add_argument('-f', '--features-file', default='features_dataset.csv')
    parser.add_argument('-m', '--model-dir', default='models')
    parser.add_argument('-o', '--output', default='evaluation_report.json')

    args = parser.parse_args()

    print("=" * 54)
    print("  KDS Guard - Full System Evaluation")
    print("=" * 54)
    print()

    # Load data
    features_path = os.path.join(args.data_dir, args.features_file)
    if not os.path.exists(features_path):
        print(f"❌ Not found: {features_path}")
        sys.exit(1)

    df = pd.read_csv(features_path)
    print(f"📂 Loaded {len(df)} samples from {features_path}")

    if 'label' not in df.columns:
        print("❌ Dataset needs 'label' column for evaluation")
        sys.exit(1)

    y_true = (df['label'] != 'human').astype(int).values
    print(f"   Human: {(y_true == 0).sum()}, Injection: {(y_true == 1).sum()}")

    results = []

    # 1. Rule-based
    rule_result = evaluate_rule_based(df, y_true)
    results.append(rule_result)

    # 2. ML models
    model_files = {
        'Isolation Forest': 'isolation_forest.pkl',
        'One-Class SVM': 'oneclass_svm.pkl',
        'Random Forest': 'random_forest.pkl',
    }
    scaler_path = os.path.join(args.model_dir, 'scaler.pkl')

    for model_name, model_file in model_files.items():
        model_path = os.path.join(args.model_dir, model_file)
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            ml_result = evaluate_ml_model(df, y_true, model_path, scaler_path, model_name)
            if ml_result:
                results.append(ml_result)

    # 3. Hybrid
    best_model_path = os.path.join(args.model_dir, 'model.pkl')
    if os.path.exists(best_model_path):
        hybrid_result = evaluate_hybrid(df, y_true, best_model_path, scaler_path)
        results.append(hybrid_result)

    # === Summary ===
    print("\n" + "="*60)
    print("📊 EVALUATION SUMMARY")
    print("="*60)

    summary_df = pd.DataFrame(results)
    if not summary_df.empty:
        display_cols = ['method', 'accuracy', 'precision', 'recall', 'f1_score', 'auc_roc']
        available = [c for c in display_cols if c in summary_df.columns]
        print(summary_df[available].to_string(index=False))

        best = summary_df.loc[summary_df['f1_score'].idxmax()]
        print(f"\n🏆 Best method: {best['method']} (F1: {best['f1_score']:.4f})")

    # Save report
    report = {
        'timestamp': datetime.now().isoformat(),
        'dataset': features_path,
        'n_samples': len(df),
        'n_human': int((y_true == 0).sum()),
        'n_injection': int((y_true == 1).sum()),
        'results': results,
    }

    report_path = os.path.join(args.data_dir, args.output)
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ Report saved: {report_path}")


if __name__ == "__main__":
    main()
