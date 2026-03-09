@echo off
title AutoMindz
echo ==================================================
echo Starting AutoMindz (Local Node Mode)
echo ==================================================
echo.
echo NOTE: Since Docker/MongoDB is not installed, the app 
echo will run using an "In-Memory" database. Your data 
echo (users, campaigns) will reset when the server is closed.
echo.
echo Starting Backend...
start cmd /k "cd server && npm run dev"

echo Starting Frontend...
start cmd /k "cd client && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Frontend: http://localhost:5173
echo Backend API:  http://localhost:5000/api
echo.
pause
