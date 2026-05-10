#!/usr/bin/env python3
"""
Xuat dashboard_snapshot.json tu data/features_dataset.csv cho React dashboard.
Chay sau integrate_datasets.py hoac train_model.py.

Usage:
  python scripts/export_dashboard_snapshot.py
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[1]
FEATURES_CSV = ROOT / "data" / "features_dataset.csv"
EVAL_JSON = ROOT / "data" / "evaluation_report.json"
OUT_JSON = ROOT / "kds-guard-dashboard" / "src" / "data" / "dashboard_snapshot.json"


def radar_series(g: pd.DataFrame) -> list[float]:
    return [
        float(g["mean_flight_time"].mean()),
        float(g["mean_hold_time"].mean()),
        float(g["typing_speed"].mean()),
        float(g["cv_flight_time"].mean() * 100.0),
        float(g["max_burst_length"].mean()),
        float(g["modifier_ratio"].mean() * 100.0),
        float(g["iqr_hold_time"].mean()),
    ]


def human_risk_proxy(row: pd.Series) -> float:
    ft = float(row["mean_flight_time"])
    cv = float(row["cv_flight_time"])
    s = (120.0 - min(ft, 120.0)) / 800.0 + max(0.0, 0.25 - cv) * 0.5
    return float(np.clip(s, 0.02, 0.18))


def injection_risk_proxy(row: pd.Series) -> float:
    ft = float(row["mean_flight_time"])
    return float(np.clip(0.75 + (35.0 - min(ft, 35.0)) / 200.0, 0.85, 0.99))


def short_name(uid: str, max_len: int = 22) -> str:
    u = uid.strip()
    if len(u) <= max_len:
        return u
    return u[: max_len - 1] + "…"


def main() -> None:
    if not FEATURES_CSV.exists():
        print(f"Khong tim thay {FEATURES_CSV}")
        sys.exit(1)

    df = pd.read_csv(FEATURES_CSV)
    rust = df[df["source"] == "self_collected_rust"]
    inj = df[df["label"] == "injection"]
    human = df[df["label"] == "human"]

    total = len(df)
    human_n = len(human)
    inj_n = len(inj)
    rust_w = len(rust)
    rust_users_n = int(rust["user_id"].nunique()) if rust_w else 0

    f1_text = ""
    if EVAL_JSON.exists():
        try:
            with open(EVAL_JSON, encoding="utf-8") as f:
                rep = json.load(f)
            rf = rep.get("random_forest") or rep.get("Random Forest") or {}
            f1 = rf.get("f1_score") or rf.get("f1") or rep.get("f1_score")
            if f1 is not None:
                f1_text = f"F1={float(f1):.4f}"
        except Exception:
            pass

    now = datetime.now(timezone.utc).astimezone()
    gen_iso = now.isoformat()
    last_up = now.strftime("%Y-%m-%dT%H:%M:%S")

    # --- Keystroke radar ---
    km: dict[str, list[float]] = {}
    if rust_w > 0:
        km["Người dùng thật (TB Rust)"] = radar_series(rust)
        user_counts = rust.groupby("user_id").size().sort_values(ascending=False)
        top_users = list(user_counts.head(8).index)
        for uid in top_users:
            g = rust[rust["user_id"] == uid]
            km[short_name(str(uid))] = radar_series(g)
    if inj_n > 0:
        km["BadUSB Injection (lab)"] = radar_series(inj)

    # --- Activity timeline (gio VN tu epoch window_end_ms, chi Rust co epoch thuc) ---
    labels = [
        "00:00",
        "01:00",
        "02:00",
        "03:00",
        "04:00",
        "05:00",
        "06:00",
        "07:00",
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00",
        "19:00",
        "20:00",
        "21:00",
        "22:00",
        "23:00",
    ]
    hourly = [0] * 24
    if rust_w > 0:
        ts = pd.to_datetime(rust["window_end_ms"], unit="ms", utc=True)
        try:
            ts_vn = ts.dt.tz_convert("Asia/Ho_Chi_Minh")
            for h in ts_vn.dt.hour:
                hourly[int(h)] += 1
        except Exception:
            # Fallback: phan phoi deu theo chi so
            n = rust_w
            for i in range(24):
                hourly[i] = n // 24 + (1 if i < (n % 24) else 0)

    # --- Risk score history ---
    rng = np.random.RandomState(42)
    rs_hist: list[float] = []
    rs_lbl: list[str] = []
    if rust_w > 0:
        sample_r = rust.sample(min(14, rust_w), random_state=rng)
        for i, (_, row) in enumerate(sample_r.iterrows()):
            rs_hist.append(human_risk_proxy(row))
            rs_lbl.append(f"H{i + 1}")
    if inj_n > 0:
        sample_i = inj.sample(min(6, inj_n), random_state=rng)
        for i, (_, row) in enumerate(sample_i.iterrows()):
            rs_hist.append(injection_risk_proxy(row))
            rs_lbl.append(f"INJ{i + 1}")

    cur_risk = float(np.mean(rs_hist[:5])) if len(rs_hist) >= 5 else (float(rs_hist[0]) if rs_hist else 0.04)

    # --- System overview cards ---
    desc1 = "Theo dataset offline đã merge"
    if f1_text:
        desc1 = f"Báo cáo đánh giá – {f1_text}"

    metrics = [
        {
            "id": 1,
            "icon": "mdi:shield-check",
            "value": "AN TOÀN",
            "label": "Trạng thái hệ thống",
            "description": desc1,
            "color": "success.main",
        },
        {
            "id": 2,
            "icon": "mdi:account-group",
            "value": str(rust_users_n),
            "label": "Người dùng (Rust Collector)",
            "description": f"{rust_w:,} cửa sổ từ file thu thập (data/raw/rust)",
            "color": "info.main",
        },
        {
            "id": 3,
            "icon": "mdi:shield-off-outline",
            "value": f"{inj_n:,}",
            "label": "Mẫu injection (tổng hợp)",
            "description": "Mô phỏng BadUSB trong pipeline offline",
            "color": "error.main",
        },
        {
            "id": 4,
            "icon": "mdi:database-check",
            "value": f"{total:,}",
            "label": "Tổng mẫu trong features_dataset",
            "description": f"{human_n:,} human + {inj_n:,} injection",
            "color": "info.main",
        },
    ]

    inj_ft = float(inj["mean_flight_time"].mean()) if inj_n else 0.0
    inj_sp = float(inj["typing_speed"].mean()) if inj_n else 0.0
    inj_burst = float(inj["max_burst_length"].mean()) if inj_n else 0.0

    recent_alerts = [
        {
            "id": 1,
            "severity": "CRITICAL",
            "title": f"Phát hiện {inj_n} mẫu injection trong dataset offline",
            "description": (
                f"Trung bình lab: mean flight={inj_ft:.1f} ms, "
                f"speed={inj_sp:.1f} keys/s, burst={inj_burst:.1f} phím."
            ),
            "timestamp": last_up[:16].replace("T", " "),
            "action": "Đánh giá rule + RF",
            "source": "Dataset merge",
        },
        {
            "id": 2,
            "severity": "HIGH",
            "title": f"Tốc độ gõ injection TB: {inj_sp:.1f} keys/s",
            "description": (
                "So với người thật (Rust TB), injection thường có flight time thấp và speed cao."
            ),
            "timestamp": last_up[:16].replace("T", " "),
            "action": "Rule R3 / RF",
            "source": "Feature stats",
        },
        {
            "id": 3,
            "severity": "MEDIUM",
            "title": f"{rust_users_n} người — {rust_w} cửa sổ Rust",
            "description": (
                "Thống kê từ các file CSV trong data/raw/rust sau khi trích features."
            ),
            "timestamp": last_up[:16].replace("T", " "),
            "action": "Info",
            "source": "integrate_datasets",
        },
    ]

    # --- Event log rows (tom tat + top users) ---
    rows = []
    rid = 1

    def row(**kw):
        nonlocal rid
        o = {"id": rid, **kw}
        rid += 1
        return o

    rows.append(
        row(
            timestamp=last_up.replace("T", " ")[:19],
            eventType="INFO",
            source="SnapshotExport",
            riskScore=0.0,
            triggeredRules="-",
            action="Allow",
            details=f"dashboard_snapshot.json generated — {total:,} samples, rust_windows={rust_w}",
        )
    )
    if rust_w > 0:
        tb_ft = float(rust["mean_flight_time"].mean())
        tb_sp = float(rust["typing_speed"].mean())
        rows.append(
            row(
                timestamp=last_up.replace("T", " ")[:19],
                eventType="INFO",
                source="RustCollector",
                riskScore=round(cur_risk, 2),
                triggeredRules="-",
                action="Allow",
                details=f"Rust TB: ft={tb_ft:.1f} ms, speed={tb_sp:.1f} keys/s — {rust_users_n} users",
            )
        )
    uc = rust.groupby("user_id").size().sort_values(ascending=False).head(8)
    for uid, cnt in uc.items():
        g = rust[rust["user_id"] == uid]
        rows.append(
            row(
                timestamp=last_up.replace("T", " ")[:19],
                eventType="INFO",
                source="Collector",
                riskScore=0.05,
                triggeredRules="-",
                action="Allow",
                details=f"{short_name(str(uid), 40)} — {int(cnt)} windows, ft={g['mean_flight_time'].mean():.1f} ms",
            )
        )

    snap = {
        "generated_at": gen_iso,
        "systemOverview": {
            "metrics": metrics,
            "currentRiskScore": round(cur_risk, 3),
            "lastUpdated": last_up,
            "threatLevel": "LOW",
            "threatDescription": "Không có mối đe dọa tích cực từ snapshot offline — giám sát realtime khi chạy kds_guard + bridge.",
        },
        "keystrokeMetrics": km,
        "activityTimeline": {"values": hourly, "labels": labels},
        "riskScore": {"history": rs_hist, "labels": rs_lbl},
        "recentAlerts": recent_alerts,
        "eventLogRows": rows,
        "gaugeValue": max(5.0, min(95.0, cur_risk * 100)),
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(snap, f, ensure_ascii=False, indent=2)

    print(f"OK -> {OUT_JSON}")
    print(f"   samples={total}, rust_windows={rust_w}, rust_users={rust_users_n}, injection={inj_n}")


if __name__ == "__main__":
    main()
