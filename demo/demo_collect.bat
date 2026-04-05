@echo off
echo ==========================================
echo   KDS Guard - Che do thu thap du lieu
echo   Go phim binh thuong trong 30 giay
echo ==========================================
echo.
echo Nhan phim bat ky de bat dau...
pause >nul

"%~dp0kds_guard.exe" --collect-only -d 30 -u demo_user --log-keys -v

echo.
echo Da thu thap xong! Kiem tra file CSV trong thu muc data/
pause
