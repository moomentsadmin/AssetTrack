# Windows Standalone Installer - User Guide

## 🎯 What You Get

A **single executable file** (`agent.exe`) that:

✅ **NO Node.js required** - Everything bundled inside  
✅ **NO Python required** - Not needed at all  
✅ **NO dependencies** - Completely standalone  
✅ **NO admin software installation** - Just run one command  
✅ **Automatic service** - Runs in background, starts on boot  
✅ **Small footprint** - ~85 MB (includes Node.js runtime)  

---

## 📥 What You Need

1. **agent.exe** - The standalone tracking agent
2. **Tracking token** - Get from Admin panel in Asset Management System
3. **Server URL** - Your Asset Management System URL

That's it! No other software installation needed.

---

## 🚀 Installation (5-Minute Setup)

### Step 1: Get Your Tracking Token

1. Log in to Asset Management System
2. Go to **Device Tracking** page (Admin/Manager only)
3. Click **"Enable Tracking"**
4. Select your device from dropdown
5. Click **"Enable Tracking"** button
6. **Copy the tracking token** shown in the dialog

### Step 2: Download agent.exe

1. Click **"Download Agent"** button on Device Tracking page
2. Download the Windows installer package
3. Extract files to a folder (e.g., `C:\AssetTracking\`)

### Step 3: Install the Agent

Open **PowerShell or Command Prompt as Administrator** and run:

```powershell
cd C:\AssetTracking
agent.exe install --server-url "https://assetmgt.digile.com" --tracking-token "YOUR_TOKEN_HERE"
```

**That's it!** The agent is now installed and running.

---

## 🎛️ Installation Options

### Basic Installation

```powershell
agent.exe install --server-url "https://your-server.com" --tracking-token "YOUR_TOKEN"
```

### Custom Heartbeat Interval

Send data every 10 minutes instead of default 5:

```powershell
agent.exe install --server-url "..." --tracking-token "..." --interval 10
```

### Disable Location Tracking

Don't track IP-based location:

```powershell
agent.exe install --server-url "..." --tracking-token "..." --disable-location
```

### Enable Location Tracking (Default)

```powershell
agent.exe install --server-url "..." --tracking-token "..." --enable-location
```

---

## ✅ Verify Installation

### Check Service Status

```powershell
sc query AssetMgtTracking
```

Should show: `STATE: 4 RUNNING`

### View in Services

1. Press `Win + R`
2. Type: `services.msc`
3. Look for: **"Asset Management Tracking Agent"**
4. Status should be: **Running**

### Check Logs

```powershell
type "%PROGRAMDATA%\AssetMgtTracking\logs\agent.log"
```

You should see heartbeat messages.

### Check in Admin Panel

1. Go to Device Tracking page
2. Wait 5 minutes
3. Device should show as **"Online"** (green badge)
4. CPU, Memory, Disk usage should be visible

---

## 🗑️ Uninstallation

Open **PowerShell or Command Prompt as Administrator**:

```powershell
cd C:\AssetTracking
agent.exe uninstall
```

This will:
- Stop the service
- Remove the service
- Preserve configuration files (for reinstallation)

To completely remove all files:

```powershell
agent.exe uninstall
rmdir /S "%PROGRAMDATA%\AssetMgtTracking"
```

---

## 📂 File Locations

| What | Where |
|------|-------|
| Configuration | `C:\ProgramData\AssetMgtTracking\config.json` |
| Logs | `C:\ProgramData\AssetMgtTracking\logs\agent.log` |
| Service | Windows Services (AssetMgtTracking) |

---

## 🔧 Troubleshooting

### "Access Denied" Error

**Solution:** Run PowerShell/Command Prompt **as Administrator**

Right-click → "Run as Administrator"

### Service Won't Start

1. Check logs:
   ```powershell
   type "%PROGRAMDATA%\AssetMgtTracking\logs\agent.log"
   ```

2. Verify configuration:
   ```powershell
   type "%PROGRAMDATA%\AssetMgtTracking\config.json"
   ```

3. Check server URL is correct

4. Check tracking token is valid

### Device Not Showing in Admin Panel

**Wait 5 minutes** for first heartbeat, then:

1. Check service is running:
   ```powershell
   sc query AssetMgtTracking
   ```

2. Check logs for errors

3. Verify network connection to server

4. Verify firewall allows outbound HTTPS

### Manual Service Start

```powershell
sc start AssetMgtTracking
```

### Manual Service Stop

```powershell
sc stop AssetMgtTracking
```

---

## 🔄 Updating Configuration

To change server URL or token:

1. Uninstall:
   ```powershell
   agent.exe uninstall
   ```

2. Reinstall with new settings:
   ```powershell
   agent.exe install --server-url "NEW_URL" --tracking-token "NEW_TOKEN"
   ```

---

## 🔐 Security & Privacy

### What's Monitored

✅ CPU usage (%)  
✅ Memory usage (%)  
✅ Disk usage (%)  
✅ IP-based location (optional, approximate city-level)  
✅ Hostname  
✅ Operating system info  

### What's NOT Monitored

❌ Screen captures  
❌ Keystrokes  
❌ Personal files  
❌ Browsing history  
❌ Application usage  
❌ Precise GPS location  

### Data Security

- All data sent over **HTTPS** (encrypted)
- Tracking token stored locally with **restricted permissions**
- Only authorized admins can view tracking data
- **No logging** of sensitive information

---

## 📊 What Data is Sent

Every 5 minutes (or configured interval), the agent sends:

```json
{
  "hostname": "LAPTOP-ABC123",
  "cpuUsage": 45.2,
  "memoryUsage": 62.5,
  "memoryTotal": 16,
  "diskUsage": 75.3,
  "diskTotal": 512,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "osInfo": "Windows 11 Pro"
}
```

**No personal data** is collected or transmitted.

---

## ⚡ Quick Reference

| Command | Purpose |
|---------|---------|
| `agent.exe install ...` | Install as Windows service |
| `agent.exe uninstall` | Remove service |
| `agent.exe run` | Run directly (for testing) |
| `agent.exe run --once` | Send one heartbeat and exit |
| `sc query AssetMgtTracking` | Check service status |
| `sc start AssetMgtTracking` | Start service |
| `sc stop AssetMgtTracking` | Stop service |

---

## 💡 Benefits of Standalone .exe

### For IT Administrators

- **No software installation** - Just copy agent.exe and run
- **Consistent deployment** - Same command on all Windows machines
- **Easy updates** - Replace agent.exe file
- **Centralized management** - Monitor from admin panel

### For End Users

- **Zero configuration** - IT handles everything
- **No interruptions** - Runs silently in background
- **No performance impact** - Uses minimal resources
- **Automatic recovery** - Restarts if crashes

---

## 📞 Support

### Common Issues

1. **Service won't install** → Run as Administrator
2. **Device not showing up** → Wait 5 minutes, check logs
3. **"Token invalid" error** → Get new token from admin panel
4. **Network errors** → Check firewall/proxy settings

### Getting Help

1. Check this documentation
2. Review log files
3. Contact your system administrator
4. Provide logs when requesting help

---

## 🎉 Success Indicators

You know everything is working when:

✅ Service shows "Running" in Windows Services  
✅ Device appears in Admin Panel (Device Tracking page)  
✅ Status shows "Online" (green badge)  
✅ System resources (CPU/Memory/Disk) are visible  
✅ Last Update time refreshes every 5 minutes  

---

**Installation takes less than 5 minutes and requires NO software installation!**

Just download agent.exe, run one command, and you're done. 🚀
