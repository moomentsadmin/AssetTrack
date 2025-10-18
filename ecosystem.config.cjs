const fs = require('fs');
const path = require('path');

// Load .env file
const envFile = path.join(__dirname, '.env');
const env = { NODE_ENV: 'production', PORT: '5000' };

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
}

module.exports = {
  apps: [{
    name: 'asset-management',
    script: './dist/index.js',
    interpreter: 'node',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: env,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
};
