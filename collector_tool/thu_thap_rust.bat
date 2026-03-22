@echo off
chcp 65001 >nul
title KDS Guard - Thu Thap Du Lieu Go Phim

echo.
echo ========================================================
echo   KDS Guard - Thu Thap Du Lieu Go Phim
echo   (Nguon 3 - Rust Collector)
echo ========================================================
echo.

REM Xac dinh thu muc
set "PROJECT_DIR=%~dp0.."
set "DATA_DIR=%PROJECT_DIR%\data\raw\rust"
set "KDS_EXE=%~dp0kds_guard.exe"

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

if not exist "%KDS_EXE%" (
    echo [LOI] Khong tim thay kds_guard.exe!
    echo   Chay: cargo build --release trong thu muc kds_guard
    pause
    exit /b 1
)

echo   HUONG DAN:
echo   - Nhap ten cua ban
echo   - Se co 3 sessions, moi session tu dong dung khi het gio
echo   - MO NOTEPAD MOI truoc khi go moi session
echo   - Dong Notepad khi xong hoac cho het gio
echo.

set /p USERNAME=Nhap ten cua ban (khong dau, dung _ thay khoang trang): 

if "%USERNAME%"=="" (
    echo [LOI] Ban chua nhap ten!
    pause
    exit /b 1
)

REM ========== SESSION 1 ==========
echo.
echo ========================================================
echo   SESSION 1/3: Go doan van (toi da 2 phut)
echo ========================================================
echo.
echo   ****************************************************
echo   *  HAY MO NOTEPAD MOI (Ctrl+N) TRUOC KHI GO!      *
echo   ****************************************************
echo.
echo   Go lai doan van sau trong Notepad:
echo.
echo   "Truong Dai hoc Cong nghe la mot trong nhung truong dai
echo   hoc hang dau Viet Nam ve dao tao va nghien cuu trong linh
echo   vuc cong nghe thong tin va truyen thong."
echo.
echo   Session se TU DONG DUNG sau 120 giay.
echo   Nhan ENTER khi da mo Notepad san sang...
pause >nul

echo.
echo   *** DANG THU THAP (120 giay) - GO TRONG NOTEPAD ***
echo.

"%KDS_EXE%" --collect-only --log-keys -u %USERNAME%_s1 -o "%DATA_DIR%" -d 120

echo.
echo   Session 1 HOAN TAT!
echo.
timeout /t 3 /nobreak >nul

REM ========== SESSION 2 ==========
echo ========================================================
echo   SESSION 2/3: Go chuoi ngau nhien (toi da 90 giay)
echo ========================================================
echo.
echo   ****************************************************
echo   *  HAY MO TAB NOTEPAD MOI (Ctrl+N) TRUOC KHI GO!  *
echo   ****************************************************
echo.
echo   Go cac chuoi sau (lap lai nhieu lan):
echo.
echo   x7Kp2mN9bT   P@ssw0rd123!   Str0ng#Key2024
echo.
echo   Session se TU DONG DUNG sau 90 giay.
echo   Nhan ENTER khi da mo Notepad san sang...
pause >nul

echo.
echo   *** DANG THU THAP (90 giay) - GO TRONG NOTEPAD ***
echo.

"%KDS_EXE%" --collect-only --log-keys -u %USERNAME%_s2 -o "%DATA_DIR%" -d 90

echo.
echo   Session 2 HOAN TAT!
echo.
timeout /t 3 /nobreak >nul

REM ========== SESSION 3 ==========
echo ========================================================
echo   SESSION 3/3: Go tu do (toi da 90 giay)
echo ========================================================
echo.
echo   ****************************************************
echo   *  HAY MO TAB NOTEPAD MOI (Ctrl+N) TRUOC KHI GO!  *
echo   ****************************************************
echo.
echo   Go bat ky gi ban muon: chat, email, code, ghi chu...
echo.
echo   Session se TU DONG DUNG sau 90 giay.
echo   Nhan ENTER khi da mo Notepad san sang...
pause >nul

echo.
echo   *** DANG THU THAP (90 giay) - GO TRONG NOTEPAD ***
echo.

"%KDS_EXE%" --collect-only --log-keys -u %USERNAME%_s3 -o "%DATA_DIR%" -d 90

echo.
echo ========================================================
echo   HOAN TAT! Cam on ban da tham gia!
echo ========================================================
echo.
echo   Du lieu da luu tai: %DATA_DIR%
echo   Da thu 3 sessions cho user: %USERNAME%
echo.
echo   Cam on ban da ho tro du an!
echo.
pause
