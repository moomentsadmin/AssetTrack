# URGENT: Fix 504 Gateway Timeout

## 🔥 What's Happening

**504 Gateway Timeout** means:
- Your PM2 app has **crashed** or is **frozen**
- Nginx is waiting for a response but the app isn't responding
- This often happens after a failed login attempt with wrong password format

---

## 🚀 IMMEDIATE FIX (Run These Commands)

### Step 1: Check PM2 Status
```bash
pm2 list
```

**If you see "errored" or "stopped"** → App has crashed ❌

### Step 2: Restart PM2 Immediately
```bash
pm2 restart asset-management
pm2 logs asset-management --lines 50
```

### Step 3: Check If It's Running
```bash
curl http://localhost:5000/health
```

**Should return:** `{"status":"healthy","timestamp":"..."}`

If it works → Continue to Step 4  
If it fails → **Read logs below** ⬇️

### Step 4: Test Login Again
Visit: **https://asset.digile.com**

---

## 🔍 If Still Not Working - Check Logs

```bash
cd ~/AssetTrack
git pull origin main
chmod +x check-pm2-status.sh
./check-pm2-status.sh
```

This will show you:
- PM2 process status
- Error logs
- If database is accessible
- If app is responding

---

## 🆘 Common Issues & Fixes

### Issue 1: App Keeps Crashing (Error Logs Show Database Errors)

**Fix:** Check database connection
```bash
# Test database
psql -h localhost -U asset_user -d asset_management -c "SELECT COUNT(*) FROM users;"

# If this fails, check .env file
cat ~/AssetTrack/.env | grep DATABASE_URL
```

### Issue 2: App Starts But Crashes on Login

**Cause:** Wrong password hash format (bcrypt vs scrypt mismatch)

**Fix:** Delete the admin user and recreate with correct script
```bash
# Delete old admin
psql -h localhost -U asset_user -d asset_management -c "DELETE FROM users WHERE username = 'admin';"

# Create new admin with correct password hash
cd ~/AssetTrack
./create-admin-correct.sh

# Restart PM2
pm2 restart asset-management
```

### Issue 3: SESSION_SECRET Not Set

**Fix:** Add SESSION_SECRET to .env
```bash
cd ~/AssetTrack

# Generate random secret
echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env

# Restart PM2 with new environment
pm2 restart asset-management --update-env
```

### Issue 4: Port 5000 Already in Use

**Fix:** Kill process using port 5000
```bash
# Find process
sudo lsof -i :5000

# Kill it (replace PID with the number from above)
sudo kill -9 PID

# Restart PM2
pm2 restart asset-management
```

---

## 📋 Complete Restart Procedure

If all else fails, do a **complete restart**:

```bash
# 1. Stop PM2
pm2 stop asset-management
pm2 delete asset-management

# 2. Pull latest code
cd ~/AssetTrack
git pull origin main

# 3. Verify .env file exists and has all variables
cat .env

# Should have:
# - DATABASE_URL=postgresql://...
# - PGHOST=localhost
# - PGUSER=asset_user
# - PGPASSWORD=...
# - PGDATABASE=asset_management
# - PGPORT=5432
# - SESSION_SECRET=...

# 4. Start PM2 fresh
pm2 start ecosystem.config.cjs

# 5. Check logs
pm2 logs asset-management --lines 50

# 6. Test
curl http://localhost:5000/health
```

---

## 🎯 Quick Diagnosis Commands

**Is PM2 running?**
```bash
pm2 list
```

**Is app responding?**
```bash
curl http://localhost:5000/health
```

**Is database accessible?**
```bash
psql -h localhost -U asset_user -d asset_management -c "SELECT 1;"
```

**What are the errors?**
```bash
pm2 logs asset-management --err --lines 100
```

---

## ✅ Expected Healthy State

When everything is working:

**PM2 Status:**
```
┌─────┬────────────────┬─────────────┬─────────┬─────────┐
│ id  │ name           │ mode        │ status  │ cpu     │
├─────┼────────────────┼─────────────┼─────────┼─────────┤
│ 0   │ asset-mgmt     │ fork        │ online  │ 0%      │
└─────┴────────────────┴─────────────┴─────────┴─────────┘
```

**Health Check:**
```bash
curl http://localhost:5000/health
# Returns: {"status":"healthy","timestamp":"2025-10-18T11:55:00.000Z"}
```

**Login Page:**
- Visit https://asset.digile.com
- Should load login form
- No 502/504 errors

---

## 🔧 Emergency Reset (Last Resort)

If nothing works, reset everything:

```bash
# Stop PM2
pm2 stop all
pm2 delete all

# Reset database setup
psql -h localhost -U asset_user -d asset_management <<EOF
DELETE FROM system_settings;
INSERT INTO system_settings (setup_completed, company_name, default_currency)
VALUES (false, 'Asset Management System', 'USD');
EOF

# Restart PM2
cd ~/AssetTrack
pm2 start ecosystem.config.cjs
pm2 save

# Visit setup page
# Go to https://asset.digile.com and complete first-time setup
```

---

**Start with Step 1 & 2 above - just restart PM2 and check logs!** 🚀
