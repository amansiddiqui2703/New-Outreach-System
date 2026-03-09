@echo off
title AutoMindz Stop Script

echo =========================================
echo       Shutting Down AutoMindz...
echo =========================================
echo Safely stopping containers and preserving your data in MongoDB.

docker-compose down

echo.
echo =========================================
echo       AutoMindz has been stopped!
echo =========================================
echo All your data has been saved to the MongoDB volume.
pause
