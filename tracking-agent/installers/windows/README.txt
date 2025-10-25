Asset Management Device Tracking Agent - Windows Installation
================================================================

QUICK START:

1. Open PowerShell as Administrator
2. Navigate to this directory
3. Run the installation command:

   .\install.ps1 -ServerUrl "https://YOUR-SERVER.com" -TrackingToken "YOUR-TOKEN" -EnableLocation

REQUIREMENTS:
   - Windows 10 or later
   - Node.js (download from https://nodejs.org/)
   - Administrator privileges

GETTING YOUR TRACKING TOKEN:
   1. Log in to Asset Management System
   2. Go to Device Tracking page (Admin/Manager only)
   3. Click "Enable Tracking" and select your device
   4. Copy the token shown

OPTIONAL: Install NSSM for better service management
   - Download from: https://nssm.cc/
   - Or use Chocolatey: choco install nssm

For full documentation, see: tracking-agent/installers/README.md
