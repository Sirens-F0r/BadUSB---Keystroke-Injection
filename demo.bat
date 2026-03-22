@echo off
chcp 65001 >nul 2>&1
title KDS Guard - Demo Suite
color 0A

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  🛡️  KDS Guard - Demo Suite                         ║
echo ║  BadUSB Detection via Keystroke Dynamics             ║
echo ╠══════════════════════════════════════════════════════╣
echo ║                                                      ║
echo ║  Demo 1: Human Typing    → Kết quả: NORMAL          ║
echo ║  Demo 2: Injection Attack → Kết quả: CRITICAL       ║
echo ║  Demo 3: Dashboard        → Streamlit Dashboard      ║
echo ║                                                      ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:menu
echo ┌──────────────────────────────────────────┐
echo │  Chọn demo:                              │
echo │                                          │
echo │  [1] Demo 1 - Human Typing Detection     │
echo │  [2] Demo 2 - Injection Attack Detection │
echo │  [3] Demo 3 - Dashboard Visualization    │
echo │  [4] Chạy tất cả tuần tự               │
echo │  [0] Thoát                               │
echo │                                          │
echo └──────────────────────────────────────────┘
echo.
set /p choice="👉 Nhập lựa chọn (0-4): "

if "%choice%"=="1" goto demo1
if "%choice%"=="2" goto demo2
if "%choice%"=="3" goto demo3
if "%choice%"=="4" goto demo_all
if "%choice%"=="0" goto exit

echo ❌ Lựa chọn không hợp lệ!
echo.
goto menu

:: ============================================
:: DEMO 1: Human Typing
:: ============================================
:demo1
cls
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  DEMO 1: Human Typing Detection                     ║
echo ╠══════════════════════════════════════════════════════╣
echo ║                                                      ║
echo ║  Mục đích: Chứng minh người gõ bình thường           ║
echo ║            KHÔNG bị phát hiện nhầm (False Positive)   ║
echo ║                                                      ║
echo ║  Cách thực hiện:                                     ║
echo ║  1. KDS Guard sẽ chạy ở chế độ Detection             ║
echo ║  2. Mở Notepad và gõ bình thường                     ║
echo ║  3. Quan sát: Risk Level = NORMAL                    ║
echo ║                                                      ║
echo ║  Kết quả mong đợi:                                   ║
echo ║  ✅ Risk level: NORMAL                               ║
echo ║  ✅ Không có cảnh báo                                ║
echo ║                                                      ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo 📝 Đề xuất gõ:
echo    "The quick brown fox jumps over the lazy dog"
echo    "Hôm nay trời đẹp quá, tôi muốn đi dạo"
echo.
echo ⏱️  Thời gian: gõ khoảng 30 giây
echo.
pause

:: Mở Notepad
start notepad.exe
timeout /t 2 >nul

:: Chạy KDS Guard ở chế độ detection (30 giây)
echo 🛡️  Đang chạy KDS Guard (Detection Mode, 30 giây)...
echo    Hãy gõ văn bản bình thường trong Notepad!
echo.
kds_guard\target\release\kds_guard.exe --log-keys -v -d 30

echo.
echo ✅ Demo 1 hoàn tất!
echo    Kết quả mong đợi: Risk NORMAL, không cảnh báo
echo.
pause

:: Đóng Notepad
taskkill /IM notepad.exe /F >nul 2>&1

if "%from_all%"=="1" goto demo2
goto menu

:: ============================================
:: DEMO 2: Injection Attack
:: ============================================
:demo2
cls
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  DEMO 2: Injection Attack Detection                  ║
echo ╠══════════════════════════════════════════════════════╣
echo ║                                                      ║
echo ║  Mục đích: Chứng minh hệ thống phát hiện             ║
echo ║            tấn công chèn phím giả mạo (BadUSB)       ║
echo ║                                                      ║
echo ║  Cách thực hiện:                                     ║
echo ║  1. KDS Guard chạy ở chế độ Detection                ║
echo ║  2. Script injection simulator sẽ gõ siêu nhanh      ║
echo ║  3. Quan sát: Risk Level = CRITICAL                  ║
echo ║                                                      ║
echo ║  Kết quả mong đợi:                                   ║
echo ║  🔴 Risk level: CRITICAL                             ║
echo ║  🔴 PHÁT HIỆN TẤN CÔNG HID INJECTION!                ║
echo ║                                                      ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo ⚠️  Script injection sẽ gõ phím tự động vào Notepad
echo    (payload an toàn, chỉ echo text)
echo.
pause

:: Mở Notepad
start notepad.exe
timeout /t 2 >nul

:: Chạy KDS Guard và injection simulator song song
echo 🛡️  Đang khởi động KDS Guard (Detection Mode)...
start "KDS Guard" cmd /c "kds_guard\target\release\kds_guard.exe --log-keys -v -d 20"

:: Đợi KDS Guard khởi động
timeout /t 3 >nul

echo 💉 Đang chạy Injection Simulator (BadUSB Fast)...
echo    Hãy quan sát cửa sổ KDS Guard!
echo.
python scripts\simulate_injection.py --type fast --delay 2

:: Đợi KDS Guard kết thúc
timeout /t 10 >nul

echo.
echo ✅ Demo 2 hoàn tất!
echo    Kết quả mong đợi: Risk CRITICAL, có cảnh báo injection
echo.
pause

:: Đóng Notepad
taskkill /IM notepad.exe /F >nul 2>&1

if "%from_all%"=="1" goto demo3
goto menu

:: ============================================
:: DEMO 3: Dashboard
:: ============================================
:demo3
cls
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  DEMO 3: Dashboard Visualization                    ║
echo ╠══════════════════════════════════════════════════════╣
echo ║                                                      ║
echo ║  Mục đích: Hiển thị kết quả phân tích trực quan      ║
echo ║                                                      ║
echo ║  Dashboard bao gồm 5 tabs:                           ║
echo ║  📊 Tab 1: Overview         (tổng quan hệ thống)     ║
echo ║  🔍 Tab 2: Live Monitor     (giám sát realtime)      ║
echo ║  📈 Tab 3: Analysis         (phân tích chi tiết)     ║
echo ║  🤖 Tab 4: Model Performance (so sánh mô hình)      ║
echo ║  📋 Tab 5: Detection Log    (nhật ký phát hiện)      ║
echo ║                                                      ║
echo ║  Lưu ý: Cần có data đã được xử lý trong data/       ║
echo ║                                                      ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo 🌐 Dashboard sẽ mở tại: http://localhost:8501
echo    Nhấn Ctrl+C trong terminal để dừng dashboard
echo.
pause

echo 🚀 Đang khởi động Streamlit Dashboard...
streamlit run dashboard\dashboard.py

echo.
echo ✅ Demo 3 hoàn tất!
echo.
pause

if "%from_all%"=="1" goto demo_done
goto menu

:: ============================================
:: DEMO ALL
:: ============================================
:demo_all
set from_all=1
goto demo1

:demo_done
set from_all=
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  ✅ Tất cả 3 demo đã hoàn tất!                     ║
echo ╚══════════════════════════════════════════════════════╝
echo.
pause
goto menu

:exit
echo.
echo 👋 Tạm biệt!
echo.
