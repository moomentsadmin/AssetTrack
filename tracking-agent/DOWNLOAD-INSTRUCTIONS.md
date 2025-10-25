# How to Download the Tracking Agent

## Option 1: Download via File Browser (Recommended)

1. In Replit, open the **Files** panel on the left sidebar
2. Navigate to the **`tracking-agent`** folder
3. You can download individual files or the entire folder:
   - **Individual files**: Right-click on any file → Download
   - **Entire folder**: Right-click on `tracking-agent` → Download as ZIP

## Option 2: Download Pre-Packaged Archive

A pre-packaged archive is available at:
```
tracking-agent/tracking-agent-package.tar.gz
```

**To download:**
1. Open the Files panel in Replit
2. Navigate to `tracking-agent/`
3. Right-click on `tracking-agent-package.tar.gz`
4. Select "Download"

**To extract (on target machine):**
```bash
# Linux/macOS
tar -xzf tracking-agent-package.tar.gz

# Windows (use 7-Zip, WinRAR, or built-in Windows extraction)
Right-click → Extract All
```

## Option 3: Clone from Repository

If your project is in a Git repository:
```bash
git clone <your-repo-url>
cd <repo-name>/tracking-agent
```

## Option 4: Download via Command Line (from Replit Shell)

From Replit Shell, you can serve the files temporarily:
```bash
# Start a simple HTTP server
cd tracking-agent
python3 -m http.server 8080
```

Then access via: `https://<your-replit-url>:8080`

---

## What's Included

The tracking-agent package contains:

```
tracking-agent/
├── agent.js                    # Main tracking agent
├── package.json                # Dependencies
├── README.md                   # Main documentation
├── installers/
│   ├── README.md               # Complete installation guide
│   ├── windows/
│   │   ├── install.ps1         # Windows installer
│   │   └── README.txt          # Quick start
│   ├── linux/
│   │   ├── install.sh          # Linux installer
│   │   └── README.txt          # Quick start
│   └── macos/
│       ├── install.sh          # macOS installer
│       └── README.txt          # Quick start
```

---

## Distribution Methods

### Method 1: Email Distribution
1. Download `tracking-agent-package.tar.gz` or `tracking-agent.zip`
2. Email to IT staff or device users
3. Include installation instructions

### Method 2: Network Share
1. Place tracking-agent folder on shared network drive
2. Users can access and run installer from there

### Method 3: USB Drive
1. Copy tracking-agent folder to USB drive
2. Distribute to users physically

### Method 4: Internal Software Repository
1. Upload to your organization's software repository
2. Deploy via existing software management tools

---

## Quick Deployment Example

**For IT Administrators:**

```bash
# 1. Download the package
# (download tracking-agent-package.tar.gz from Replit)

# 2. Extract on your admin workstation
tar -xzf tracking-agent-package.tar.gz

# 3. Copy to target laptop (via SSH, USB, network share, etc.)
scp -r tracking-agent user@laptop-ip:/tmp/

# 4. SSH into laptop and install
ssh user@laptop-ip
cd /tmp/tracking-agent/installers/linux
sudo ./install.sh \
  --server-url "https://assetmgt.digile.com" \
  --tracking-token "TOKEN_FROM_ADMIN_PANEL" \
  --enable-location
```

---

## Need Help?

- **Installation Guide**: See `installers/README.md`
- **Troubleshooting**: Check installation guide for common issues
- **Support**: Contact your IT administrator
