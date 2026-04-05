@echo off
echo ==========================================
echo   KDS Guard - Che do phat hien tan cong
echo   Can chay voi quyen Administrator!
echo ==========================================
echo.
echo Nhan phim bat ky de bat dau...
pause >nul

"%~dp0kds_guard.exe" -w 40 -s 20 -u demo_user -v

echo.
echo Da dung KDS Guard.
pause
