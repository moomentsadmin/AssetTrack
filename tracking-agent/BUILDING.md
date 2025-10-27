# Building Standalone Executables

This guide explains how to build standalone executable files for the tracking agent that require **NO external dependencies** (no Node.js, no Python, nothing).

## 📋 Prerequisites

### For Building

1. **Node.js 18 or later** (only needed for building, not for end users)
2. **npm** (comes with Node.js)
3. **WinSW** (only for Windows builds)

### Installing Build Dependencies

```bash
cd tracking-agent
npm install
```

This installs:
- `@yao-pkg/pkg` - Packages Node.js app into executables
- `commander` - CLI framework
- `axios` - HTTP client
- `systeminformation` - System metrics

---

## 🪟 Building for Windows

### Step 1: Get WinSW

WinSW (Windows Service Wrapper) is required for Windows service management:

1. Download from: https://github.com/winsw/winsw/releases
2. Get the latest `WinSW-x64.exe`
3. Rename to `winsw.exe`
4. Place in: `tracking-agent/build/windows/winsw.exe`

### Step 2: Build Windows Executable

```bash
cd tracking-agent
npm run build:win
```

This creates: `dist/agent-win.exe` (~80-90 MB)

### Step 3: Package Complete Installer

```bash
npm run build:package
```

This creates: `dist/windows-installer/` folder containing:
- `agent.exe` - Standalone executable (Node.js bundled)
- `winsw.exe` - Service wrapper
- `README.txt` - Installation instructions
- `install.bat` - Quick install helper

### Windows Build Output

```
dist/
├── agent-win.exe                    (~85 MB)
└── windows-installer/
    ├── agent.exe                   (~85 MB) 
    ├── winsw.exe                   (~2 MB)
    ├── README.txt
    └── install.bat
```

---

## 🐧 Building for Linux

```bash
cd tracking-agent
npm run build:linux
```

Output: `dist/agent-linux` (~90 MB)

The Linux binary includes everything needed and can be deployed to any x64 Linux system.

---

## 🍎 Building for macOS

```bash
cd tracking-agent
npm run build:macos
```

Output: `dist/agent-macos` (~90 MB)

The macOS binary includes everything needed and can be deployed to any x64 macOS system (10.13+).

---

## 🌍 Building for All Platforms

```bash
cd tracking-agent
npm run build:all
```

This creates executables for Windows, Linux, and macOS in one command.

---

## 📦 What's Bundled?

Each executable includes:

✅ **Node.js runtime** (v18)  
✅ **All npm dependencies**  
  - axios (HTTP client)
  - commander (CLI framework)
  - systeminformation (system metrics)  
✅ **Application code** (agent.js)  
✅ **Configuration management** (built-in)  

**Total size:** 80-90 MB per platform

---

## 🎯 Using the Built Executables

### Windows (agent.exe)

```powershell
# Install as Windows service
agent.exe install --server-url "https://assetmgt.digile.com" --tracking-token "YOUR_TOKEN"

# Uninstall service
agent.exe uninstall

# Run directly (for testing)
agent.exe run --once
```

### Linux (agent-linux)

```bash
# Make executable
chmod +x agent-linux

# Install as systemd service
sudo ./agent-linux install --server-url "https://assetmgt.digile.com" --tracking-token "YOUR_TOKEN"

# Uninstall service
sudo ./agent-linux uninstall

# Run directly (for testing)
./agent-linux run --once
```

### macOS (agent-macos)

```bash
# Make executable
chmod +x agent-macos

# Install as LaunchDaemon
sudo ./agent-macos install --server-url "https://assetmgt.digile.com" --tracking-token "YOUR_TOKEN"

# Uninstall service
sudo ./agent-macos uninstall

# Run directly (for testing)
./agent-macos run --once
```

---

## 🔧 Advanced Options

### Custom Heartbeat Interval

```bash
# Send heartbeat every 10 minutes instead of 5
agent.exe install --server-url "..." --tracking-token "..." --interval 10
```

### Disable Location Tracking

```bash
# Don't track IP-based location
agent.exe install --server-url "..." --tracking-token "..." --disable-location
```

### Diagnostic Mode

```bash
# Send one heartbeat and exit (for testing)
agent.exe run --once
```

---

## 📂 File Locations

### Windows

- **Configuration:** `C:\ProgramData\AssetMgtTracking\config.json`
- **Logs:** `C:\ProgramData\AssetMgtTracking\logs\agent.log`
- **Service:** `AssetMgtTracking` (Windows Services)

### Linux

- **Configuration:** `/etc/assetmgt-tracking/config.json`
- **Logs:** `/var/log/assetmgt-tracking/agent.log`
- **Service:** `/etc/systemd/system/assetmgttracking.service`

### macOS

- **Configuration:** `/Library/Application Support/AssetMgtTracking/config.json`
- **Logs:** `/Library/Application Support/AssetMgtTracking/logs/agent.log`
- **Service:** `/Library/LaunchDaemons/com.assetmgt.tracking.plist`

---

## 🐛 Troubleshooting

### Build fails with "pkg not found"

```bash
npm install @yao-pkg/pkg --save-dev
```

### Windows build missing winsw.exe

Download WinSW from https://github.com/winsw/winsw/releases and place in `build/windows/`

### Executable is too large

This is normal. The executable includes:
- Node.js runtime (~60 MB)
- npm packages (~20 MB)
- Application code (~5 MB)

Total: ~85 MB is expected.

### "Permission denied" on Linux/macOS

```bash
chmod +x agent-linux
# or
chmod +x agent-macos
```

---

## 🔐 Security Notes

1. **Tracking tokens** are stored in config files with restricted permissions (0600)
2. **Config directory** has ACL restrictions (SYSTEM/Administrators on Windows)
3. **No sensitive data** is logged (privacy-focused)
4. **HTTPS required** for production deployments

---

## 📊 Build Performance

| Platform | Build Time | Output Size | Dependencies Included |
|----------|-----------|-------------|----------------------|
| Windows  | ~2-3 min  | 85 MB      | Node.js + all packages |
| Linux    | ~2-3 min  | 90 MB      | Node.js + all packages |
| macOS    | ~2-3 min  | 90 MB      | Node.js + all packages |

---

## 🚀 Distribution

### Option 1: Direct Distribution

Distribute the executable directly:
- Windows: `agent.exe` + `winsw.exe`
- Linux: `agent-linux` (single file)
- macOS: `agent-macos` (single file)

### Option 2: Installer Package

Create a ZIP/installer containing:
- Executable(s)
- README with instructions
- Quick install script

### Option 3: MSI Installer (Windows)

Use tools like WiX Toolset to create a proper Windows installer.

---

## ✅ Testing Checklist

Before distributing, test on a **clean machine** without Node.js:

- [ ] Executable runs without errors
- [ ] Service installs successfully
- [ ] Heartbeat sends to server
- [ ] Service survives reboot
- [ ] Uninstall removes service
- [ ] Logs are created
- [ ] Config file is created

---

## 📞 Support

For build issues or questions:
1. Check this documentation
2. Review `build.js` script
3. Check pkg documentation: https://github.com/yao-pkg/pkg

---

**Next Steps:**
1. Build executables using `npm run build:package`
2. Test on clean machine
3. Distribute to end users
4. Users install with single command - NO Node.js required!
