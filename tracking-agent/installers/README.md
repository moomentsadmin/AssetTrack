# Device Tracking Agent - Installation Guide

The Asset Management Device Tracking Agent is a lightweight service that monitors your laptop's system resources and reports location data to your asset management server.

## Features

- **System Monitoring**: CPU, memory, and disk usage
- **Location Tracking**: IP-based geolocation (optional)
- **Automatic Updates**: Regular heartbeat every 5 minutes
- **Auto-Recovery**: Automatically restarts if connection fails
- **Secure**: Token-based authentication

## Platform Support

✅ **Windows** (Windows 10/11, Windows Server 2016+)  
✅ **Linux** (Ubuntu, Debian, RHEL, CentOS, Fedora)  
✅ **macOS** (10.13 High Sierra and later)

---

## Prerequisites

All platforms require **Node.js** (LTS version recommended):

### Windows
Download and install from: https://nodejs.org/

### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# RHEL/CentOS/Fedora
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs
```

### macOS
```bash
# Using Homebrew
brew install node

# Or download from: https://nodejs.org/
```

---

## Installation

### Step 1: Obtain Tracking Token

1. Log in to the Asset Management System as an **Admin** or **Manager**
2. Navigate to **Device Tracking** page
3. Click **Enable Tracking** button
4. Select the asset (laptop) you want to track
5. Click **Enable Tracking** - a tracking token will be displayed
6. **Copy the token** - you'll need it for installation

### Step 2: Download Installation Package

Download the appropriate installer for your operating system:

```bash
# Clone or download the tracking-agent directory
git clone <repository-url>
cd tracking-agent/installers
```

### Step 3: Run Platform-Specific Installer

#### Windows Installation

**Option 1: Using PowerShell (Recommended)**

1. Open PowerShell as **Administrator** (Right-click → "Run as Administrator")
2. Navigate to the installers directory
3. Run the installation script:

```powershell
cd tracking-agent\installers\windows

.\install.ps1 `
  -ServerUrl "https://assetmgt.digile.com" `
  -TrackingToken "YOUR_TOKEN_HERE" `
  -EnableLocation

# Optional parameters:
# -InstallPath "C:\Custom\Path"           # Custom installation directory
# -HeartbeatInterval 300000               # Heartbeat interval in milliseconds
```

**Option 2: Using Scheduled Task (if NSSM not available)**

The installer will automatically create a Windows Scheduled Task if NSSM is not installed.

**Option 3: Install NSSM for Better Service Management**

For optimal service management, install NSSM (Non-Sucking Service Manager):
```powershell
# Using Chocolatey
choco install nssm

# Or download from: https://nssm.cc/
```

Then re-run the installer script.

**Service Management (Windows):**
```powershell
# Check status
nssm status AssetMgtTracking

# Stop service
nssm stop AssetMgtTracking

# Start service
nssm start AssetMgtTracking

# Or using Scheduled Tasks:
schtasks /query /tn AssetMgtTracking
schtasks /run /tn AssetMgtTracking
schtasks /end /tn AssetMgtTracking
```

---

#### Linux Installation

1. Open terminal
2. Navigate to the installers directory
3. Run the installation script with sudo:

```bash
cd tracking-agent/installers/linux

sudo ./install.sh \
  --server-url "https://assetmgt.digile.com" \
  --tracking-token "YOUR_TOKEN_HERE" \
  --enable-location

# Optional parameters:
# --install-path /custom/path              # Custom installation directory
# --heartbeat-interval 300000              # Heartbeat interval in milliseconds
```

**Service Management (Linux):**
```bash
# Check status
sudo systemctl status assetmgt-tracking

# Stop service
sudo systemctl stop assetmgt-tracking

# Start service
sudo systemctl start assetmgt-tracking

# Restart service
sudo systemctl restart assetmgt-tracking

# View logs
sudo journalctl -u assetmgt-tracking -f
```

---

#### macOS Installation

1. Open Terminal
2. Navigate to the installers directory
3. Run the installation script with sudo:

```bash
cd tracking-agent/installers/macos

sudo ./install.sh \
  --server-url "https://assetmgt.digile.com" \
  --tracking-token "YOUR_TOKEN_HERE" \
  --enable-location

# Optional parameters:
# --install-path /custom/path              # Custom installation directory
# --heartbeat-interval 300000              # Heartbeat interval in milliseconds
```

**Service Management (macOS):**
```bash
# Check status
sudo launchctl list | grep com.assetmgt.tracking

# Stop service
sudo launchctl unload /Library/LaunchDaemons/com.assetmgt.tracking.plist

# Start service
sudo launchctl load /Library/LaunchDaemons/com.assetmgt.tracking.plist

# View logs
tail -f /var/log/assetmgt-tracking.log
tail -f /var/log/assetmgt-tracking-error.log
```

---

## Configuration

### Environment Variables

The installer creates a `.env` file with the following configuration:

```env
SERVER_URL=https://assetmgt.digile.com
TRACKING_TOKEN=your_token_here
HEARTBEAT_INTERVAL=300000
ENABLE_LOCATION=true
```

**Configuration Options:**

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_URL` | Asset Management server URL | Required |
| `TRACKING_TOKEN` | Authentication token | Required |
| `HEARTBEAT_INTERVAL` | Update frequency (milliseconds) | 300000 (5 min) |
| `ENABLE_LOCATION` | Enable IP geolocation tracking | false |

### Manual Configuration

**Windows:** `C:\Program Files\AssetMgtTracking\.env`  
**Linux:** `/opt/assetmgt-tracking/.env`  
**macOS:** `/usr/local/assetmgt-tracking/.env`

After editing configuration, restart the service.

---

## Privacy & Security

### What Data is Collected?

- **System Resources**: CPU usage (%), Memory usage (%), Disk usage (%)
- **Device Info**: Hostname, IP address, Operating system
- **Location** (if enabled): IP-based geolocation (approximate city/region)

### What is NOT Collected?

- ❌ Screen captures or screenshots
- ❌ Keystrokes or user activity
- ❌ File contents or personal data
- ❌ Precise GPS coordinates (only IP-based location)

### Security

- All data transmission uses HTTPS encryption
- Token-based authentication (no passwords stored on device)
- Data only sent to your configured server
- No third-party analytics or tracking

### Disabling Location Tracking

To disable location tracking after installation:

1. Edit the `.env` file (see paths above)
2. Change `ENABLE_LOCATION=true` to `ENABLE_LOCATION=false`
3. Restart the service

---

## Troubleshooting

### Agent Not Reporting

**Check if service is running:**
```bash
# Windows
nssm status AssetMgtTracking
# or
schtasks /query /tn AssetMgtTracking

# Linux
sudo systemctl status assetmgt-tracking

# macOS
sudo launchctl list | grep com.assetmgt.tracking
```

**Check logs for errors:**
```bash
# Windows
type "C:\Program Files\AssetMgtTracking\agent.log"

# Linux
sudo journalctl -u assetmgt-tracking -n 50

# macOS
tail -50 /var/log/assetmgt-tracking-error.log
```

**Verify network connectivity:**
```bash
# Test server connection
curl https://assetmgt.digile.com/api/health

# On Windows:
Invoke-WebRequest https://assetmgt.digile.com/api/health
```

### Invalid Token Error

1. Verify token is correct (no extra spaces)
2. Check if tracking was disabled in admin panel
3. Generate a new token from the admin panel

### Node.js Not Found

Ensure Node.js is in your PATH:
```bash
# Check Node.js installation
node --version
npm --version

# Windows: Add to PATH
setx PATH "%PATH%;C:\Program Files\nodejs\"

# Linux/macOS: Already added during Node.js installation
```

---

## Uninstallation

### Windows

```powershell
# If using NSSM
nssm stop AssetMgtTracking
nssm remove AssetMgtTracking confirm

# If using Scheduled Task
schtasks /delete /tn AssetMgtTracking /f

# Remove installation directory
Remove-Item -Recurse -Force "C:\Program Files\AssetMgtTracking"
```

### Linux

```bash
sudo systemctl stop assetmgt-tracking
sudo systemctl disable assetmgt-tracking
sudo rm /etc/systemd/system/assetmgt-tracking.service
sudo rm -rf /opt/assetmgt-tracking
sudo systemctl daemon-reload
```

### macOS

```bash
sudo launchctl unload /Library/LaunchDaemons/com.assetmgt.tracking.plist
sudo rm /Library/LaunchDaemons/com.assetmgt.tracking.plist
sudo rm -rf /usr/local/assetmgt-tracking
sudo rm /var/log/assetmgt-tracking*.log
```

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review service logs for error messages
3. Contact your IT administrator
4. Raise an issue on the project repository

---

## Technical Details

### System Requirements

- **CPU**: Any modern x86/x64/ARM processor
- **RAM**: 50 MB minimum
- **Disk**: 100 MB free space
- **Network**: Internet connection required
- **Permissions**: Administrator/root access for installation

### Resource Usage

- **CPU Usage**: < 0.5% average
- **Memory Usage**: ~30-50 MB
- **Network Traffic**: ~1 KB per heartbeat (5 min intervals = ~12 KB/hour)
- **Disk I/O**: Minimal (only log files)

### Compatibility

| Platform | Minimum Version | Tested Versions |
|----------|----------------|-----------------|
| Windows | 10 | 10, 11, Server 2016+ |
| Ubuntu | 18.04 LTS | 18.04, 20.04, 22.04, 24.04 |
| Debian | 10 | 10, 11, 12 |
| RHEL/CentOS | 7 | 7, 8, 9 |
| macOS | 10.13 | 10.13 - 14.x |

---

## License

Copyright © 2025 Asset Management System  
All rights reserved.
