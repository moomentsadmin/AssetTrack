Asset Management Device Tracking Agent - macOS Installation
===============================================================

QUICK START:

1. Open Terminal
2. Navigate to this directory
3. Run the installation command:

   sudo ./install.sh --server-url "https://YOUR-SERVER.com" --tracking-token "YOUR-TOKEN" --enable-location

REQUIREMENTS:
   - macOS 10.13 (High Sierra) or later
   - Node.js (install with: brew install node, or download from https://nodejs.org/)
   - Administrator access

GETTING YOUR TRACKING TOKEN:
   1. Log in to Asset Management System
   2. Go to Device Tracking page (Admin/Manager only)
   3. Click "Enable Tracking" and select your device
   4. Copy the token shown

SERVICE MANAGEMENT:
   sudo launchctl list | grep com.assetmgt.tracking
   sudo launchctl unload /Library/LaunchDaemons/com.assetmgt.tracking.plist
   sudo launchctl load /Library/LaunchDaemons/com.assetmgt.tracking.plist
   tail -f /var/log/assetmgt-tracking.log

For full documentation, see: tracking-agent/installers/README.md
