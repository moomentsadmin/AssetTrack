# 🔧 Complete Fix for 502 Error

## Issues Found

1. ✅ **drizzle-kit command** - Fixed (using npx)
2. ✅ **ecosystem.config.js** - Fixed (renamed to .cjs)
3. ❌ **Database permissions** - Needs fixing (see below)

---

## 🚀 Two-Step Fix

### Step 1: Fix Database Permissions (1 minute)

SSH into your server and run:

```bash
cd ~/AssetTrack
git pull origin main
chmod +x fix-database-permissions.sh
./fix-database-permissions.sh
```

This will grant the `asset_user` proper permissions on the database schema.

### Step 2: Deploy Application (1 minute)

```bash
cd ~/AssetTrack
chmod +x fix-deployment.sh
./fix-deployment.sh
```

This will:
- Install dependencies
- Run migrations (now with correct permissions)
- Build the app
- Start PM2 with correct config

### Step 3: Reload Nginx

```bash
sudo systemctl reload nginx
```

### Step 4: Test

Visit: **https://asset.digile.com** 🎉

---

## 📋 Quick Commands (Copy-Paste)

```bash
# All in one
cd ~/AssetTrack && \
git pull origin main && \
chmod +x fix-database-permissions.sh fix-deployment.sh && \
./fix-database-permissions.sh && \
./fix-deployment.sh && \
sudo systemctl reload nginx
```

Then visit: https://asset.digile.com

---

## 🐛 If You Get Errors

### Check PM2 Status
```bash
pm2 status
```

Should show:
```
┌────┬──────────────────┬─────────┬─────────┐
│ id │ name             │ mode    │ status  │
├────┼──────────────────┼─────────┼─────────┤
│ 0  │ asset-management │ fork    │ online  │
└────┴──────────────────┴─────────┴─────────┘
```

### Check Logs
```bash
pm2 logs asset-management --lines 50
```

### Test Locally
```bash
curl http://localhost:5000/health
```

Should return:
```json
{"status":"ok"}
```

---

## ✅ What Was Fixed

### 1. Database Permissions Error
**Problem:** `error: permission denied for schema public`

**Fix:** Grant all privileges to `asset_user` on the public schema

**Script:** `fix-database-permissions.sh`

### 2. PM2 Config File Error
**Problem:** `module is not defined in ES module scope`

**Cause:** package.json has `"type": "module"` but ecosystem.config.js uses CommonJS syntax

**Fix:** Renamed `ecosystem.config.js` to `ecosystem.config.cjs`

**Updated files:**
- `deploy-pm2.sh` - Now uses `.cjs` extension
- `fix-deployment.sh` - Now uses `.cjs` extension

### 3. drizzle-kit Not Found
**Problem:** `sh: 1: drizzle-kit: not found`

**Fix:** Use `npx drizzle-kit push` instead of `npm run db:push`

**Updated:** `deploy-pm2.sh`, `fix-deployment.sh`

---

## 🔍 Verify Everything

After running the fixes, verify:

```bash
# 1. Check PM2
pm2 status
# Status should be: online

# 2. Check app locally
curl http://localhost:5000/health
# Should return: {"status":"ok"}

# 3. Check Nginx
sudo nginx -t
# Should show: syntax is ok

# 4. Check database
psql -h localhost -U asset_user -d asset_management -c "SELECT version();"
# Should connect successfully

# 5. Visit website
# https://asset.digile.com should load
```

---

## 📝 Files Changed

Pull these from Git:
- ✅ `ecosystem.config.cjs` (renamed from .js)
- ✅ `fix-database-permissions.sh` (new)
- ✅ `fix-deployment.sh` (updated)
- ✅ `deploy-pm2.sh` (updated)
- ✅ `COMPLETE_FIX.md` (this file)

---

## 🆘 Still Having Issues?

Run the complete diagnostic:

```bash
echo "=== PM2 Status ==="
pm2 status

echo -e "\n=== PM2 Logs ==="
pm2 logs asset-management --lines 30 --nostream

echo -e "\n=== Database Test ==="
psql -h localhost -U asset_user -d asset_management -c "SELECT 1;"

echo -e "\n=== App Health ==="
curl -v http://localhost:5000/health

echo -e "\n=== Nginx Status ==="
sudo nginx -t
```

Share the output and I'll help you fix it!

---

## 📞 Next Steps

1. **Pull latest code:** `git pull origin main`
2. **Fix database permissions:** `./fix-database-permissions.sh`
3. **Deploy app:** `./fix-deployment.sh`
4. **Reload Nginx:** `sudo systemctl reload nginx`
5. **Visit:** https://asset.digile.com

That's it! 🎉
