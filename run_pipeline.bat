@echo off
REM ====================================================
REM KDS Guard - Full Pipeline Runner (Windows)
REM ====================================================
echo.
echo ====================================================
echo   KDS Guard - Full Pipeline
echo   BadUSB Detection via Keystroke Dynamics
echo ====================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM Install dependencies
echo [1/5] Installing Python dependencies...
pip install -r requirements.txt --quiet
echo      Done.

REM Generate demo data
echo.
echo [2/5] Generating demo dataset...
python scripts\generate_demo_data.py -d data -n 20
if errorlevel 1 (
    echo [ERROR] Data generation failed.
    pause
    exit /b 1
)

REM Train models
echo.
echo [3/5] Training ML models...
python scripts\train_model.py -d data -m models
if errorlevel 1 (
    echo [WARNING] Model training had issues, continuing...
)

REM Evaluate
echo.
echo [4/5] Evaluating system...
python scripts\evaluate.py -d data -m models
if errorlevel 1 (
    echo [WARNING] Evaluation had issues, continuing...
)

REM Visualize
echo.
echo [5/5] Generating visualizations...
python scripts\visualize.py -d data -o plots -m models
if errorlevel 1 (
    echo [WARNING] Visualization had issues, continuing...
)

echo.
echo ====================================================
echo   Pipeline Complete!
echo ====================================================
echo.
echo   Data:     data\
echo   Models:   models\
echo   Plots:    plots\
echo.
echo   To start dashboard:
echo   streamlit run dashboard\dashboard.py
echo.
pause
