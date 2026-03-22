"""
Pipeline Runner cho KDS Guard
Chạy toàn bộ pipeline: Generate Data → Train → Evaluate → Visualize

Usage: python scripts/run_pipeline.py
"""

import os
import sys
import subprocess
import time
from datetime import datetime


def run_step(step_name: str, command: list[str], cwd: str = ".") -> bool:
    """Chạy một bước trong pipeline."""
    print(f"\n{'='*60}")
    print(f"🔄 Step: {step_name}")
    print(f"{'='*60}")
    print(f"   Command: {' '.join(command)}")
    print(f"   Working dir: {cwd}")
    print()

    start_time = time.time()

    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            capture_output=False,
            text=True,
            timeout=300,  # 5 minutes max
        )

        elapsed = time.time() - start_time

        if result.returncode == 0:
            print(f"\n   ✅ {step_name} completed ({elapsed:.1f}s)")
            return True
        else:
            print(f"\n   ❌ {step_name} failed (exit code: {result.returncode})")
            return False

    except subprocess.TimeoutExpired:
        print(f"\n   ⏰ {step_name} timed out!")
        return False
    except FileNotFoundError as e:
        print(f"\n   ❌ Command not found: {e}")
        return False
    except Exception as e:
        print(f"\n   ❌ Error: {e}")
        return False


def main():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║  🚀 KDS Guard - Full Pipeline Runner                     ║")
    print("║  BadUSB Detection via Keystroke Dynamics                  ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    scripts_dir = os.path.join(project_root, "scripts")
    data_dir = os.path.join(project_root, "data")
    models_dir = os.path.join(project_root, "models")
    plots_dir = os.path.join(project_root, "plots")

    # Tạo thư mục
    for d in [data_dir, models_dir, plots_dir]:
        os.makedirs(d, exist_ok=True)

    python = sys.executable
    results = []

    # === Step 1: Generate Demo Data ===
    success = run_step(
        "Generate Demo Dataset",
        [python, os.path.join(scripts_dir, "generate_demo_data.py"),
         "-d", data_dir, "-n", "20"],
        cwd=project_root,
    )
    results.append(("Generate Data", success))

    if not success:
        print("\n❌ Pipeline stopped: Data generation failed.")
        return

    # === Step 2: Train ML Models ===
    success = run_step(
        "Train ML Models",
        [python, os.path.join(scripts_dir, "train_model.py"),
         "-d", data_dir, "-m", models_dir],
        cwd=project_root,
    )
    results.append(("Train Models", success))

    # === Step 3: Evaluate System ===
    success = run_step(
        "Evaluate System",
        [python, os.path.join(scripts_dir, "evaluate.py"),
         "-d", data_dir, "-m", models_dir],
        cwd=project_root,
    )
    results.append(("Evaluate", success))

    # === Step 4: Generate Visualizations ===
    success = run_step(
        "Generate Visualizations",
        [python, os.path.join(scripts_dir, "visualize.py"),
         "-d", data_dir, "-o", plots_dir, "-m", models_dir],
        cwd=project_root,
    )
    results.append(("Visualize", success))

    # === Summary ===
    print("\n" + "="*60)
    print("📋 PIPELINE SUMMARY")
    print("="*60)

    for step_name, success in results:
        status = "✅" if success else "❌"
        print(f"   {status} {step_name}")

    all_success = all(s for _, s in results)

    if all_success:
        print(f"\n🎉 All steps completed successfully!")
        print(f"\n📂 Output files:")
        print(f"   Data:   {data_dir}/")
        print(f"   Models: {models_dir}/")
        print(f"   Plots:  {plots_dir}/")
        print(f"\n🖥️ To start dashboard:")
        print(f"   streamlit run dashboard/dashboard.py")
    else:
        print(f"\n⚠️ Some steps failed. Check output above.")

    print(f"\n📅 Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
