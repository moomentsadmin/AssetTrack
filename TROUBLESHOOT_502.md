# 🔧 Troubleshooting 502 Bad Gateway Error

**Error:** 502 Bad Gateway on asset.digile.com  
**Cause:** Nginx is running but can't connect to the PM2 application

---

## 🚨 Quick Fix (Run These Commands on Server)

SSH into your server and run these commands:

```bash
# 1. Check if PM2 is running
pm2 status

# 2. Check application logs for errors
pm2 logs asset-management --lines 50

# 3. Check if app is listening on port 5000
curl http://localhost:5000/health

# 4. Check Nginx error logs
sudo tail -n 50 /var/log/nginx/error.log
```

---

## 🔍 Diagnostic Steps

### Step 1: Check PM2 Status

```bash
pm2 status
```

**Expected Output:**
```
┌─────┬────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ mode    │ status  │ cpu      │
├─────┼────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ asset-management   │ fork    │ online  │ 0%       │
└─────┴────────────────────┴─────────┴─────────┴──────────┘
```

**If status shows "errored" or "stopped":**
- App crashed during startup
- See Step 2 (Check Logs)

**If PM2 shows no processes:**
- App was never started
- See Step 5 (Restart Deployment)

---

### Step 2: Check Application Logs

```bash
pm2 logs asset-management --err --lines 50
```

**Common Errors & Fixes:**

#### Error: "ECONNREFUSED" or "connect ECONNREFUSED"
**Cause:** Database connection failed

**Fix:**
```bash
cd ~/AssetTrack

# 1. Check .env file exists
ls -la .env

# 2. Verify DATABASE_URL is correct
grep DATABASE_URL .env

# 3. Test database connection
psql -h localhost -U asset_user -d asset_management

# 4. If password fails, update .env:
nano .env
# Update DATABASE_URL with correct password

# 5. Restart app
pm2 restart asset-management
```

#### Error: "MODULE_NOT_FOUND" or "Cannot find module"
**Cause:** Dependencies not installed

**Fix:**
```bash
cd ~/AssetTrack
npm ci
npm run build
pm2 restart asset-management
```

#### Error: "Port 5000 already in use"
**Cause:** Another process using port 5000

**Fix:**
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process (replace PID)
sudo kill -9 <PID>

# Restart app
pm2 restart asset-management
```

#### Error: "SESSION_SECRET is required"
**Cause:** .env file missing SESSION_SECRET

**Fix:**
```bash
cd ~/AssetTrack

# Generate a new secret
openssl rand -base64 32

# Add to .env
nano .env
# Add line: SESSION_SECRET=<paste the generated secret>

# Restart app
pm2 restart asset-management
```

---

### Step 3: Test Local Connection

```bash
# Test if app responds locally
curl http://localhost:5000/health
```

**Expected Response:**
```json
{"status":"ok"}
```

**If connection refused:**
- App is not running (check Step 1)
- App is on wrong port (check .env PORT setting)

**If you get HTML response:**
- App is working! Problem is with Nginx config (see Step 4)

---

### Step 4: Check Nginx Configuration

```bash
# Test Nginx config
sudo nginx -t

# Check if site is enabled
ls -la /etc/nginx/sites-enabled/ | grep asset

# View current config
sudo cat /etc/nginx/sites-available/asset-management
```

**Fix Nginx config:**
```bash
cd ~/AssetTrack

# Copy correct config
sudo cp nginx-http.conf /etc/nginx/sites-available/asset-management

# Enable site (if not enabled)
sudo ln -sf /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

---

### Step 5: Complete Restart Procedure

If nothing above works, do a complete restart:

```bash
cd ~/AssetTrack

# 1. Stop PM2
pm2 stop asset-management
pm2 delete asset-management

# 2. Verify .env file
cat .env
# Should have: DATABASE_URL, SESSION_SECRET, NODE_ENV=production, PORT=5000

# 3. Run deployment script
./deploy-pm2.sh

# 4. Check status
pm2 status

# 5. Check logs
pm2 logs asset-management --lines 20

# 6. Test locally
curl http://localhost:5000/health

# 7. If working locally, reload Nginx
sudo systemctl reload nginx
```

---

## 🐛 Deep Debugging

### Check All Services

```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql

# Check if port 5000 is listening
sudo netstat -tlnp | grep 5000
```

### View All Logs

```bash
# PM2 logs (application)
pm2 logs asset-management --lines 100

# Nginx error log
sudo tail -n 100 /var/log/nginx/error.log

# Nginx access log
sudo tail -n 100 /var/log/nginx/asset-management.access.log

# PostgreSQL logs
sudo journalctl -u postgresql -n 50
```

### Check .env Configuration

```bash
cd ~/AssetTrack
cat .env
```

**Required variables:**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://asset_user:YOUR_PASSWORD@localhost:5432/asset_management
SESSION_SECRET=<long random string>
```

**Fix .env:**
```bash
# If .env doesn't exist or is wrong
cp .env.pm2.example .env
nano .env

# Generate SESSION_SECRET
openssl rand -base64 32

# Update DATABASE_URL with your password
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

---

## ✅ Checklist

Run through this checklist:

- [ ] PM2 shows "online" status: `pm2 status`
- [ ] No errors in PM2 logs: `pm2 logs asset-management --err --lines 20`
- [ ] App responds locally: `curl http://localhost:5000/health`
- [ ] Port 5000 is listening: `sudo netstat -tlnp | grep 5000`
- [ ] .env file exists and is configured: `cat ~/AssetTrack/.env`
- [ ] Database connection works: `psql -h localhost -U asset_user -d asset_management`
- [ ] Nginx config is valid: `sudo nginx -t`
- [ ] Nginx site is enabled: `ls -la /etc/nginx/sites-enabled/ | grep asset`
- [ ] Nginx is running: `sudo systemctl status nginx`

---

## 🎯 Most Common Issues

### Issue #1: Database Password Wrong in .env
```bash
# Fix
cd ~/AssetTrack
nano .env
# Update DATABASE_URL with correct password
pm2 restart asset-management
```

### Issue #2: Dependencies Not Installed
```bash
# Fix
cd ~/AssetTrack
npm ci
npm run build
pm2 restart asset-management
```

### Issue #3: SESSION_SECRET Missing
```bash
# Fix
cd ~/AssetTrack
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
pm2 restart asset-management
```

### Issue #4: PM2 Not Running
```bash
# Fix
cd ~/AssetTrack
./deploy-pm2.sh
```

### Issue #5: Nginx Not Configured
```bash
# Fix
cd ~/AssetTrack
sudo cp nginx-http.conf /etc/nginx/sites-available/asset-management
sudo ln -sf /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🆘 Emergency Reset

If everything fails, start fresh:

```bash
# 1. Stop everything
pm2 stop all
pm2 delete all

# 2. Remove old files
cd ~
rm -rf AssetTrack

# 3. Clone fresh
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack

# 4. Configure .env
cp .env.pm2.example .env
nano .env
# Set: DATABASE_URL, SESSION_SECRET

# 5. Deploy
chmod +x deploy-pm2.sh
./deploy-pm2.sh

# 6. Configure Nginx
sudo cp nginx-http.conf /etc/nginx/sites-available/asset-management
sudo ln -sf /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. Test
curl http://localhost:5000/health
```

---

## 📞 Get Help

**Share this output when asking for help:**

```bash
echo "=== PM2 Status ==="
pm2 status

echo -e "\n=== PM2 Logs (Last 30 lines) ==="
pm2 logs asset-management --lines 30 --nostream

echo -e "\n=== Local Health Check ==="
curl -v http://localhost:5000/health

echo -e "\n=== Nginx Status ==="
sudo nginx -t
sudo systemctl status nginx --no-pager

echo -e "\n=== Port 5000 Listening ==="
sudo netstat -tlnp | grep 5000

echo -e "\n=== .env Check ==="
cd ~/AssetTrack && ls -la .env && echo "DATABASE_URL exists:" && grep -c DATABASE_URL .env
```

Save output to a file:
```bash
bash -c '...(commands above)...' > debug-output.txt 2>&1
cat debug-output.txt
```
