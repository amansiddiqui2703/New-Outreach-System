@echo off
title AutoMindz Start Script

echo =========================================
echo       Checking Docker Installation
echo =========================================
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running.
    echo Please install Docker Desktop for Windows: https://docs.docker.com/desktop/install/windows-install/
    echo Make sure Docker Desktop is open and running before launching AutoMindz.
    echo.
    pause
    exit /b 1
)

echo.
echo =========================================
echo       Starting AutoMindz Environment
echo =========================================
echo This may take a few minutes the first time it runs to download the images.
echo Your data will be safely persisted in MongoDB.

:: Run docker-compose in detached mode and rebuild if necessary
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start Docker containers.
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo =========================================
echo       AutoMindz is running!
echo =========================================
echo Frontend: http://localhost:5173
echo Backend API:  http://localhost:5000/api
echo.
echo To shut down the application without losing data, run stop.bat!
echo.
pause
