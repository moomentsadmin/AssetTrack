#!/usr/bin/env node

/**
 * Asset Management System - Device Tracking Agent
 * 
 * This agent runs on tracked devices and sends system information
 * and location data to the Asset Management System server.
 * 
 * Installation:
 * 1. Install Node.js (v18 or later)
 * 2. Copy this file to your device
 * 3. Run: npm install axios os-utils systeminformation
 * 4. Configure the tracking token (see config below)
 * 5. Run: node agent.js
 */

const axios = require('axios');
const os = require('os');
const si = require('systeminformation');

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Server URL - Replace with your server address
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  
  // Tracking token - Get this from the admin panel
  trackingToken: process.env.TRACKING_TOKEN || '',
  
  // Heartbeat interval in milliseconds (default: 5 minutes)
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 300000,
  
  // Enable location tracking (requires internet connection for IP geolocation)
  enableLocationTracking: process.env.ENABLE_LOCATION !== 'false',
};

// Validate configuration
if (!CONFIG.trackingToken) {
  console.error('ERROR: Tracking token not configured!');
  console.error('Please set the TRACKING_TOKEN environment variable or edit this file.');
  console.error('Example: TRACKING_TOKEN=your-token-here node agent.js');
  process.exit(1);
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
    console.error('Error getting CPU usage:', error.message);
    return null;
  }
}

/**
 * Get memory usage information
 */
async function getMemoryInfo() {
  try {
    const mem = await si.mem();
    const total = Math.round((mem.total / (1024 ** 3)) * 100) / 100; // GB
    const used = Math.round((mem.used / (1024 ** 3)) * 100) / 100; // GB
    const usagePercent = Math.round((mem.used / mem.total) * 100 * 100) / 100;
    
    return {
      total,
      usage: usagePercent
    };
  } catch (error) {
    console.error('Error getting memory info:', error.message);
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
      // Get the primary disk (usually first one)
      const primary = disks[0];
      const total = Math.round((primary.size / (1024 ** 3)) * 100) / 100; // GB
      const usagePercent = Math.round(primary.use * 100) / 100;
      
      return {
        total,
        usage: usagePercent
      };
    }
    return { total: null, usage: null };
  } catch (error) {
    console.error('Error getting disk info:', error.message);
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
      // Skip internal and non-IPv4 addresses
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
async function getLocation() {
  if (!CONFIG.enableLocationTracking) {
    return { latitude: null, longitude: null };
  }
  
  try {
    // Using ip-api.com for free IP geolocation
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
    console.error('Error getting location:', error.message);
  }
  
  return { latitude: null, longitude: null, ipAddress: getIPAddress() };
}

// ==================== HEARTBEAT ====================

/**
 * Send heartbeat to server
 */
async function sendHeartbeat() {
  try {
    console.log('[%s] Collecting system information...', new Date().toISOString());
    
    // Collect all data in parallel
    const [cpuUsage, memInfo, diskInfo, osInfo, location] = await Promise.all([
      getCPUUsage(),
      getMemoryInfo(),
      getDiskInfo(),
      getOSInfo(),
      getLocation()
    ]);
    
    const payload = {
      token: CONFIG.trackingToken,
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
    
    console.log('[%s] Sending heartbeat to server...', new Date().toISOString());
    console.log('  CPU Usage: %s%', cpuUsage);
    console.log('  Memory: %s% (%s GB total)', memInfo.usage, memInfo.total);
    console.log('  Disk: %s% (%s GB total)', diskInfo.usage, diskInfo.total);
    console.log('  Location: %s, %s', location.latitude || 'N/A', location.longitude || 'N/A');
    
    const response = await axios.post(
      `${CONFIG.serverUrl}/api/device-tracking/heartbeat`,
      payload,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('[%s] ✓ Heartbeat sent successfully', new Date().toISOString());
    console.log('---');
  } catch (error) {
    if (error.response) {
      console.error('[ERROR] Server responded with error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[ERROR] No response from server. Please check your network connection.');
    } else {
      console.error('[ERROR] Failed to send heartbeat:', error.message);
    }
  }
}

// ==================== MAIN ====================

console.log('====================================');
console.log('Asset Management - Tracking Agent');
console.log('====================================');
console.log('Server URL:', CONFIG.serverUrl);
console.log('Heartbeat Interval:', CONFIG.heartbeatInterval / 1000, 'seconds');
console.log('Location Tracking:', CONFIG.enableLocationTracking ? 'Enabled' : 'Disabled');
console.log('====================================\n');

// Send first heartbeat immediately
sendHeartbeat();

// Schedule periodic heartbeats
setInterval(sendHeartbeat, CONFIG.heartbeatInterval);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[%s] Shutting down tracking agent...', new Date().toISOString());
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[%s] Shutting down tracking agent...', new Date().toISOString());
  process.exit(0);
});
