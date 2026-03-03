@echo off
title AutoMindz Start Script

echo =========================================
echo       Cleaning up old processes...
echo =========================================
:: Quietly kill any stuck Node.js servers to prevent port in-use errors
taskkill /F /IM node.exe >nul 2>&1

echo.
echo =========================================
echo       Starting Backend Server...
echo =========================================
:: Open a new window and start the backend
cd "%~dp0server"
start "AutoMindz Backend" cmd /k "npm run dev"

echo.
echo =========================================
echo       Starting Frontend Server...
echo =========================================
:: Open another new window and start the frontend
cd "%~dp0client"
start "AutoMindz Frontend" cmd /k "npm run dev"

echo.
echo =========================================
echo    Both servers are starting up!
echo    You can now close this window.
echo =========================================
timeout /t 5 >nul
