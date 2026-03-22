@echo off
chcp 65001 >nul
title KDS Guard - Thu Thap Du Lieu Go Phim

echo.
echo ========================================================
echo   KDS Guard - Thu Thap Du Lieu Go Phim
echo   Du an: Phat hien BadUSB qua Keystroke Dynamics
echo ========================================================
echo.

REM Xac dinh thu muc hien tai
set "DATA_DIR=%~dp0data"
set "KDS_EXE=%~dp0kds_guard.exe"

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

if not exist "%KDS_EXE%" (
    echo [LOI] Khong tim thay kds_guard.exe!
    echo   Hay dam bao file kds_guard.exe nam cung thu muc voi file .bat nay.
    pause
    exit /b 1
)

echo   HUONG DAN:
echo   1. Nhap ten cua ban
echo   2. Se co 3 sessions, moi session tu dong dung khi het gio
echo   3. MO NOTEPAD MOI truoc khi go moi session
echo   4. Go xong dong Notepad, hoac cho het gio tu dong chuyen
echo.
echo   LUU Y: Chuong trinh thu thap phim ban nhan o nen,
echo   KHONG luu noi dung ban go, chi luu toc do va nhip go.
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
echo   Du lieu da luu trong thu muc: data\
echo   Hay gui lai thu muc "data" cho nguoi nghien cuu.
echo.
echo   Cam on ban da ho tro du an!
echo.
pause
