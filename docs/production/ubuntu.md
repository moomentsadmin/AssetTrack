**Ubuntu (systemd) — Self-hosted VM**

This guide explains how to deploy AssetTrack on an Ubuntu 22.04+ VM using a systemd service. It assumes a managed Postgres instance (local or remote).

1) Prepare the server

```bash
# update and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential postgresql-client

# Install Node 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Create a non-root user for the app
sudo useradd -m -s /bin/bash assettrack
sudo passwd assettrack
sudo usermod -aG sudo assettrack
```

2) Checkout & build

```bash
sudo -i -u assettrack
cd ~
git clone https://github.com/<your-org>/AssetTrack.git
cd AssetTrack
cp docs/production/.env.production.example .env.production
# Edit .env.production with your DATABASE_URL and secrets
npm ci
npm run build
exit
```

3) Systemd service

Create `/etc/systemd/system/assettrack.service` (run as root):

```ini
[Unit]
Description=AssetTrack service
After=network.target

[Service]
Type=simple
User=assettrack
WorkingDirectory=/home/assettrack/AssetTrack
EnvironmentFile=/home/assettrack/AssetTrack/.env.production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now assettrack.service
sudo journalctl -u assettrack -f
```

4) Nginx reverse proxy + TLS (recommended)

Install nginx and certbot, then add a proxy config for your domain:

```nginx
server {
  listen 80;
  server_name assettrack.example.com;
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Then obtain TLS with Certbot and enable HTTPS.

5) Run DB Migrations

Install drizzle-kit and run migrations (from app root):

```bash
# using environment variable in .env.production
export DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d'=' -f2- )"
npx drizzle-kit push:pg --env DATABASE_URL
```

Notes & tips
- Use a managed DB for production (RDS, DigitalOcean Managed DB, etc.).
- Ensure `SESSION_SECRET` is set to a long random string.
- Monitor logs via `journalctl -u assettrack` or a log aggregator.
