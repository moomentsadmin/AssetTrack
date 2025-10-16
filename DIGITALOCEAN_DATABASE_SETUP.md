# 🌊 DigitalOcean Managed Database Setup Guide

## Step-by-Step Setup for Asset Management System

This guide will help you set up a DigitalOcean Managed PostgreSQL database for your Asset Management application.

---

## 📋 Prerequisites

- DigitalOcean account (sign up at https://digitalocean.com)
- Your server running at test.digile.com

---

## 🚀 Part 1: Create Database on DigitalOcean

### Step 1: Access Database Dashboard

1. Log in to DigitalOcean: https://cloud.digitalocean.com
2. Click **"Databases"** in the left sidebar (or go to https://cloud.digitalocean.com/databases)
3. Click **"Create Database Cluster"** button

### Step 2: Configure Database Cluster

**Database Engine:**
- Select: **PostgreSQL**
- Version: **15** (recommended) or latest

**Choose a Datacenter Region:**
- Select the **same region** as your server for best performance
- If your server is in NYC, choose **New York**
- If in Singapore, choose **Singapore**
- Check latency from your server:
  ```bash
  # On your server, test ping to different regions
  ping -c 3 nyc1-do-user-12345.ondigitalocean.com
  ```

**Choose a Plan:**

| Plan | RAM | vCPUs | Disk | Connections | Price |
|------|-----|-------|------|-------------|-------|
| **Basic** | 1 GB | 1 vCPU | 10 GB | 25 | **$15/month** ✅ |
| **Basic** | 2 GB | 1 vCPU | 25 GB | 50 | $30/month |
| **Professional** | 4 GB | 2 vCPUs | 38 GB | 97 | $60/month |

**Recommendation:** Start with **Basic 1GB plan ($15/month)** - Perfect for small to medium applications

**Finalize and Create:**
- Database cluster name: `asset-management-db` (or your choice)
- Number of standby nodes: 0 (to save cost, can add later)
- Click **"Create Database Cluster"**

### Step 3: Wait for Database to Initialize

- Takes about 3-5 minutes to provision
- Status will show **"Creating..."** then **"Active"**

---

## 🔧 Part 2: Configure Database Access

### Step 4: Add Your Server to Trusted Sources

Once the database is active:

1. In the database dashboard, go to **"Settings"** tab
2. Scroll to **"Trusted Sources"** section
3. Click **"Add trusted sources"** or **"Edit"**
4. Add your server's IP address

**Get your server IP:**
```bash
# On your server (root@assettest)
curl ifconfig.me
```

**Add the IP:**
- Click **"New rule"**
- Enter your server IP (e.g., `123.45.67.89`)
- Click **"Save"**

**Alternative:** You can temporarily allow **"All IPv4 addresses"** for testing (not recommended for production)

### Step 5: Get Connection Details

1. Go to **"Overview"** or **"Connection Details"** tab
2. You'll see connection information like:

```
Host: db-postgresql-nyc1-12345-do-user-67890.ondigitalocean.com
Port: 25060
User: doadmin
Password: [click to show]
Database: defaultdb
SSL Mode: require
```

**Important:** 
- Click **"show"** to reveal the password
- Copy and save it securely

### Step 6: Get Connection String

Scroll down to **"Connection String"** section:

**Select:** `postgresql://` format

You'll see something like:
```
postgresql://doadmin:your_password_here@db-postgresql-nyc1-12345-do-user-67890.ondigitalocean.com:25060/defaultdb?sslmode=require
```

**Copy this entire string** - you'll need it in the next step!

---

## 🖥️ Part 3: Configure Your Application

### Step 7: Update .env File on Your Server

```bash
# SSH to your server
ssh root@assettest

# Navigate to project
cd ~/AssetTrackr

# Stop current deployment
docker compose -f docker-compose.ssl.yml down

# Create/edit .env file
nano .env
```

**Paste this configuration:**

```env
# ===================================
# DOMAIN CONFIGURATION
# ===================================
DOMAIN=test.digile.com
LETSENCRYPT_EMAIL=admin@digile.com

# ===================================
# DIGITALOCEAN MANAGED DATABASE
# ===================================
# Paste your connection string from DigitalOcean dashboard
DATABASE_URL=postgresql://doadmin:YOUR_PASSWORD@db-postgresql-nyc1-12345-do-user-67890.ondigitalocean.com:25060/defaultdb?sslmode=require

# ===================================
# APPLICATION CONFIGURATION
# ===================================
# Generate with: openssl rand -base64 32
SESSION_SECRET=your_secure_random_session_secret_min_32_characters

# ===================================
# TRAEFIK DASHBOARD
# ===================================
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$kF5Z5z5Z5z5z5Z5z5z5z5OqGqGqGqGqGqGqGqGqGqGqGqGqGqG
```

**Replace:**
- `YOUR_PASSWORD` with the actual password from DigitalOcean
- The entire `DATABASE_URL` with the connection string from DigitalOcean
- `SESSION_SECRET` with a secure random string

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter`

### Step 8: Verify .env File

```bash
# Check the file was created correctly
cat .env

# Make sure DATABASE_URL is correct and has no typos
```

---

## 🚀 Part 4: Deploy with DigitalOcean Database

### Step 9: Pull Latest Code

```bash
cd ~/AssetTrackr

# Pull latest code (includes docker-compose.ssl-external-db.yml)
git pull origin main
```

### Step 10: Deploy Application

```bash
cd ~/AssetTrackr

# Deploy with external database
docker compose -f docker-compose.ssl-external-db.yml up -d --build

# This will:
# - Build the application
# - Connect to DigitalOcean database
# - Run database migrations
# - Start the application
```

### Step 11: Monitor Deployment

```bash
# Watch logs in real-time
docker compose -f docker-compose.ssl-external-db.yml logs -f app
```

**Look for these SUCCESS indicators:**
```
✓ Pulling schema from database...
✓ No changes detected (first time)
  OR
✓ Applying schema changes...
✓ [express] serving on port 5000
```

**Press Ctrl+C to exit logs when you see the server running**

### Step 12: Verify Connection

```bash
# Test API endpoint
docker compose -f docker-compose.ssl-external-db.yml exec app wget -qO- http://localhost:5000/api/setup/status

# Should return:
# {"needsSetup":true}
```

**If you get an error**, check:
1. Database connection string is correct in .env
2. Server IP is whitelisted in DigitalOcean
3. Database is in "Active" state

---

## 🌐 Part 5: Access Your Application

### Step 13: Open in Browser

Visit: **https://test.digile.com**

**Expected Flow:**
1. **First Time:** Redirects to `/setup` page
2. **Create admin account** with your chosen credentials:
   - Full Name: Your Name
   - Email: your@email.com
   - Username: admin (or your choice)
   - Password: Secure password (min 8 characters)
3. Click **"Create Admin Account"**
4. **Automatically logged in** to dashboard

**If you see 404 error:**
- Wait 1-2 minutes for SSL certificates to generate
- Check app logs: `docker compose -f docker-compose.ssl-external-db.yml logs app`

---

## ✅ Verification Checklist

Run these checks to ensure everything is working:

### Check 1: Containers Running
```bash
docker compose -f docker-compose.ssl-external-db.yml ps
```
**Expected:**
```
asset-traefik   Up   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
asset-app       Up (healthy)
```

### Check 2: Database Connection
```bash
# Test connection from app container
docker compose -f docker-compose.ssl-external-db.yml exec app wget -qO- http://localhost:5000/api/setup/status
```
**Expected:** `{"needsSetup":true}` or `{"needsSetup":false}`

### Check 3: Website Access
- Visit: https://test.digile.com
- Should load without certificate errors
- Shows login or setup page

### Check 4: DigitalOcean Dashboard
- Go to DigitalOcean Databases
- Your database should show:
  - Status: **Active**
  - Connections: **1 or more** (app connected)
  - CPU/Memory: Some usage

---

## 🎯 DigitalOcean Database Features

### Automatic Backups
- **Daily backups** automatically enabled
- Retention: 7 days (can be extended)
- View in: Database → Backups tab

### Point-in-Time Recovery
- Available on Professional plans
- Restore to any point in the last 7 days

### Connection Pooling
- Available on all plans
- Go to: Database → Connection Pools
- Recommended for high-traffic apps

### Metrics & Monitoring
- Go to: Database → Metrics tab
- View:
  - CPU usage
  - Memory usage
  - Disk I/O
  - Connection count
  - Query performance

### Alerts
- Go to: Database → Settings → Alerts
- Set up alerts for:
  - High CPU usage
  - High memory usage
  - Connection limit reached

---

## 🔧 Common Issues & Solutions

### Issue 1: Connection Timeout

**Symptoms:**
```
Error: connect ETIMEDOUT
```

**Solutions:**
1. Check server IP is whitelisted in DigitalOcean
2. Verify firewall allows outbound connections on port 25060
3. Test connection manually:
   ```bash
   docker compose -f docker-compose.ssl-external-db.yml exec app sh
   nc -zv db-postgresql-nyc1-12345-do-user-67890.ondigitalocean.com 25060
   ```

### Issue 2: Authentication Failed

**Symptoms:**
```
Error: password authentication failed for user "doadmin"
```

**Solutions:**
1. Double-check password in .env (no extra spaces)
2. Verify DATABASE_URL format is correct
3. Make sure password special characters are URL-encoded:
   - `@` → `%40`
   - `#` → `%23`
   - `&` → `%26`

### Issue 3: SSL Connection Error

**Symptoms:**
```
Error: SSL connection required
```

**Solutions:**
1. Make sure `?sslmode=require` is at the end of DATABASE_URL
2. Try: `?sslmode=verify-full` if require doesn't work

### Issue 4: Too Many Connections

**Symptoms:**
```
Error: too many connections for role "doadmin"
```

**Solutions:**
1. Upgrade to larger plan (more connections)
2. Enable connection pooling in DigitalOcean
3. Reduce application connection pool size

---

## 💰 Cost Management

### Current Cost
- **Basic 1GB plan:** $15/month
- **Storage overages:** $0.10/GB over included 10GB
- **Backups:** Included (7 days retention)

### Cost Optimization Tips
1. **Start small:** Begin with Basic plan, upgrade if needed
2. **Monitor usage:** Check Metrics tab regularly
3. **Delete test databases:** Remove unused databases
4. **Use connection pooling:** Reduces connection overhead
5. **Archive old data:** Keep database size under plan limit

### Upgrade Path
When you need more:
1. Go to: Database → Settings
2. Click **"Resize"**
3. Select new plan
4. Click **"Resize cluster"**
5. Zero downtime upgrade!

---

## 🔒 Security Best Practices

### 1. IP Whitelisting
✅ **Only add your server IP**, not "All IPs"
```bash
# Get your server IP
curl ifconfig.me
```

### 2. Strong Password
✅ Use the auto-generated password from DigitalOcean (already secure)

### 3. SSL/TLS
✅ Always use `?sslmode=require` in connection string

### 4. Rotate Credentials
```bash
# Every 90 days:
# 1. In DigitalOcean, go to Users & Databases
# 2. Reset password for doadmin
# 3. Update .env file
# 4. Restart app:
docker compose -f docker-compose.ssl-external-db.yml restart app
```

### 5. Enable Monitoring
✅ Set up alerts in DigitalOcean dashboard

### 6. Regular Backups
✅ Enabled by default - verify in Backups tab

---

## 📊 Managing Your Deployment

### Common Commands

```bash
# Start application
docker compose -f docker-compose.ssl-external-db.yml up -d

# Stop application
docker compose -f docker-compose.ssl-external-db.yml down

# View logs
docker compose -f docker-compose.ssl-external-db.yml logs -f app

# Restart application
docker compose -f docker-compose.ssl-external-db.yml restart app

# Rebuild after code changes
docker compose -f docker-compose.ssl-external-db.yml up -d --build

# Run database migrations
docker compose -f docker-compose.ssl-external-db.yml exec app npm run db:push

# Check container status
docker compose -f docker-compose.ssl-external-db.yml ps
```

### Updating Your Application

```bash
cd ~/AssetTrackr

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.ssl-external-db.yml up -d --build

# Check logs
docker compose -f docker-compose.ssl-external-db.yml logs -f app
```

---

## 📈 Monitoring & Maintenance

### Daily Checks (Optional)
- ✅ Application is accessible at https://test.digile.com
- ✅ DigitalOcean database status is "Active"

### Weekly Checks
- ✅ Review database metrics (CPU, Memory, Connections)
- ✅ Check backup status
- ✅ Review application logs for errors

### Monthly Tasks
- ✅ Review database size vs. plan limits
- ✅ Check for DigitalOcean security updates
- ✅ Verify backups are working
- ✅ Review costs and optimize if needed

---

## 🎉 Success!

Your Asset Management application is now running with:
- ✅ DigitalOcean Managed PostgreSQL database
- ✅ Automatic daily backups
- ✅ SSL/TLS encryption
- ✅ Professional-grade database hosting
- ✅ Easy scaling when you grow

**Access your application:** https://test.digile.com

**Need help?**
- DigitalOcean Docs: https://docs.digitalocean.com/products/databases/
- DigitalOcean Support: Available 24/7 via ticket
- Community: https://www.digitalocean.com/community

---

## 📝 Quick Reference Card

```bash
# Application URL
https://test.digile.com

# Database Dashboard
https://cloud.digitalocean.com/databases

# View App Logs
docker compose -f docker-compose.ssl-external-db.yml logs -f app

# Restart App
docker compose -f docker-compose.ssl-external-db.yml restart app

# Check Status
docker compose -f docker-compose.ssl-external-db.yml ps

# Run Migrations
docker compose -f docker-compose.ssl-external-db.yml exec app npm run db:push
```

---

**🌊 Your DigitalOcean database is ready! Happy asset tracking!**
