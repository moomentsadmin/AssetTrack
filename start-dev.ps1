#!/usr/bin/env pwsh
# AssetTrack Development Server Startup Script
# This script ensures the database is running before starting the application

Write-Host "=== AssetTrack Development Server Startup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if (-not $dockerVersion) {
        throw "Docker not found"
    }
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running or not installed" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop and ensure it's running" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "  Please copy .env.example to .env and configure it" -ForegroundColor Red
    Write-Host "  Example: cp .env.example .env" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Environment configuration found" -ForegroundColor Green

# Check if node_modules exists
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "! Dependencies not installed, running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Start PostgreSQL database
Write-Host "Starting PostgreSQL database..." -ForegroundColor Yellow
docker compose up -d db
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start database" -ForegroundColor Red
    exit 1
}

# Wait for database to be healthy
Write-Host "Waiting for database to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts -and -not $healthy) {
    $attempt++
    Start-Sleep -Seconds 1
    
    $status = docker ps --filter "name=asset-db" --format "{{.Status}}" 2>$null
    if ($status -match "healthy") {
        $healthy = $true
    }
    
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""
if ($healthy) {
    Write-Host "✓ Database is healthy and ready" -ForegroundColor Green
} else {
    Write-Host "⚠ Database may not be fully ready, but continuing..." -ForegroundColor Yellow
}

# Check if database schema exists
Write-Host "Checking database schema..." -ForegroundColor Yellow
$tableCount = docker exec asset-db psql -U asset_user -d asset_management -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
if ($null -eq $tableCount -or $tableCount.Trim() -eq "0") {
    Write-Host "! Database schema not found, running migrations..." -ForegroundColor Yellow
    npm run db:push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ Migrations may have failed, but continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ Database schema exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Starting Development Server ===" -ForegroundColor Cyan
Write-Host "Server will be available at: http://localhost:5000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev
