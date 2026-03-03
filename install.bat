@echo off
title AutoMindz - Installing Dependencies
color 0E

echo.
echo    ╔══════════════════════════════════════╗
echo    ║     📦 AutoMindz Installer           ║
echo    ╚══════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is NOT installed!
    echo    Download it from: https://nodejs.org
    echo.
    pause
    exit /b
)
echo ✅ Node.js: & node -v
echo.

echo 📦 Installing server dependencies...
cd server
call npm install
cd ..
echo.
echo ✅ Server dependencies installed!
echo.

echo 📦 Installing client dependencies...
cd client
call npm install
cd ..
echo.
echo ✅ Client dependencies installed!

echo.
echo ══════════════════════════════════════
echo  ✅ All done! Now double-click start.bat to run AutoMindz
echo ══════════════════════════════════════
echo.
pause
