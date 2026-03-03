@echo off
title AutoMindz Stop Script

echo =========================================
echo       Stopping AutoMindz Servers...
echo =========================================
echo.
echo Stopping all Node.js instances...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo =========================================
echo    Successfully stopped all servers!
echo    You can now close this window.
echo =========================================
timeout /t 3 >nul
