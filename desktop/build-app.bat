@echo off
echo ========================================
echo   EKBase Digital Spirit - Builder
echo   自動整.exe installer
echo ========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [1/5] Python not found. Downloading...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe' -OutFile 'python-installer.exe'"
    echo [1/5] Please install Python, then run this again.
    pause
    exit /b 1
)

echo [1/5] Python found: 
python --version

echo [2/5] Installing PyInstaller...
pip install pyinstaller

echo [3/5] Creating executable folder...
if not exist "output" mkdir output

echo [4/5] Building executable...
pyinstaller --onefile --windowed --name "EKBase-DigitalSpirit" digital-spirit-v2.py

echo [5/5] Done!
echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo Your executable is in:
echo   output\EKBase-DigitalSpirit.exe
echo.
echo Copy this to your users and they can run it!
pause
