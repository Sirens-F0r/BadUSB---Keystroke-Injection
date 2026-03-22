@echo off
REM ====================================================
REM KDS Guard - Build Rust Project (Windows)
REM ====================================================
echo.
echo ====================================================
echo   Building KDS Guard (Rust)
echo ====================================================
echo.

REM Check Rust
rustc --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Rust not found. Install from https://rustup.rs
    pause
    exit /b 1
)

cd kds_guard

REM Build debug
echo [1/2] Building debug version...
cargo build 2>&1
if errorlevel 1 (
    echo [ERROR] Debug build failed.
    pause
    exit /b 1
)
echo      Debug build: OK

REM Build release
echo.
echo [2/2] Building release version...
cargo build --release 2>&1
if errorlevel 1 (
    echo [ERROR] Release build failed.
    pause
    exit /b 1
)
echo      Release build: OK

echo.
echo ====================================================
echo   Build Complete!
echo ====================================================
echo.
echo   Debug:   kds_guard\target\debug\kds_guard.exe
echo   Release: kds_guard\target\release\kds_guard.exe
echo.
echo   Usage:
echo     kds_guard.exe --collect-only --log-keys -v
echo     kds_guard.exe --log-keys -v
echo     kds_guard.exe --help
echo.
pause
