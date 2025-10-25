# Asset Management Device Tracking Agent - Windows Installer
# This script installs the device tracking agent as a Windows Service

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$TrackingToken,
    
    [string]$InstallPath = "C:\Program Files\AssetMgtTracking",
    
    [switch]$EnableLocation = $false,
    
    [int]$HeartbeatInterval = 300000
)

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Please restart PowerShell as Administrator and try again."
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Asset Management Device Tracking Agent" -ForegroundColor Cyan
Write-Host "Windows Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "[1/7] Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "  ✓ Node.js $nodeVersion found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Node.js not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from https://nodejs.org/ and run this script again." -ForegroundColor Yellow
    Write-Host "Recommended: Download and install LTS version (Long Term Support)" -ForegroundColor Yellow
    exit 1
}

# Create installation directory
Write-Host "[2/7] Creating installation directory..." -ForegroundColor Yellow
if (!(Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "  ✓ Created $InstallPath" -ForegroundColor Green
} else {
    Write-Host "  ✓ Directory already exists" -ForegroundColor Green
}

# Copy agent files
Write-Host "[3/7] Copying agent files..." -ForegroundColor Yellow
$agentSource = Join-Path $PSScriptRoot "..\..\"
Copy-Item -Path (Join-Path $agentSource "agent.js") -Destination $InstallPath -Force
Copy-Item -Path (Join-Path $agentSource "package.json") -Destination $InstallPath -Force
Write-Host "  ✓ Agent files copied" -ForegroundColor Green

# Install dependencies
Write-Host "[4/7] Installing dependencies..." -ForegroundColor Yellow
Push-Location $InstallPath
npm install --production --silent
Pop-Location
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# Create configuration file
Write-Host "[5/7] Creating configuration..." -ForegroundColor Yellow
$configContent = @"
SERVER_URL=$ServerUrl
TRACKING_TOKEN=$TrackingToken
HEARTBEAT_INTERVAL=$HeartbeatInterval
ENABLE_LOCATION=$(if ($EnableLocation) { 'true' } else { 'false' })
"@
$configPath = Join-Path $InstallPath ".env"
$configContent | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "  ✓ Configuration saved to $configPath" -ForegroundColor Green

# Create service wrapper script
Write-Host "[6/7] Creating service wrapper..." -ForegroundColor Yellow
$wrapperContent = @"
@echo off
cd /d "$InstallPath"
node agent.js
"@
$wrapperPath = Join-Path $InstallPath "run-agent.bat"
$wrapperContent | Out-File -FilePath $wrapperPath -Encoding ASCII
Write-Host "  ✓ Service wrapper created" -ForegroundColor Green

# Install as Windows Service using NSSM (recommended) or create scheduled task
Write-Host "[7/7] Setting up service..." -ForegroundColor Yellow

# Check if NSSM is available
$nssmPath = where.exe nssm 2>$null
if ($nssmPath) {
    # Install using NSSM (preferred method)
    nssm stop AssetMgtTracking 2>$null
    nssm remove AssetMgtTracking confirm 2>$null
    
    nssm install AssetMgtTracking "$wrapperPath"
    nssm set AssetMgtTracking AppDirectory "$InstallPath"
    nssm set AssetMgtTracking DisplayName "Asset Management Device Tracking"
    nssm set AssetMgtTracking Description "Monitors device location and system resources for asset management"
    nssm set AssetMgtTracking Start SERVICE_AUTO_START
    nssm start AssetMgtTracking
    
    Write-Host "  ✓ Windows Service installed and started (using NSSM)" -ForegroundColor Green
} else {
    # Create scheduled task to run at startup
    $taskName = "AssetMgtTracking"
    
    # Remove existing task if it exists
    schtasks /query /tn $taskName >$null 2>&1
    if ($LASTEXITCODE -eq 0) {
        schtasks /delete /tn $taskName /f >$null
    }
    
    # Create new task
    $action = New-ScheduledTaskAction -Execute "node.exe" -Argument "agent.js" -WorkingDirectory $InstallPath
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
    Start-ScheduledTask -TaskName $taskName
    
    Write-Host "  ✓ Scheduled task created and started" -ForegroundColor Green
    Write-Host "  ℹ For better service management, consider installing NSSM: https://nssm.cc/" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The device tracking agent is now running and will:" -ForegroundColor White
Write-Host "  • Monitor system resources (CPU, memory, disk)" -ForegroundColor White
Write-Host "  • Send heartbeat every $($HeartbeatInterval/60000) minutes" -ForegroundColor White
if ($EnableLocation) {
    Write-Host "  • Track device location using IP geolocation" -ForegroundColor White
}
Write-Host ""
Write-Host "Configuration file: $configPath" -ForegroundColor White
Write-Host "Installation path: $InstallPath" -ForegroundColor White
Write-Host ""
Write-Host "To uninstall:" -ForegroundColor Yellow
if ($nssmPath) {
    Write-Host "  nssm stop AssetMgtTracking" -ForegroundColor Gray
    Write-Host "  nssm remove AssetMgtTracking confirm" -ForegroundColor Gray
} else {
    Write-Host "  schtasks /delete /tn AssetMgtTracking /f" -ForegroundColor Gray
}
Write-Host "  Remove-Item -Recurse -Force '$InstallPath'" -ForegroundColor Gray
Write-Host ""
