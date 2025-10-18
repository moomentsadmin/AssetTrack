# Complete Ubuntu Setup Guide
## Asset Management System - PM2 + Nginx + PostgreSQL

**Target:** Fresh Ubuntu 20.04+ server  
**Domain:** asset.digile.com  
**Server IP:** 178.128.51.240

---

## 🚀 Quick Start (5 Steps)

```bash
# 1. Install everything
curl -fsSL https://raw.githubusercontent.com/moomentsadmin/AssetTrack/main/install-ubuntu.sh | bash

# 2. Configure database
sudo -u postgres psql
```
```sql
CREATE DATABASE asset_management;
CREATE USER asset_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;
\c asset_management
GRANT ALL ON SCHEMA public TO asset_user;
\q
```
```bash
# 3. Configure application
cd ~/AssetTrack
cp .env.production.example .env
nano .env  # Edit DATABASE_URL and SESSION_SECRET

# 4. Deploy
./deploy-pm2.sh

# 5. Setup SSL
sudo certbot --nginx -d asset.digile.com
```

**Done!** Visit https://asset.digile.com

---

## 📋 Detailed Step-by-Step Guide

### Step 1: Prepare Server

**1.1 Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

**1.2 Install Node.js 20**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x
```

**1.3 Install PostgreSQL**
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

**1.4 Install Nginx**
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

**1.5 Install PM2**
```bash
sudo npm install -g pm2
pm2 --version
```

**1.6 Install Certbot (for SSL)**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

### Step 2: Configure PostgreSQL

```bash
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
-- Create database
CREATE DATABASE asset_management;

-- Create user (CHANGE THE PASSWORD!)
CREATE USER asset_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD_HERE';

-- Grant database privileges
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;

-- Connect to database
\c asset_management

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO asset_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO asset_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO asset_user;

-- Verify
\du  -- List users
\l   -- List databases

-- Exit
\q
```

**Test the connection:**
```bash
psql -h localhost -U asset_user -d asset_management
# Enter password when prompted
# If successful, you'll see: asset_management=>
\q
```

---

### Step 3: Clone and Configure Application

**3.1 Clone Repository**
```bash
cd ~
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack
```

**3.2 Create Environment File**
```bash
cp .env.production.example .env
nano .env
```

**Edit `.env` with these values:**
```env
NODE_ENV=production
PORT=5000

# Database (use the password you created above)
DATABASE_URL=postgresql://asset_user:YOUR_SECURE_PASSWORD_HERE@localhost:5432/asset_management
PGHOST=localhost
PGPORT=5432
PGDATABASE=asset_management
PGUSER=asset_user
PGPASSWORD=YOUR_SECURE_PASSWORD_HERE

# Session Secret (generate below)
SESSION_SECRET=PASTE_GENERATED_SECRET_HERE
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
# Copy the output and paste into .env
```

---

### Step 4: Deploy Application

**4.1 Make deploy script executable**
```bash
chmod +x deploy-pm2.sh
```

**4.2 Run deployment**
```bash
./deploy-pm2.sh
```

This will:
- ✅ Install dependencies
- ✅ Run database migrations
- ✅ Build application
- ✅ Start with PM2

**4.3 Verify it's running**
```bash
# Check PM2 status
pm2 status
# Should show: asset-management | online

# Check logs
pm2 logs asset-management --lines 20

# Test locally
curl http://localhost:5000/health
# Should return: {"status":"healthy",...}
```

---

### Step 5: Configure Nginx

**5.1 Create Nginx configuration**
```bash
sudo nano /etc/nginx/sites-available/asset-management
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name asset.digile.com www.asset.digile.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    client_max_body_size 10M;
}
```

**5.2 Enable the site**
```bash
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
```

**5.3 Remove default site (optional)**
```bash
sudo rm /etc/nginx/sites-enabled/default
```

**5.4 Test and reload Nginx**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 6: Set Up SSL Certificate

```bash
sudo certbot --nginx -d asset.digile.com -d www.asset.digile.com
```

**Follow the prompts:**
1. Enter email address
2. Agree to Terms of Service
3. Choose "2" to redirect HTTP to HTTPS

**Verify auto-renewal works:**
```bash
sudo certbot renew --dry-run
```

---

### Step 7: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

### Step 8: Configure PM2 Auto-Start

```bash
# Generate startup script
pm2 startup systemd

# Copy and run the command it outputs (example):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Save current process list
pm2 save

# Verify
systemctl status pm2-root
```

---

### Step 9: Test Everything

**9.1 Check application status**
```bash
pm2 status
pm2 logs asset-management --lines 50
```

**9.2 Test HTTPS**
```bash
curl -I https://asset.digile.com
# Should return: HTTP/2 200
```

**9.3 Open in browser**
```
https://asset.digile.com
```

You should see the first-time setup page! 🎉

---

## 🔧 Management Commands

### PM2 Commands
```bash
# Status
pm2 status

# View logs
pm2 logs asset-management

# Restart
pm2 restart asset-management

# Stop
pm2 stop asset-management

# Start
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Commands
```bash
# Connect to database
sudo -u postgres psql -d asset_management

# Backup database
sudo -u postgres pg_dump asset_management > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql asset_management < backup_20250118.sql
```

---

## 🔄 Updating the Application

```bash
cd ~/AssetTrack

# Pull latest code
git pull origin main

# Deploy update
./deploy-pm2.sh

# Check status
pm2 status
pm2 logs asset-management
```

---

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check logs for errors
pm2 logs asset-management --err

# Common fixes:
# 1. Check database connection
psql -h localhost -U asset_user -d asset_management

# 2. Check .env file
cat .env

# 3. Reinstall dependencies
npm ci
./deploy-pm2.sh
```

### 502 Bad Gateway
```bash
# Check if PM2 is running
pm2 status

# Check if app responds locally
curl http://localhost:5000/health

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart everything
pm2 restart asset-management
sudo systemctl reload nginx
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check if user can connect
psql -h localhost -U asset_user -d asset_management

# Reset user password
sudo -u postgres psql
ALTER USER asset_user WITH PASSWORD 'new_password';
\q

# Update .env with new password
nano .env
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Check Nginx SSL config
sudo nginx -t
```

---

## 📊 Monitoring

### Check Application Health
```bash
# PM2 status
pm2 status

# CPU/Memory usage
pm2 monit

# Detailed info
pm2 info asset-management
```

### Check System Resources
```bash
# Disk space
df -h

# Memory
free -h

# CPU
top
```

---

## 🔒 Security Checklist

- ✅ Firewall enabled (UFW)
- ✅ SSL certificate installed
- ✅ Strong database password
- ✅ Secure SESSION_SECRET
- ✅ PM2 running as systemd service
- ✅ Regular system updates
- ✅ Database backups configured

---

## 📞 Support

**Logs Location:**
- Application: `pm2 logs asset-management`
- Nginx: `/var/log/nginx/`
- PostgreSQL: `/var/log/postgresql/`

**Quick Health Check:**
```bash
# Run this to check everything
pm2 status && \
curl -s http://localhost:5000/health && \
sudo systemctl status nginx && \
sudo systemctl status postgresql
```

---

## 🎯 Production Checklist

Before going live:
- [ ] Database password is strong and secure
- [ ] SESSION_SECRET is randomly generated
- [ ] SSL certificate is active
- [ ] Firewall is enabled
- [ ] PM2 auto-start is configured
- [ ] Database backups are scheduled
- [ ] Application responds at https://asset.digile.com
- [ ] First-time admin account is created
- [ ] Application logs are monitored
