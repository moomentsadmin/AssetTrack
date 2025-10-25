# 📡 Device Tracking Agent - Quick Start Guide

## ✅ Issues Resolved

1. **Database tables created** - `device_tracking` and `device_tracking_history` tables now exist
2. **Installation packages complete** - Windows, Linux, and macOS installers ready
3. **Download button added** - Easy access from Device Tracking page

---

## 📂 Where to Find the Tracking Agent

The **tracking-agent** folder is located at the root of your project:

```
your-project/
├── tracking-agent/          ← HERE!
│   ├── agent.js
│   ├── package.json
│   ├── README.md
│   ├── index.html          ← Visual download page
│   ├── tracking-agent-package.tar.gz  ← Complete package
│   ├── DOWNLOAD-INSTRUCTIONS.md
│   └── installers/
│       ├── README.md       ← Complete installation guide
│       ├── windows/
│       │   ├── install.ps1
│       │   └── README.txt
│       ├── linux/
│       │   ├── install.sh
│       │   └── README.txt
│       └── macos/
│           ├── install.sh
│           └── README.txt
```

---

## 🚀 3 Ways to Access the Agent

### Method 1: Via Replit UI (Easiest)
1. In Replit, open the **Files** panel (left sidebar)
2. Locate the **`tracking-agent`** folder
3. Download options:
   - **Single file**: Right-click → Download
   - **Entire folder**: Right-click on `tracking-agent` → Download as ZIP

### Method 2: Via Application UI (New!)
1. Log in to your Asset Management System
2. Go to **Device Tracking** page
3. Click the **"Download Agent"** button (top right)
4. This opens the download instructions

### Method 3: Direct File Access
Access the files directly in your Replit workspace:
- Browse to `/tracking-agent/` folder
- All files are ready to download or copy

---

## 📥 What to Download

### For Individual Device Installation:
Download the appropriate installer:
- **Windows**: `tracking-agent/installers/windows/install.ps1`
- **Linux**: `tracking-agent/installers/linux/install.sh`
- **macOS**: `tracking-agent/installers/macos/install.sh`

### For Bulk Distribution:
Download the complete package:
- **File**: `tracking-agent/tracking-agent-package.tar.gz` (13 KB)
- Contains all installers and documentation
- Ready to distribute to IT team or users

---

## 🎯 How to Use (Step-by-Step)

### Step 1: Enable Tracking in Admin Panel
1. Log in as **Admin** or **Manager**
2. Navigate to **Device Tracking** page (`/device-tracking`)
3. Click **"Enable Tracking"** button
4. Select the asset (laptop) from dropdown
5. Click **"Enable Tracking"** in dialog
6. **Copy the tracking token** that appears

### Step 2: Download Installer
Click the **"Download Agent"** button on the Device Tracking page, or:
- Access `tracking-agent/installers/` folder in Replit Files
- Download the installer for your OS

### Step 3: Install on Device

#### Windows:
```powershell
# Open PowerShell as Administrator
cd path\to\installers\windows

.\install.ps1 `
  -ServerUrl "https://assetmgt.digile.com" `
  -TrackingToken "YOUR_TOKEN_FROM_STEP_1" `
  -EnableLocation
```

#### Linux:
```bash
# Open Terminal
cd path/to/installers/linux

sudo ./install.sh \
  --server-url "https://assetmgt.digile.com" \
  --tracking-token "YOUR_TOKEN_FROM_STEP_1" \
  --enable-location
```

#### macOS:
```bash
# Open Terminal
cd path/to/installers/macos

sudo ./install.sh \
  --server-url "https://assetmgt.digile.com" \
  --tracking-token "YOUR_TOKEN_FROM_STEP_1" \
  --enable-location
```

### Step 4: Verify Installation
1. Wait 5 minutes (or configured heartbeat interval)
2. Refresh the Device Tracking page
3. Device should show as **"Online"** (green badge)
4. System resources (CPU, Memory, Disk) should be visible
5. Location coordinates displayed (if enabled)

---

## 🎨 Visual Download Page

Open `tracking-agent/index.html` in your browser for a beautiful download interface with:
- Platform-specific download buttons
- Visual installation instructions
- Quick links to documentation

---

## 📖 Documentation Files

| File | Description |
|------|-------------|
| `tracking-agent/README.md` | Main agent documentation |
| `tracking-agent/installers/README.md` | Complete installation guide (comprehensive) |
| `tracking-agent/DOWNLOAD-INSTRUCTIONS.md` | Multiple download methods explained |
| `tracking-agent/installers/windows/README.txt` | Windows quick start |
| `tracking-agent/installers/linux/README.txt` | Linux quick start |
| `tracking-agent/installers/macos/README.txt` | macOS quick start |

---

## 🔍 Troubleshooting

### "Folder not found in Replit"
- Refresh your Replit workspace
- Check you're in the root directory
- Look in the Files panel (left sidebar)

### "Can't download files"
- Right-click on file/folder → Download
- Or download the pre-packaged `tracking-agent-package.tar.gz`

### "Agent not reporting"
1. Check service is running:
   - Windows: `nssm status AssetMgtTracking`
   - Linux: `sudo systemctl status assetmgt-tracking`
   - macOS: `sudo launchctl list | grep com.assetmgt.tracking`

2. Check logs:
   - Windows: See installation directory
   - Linux: `sudo journalctl -u assetmgt-tracking -f`
   - macOS: `tail -f /var/log/assetmgt-tracking.log`

3. Verify token is correct in `.env` file

---

## ✨ Features Summary

**Installers Include:**
- ✅ Automatic service installation
- ✅ Auto-start on system boot
- ✅ Auto-recovery if connection fails
- ✅ Complete error handling
- ✅ Easy uninstallation

**What's Monitored:**
- ✅ CPU usage (%)
- ✅ Memory usage (%)
- ✅ Disk usage (%)
- ✅ IP-based location (optional)
- ✅ Device hostname
- ✅ Operating system info

**Security:**
- ✅ HTTPS encryption
- ✅ Token-based authentication
- ✅ Admin/Manager only access
- ✅ No screen captures or keylogging
- ✅ Privacy-focused (IP geolocation only)

---

## 🎁 Ready-to-Use Package

Everything is ready for production use:

1. ✅ Database tables created and verified
2. ✅ Complete installers for all platforms
3. ✅ Comprehensive documentation
4. ✅ Download button in UI
5. ✅ Visual download page
6. ✅ Quick start guides
7. ✅ Troubleshooting guides

---

## 📞 Next Steps

1. **Test the system** by enabling tracking for a test device
2. **Distribute installers** to your IT team or device users
3. **Monitor devices** from the Device Tracking admin page
4. **Share documentation** with installation personnel

---

**Need Help?**
- See `tracking-agent/installers/README.md` for complete guide
- Check troubleshooting section for common issues
- Review logs for detailed error messages

---

**© 2025 Asset Management System**  
Device Tracking Agent v1.0
