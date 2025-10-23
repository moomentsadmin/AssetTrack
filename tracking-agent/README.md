# Asset Management System - Device Tracking Agent

## Overview

The Device Tracking Agent is a lightweight Node.js application that runs on laptops and other devices to provide real-time monitoring and location tracking for the Asset Management System.

## Features

- **System Resource Monitoring**: Tracks CPU usage, memory usage, and disk usage
- **Location Tracking**: Uses IP geolocation to determine device location
- **Real-time Updates**: Sends periodic heartbeats to the server
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Lightweight**: Minimal resource footprint

## Prerequisites

- Node.js version 18 or later ([Download here](https://nodejs.org/))
- Internet connection
- Tracking token from your Asset Management System

## Installation

### Step 1: Download the Agent

Download the tracking agent files:
- `agent.js`
- `package.json`

### Step 2: Install Dependencies

Open a terminal/command prompt in the tracking-agent directory and run:

```bash
npm install
```

This will install the required dependencies:
- `axios` - For HTTP communication with the server
- `systeminformation` - For collecting system information

### Step 3: Get Your Tracking Token

1. Log in to the Asset Management System as an Admin or Manager
2. Navigate to **Device Tracking** page
3. Click **Enable Tracking** on the asset you want to track
4. Copy the generated **Tracking Token**

### Step 4: Configure the Agent

You can configure the agent using environment variables or by editing the `agent.js` file directly.

#### Option A: Using Environment Variables (Recommended)

**On Windows (Command Prompt):**
```cmd
set SERVER_URL=https://your-server.com
set TRACKING_TOKEN=your-tracking-token-here
set HEARTBEAT_INTERVAL=300000
set ENABLE_LOCATION=true
node agent.js
```

**On Windows (PowerShell):**
```powershell
$env:SERVER_URL="https://your-server.com"
$env:TRACKING_TOKEN="your-tracking-token-here"
$env:HEARTBEAT_INTERVAL="300000"
$env:ENABLE_LOCATION="true"
node agent.js
```

**On macOS/Linux:**
```bash
export SERVER_URL=https://your-server.com
export TRACKING_TOKEN=your-tracking-token-here
export HEARTBEAT_INTERVAL=300000
export ENABLE_LOCATION=true
node agent.js
```

#### Option B: Edit Configuration in Code

Open `agent.js` and modify the CONFIG section:

```javascript
const CONFIG = {
  serverUrl: 'https://your-server.com',
  trackingToken: 'your-tracking-token-here',
  heartbeatInterval: 300000, // 5 minutes in milliseconds
  enableLocationTracking: true,
};
```

### Step 5: Run the Agent

```bash
npm start
```

Or directly:
```bash
node agent.js
```

You should see output like:
```
====================================
Asset Management - Tracking Agent
====================================
Server URL: https://your-server.com
Heartbeat Interval: 300 seconds
Location Tracking: Enabled
====================================

[2025-01-18T10:30:00.000Z] Collecting system information...
[2025-01-18T10:30:01.000Z] Sending heartbeat to server...
  CPU Usage: 45.23%
  Memory: 62.5% (16 GB total)
  Disk: 55.8% (512 GB total)
  Location: 40.7128, -74.0060
[2025-01-18T10:30:01.500Z] ✓ Heartbeat sent successfully
---
```

## Running as a Background Service

### Windows - Using Node.js PM2

1. Install PM2 globally:
```cmd
npm install -g pm2
```

2. Start the agent:
```cmd
pm2 start agent.js --name asset-tracker
```

3. Save the process list:
```cmd
pm2 save
```

4. Setup auto-start on boot:
```cmd
pm2 startup
```

### macOS - Using PM2 or LaunchAgent

**Using PM2 (same as Windows):**
```bash
npm install -g pm2
pm2 start agent.js --name asset-tracker
pm2 save
pm2 startup
```

### Linux - Using systemd

1. Create a service file:
```bash
sudo nano /etc/systemd/system/asset-tracker.service
```

2. Add the following content (adjust paths as needed):
```ini
[Unit]
Description=Asset Management Tracking Agent
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/tracking-agent
Environment="SERVER_URL=https://your-server.com"
Environment="TRACKING_TOKEN=your-tracking-token-here"
ExecStart=/usr/bin/node /path/to/tracking-agent/agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:
```bash
sudo systemctl enable asset-tracker
sudo systemctl start asset-tracker
```

4. Check status:
```bash
sudo systemctl status asset-tracker
```

## Configuration Options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `SERVER_URL` | `http://localhost:5000` | URL of your Asset Management System server |
| `TRACKING_TOKEN` | (required) | Unique token for this device from the admin panel |
| `HEARTBEAT_INTERVAL` | `300000` | How often to send updates (in milliseconds) |
| `ENABLE_LOCATION` | `true` | Whether to include location data |

## Troubleshooting

### Agent won't start

**Error: "Tracking token not configured"**
- Make sure you've set the `TRACKING_TOKEN` environment variable or edited the CONFIG in `agent.js`

**Error: "Cannot find module"**
- Run `npm install` to install dependencies

### Connection issues

**Error: "No response from server"**
- Check that the `SERVER_URL` is correct
- Verify your network connection
- Check if the server is accessible from this device

**Error: "Invalid tracking token"**
- Verify the tracking token is correct
- Check that device tracking is enabled for this asset in the admin panel

### Location not updating

- Ensure `ENABLE_LOCATION` is set to `true`
- Check your internet connection (IP geolocation requires internet access)
- Some corporate networks may block geolocation services

## Data Privacy

The tracking agent collects and sends the following information:
- System hostname
- IP address (local and public)
- Geographic location (via IP geolocation)
- CPU usage percentage
- Memory usage percentage and total memory
- Disk usage percentage and total disk space
- Operating system information

All data is transmitted over HTTPS (when using a secure server URL) and is only accessible to authorized administrators in your Asset Management System.

## Uninstalling

1. Stop the agent (press Ctrl+C if running in foreground)
2. If running as a service:
   - **PM2**: `pm2 stop asset-tracker && pm2 delete asset-tracker`
   - **systemd**: `sudo systemctl stop asset-tracker && sudo systemctl disable asset-tracker`
3. Delete the tracking-agent directory

## Support

For issues or questions, contact your Asset Management System administrator.

## Version

Version: 1.0.0
