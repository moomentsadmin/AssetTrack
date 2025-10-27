#!/usr/bin/env node

/**
 * Asset Management System - Device Tracking Agent
 * 
 * Standalone executable that bundles Node.js runtime and all dependencies.
 * No external software installation required on target devices.
 * 
 * Usage:
 *   agent.exe install --server-url <url> --tracking-token <token> [options]
 *   agent.exe run
 *   agent.exe uninstall
 */

const { Command } = require('commander');
const axios = require('axios');
const os = require('os');
const si = require('systeminformation');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==================== CONFIGURATION ====================

const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Configuration paths
const CONFIG_DIR = isWindows
  ? path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'AssetMgtTracking')
  : isMacOS
  ? '/Library/Application Support/AssetMgtTracking'
  : '/etc/assetmgt-tracking';

const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const LOG_DIR = path.join(CONFIG_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'agent.log');

// Service configuration
const SERVICE_NAME = 'AssetMgtTracking';
const SERVICE_DISPLAY_NAME = 'Asset Management Tracking Agent';
const SERVICE_DESCRIPTION = 'Monitors device status and sends heartbeat data to Asset Management System';

// Installation paths
const INSTALL_DIR = isWindows
  ? path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'AssetMgtTracking')
  : isMacOS
  ? '/usr/local/bin/assetmgt-tracking'
  : '/opt/assetmgt-tracking';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  }
}

/**
 * Log message to console and file
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  try {
    ensureDir(LOG_DIR);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (error) {
    // Silent failure if logging fails
  }
}

/**
 * Load configuration from file
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    log(`Error loading config: ${error.message}`, 'ERROR');
  }
  return null;
}

/**
 * Save configuration to file
 */
function saveConfig(config) {
  try {
    ensureDir(CONFIG_DIR);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
    log('Configuration saved successfully');
    return true;
  } catch (error) {
    log(`Error saving config: ${error.message}`, 'ERROR');
    return false;
  }
}

// ==================== SYSTEM INFORMATION ====================

/**
 * Get CPU usage percentage
 */
async function getCPUUsage() {
  try {
    const load = await si.currentLoad();
    return Math.round(load.currentLoad * 100) / 100;
  } catch (error) {
    log(`Error getting CPU usage: ${error.message}`, 'ERROR');
    return null;
  }
}

/**
 * Get memory usage information
 */
async function getMemoryInfo() {
  try {
    const mem = await si.mem();
    const total = Math.round((mem.total / (1024 ** 3)) * 100) / 100;
    const used = Math.round((mem.used / (1024 ** 3)) * 100) / 100;
    const usagePercent = Math.round((mem.used / mem.total) * 100 * 100) / 100;
    
    return {
      total,
      usage: usagePercent
    };
  } catch (error) {
    log(`Error getting memory info: ${error.message}`, 'ERROR');
    return { total: null, usage: null };
  }
}

/**
 * Get disk usage information
 */
async function getDiskInfo() {
  try {
    const disks = await si.fsSize();
    if (disks && disks.length > 0) {
      const primary = disks[0];
      const total = Math.round((primary.size / (1024 ** 3)) * 100) / 100;
      const usagePercent = Math.round(primary.use * 100) / 100;
      
      return {
        total,
        usage: usagePercent
      };
    }
    return { total: null, usage: null };
  } catch (error) {
    log(`Error getting disk info: ${error.message}`, 'ERROR');
    return { total: null, usage: null };
  }
}

/**
 * Get operating system information
 */
async function getOSInfo() {
  try {
    const osInfo = await si.osInfo();
    return `${osInfo.platform} ${osInfo.distro} ${osInfo.release}`;
  } catch (error) {
    return `${os.platform()} ${os.release()}`;
  }
}

/**
 * Get hostname
 */
function getHostname() {
  return os.hostname();
}

/**
 * Get IP address
 */
function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

/**
 * Get location data using IP geolocation
 */
async function getLocation(enableLocationTracking) {
  if (!enableLocationTracking) {
    return { latitude: null, longitude: null };
  }
  
  try {
    const response = await axios.get('http://ip-api.com/json/?fields=lat,lon,query', {
      timeout: 5000
    });
    
    if (response.data && response.data.lat && response.data.lon) {
      return {
        latitude: response.data.lat,
        longitude: response.data.lon,
        ipAddress: response.data.query
      };
    }
  } catch (error) {
    log(`Error getting location: ${error.message}`, 'ERROR');
  }
  
  return { latitude: null, longitude: null, ipAddress: getIPAddress() };
}

// ==================== HEARTBEAT ====================

/**
 * Send heartbeat to server
 */
async function sendHeartbeat(config) {
  try {
    const [cpuUsage, memInfo, diskInfo, osInfo, location] = await Promise.all([
      getCPUUsage(),
      getMemoryInfo(),
      getDiskInfo(),
      getOSInfo(),
      getLocation(config.enableLocationTracking)
    ]);
    
    const payload = {
      token: config.trackingToken,
      hostname: getHostname(),
      ipAddress: location.ipAddress || getIPAddress(),
      latitude: location.latitude,
      longitude: location.longitude,
      cpuUsage,
      memoryUsage: memInfo.usage,
      memoryTotal: memInfo.total,
      diskUsage: diskInfo.usage,
      diskTotal: diskInfo.total,
      osInfo
    };
    
    log('Sending heartbeat to server...');
    
    const response = await axios.post(
      `${config.serverUrl}/api/device-tracking/heartbeat`,
      payload,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    log('✓ Heartbeat sent successfully');
  } catch (error) {
    if (error.response) {
      log(`Server error: ${error.response.status} ${JSON.stringify(error.response.data)}`, 'ERROR');
    } else if (error.request) {
      log('No response from server. Check network connection.', 'ERROR');
    } else {
      log(`Failed to send heartbeat: ${error.message}`, 'ERROR');
    }
  }
}

// ==================== SERVICE MANAGEMENT ====================

/**
 * Install Windows service using WinSW
 */
function installWindowsService() {
  const exePath = process.execPath;
  const winswExe = path.join(path.dirname(exePath), 'winsw.exe');
  const winswXml = path.join(path.dirname(exePath), 'service.xml');
  
  // Create WinSW XML configuration
  const xmlContent = `<service>
  <id>${SERVICE_NAME}</id>
  <name>${SERVICE_DISPLAY_NAME}</name>
  <description>${SERVICE_DESCRIPTION}</description>
  <executable>${exePath}</executable>
  <arguments>run</arguments>
  <logpath>${LOG_DIR}</logpath>
  <log mode="roll-by-size">
    <sizeThreshold>10240</sizeThreshold>
    <keepFiles>5</keepFiles>
  </log>
  <onfailure action="restart" delay="10 sec"/>
  <onfailure action="restart" delay="20 sec"/>
  <onfailure action="restart" delay="30 sec"/>
  <resetfailure>1 hour</resetfailure>
</service>`;

  fs.writeFileSync(winswXml, xmlContent);
  
  // Install service
  execSync(`"${winswExe}" install "${winswXml}"`, { stdio: 'inherit' });
  execSync(`"${winswExe}" start "${winswXml}"`, { stdio: 'inherit' });
  
  log('Windows service installed and started');
}

/**
 * Uninstall Windows service
 */
function uninstallWindowsService() {
  const exePath = process.execPath;
  const winswExe = path.join(path.dirname(exePath), 'winsw.exe');
  const winswXml = path.join(path.dirname(exePath), 'service.xml');
  
  try {
    execSync(`"${winswExe}" stop "${winswXml}"`, { stdio: 'inherit' });
  } catch (error) {
    // Service may not be running
  }
  
  try {
    execSync(`"${winswExe}" uninstall "${winswXml}"`, { stdio: 'inherit' });
  } catch (error) {
    // Service may not exist
  }
  
  log('Windows service uninstalled');
}

/**
 * Install Linux systemd service
 */
function installLinuxService() {
  const exePath = process.execPath;
  const serviceFile = `/etc/systemd/system/${SERVICE_NAME.toLowerCase()}.service`;
  
  const serviceContent = `[Unit]
Description=${SERVICE_DESCRIPTION}
After=network.target

[Service]
Type=simple
ExecStart=${exePath} run
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;

  fs.writeFileSync(serviceFile, serviceContent);
  
  execSync('systemctl daemon-reload', { stdio: 'inherit' });
  execSync(`systemctl enable ${SERVICE_NAME.toLowerCase()}`, { stdio: 'inherit' });
  execSync(`systemctl start ${SERVICE_NAME.toLowerCase()}`, { stdio: 'inherit' });
  
  log('Linux systemd service installed and started');
}

/**
 * Uninstall Linux systemd service
 */
function uninstallLinuxService() {
  try {
    execSync(`systemctl stop ${SERVICE_NAME.toLowerCase()}`, { stdio: 'inherit' });
  } catch (error) {
    // Service may not be running
  }
  
  try {
    execSync(`systemctl disable ${SERVICE_NAME.toLowerCase()}`, { stdio: 'inherit' });
  } catch (error) {
    // Service may not be enabled
  }
  
  const serviceFile = `/etc/systemd/system/${SERVICE_NAME.toLowerCase()}.service`;
  if (fs.existsSync(serviceFile)) {
    fs.unlinkSync(serviceFile);
  }
  
  execSync('systemctl daemon-reload', { stdio: 'inherit' });
  
  log('Linux systemd service uninstalled');
}

/**
 * Install macOS LaunchDaemon
 */
function installMacOSService() {
  const exePath = process.execPath;
  const plistFile = `/Library/LaunchDaemons/com.assetmgt.tracking.plist`;
  
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.assetmgt.tracking</string>
    <key>ProgramArguments</key>
    <array>
        <string>${exePath}</string>
        <string>run</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${LOG_FILE}</string>
    <key>StandardErrorPath</key>
    <string>${LOG_FILE}</string>
</dict>
</plist>`;

  fs.writeFileSync(plistFile, plistContent);
  
  execSync(`launchctl load ${plistFile}`, { stdio: 'inherit' });
  
  log('macOS LaunchDaemon installed and started');
}

/**
 * Uninstall macOS LaunchDaemon
 */
function uninstallMacOSService() {
  const plistFile = `/Library/LaunchDaemons/com.assetmgt.tracking.plist`;
  
  try {
    execSync(`launchctl unload ${plistFile}`, { stdio: 'inherit' });
  } catch (error) {
    // Service may not be loaded
  }
  
  if (fs.existsSync(plistFile)) {
    fs.unlinkSync(plistFile);
  }
  
  log('macOS LaunchDaemon uninstalled');
}

// ==================== CLI COMMANDS ====================

/**
 * Install command - Set up tracking agent as a service
 */
function installCommand(options) {
  console.log('====================================');
  console.log('Installing Asset Tracking Agent');
  console.log('====================================\n');
  
  // Validate required options
  if (!options.serverUrl || !options.trackingToken) {
    console.error('ERROR: Both --server-url and --tracking-token are required');
    process.exit(1);
  }
  
  // Create configuration
  const config = {
    serverUrl: options.serverUrl,
    trackingToken: options.trackingToken,
    heartbeatInterval: (options.interval || 5) * 60 * 1000,
    enableLocationTracking: options.enableLocation !== false
  };
  
  // Save configuration
  if (!saveConfig(config)) {
    console.error('ERROR: Failed to save configuration');
    process.exit(1);
  }
  
  console.log('Configuration saved to:', CONFIG_FILE);
  console.log('  Server URL:', config.serverUrl);
  console.log('  Heartbeat Interval:', options.interval || 5, 'minutes');
  console.log('  Location Tracking:', config.enableLocationTracking ? 'Enabled' : 'Disabled');
  console.log('');
  
  // Install service based on platform
  try {
    if (isWindows) {
      installWindowsService();
    } else if (isLinux) {
      installLinuxService();
    } else if (isMacOS) {
      installMacOSService();
    } else {
      console.error('ERROR: Unsupported platform:', process.platform);
      process.exit(1);
    }
    
    console.log('\n✓ Installation complete!');
    console.log('\nThe tracking agent is now running as a system service.');
    console.log('It will automatically start on system boot.');
    console.log('\nLogs are stored in:', LOG_DIR);
  } catch (error) {
    console.error('ERROR: Installation failed:', error.message);
    process.exit(1);
  }
}

/**
 * Uninstall command - Remove tracking agent service
 */
function uninstallCommand() {
  console.log('====================================');
  console.log('Uninstalling Asset Tracking Agent');
  console.log('====================================\n');
  
  try {
    // Remove service based on platform
    if (isWindows) {
      uninstallWindowsService();
    } else if (isLinux) {
      uninstallLinuxService();
    } else if (isMacOS) {
      uninstallMacOSService();
    }
    
    // Remove configuration (optional - commented out to preserve settings)
    // if (fs.existsSync(CONFIG_FILE)) {
    //   fs.unlinkSync(CONFIG_FILE);
    //   console.log('Configuration removed');
    // }
    
    console.log('\n✓ Uninstallation complete!');
    console.log('\nNote: Configuration files are preserved in:', CONFIG_DIR);
    console.log('To completely remove all data, manually delete this directory.');
  } catch (error) {
    console.error('ERROR: Uninstallation failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run command - Execute the tracking agent (called by service)
 */
async function runCommand(options) {
  // Load configuration
  const config = loadConfig();
  
  if (!config) {
    log('ERROR: Configuration not found. Please run install command first.', 'ERROR');
    process.exit(1);
  }
  
  if (!config.trackingToken) {
    log('ERROR: Tracking token not configured', 'ERROR');
    process.exit(1);
  }
  
  log('====================================');
  log('Asset Management - Tracking Agent');
  log('====================================');
  log(`Server URL: ${config.serverUrl}`);
  log(`Heartbeat Interval: ${config.heartbeatInterval / 1000} seconds`);
  log(`Location Tracking: ${config.enableLocationTracking ? 'Enabled' : 'Disabled'}`);
  log('====================================');
  
  // Send first heartbeat immediately
  await sendHeartbeat(config);
  
  // Schedule periodic heartbeats
  const interval = setInterval(() => sendHeartbeat(config), config.heartbeatInterval);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('Shutting down tracking agent...');
    clearInterval(interval);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Shutting down tracking agent...');
    clearInterval(interval);
    process.exit(0);
  });
  
  // If running in diagnostic mode, send only one heartbeat
  if (options.once) {
    clearInterval(interval);
    log('Diagnostic mode: Single heartbeat sent');
    process.exit(0);
  }
  
  // Keep process running
  log('Agent is running. Press Ctrl+C to stop.');
}

// ==================== CLI SETUP ====================

const program = new Command();

program
  .name('agent')
  .description('Asset Management System - Device Tracking Agent')
  .version('1.0.0');

program
  .command('install')
  .description('Install the tracking agent as a system service')
  .requiredOption('--server-url <url>', 'Asset Management System server URL')
  .requiredOption('--tracking-token <token>', 'Device tracking token from admin panel')
  .option('--interval <minutes>', 'Heartbeat interval in minutes', '5')
  .option('--enable-location', 'Enable IP-based location tracking', true)
  .option('--disable-location', 'Disable location tracking')
  .action((options) => {
    if (options.disableLocation) {
      options.enableLocation = false;
    }
    installCommand(options);
  });

program
  .command('uninstall')
  .description('Uninstall the tracking agent service')
  .action(uninstallCommand);

program
  .command('run')
  .description('Run the tracking agent (used by service)')
  .option('--once', 'Send single heartbeat and exit (diagnostic mode)')
  .action(runCommand);

program.parse(process.argv);

// Show help if no command specified
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
