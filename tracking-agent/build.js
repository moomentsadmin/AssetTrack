#!/usr/bin/env node

/**
 * Build script for creating standalone executables
 * 
 * This script packages the tracking agent into platform-specific executables
 * that bundle Node.js runtime and all dependencies.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('====================================');
console.log('Asset Tracking Agent - Build Script');
console.log('====================================\n');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Get build target from command line (default: all)
const target = process.argv[2] || 'all';

console.log('Build target:', target);
console.log('');

try {
  switch (target) {
    case 'win':
    case 'windows':
      console.log('Building Windows x64 executable...\n');
      execSync('npm run build:win', { stdio: 'inherit' });
      packageWindows();
      break;
      
    case 'linux':
      console.log('Building Linux x64 executable...\n');
      execSync('npm run build:linux', { stdio: 'inherit' });
      break;
      
    case 'macos':
    case 'mac':
      console.log('Building macOS x64 executable...\n');
      execSync('npm run build:macos', { stdio: 'inherit' });
      break;
      
    case 'all':
      console.log('Building all platforms...\n');
      execSync('npm run build:all', { stdio: 'inherit' });
      packageWindows();
      break;
      
    default:
      console.error('Unknown target:', target);
      console.error('Valid targets: win, linux, macos, all');
      process.exit(1);
  }
  
  console.log('\n====================================');
  console.log('✓ Build completed successfully!');
  console.log('====================================\n');
  console.log('Output directory: dist/\n');
  
  // List generated files
  const files = fs.readdirSync('dist');
  console.log('Generated files:');
  files.forEach(file => {
    const stats = fs.statSync(path.join('dist', file));
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`  - ${file} (${sizeMB} MB)`);
  });
  
} catch (error) {
  console.error('\n====================================');
  console.error('✗ Build failed!');
  console.error('====================================\n');
  console.error('Error:', error.message);
  process.exit(1);
}

/**
 * Package Windows build with WinSW
 */
function packageWindows() {
  console.log('\nPackaging Windows installer...');
  
  const winswPath = path.join('build', 'windows', 'winsw.exe');
  const distWinDir = path.join('dist', 'windows-installer');
  
  // Create installer directory
  if (!fs.existsSync(distWinDir)) {
    fs.mkdirSync(distWinDir, { recursive: true });
  }
  
  // Find agent executable (pkg output)
  const agentExe = path.join('dist', 'agent-win.exe');
  
  if (!fs.existsSync(agentExe)) {
    throw new Error(`Agent executable not found at ${agentExe}. Run build:win first!`);
  }
  
  // Copy agent.exe
  fs.copyFileSync(agentExe, path.join(distWinDir, 'agent.exe'));
  console.log('✓ Copied agent.exe');
  
  // Check if WinSW exists
  if (!fs.existsSync(winswPath)) {
    console.warn('\n⚠ Warning: WinSW not found at', winswPath);
    console.warn('Download WinSW from: https://github.com/winsw/winsw/releases');
    console.warn('Rename to winsw.exe and place in build/windows/');
    console.warn('Windows installer will be incomplete without winsw.exe!\n');
  } else {
    // Copy WinSW
    fs.copyFileSync(winswPath, path.join(distWinDir, 'winsw.exe'));
    console.log('✓ Copied winsw.exe');
  }
  
  // Validate installer package
  const installerAgentExe = path.join(distWinDir, 'agent.exe');
  const installerWinswExe = path.join(distWinDir, 'winsw.exe');
  
  if (!fs.existsSync(installerAgentExe)) {
    throw new Error('CRITICAL: agent.exe missing from installer package!');
  }
  
  if (!fs.existsSync(installerWinswExe)) {
    console.warn('\n⚠ WARNING: Installer is incomplete (missing winsw.exe)');
    console.warn('Service installation will not work without winsw.exe\n');
  }
  
  // Create README
  const readmeContent = `Asset Management Tracking Agent - Windows Installer
===================================================

This package contains a standalone Windows executable that requires NO external dependencies.
Node.js, Python, and all required packages are bundled into agent.exe.

Installation:
-------------

1. Open Command Prompt or PowerShell as Administrator

2. Navigate to this directory

3. Run the install command:

   agent.exe install --server-url "https://your-server.com" --tracking-token "YOUR_TOKEN"

   Options:
   --server-url         Your Asset Management System URL (required)
   --tracking-token     Device tracking token from admin panel (required)
   --interval          Heartbeat interval in minutes (default: 5)
   --enable-location   Enable IP-based location tracking (default: true)
   --disable-location  Disable location tracking

4. The agent will be installed as a Windows service and start automatically


Uninstallation:
---------------

1. Open Command Prompt or PowerShell as Administrator

2. Navigate to this directory

3. Run: agent.exe uninstall


Verification:
-------------

Check service status:
  sc query AssetMgtTracking

View logs:
  type "%PROGRAMDATA%\\AssetMgtTracking\\logs\\agent.log"


File Information:
-----------------
  agent.exe  - Standalone tracking agent (includes Node.js runtime)
  winsw.exe  - Windows Service Wrapper (used internally)
  
Total size: ~85 MB (all dependencies included)


Support:
--------
Configuration: %PROGRAMDATA%\\AssetMgtTracking\\config.json
Logs: %PROGRAMDATA%\\AssetMgtTracking\\logs\\

For issues, check the log files or contact your system administrator.
`;
  
  fs.writeFileSync(path.join(distWinDir, 'README.txt'), readmeContent);
  
  // Create install.bat helper
  const installBat = `@echo off
echo ====================================
echo Asset Tracking Agent - Quick Install
echo ====================================
echo.

set /p SERVER_URL="Enter server URL (e.g., https://assetmgt.digile.com): "
set /p TOKEN="Enter tracking token: "

echo.
echo Installing tracking agent...
echo.

agent.exe install --server-url "%SERVER_URL%" --tracking-token "%TOKEN%" --enable-location

echo.
echo Installation complete!
echo.
pause
`;
  
  fs.writeFileSync(path.join(distWinDir, 'install.bat'), installBat);
  
  console.log('✓ Windows installer package created in:', distWinDir);
}
