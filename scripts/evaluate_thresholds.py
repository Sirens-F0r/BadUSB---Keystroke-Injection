#!/usr/bin/env python3
"""
evaluate_thresholds.py - Tinh confusion matrix voi dataset thuc
Chay: python evaluate_thresholds.py

Ket qua: True Positive Rate, False Positive Rate, Accuracy
voi tung nguong risk score.
"""

import csv
import sys
import os

# Duong dan dataset
DATASET_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "data", "features_dataset.csv"
)

# Nguong hien tai (dung giong detector.rs)
THRESHOLDS = {
    "ft_mean_ms": 30.0,
    "ft_cv": 0.15,
    "max_speed": 20.0,      # Da nang len tu 15
    "ft_mean_for_speed": 50.0,  # R3 ket hop
    "burst_length": 15,
    "ht_iqr_ms": 5.0,
    "modifier_ratio": 0.4,
    "min_ft_ms": 5.0,
}


def load_dataset(path):
    """Doc CSV dataset, tra ve list cac row dict"""
    rows = []
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def evaluate_sample(row):
    """
    Tinh risk score cho 1 mau, tra ve (score, rules_triggered)
    Mo phong logic cua detector.rs
    """
    score = 0.0
    rules = []

    mean_ft = float(row.get("mean_flight_time", 999))
    cv_ft = float(row.get("cv_flight_time", 1.0))
    speed = float(row.get("typing_speed", 0))
    burst = int(float(row.get("max_burst_length", 0)))
    has_burst = burst >= THRESHOLDS["burst_length"]
    iqr_ht = float(row.get("iqr_hold_time", 100))
    mod_ratio = float(row.get("modifier_ratio", 0))
    min_ft = float(row.get("min_flight_time", 100))

    # R1: Flight Time thap
    if mean_ft > 0 and mean_ft < THRESHOLDS["ft_mean_ms"]:
        contribution = min(0.3, 0.3 * (THRESHOLDS["ft_mean_ms"] / max(mean_ft, 1)))
        score += min(contribution, 0.30)
        rules.append("R1")

    # R2: CV thap
    if cv_ft < THRESHOLDS["ft_cv"]:
        score += 0.25
        rules.append("R2")

    # R3: Toc do cao + flight time thap (ket hop)
    if speed > THRESHOLDS["max_speed"] and mean_ft < THRESHOLDS["ft_mean_for_speed"]:
        excess = speed / THRESHOLDS["max_speed"]
        score += min(0.2 * excess, 0.35)
        rules.append("R3")

    # R4: Burst
    if has_burst:
        score += 0.20
        rules.append("R4")

    # R5: Hold Time deu
    if iqr_ht > 0 and iqr_ht < THRESHOLDS["ht_iqr_ms"]:
        score += 0.15
        rules.append("R5")

    # R6: Modifier ratio
    if mod_ratio > THRESHOLDS["modifier_ratio"]:
        score += 0.10
        rules.append("R6")

    # R7: Min flight time
    if min_ft > 0 and min_ft < THRESHOLDS["min_ft_ms"]:
        score += 0.10
        rules.append("R7")

    score = min(score, 1.0)
    return score, rules


def classify(score, threshold=0.3):
    """Score >= threshold => Attack"""
    return "attack" if score >= threshold else "normal"


def main():
    if not os.path.exists(DATASET_PATH):
        print(f"Khong tim thay dataset: {DATASET_PATH}")
        sys.exit(1)

    print(f"Doc dataset: {DATASET_PATH}")
    rows = load_dataset(DATASET_PATH)
    print(f"Tong so mau: {len(rows)}")

    # Phan loai label thuc te
    # Gia dinh: cot 'label' co gia tri 'normal' hoac 'attack'
    # Neu khong co, dung typing_speed > 30 lam proxy
    has_label = "label" in rows[0] if rows else False

    results = []
    for row in rows:
        score, rules = evaluate_sample(row)
        
        if has_label:
            label = row["label"].strip().lower()
            # Dataset dung "human" cho nguoi, "attack"/"injected"/"synthetic" cho tan cong
            actual = "normal" if label in ("human", "normal", "legitimate") else "attack"
        else:
            # Proxy: mau co typing_speed > 30 coi nhu attack
            speed = float(row.get("typing_speed", 0))
            actual = "attack" if speed > 30 else "normal"
        
        results.append({
            "score": score,
            "rules": rules,
            "actual": actual,
        })

    # Dem so luong thuc te
    n_actual_attack = sum(1 for r in results if r["actual"] == "attack")
    n_actual_normal = sum(1 for r in results if r["actual"] == "normal")
    
    print(f"\nPhan bo: {n_actual_normal} normal, {n_actual_attack} attack")
    print()

    # Danh gia voi nhieu nguong
    print("=" * 75)
    print(f"{'Nguong':>8} | {'TP':>6} {'FP':>6} {'TN':>6} {'FN':>6} | {'TPR':>7} {'FPR':>7} {'Accuracy':>9} {'F1':>7}")
    print("-" * 75)

    for threshold in [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
        tp = fp = tn = fn = 0
        for r in results:
            predicted = classify(r["score"], threshold)
            if predicted == "attack" and r["actual"] == "attack":
                tp += 1
            elif predicted == "attack" and r["actual"] == "normal":
                fp += 1
            elif predicted == "normal" and r["actual"] == "normal":
                tn += 1
            else:  # predicted normal, actual attack
                fn += 1

        tpr = tp / max(tp + fn, 1)      # Sensitivity / Recall
        fpr = fp / max(fp + tn, 1)      # False Positive Rate
        accuracy = (tp + tn) / max(len(results), 1)
        precision = tp / max(tp + fp, 1)
        f1 = 2 * precision * tpr / max(precision + tpr, 1e-9)

        marker = " <-- hien tai" if threshold == 0.3 else ""
        print(f"  {threshold:>5.1f}  | {tp:>6} {fp:>6} {tn:>6} {fn:>6} | {tpr:>6.1%} {fpr:>6.1%} {accuracy:>8.1%} {f1:>6.1%}{marker}")

    print("=" * 75)
    print()
    print("Ghi chu:")
    print("  TP = True Positive  (BadUSB bị phat hien dung)")
    print("  FP = False Positive (Nguoi binh thuong bi nham)")
    print("  TPR = Recall (% BadUSB bi phat hien)")
    print("  FPR = False Positive Rate (% nguoi bi nham)")
    print("  Nguong 0.3 = muc bat dau canh bao (MEDIUM)")
    print()

    # Chi tiet rule distribution
    print("Phan bo Rules (mau attack):")
    rule_count = {}
    for r in results:
        if r["actual"] == "attack":
            for rule in r["rules"]:
                rule_count[rule] = rule_count.get(rule, 0) + 1
    
    for rule in sorted(rule_count.keys()):
        count = rule_count[rule]
        pct = count / max(n_actual_attack, 1) * 100
        print(f"  {rule}: {count}/{n_actual_attack} ({pct:.1f}%)")


if __name__ == "__main__":
    main()
