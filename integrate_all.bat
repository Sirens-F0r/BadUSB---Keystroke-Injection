@echo off
chcp 65001 > nul
echo ╔════════════════════════════════════════════════════════╗
echo ║   KDS Guard - Dataset Integration Pipeline             ║
echo ║   3 nguồn: CMU ^| Python Collector ^| Rust Collector   ║
echo ╚════════════════════════════════════════════════════════╝
echo.

:: ─── Bước 0: Kiểm tra trạng thái hiện tại ───
echo [BƯỚC 0] Trạng thái dataset hiện tại:
python scripts/integrate_datasets.py --status
echo.

:: ─── Bước 1: Chuyển đổi CMU dataset ───
echo [BƯỚC 1] Chuyển đổi CMU dataset (Nguồn 1)...
python scripts/integrate_datasets.py --cmu
if errorlevel 1 (
    echo ❌ Lỗi chuyển đổi CMU. Tiếp tục...
) else (
    echo ✅ CMU done.
)
echo.

:: ─── Bước 2: Python collector ───
echo [BƯỚC 2] Xử lý Python collector logs (Nguồn 2)...
python scripts/integrate_datasets.py --self-collect
echo.

:: ─── Bước 3: Rust collector ───
echo [BƯỚC 3] Xử lý Rust collector logs (Nguồn 3)...
python scripts/integrate_datasets.py --rust-collect
echo.

:: ─── Bước 4: Gộp tất cả ───
echo [BƯỚC 4] Gộp tất cả dataset...
python scripts/integrate_datasets.py --merge
if errorlevel 1 (
    echo ❌ Lỗi merge dataset!
    pause
    exit /b 1
)
echo.

:: ─── Bước 5: Retrain model ───
echo [BƯỚC 5] Retrain model với dataset mới...
python scripts/train_model.py
echo.

echo ╔════════════════════════════════════════╗
echo ║ ✅ HOÀN TẤT! Dataset đã được gộp.     ║
echo ║ Bước tiếp:                             ║
echo ║   python scripts/evaluate.py           ║
echo ║   python scripts/visualize.py          ║
echo ║   streamlit run dashboard/dashboard.py ║
echo ╚════════════════════════════════════════╝
pause
