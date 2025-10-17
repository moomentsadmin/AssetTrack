# ✅ 404 Error & First-Time Setup - Complete Fix

## Issues Reported

1. ❌ **404 Error** after re-deployment
2. ❌ **First-time setup (create primary user) missing**

---

## Good News! ✅

**The setup routes already exist!** They're properly implemented in `server/auth.ts`:
- `/api/setup/status` - Checks if setup is needed
- `/api/setup` (POST) - Creates admin account

The 404 error is **blocking** the setup screen from appearing. Once we fix the 404, the setup will work automatically.

---

## Root Cause: Production Build Issue

The production deployment isn't serving the frontend files correctly. Possible causes:

1. Frontend build didn't complete
2. Docker didn't copy `dist/public/` folder
3. Build cache is stale

---

## Quick Fix (5 Minutes)

### On Your Production Server

```bash
cd ~/AssetTrack

# Make the fix script executable
chmod +x fix-production-404.sh

# Run the fix script
./fix-production-404.sh
```

**This script will:**
1. Pull latest changes
2. Stop services
3. Clean up old builds
4. Rebuild from scratch (no cache)
5. Verify build succeeded
6. Start services
7. Show status and logs

---

## Manual Fix (If Script Fails)

Run these commands step by step:

```bash
cd ~/AssetTrack

# 1. Pull latest
git pull origin main

# 2. Stop everything
docker compose -f docker-compose.production.yml down -v

# 3. Clean up
docker system prune -f

# 4. Rebuild (no cache)
docker compose -f docker-compose.production.yml build --no-cache app

# 5. Verify build
docker run --rm $(docker images -q | head -1) ls -la /app/dist/public/

# Should show index.html and assets/ folder

# 6. Start services
docker compose -f docker-compose.production.yml up -d

# 7. Monitor logs
docker compose -f docker-compose.production.yml logs -f app
```

**Wait for:** `"serving on port 5000"` in logs

---

## Verify the Fix

### 1. Check Container Status
```bash
docker compose -f docker-compose.production.yml ps
```

**Expected:**
- `asset-app` - running (healthy)
- `asset-traefik` - running

### 2. Test Internal Access
```bash
docker compose -f docker-compose.production.yml exec app curl -I http://localhost:5000
```

**Expected:** `HTTP/1.1 200 OK`

### 3. Test External Access
```bash
curl -I https://asset.digile.com
```

**Expected:** `HTTP/2 200`

### 4. Test in Browser
Visit: **https://asset.digile.com**

**You should see:**
- ✅ First-time setup screen (if new database)
- ✅ OR login screen (if setup already completed)

**NOT:**
- ❌ 404 error
- ❌ Blank page

---

## First-Time Setup (After Fix)

Once the 404 is fixed, you'll see this setup screen:

### Create Your Admin Account

Fill in the form:
1. **Full Name** - Your full name
2. **Email** - Your email address  
3. **Username** - admin (or your preference, min 3 chars)
4. **Password** - Secure password (min 8 chars)

Click **"Create Admin Account"**

✅ You'll be logged in automatically!

The setup routes work perfectly:
- `GET /api/setup/status` - Returns `{ setupCompleted: false }`
- `POST /api/setup` - Creates admin user and logs you in

---

## Troubleshooting

### Still Getting 404?

**Check if frontend files exist:**
```bash
docker compose -f docker-compose.production.yml exec app ls -la /app/dist/public/
```

**Should show:**
- `index.html`
- `assets/` folder with JS/CSS files

**If missing:** Build failed. Check build logs:
```bash
docker compose -f docker-compose.production.yml logs app | grep -i error
```

### Setup Screen Not Appearing?

**Check setup status:**
```bash
docker compose -f docker-compose.production.yml exec app curl http://localhost:5000/api/setup/status
```

**Expected response:**
```json
{"setupCompleted": false}
```

**If `setupCompleted: true`:** Setup already done. You'll see login screen instead.

### Can't Access Port 5000 Internally?

**Check if app is running:**
```bash
docker compose -f docker-compose.production.yml logs app --tail=50
```

**Look for:**
- ✅ `"serving on port 5000"`
- ❌ Any errors

---

## What's Different from Test Deployment?

Your previous deployment (test.digile.com) works, but asset.digile.com shows 404. Common differences:

1. **Fresh database** - test.digile.com has users, asset.digile.com might be empty
2. **Build cache** - Old build might be cached
3. **Environment variables** - Check .env is correct

**Verify .env on production:**
```bash
cat .env | grep -v PASSWORD | grep -v SECRET

# Should show:
# DOMAIN=asset.digile.com
# USE_EXTERNAL_DB=true
# DATABASE_URL=postgresql://...
```

---

## Expected Behavior After Fix

### First Visit (New Database)
1. Visit https://asset.digile.com
2. See **"First-time setup required"** screen
3. Fill in admin account details
4. Click "Create Admin Account"
5. Automatically logged in as admin ✅

### Subsequent Visits
1. Visit https://asset.digile.com
2. See **login screen**
3. Enter username/password
4. Access dashboard ✅

---

## Files Created for You

1. **fix-production-404.sh** - Automated fix script ⭐
2. **PRODUCTION_404_FIX.md** - Detailed troubleshooting guide
3. **404_AND_SETUP_FIX.md** - This summary

---

## Quick Reference

### Deploy the Fix
```bash
cd ~/AssetTrack
./fix-production-404.sh
```

### Monitor Logs
```bash
docker compose -f docker-compose.production.yml logs -f app
```

### Check Status
```bash
docker compose -f docker-compose.production.yml ps
```

### Restart if Needed
```bash
docker compose -f docker-compose.production.yml restart app
```

---

## Summary

**Issue 1: 404 Error**
- **Cause:** Frontend build not accessible
- **Fix:** Rebuild with `--no-cache` flag
- **Script:** `./fix-production-404.sh`

**Issue 2: Setup Missing**
- **Status:** ✅ Routes already exist!
- **Location:** `server/auth.ts` lines 74-143
- **Will appear:** Once 404 is fixed

**Next Steps:**
1. Run `./fix-production-404.sh` on production server
2. Wait 2-3 minutes for rebuild
3. Visit https://asset.digile.com
4. Complete first-time setup
5. Start using the system! 🚀

---

**The setup functionality is ready - we just need to fix the 404 to access it!**
