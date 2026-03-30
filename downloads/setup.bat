@echo off
echo ======================================
echo  Digital Spirit Driver 安裝程式
echo ======================================
echo.
python --version >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 未找到 Python，請先安裝 Python 3.8+
    echo 下載地址: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] 找到 Python
set INSTALL_DIR=%USERPROFILE%\DigitalSpirit
echo 安裝到: %INSTALL_DIR%
mkdir "%INSTALL_DIR%" 2>nul
copy driver.py "%INSTALL_DIR%\" >nul
copy telegram-bridge.py "%INSTALL_DIR%\" >nul
echo.
echo ======================================
echo 安裝完成！
echo 請到 %INSTALL_DIR% 查看
echo 詳見 README.md
echo ======================================
pause
