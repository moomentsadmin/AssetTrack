Asset Management Device Tracking Agent - Linux Installation
===============================================================

QUICK START:

1. Open terminal
2. Navigate to this directory
3. Run the installation command:

   sudo ./install.sh --server-url "https://YOUR-SERVER.com" --tracking-token "YOUR-TOKEN" --enable-location

REQUIREMENTS:
   - Ubuntu 18.04+ / Debian 10+ / RHEL 7+ / CentOS 7+
   - Node.js (install with: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs)
   - Root/sudo access

GETTING YOUR TRACKING TOKEN:
   1. Log in to Asset Management System
   2. Go to Device Tracking page (Admin/Manager only)
   3. Click "Enable Tracking" and select your device
   4. Copy the token shown

SERVICE MANAGEMENT:
   sudo systemctl status assetmgt-tracking
   sudo systemctl restart assetmgt-tracking
   sudo journalctl -u assetmgt-tracking -f

For full documentation, see: tracking-agent/installers/README.md
