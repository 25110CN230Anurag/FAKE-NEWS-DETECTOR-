@echo off
title Veritas - AI Fake News Detector
color 0B
echo ========================================================
echo   VERITAS: AI News Veracity & Real-Time Fact-Checker
echo ========================================================
echo.
echo [1/2] Checking Python environment...
python --version
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python.
    pause
    exit /b
)

echo.
echo [2/2] Starting Veritas Web Server...
echo The app will be available at: http://127.0.0.1:5000
echo Presentation deck is at:       http://127.0.0.1:5000/presentation
echo.
start http://127.0.0.1:5000
python app.py
pause
