@echo off
chcp 65001 >nul
title KDS Guard - Thu Thap Du Lieu Go Phim

echo.
echo ========================================================
echo   KDS Guard - Thu Thap Du Lieu Go Phim
echo   (Do An Co So - Phat hien tan cong BadUSB)
echo ========================================================
echo.

REM Xac dinh thu muc goc du an (parent cua collector_tool/)
set "PROJECT_DIR=%~dp0.."
set "DATA_DIR=%PROJECT_DIR%\data"

REM Kiem tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Python!
    echo       Tai va cai Python tu: https://www.python.org/downloads/
    echo       Nho tich "Add Python to PATH" khi cai dat.
    echo.
    pause
    exit /b 1
)

REM Cai pynput neu chua co
echo [1/3] Kiem tra thu vien pynput...
pip show pynput >nul 2>&1
if errorlevel 1 (
    echo       Dang cai dat pynput...
    pip install pynput --quiet
    echo       Da cai xong!
) else (
    echo       pynput da co san.
)

echo.
echo --------------------------------------------------------
echo   HUONG DAN:
echo   - Nhap ten cua ban (vi du: nguyen_van_a)
echo   - Se co 3 sessions:
echo     + Session 1: Go doan van (3 phut)
echo     + Session 2: Go chuoi ngau nhien (2 phut)
echo     + Session 3: Go tu do (2 phut)
echo   - Nhan ESC de dung som bat ky luc nao
echo.
echo   Du lieu se luu tai: %DATA_DIR%
echo --------------------------------------------------------
echo.

set /p USERNAME=Nhap ten cua ban (khong dau, dung _ thay khoang trang): 

if "%USERNAME%"=="" (
    echo [LOI] Ban chua nhap ten!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   SESSION 1/3: Go doan van (3 phut)
echo ========================================================
echo.
echo   Hay go lai doan van sau day:
echo.
echo   "Truong Dai hoc Cong nghe la mot trong nhung truong dai
echo   hoc hang dau Viet Nam ve dao tao va nghien cuu trong linh
echo   vuc cong nghe thong tin va truyen thong."
echo.
echo   Nhan ENTER de bat dau, sau do GO PHIM. Nhan ESC de ket thuc.
pause >nul

python "%~dp0collect_keystrokes.py" -u %USERNAME% -s 1 -o "%DATA_DIR%" --duration 180

echo.
echo ========================================================
echo   SESSION 2/3: Go chuoi ngau nhien (2 phut)
echo ========================================================
echo.
echo   Hay go cac chuoi sau:
echo.
echo   x7Kp2mN9bT   P@ssw0rd123!   Str0ng#Key2024
echo.
echo   Nhan ENTER de bat dau, sau do GO PHIM. Nhan ESC de ket thuc.
pause >nul

python "%~dp0collect_keystrokes.py" -u %USERNAME% -s 2 -o "%DATA_DIR%" --duration 120

echo.
echo ========================================================
echo   SESSION 3/3: Go tu do (2 phut)
echo ========================================================
echo.
echo   Hay go bat ky gi ban muon: chat, email, code, ...
echo.
echo   Nhan ENTER de bat dau, sau do GO PHIM. Nhan ESC de ket thuc.
pause >nul

python "%~dp0collect_keystrokes.py" -u %USERNAME% -s 3 -o "%DATA_DIR%" --duration 120

echo.
echo ========================================================
echo   HOAN TAT! Cam on ban da tham gia!
echo ========================================================
echo.
echo   Du lieu da luu tai: %DATA_DIR%
echo.
echo   Hay gui TAT CA file CSV trong thu muc "data"
echo   ve cho nguoi phu trach du an.
echo.
echo   Cam on ban da ho tro!
echo.
pause
