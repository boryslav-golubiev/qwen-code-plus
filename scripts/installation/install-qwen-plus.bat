@echo off
REM Qwen Code Plus Windows Installer
REM Usage: download and run from https://raw.githubusercontent.com/boryslav-golubiev/qwen-code-plus/refs/heads/main/scripts/installation/install-qwen-plus.bat

setlocal enabledelayedexpansion

echo ==========================================
echo    Qwen Code Plus Windows Installer
echo ==========================================
echo.

REM ---- Check Node.js ----
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed.
    echo.
    echo Please install Node.js 20+ from https://nodejs.org/
    echo Then run this installer again.
    exit /b 1
)

for /f "delims=" %%i in ('node --version') do set "NODE_VERSION=%%i"
set "MAJOR_VERSION=!NODE_VERSION:v=!"
for /f "tokens=1 delims=." %%a in ("!MAJOR_VERSION!") do set "MAJOR_VERSION=%%a"

if !MAJOR_VERSION! LSS 20 (
    echo ERROR: Node.js version !NODE_VERSION! is too old. Need version 20+.
    echo.
    echo Please install Node.js 20+ from https://nodejs.org/
    echo Then run this installer again.
    exit /b 1
)

echo INFO: Node.js !NODE_VERSION! found.
echo.

REM ---- Fix npm global path if needed ----
set "NPM_PREFIX="
for /f "delims=" %%i in ('npm config get prefix 2^>nul') do set "NPM_PREFIX=%%i"

if "!NPM_PREFIX!"=="" (
    echo INFO: Setting npm global prefix to user directory...
    set "NPM_PREFIX=%USERPROFILE%\.npm-global"
    if not exist "!NPM_PREFIX!" mkdir "!NPM_PREFIX!"
    npm config set prefix "!NPM_PREFIX!"
)

REM Check if system path
set "IS_SYSTEM=0"
echo !NPM_PREFIX! | findstr /C:"\Program Files" >nul
if %ERRORLEVEL% EQU 0 set "IS_SYSTEM=1"
echo !NPM_PREFIX! | findstr /C:"Program Files (x86)" >nul
if %ERRORLEVEL% EQU 0 set "IS_SYSTEM=1"

if !IS_SYSTEM! EQU 1 (
    echo INFO: npm global prefix points to system directory. Switching to user directory...
    set "NPM_PREFIX=%USERPROFILE%\.npm-global"
    if not exist "!NPM_PREFIX!" mkdir "!NPM_PREFIX!"
    npm config set prefix "!NPM_PREFIX!"
)

REM Add to PATH for this session
set "PATH=!NPM_PREFIX!\bin;!PATH!"

REM ---- Install Qwen Code Plus ----
echo INFO: Installing Qwen Code Plus...
echo.
call npm install -g @boryslav-golubiev/qwen-code-plus@latest

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Installation failed. Check your internet connection and try again.
    exit /b 1
)

echo.
echo ==========================================
echo  Installation Complete!
echo ==========================================
echo.

where qwen-plus >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: qwen-plus is available in PATH!
    call qwen-plus --version
    echo.
    echo Run: qwen-plus
) else (
    echo WARNING: qwen-plus not found in PATH.
    echo Add this to your PATH: !NPM_PREFIX!\bin
    echo.
    echo You can also run it directly: "!NPM_PREFIX!\bin\qwen-plus.cmd"
)

echo.
endlocal
