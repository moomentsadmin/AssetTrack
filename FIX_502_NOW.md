# 🚨 QUICK FIX - 502 Bad Gateway

## The Problem
- **drizzle-kit** command not found during deployment
- Old PM2 process named "assettrackr" instead of "asset-management"
- App keeps crashing (16 restarts)

## ✅ The Solution (30 seconds)

SSH into your server and run these 3 commands:

```bash
# 1. Go to app directory
cd ~/AssetTrack

# 2. Pull the fix
git pull origin main

# 3. Run the fix script
chmod +x fix-deployment.sh
./fix-deployment.sh
```

That's it! The script will:
- ✅ Clean up old PM2 processes
- ✅ Install dependencies correctly
- ✅ Run migrations with `npx` (fixes drizzle-kit issue)
- ✅ Build the app
- ✅ Start PM2 with correct configuration
- ✅ Test the app locally

---

## After Running the Script

If you see "✅ App is running!", reload Nginx:

```bash
sudo systemctl reload nginx
```

Then visit: **https://asset.digile.com** 🎉

---

## If It Still Doesn't Work

Check the PM2 logs:

```bash
pm2 logs asset-management --lines 50
```

**Common issues:**

### Database connection failed
```bash
cd ~/AssetTrack
nano .env
# Make sure DATABASE_URL has the correct password:
# DATABASE_URL=postgresql://asset_user:YOUR_PASSWORD@localhost:5432/asset_management

pm2 restart asset-management
```

### Build failed
```bash
cd ~/AssetTrack
npm ci
npm run build
pm2 restart asset-management
```

---

## Manual Steps (If Script Fails)

```bash
cd ~/AssetTrack
git pull origin main

# Clean up old PM2
pm2 delete all
pm2 save --force

# Install
npm ci

# Migrate
npx drizzle-kit push

# Build
npm run build

# Start
pm2 start ecosystem.config.js
pm2 save

# Test
curl http://localhost:5000/health

# Reload Nginx
sudo systemctl reload nginx
```

---

## What Was Fixed

1. **deploy-pm2.sh** - Now uses `npx drizzle-kit push` instead of `npm run db:push`
2. **deploy-pm2.sh** - Now cleans up old PM2 processes before starting
3. **fix-deployment.sh** - New automated fix script

The issue was that `drizzle-kit` command wasn't being found because the npm script wasn't using `npx` to locate it in node_modules.

---

## Verify Everything Works

```bash
# Check PM2
pm2 status
# Should show: asset-management | online

# Check app
curl http://localhost:5000/health
# Should return: {"status":"ok"}

# Check Nginx
sudo nginx -t
# Should show: syntax is ok

# Visit website
# https://asset.digile.com should load
```

---

**Need help?** Share the output of:
```bash
pm2 logs asset-management --lines 50
```
