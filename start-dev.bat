@echo off
REM AssetTrack Development Server Startup Script
REM This script ensures the database is running before starting the application

echo === AssetTrack Development Server Startup ===
echo.

REM Check if Docker is running
echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running or not installed
    echo Please install Docker Desktop and ensure it's running
    pause
    exit /b 1
)
echo [OK] Docker is installed

REM Check if .env file exists
echo Checking environment configuration...
if not exist .env (
    echo [ERROR] .env file not found
    echo Please copy .env.example to .env and configure it
    echo Example: copy .env.example .env
    pause
    exit /b 1
)
echo [OK] Environment configuration found

REM Check if node_modules exists
echo Checking dependencies...
if not exist node_modules (
    echo [INFO] Dependencies not installed, running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)
echo [OK] Dependencies installed

REM Start PostgreSQL database
echo Starting PostgreSQL database...
docker compose up -d db
if errorlevel 1 (
    echo [ERROR] Failed to start database
    pause
    exit /b 1
)

REM Wait for database to be healthy
echo Waiting for database to be healthy...
timeout /t 5 /nobreak >nul
echo [OK] Database should be ready

echo.
echo === Starting Development Server ===
echo Server will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

REM Start the development server
call npm run dev
