@echo off
echo ========================================
echo   EKBase Digital Spirit - Setup
echo   數位靈體平台 - 安裝程式
echo ========================================
echo.

echo [1/4] Checking Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found!
    echo Please install Python 3.x from https://python.org
    pause
    exit /b 1
)

echo [2/4] Installing required packages...
pip install requests >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    pip install requests
)

echo [3/4] Creating folder...
if not exist "EKBase-DigitalSpirit" mkdir "EKBase-DigitalSpirit"
copy digital-spirit.py "EKBase-DigitalSpirit\" >nul
copy README.md "EKBase-DigitalSpirit\" >nul

echo [4/4] Done!
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To run the app:
echo   cd EKBase-DigitalSpirit
echo   python digital-spirit.py
echo.
echo Or use the shortcut on your Desktop!
echo.
pause
