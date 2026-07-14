@echo off
title Persian Subtitle Finder - Smart AI Translator
color 0B

echo =======================================================
echo    Persian Subtitle Finder - Windows One-Click Start
echo =======================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [X] Node.js is not installed or not in PATH!
    echo Please download and install it from https://nodejs.org/
    echo Make sure to check the box that says "Add to PATH" during installation.
    pause
    exit /b
)

echo [*] Node.js detected.

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo [*] First run detected. Installing dependencies (this may take a few minutes)...
    call npm install
) else (
    echo [*] Dependencies already installed.
)

:: Build the application
echo [*] Building the application for optimal performance...
call npm run build

:: Start the server in the background and open the browser
echo [*] Starting server and opening default browser...

:: Create a temporary VBScript to open the browser silently after a short delay
echo WScript.Sleep 3000 > open_browser.vbs
echo CreateObject("WScript.Shell").Run "http://localhost:3000" >> open_browser.vbs
start wscript open_browser.vbs

:: Run the server
echo.
echo =======================================================
echo Application is running! Keep this window open.
echo To close the application, simply close this window.
echo =======================================================
call npm start

:: Cleanup if it ever reaches here
del open_browser.vbs
