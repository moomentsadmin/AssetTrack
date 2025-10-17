# 🚀 Production Deployment Guide

## Quick Start

This guide covers deploying the Asset Management System to production with SSL/TLS encryption using Traefik and Let's Encrypt.

**Supports:**
- ✅ Local PostgreSQL database (containerized)
- ✅ External managed databases (DigitalOcean, AWS RDS, Neon, Supabase, etc.)
- ✅ Automatic SSL/TLS certificates via Let's Encrypt
- ✅ Automatic HTTP to HTTPS redirect
- ✅ Production-ready configuration

---

## 📋 Prerequisites

1. **Server Requirements:**
   - Linux server (Ubuntu 20.04+ recommended)
   - **Docker 20.10+ and Docker Compose V2** ([Install Guide](DOCKER_INSTALLATION_GUIDE.md))
   - Root or sudo access
   - Minimum 2GB RAM, 20GB disk

2. **Domain Setup:**
   - Domain name pointed to your server IP
   - DNS A records configured (see DNS Setup section)

3. **Ports:**
   - Port 80 (HTTP) - open for Let's Encrypt
   - Port 443 (HTTPS) - open for secure traffic

---

## 🐳 Install Docker

If Docker is not installed, follow the comprehensive guide:

**📖 [DOCKER_INSTALLATION_GUIDE.md](DOCKER_INSTALLATION_GUIDE.md)** - Complete installation for all platforms

**Quick Install (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Logout and login again
```

**Verify Installation:**
```bash
docker --version
docker compose version
```

---

## 🌐 DNS Setup

Configure these DNS records (replace with your domain and server IP):

```
Type    Name       Value              TTL
A       @          123.45.67.89       300
A       www        123.45.67.89       300
A       traefik    123.45.67.89       300
```

**Verify DNS propagation:**
```bash
nslookup yourdomain.com
nslookup www.yourdomain.com
nslookup traefik.yourdomain.com
```

---

## 🗄️ Database Options

### Option 1: Local PostgreSQL (Containerized)

**Pros:** Simple, no external dependencies, free
**Cons:** Requires manual backups, limited scalability

**Configuration:**
```env
USE_EXTERNAL_DB=false
PGUSER=asset_user
PGPASSWORD=secure_password_here
PGDATABASE=asset_management
```

**Deploy command:**
```bash
docker compose -f docker-compose.production.yml --profile local-db up -d --build
```

---

### Option 2: External Managed Database (Recommended)

**Pros:** Automatic backups, better performance, easy scaling, managed updates
**Cons:** Monthly cost (~$15-30)

**Supported Providers:**
- DigitalOcean Managed Database
- AWS RDS PostgreSQL
- Azure Database for PostgreSQL
- Google Cloud SQL
- Neon (Serverless)
- Supabase

**Configuration:**
```env
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Deploy command:**
```bash
docker compose -f docker-compose.production.yml up -d --build
```

---

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone repository
cd ~
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr
```

### Step 2: Configure Environment

```bash
# Copy example .env
cp .env.production.example .env

# Edit configuration
nano .env
```

**For Local Database:**
```env
# Domain
DOMAIN=test.digile.com
LETSENCRYPT_EMAIL=admin@digile.com

# Local Database
USE_EXTERNAL_DB=false
PGUSER=asset_user
PGPASSWORD=$(openssl rand -base64 24)
PGDATABASE=asset_management

# Security
SESSION_SECRET=$(openssl rand -base64 32)

# Traefik Dashboard (optional)
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$your_hash_here
```

**For DigitalOcean Database:**
```env
# Domain
DOMAIN=test.digile.com
LETSENCRYPT_EMAIL=admin@digile.com

# External Database
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://doadmin:password@db-postgresql-nyc1-12345.ondigitalocean.com:25060/defaultdb?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0

# Security
SESSION_SECRET=$(openssl rand -base64 32)

# Traefik Dashboard (optional)
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$your_hash_here
```

**Save:** Ctrl+X, Y, Enter

### Step 3: Deploy Application

📖 **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)** - Complete first-time setup guide

**For Local Database:**
```bash
docker compose -f docker-compose.production.yml --profile local-db up -d --build
```

**For External Database:**
```bash
docker compose -f docker-compose.production.yml up -d --build
```

### Step 4: Monitor Deployment

```bash
# Watch logs
docker compose -f docker-compose.production.yml logs -f app

# Wait for:
# ✅ "Server running on port 5000"
# ✅ No SSL/certificate errors

# Press Ctrl+C to exit logs
```

### Step 5: Verify Deployment

```bash
# Check container status
docker compose -f docker-compose.production.yml ps

# Should show:
# asset-app      Up (healthy)
# asset-traefik  Up
# asset-db       Up (healthy)  # Only if using local database

# Test API
docker compose -f docker-compose.production.yml exec app wget -qO- http://localhost:5000/api/setup/status

# Should return: {"needsSetup":true}
```

### Step 6: Access Application & First-Time Setup

Visit: **https://yourdomain.com** or **http://your-server-ip:5000**

**First-Time Setup (Automatic):**
1. Redirects to HTTPS automatically
2. Shows setup page on first visit
3. Fill in admin account details:
   - Full Name
   - Email
   - Username (min 3 characters)
   - Password (min 8 characters)
4. Click "Create Admin Account"
5. Automatically logged in and ready to use!

📖 **Complete First-Time Setup Guide:** [FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)

**Traefik Dashboard:** https://traefik.yourdomain.com

---

## 🔐 Security Configuration

### Generate Secure Credentials

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate database password
openssl rand -base64 24

# Generate Traefik dashboard password
htpasswd -nB admin
# Enter password when prompted
# Copy output and escape $ with $$ in .env
```

### Firewall Setup

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🗄️ DigitalOcean Database Setup

### 1. Create Database

1. Go to: https://cloud.digitalocean.com/databases
2. Click "Create Database Cluster"
3. Select PostgreSQL 15
4. Choose plan: Basic 1GB ($15/month recommended)
5. Select same region as your server
6. Create database

### 2. Configure Access

1. Get your server IP:
   ```bash
   curl ifconfig.me
   ```

2. In DigitalOcean database dashboard:
   - Go to Settings → Trusted Sources
   - Add your server IP
   - Save

### 3. Get Connection Details

1. Go to Overview tab
2. Copy "Connection String" (public network)
3. Example:
   ```
   postgresql://doadmin:password@db-postgresql-nyc1-12345.ondigitalocean.com:25060/defaultdb?sslmode=require
   ```

### 4. Update .env

```env
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://doadmin:password@db-postgresql-nyc1-12345.ondigitalocean.com:25060/defaultdb?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### 5. Deploy

```bash
docker compose -f docker-compose.production.yml up -d --build
```

---

## 🔧 Management Commands

### Start/Stop

```bash
# Start
docker compose -f docker-compose.production.yml up -d

# Stop
docker compose -f docker-compose.production.yml down

# Restart
docker compose -f docker-compose.production.yml restart app
```

### Logs

```bash
# View app logs
docker compose -f docker-compose.production.yml logs -f app

# View all logs
docker compose -f docker-compose.production.yml logs -f

# Last 100 lines
docker compose -f docker-compose.production.yml logs app --tail 100
```

### Updates

```bash
cd ~/AssetTrackr

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.production.yml up -d --build
```

### Database Migrations

```bash
# Run migrations manually
docker compose -f docker-compose.production.yml exec app npm run db:push

# Force push (if needed)
docker compose -f docker-compose.production.yml exec app npm run db:push -- --force
```

### Backups (Local Database)

```bash
# Backup database
docker compose -f docker-compose.production.yml exec db pg_dump -U asset_user asset_management > backup.sql

# Restore database
docker compose -f docker-compose.production.yml exec -T db psql -U asset_user asset_management < backup.sql
```

---

## 🐛 Troubleshooting

### Issue: SSL Certificate Error with External Database

**Symptoms:**
```
Error: self-signed certificate in certificate chain
```

**Solution:**
```env
# In .env, ensure this is set:
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Then restart:
```bash
docker compose -f docker-compose.production.yml restart app
```

---

### Issue: Connection Refused

**Check 1: Container Status**
```bash
docker compose -f docker-compose.production.yml ps
```

**Check 2: Logs**
```bash
docker compose -f docker-compose.production.yml logs app --tail 100
```

**Check 3: DATABASE_URL**
```bash
docker compose -f docker-compose.production.yml exec app printenv DATABASE_URL
```

---

### Issue: Let's Encrypt Rate Limit

**Solution:** Use staging server for testing

```bash
# Edit docker-compose.production.yml
nano docker-compose.production.yml

# Uncomment this line in traefik command section:
- "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"

# Restart
docker compose -f docker-compose.production.yml restart traefik
```

---

### Issue: Database Connection Timeout

**For External DB:** Check firewall/whitelist settings
```bash
# Test connection from server
telnet db-postgresql-nyc1-12345.ondigitalocean.com 25060
```

---

## 📊 Monitoring

### Health Checks

```bash
# App health
docker compose -f docker-compose.production.yml exec app wget -qO- http://localhost:5000/api/user

# Container health
docker compose -f docker-compose.production.yml ps
```

### Resource Usage

```bash
# CPU and Memory
docker stats

# Disk usage
docker system df
```

---

## 🔄 Switching Databases

### From Local to External

1. Backup local database:
   ```bash
   docker compose -f docker-compose.production.yml exec db pg_dump -U asset_user asset_management > backup.sql
   ```

2. Update .env:
   ```env
   USE_EXTERNAL_DB=true
   DATABASE_URL=your_external_db_url
   ```

3. Redeploy:
   ```bash
   docker compose -f docker-compose.production.yml down
   docker compose -f docker-compose.production.yml up -d --build
   ```

4. Restore data (if needed):
   ```bash
   psql "your_external_db_url" < backup.sql
   ```

---

## ✅ Production Checklist

- [ ] DNS records configured and propagated
- [ ] Firewall rules configured (ports 80, 443)
- [ ] .env file configured with secure credentials
- [ ] SESSION_SECRET is a secure random string
- [ ] Database credentials are strong
- [ ] External database IP whitelisting configured (if using external DB)
- [ ] SSL certificates generated successfully
- [ ] Application accessible at https://yourdomain.com
- [ ] Admin account created
- [ ] Backups configured (if using local database)
- [ ] Monitoring/alerts set up (optional)

---

## 📚 Additional Resources

- **DigitalOcean Database:** https://docs.digitalocean.com/products/databases/
- **Traefik Documentation:** https://doc.traefik.io/traefik/
- **Let's Encrypt:** https://letsencrypt.org/
- **Docker Compose:** https://docs.docker.com/compose/

---

**🎉 Your Asset Management System is now running in production with SSL/TLS encryption!**
