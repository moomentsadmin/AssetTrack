# 🔧 Production 404 Error - Complete Fix Guide

## Issue
After deployment, accessing https://asset.digile.com shows:
- **404 page not found**
- First-time setup screen not appearing

---

## Root Cause Analysis

The 404 error occurs when the production server can't find the built frontend files. Possible causes:

1. **Build failed** - Frontend didn't compile
2. **Files not copied** - Docker didn't copy dist/public
3. **Path mismatch** - Server looking in wrong directory
4. **Permissions issue** - Non-root user can't read files

---

## Quick Fix (Run on Production Server)

```bash
cd ~/AssetTrack

# Step 1: Pull latest changes
git pull origin main

# Step 2: Stop and remove everything
docker compose -f docker-compose.production.yml down -v
docker system prune -f

# Step 3: Remove old build artifacts
rm -rf dist/

# Step 4: Rebuild with verbose output
docker compose -f docker-compose.production.yml build --no-cache --progress=plain app 2>&1 | tee build.log

# Step 5: Check if build succeeded
echo "Checking build output..."
docker run --rm $(docker images -q asset-app:latest) ls -la /app/dist/

# Step 6: Deploy
docker compose -f docker-compose.production.yml up -d

# Step 7: Monitor logs
docker compose -f docker-compose.production.yml logs -f app
```

**Look for:**
- ✅ "serving on port 5000"
- ✅ No errors about missing files
- ❌ "Could not find the build directory"

---

## Diagnostic Commands

Run these to identify the exact issue:

### 1. Check Container File Structure
```bash
# Check if dist/public exists inside container
docker compose -f docker-compose.production.yml exec app ls -laR /app/dist/
```

**Expected output:**
```
/app/dist/:
total 60
drwxr-xr-x 3 nodejs nodejs  4096 index.js
drwxr-xr-x 2 nodejs nodejs  4096 public

/app/dist/public/:
total 200
-rw-r--r-- 1 nodejs nodejs  1234 index.html
drwxr-xr-x 2 nodejs nodejs  4096 assets
```

**If missing:** Build failed or files not copied

### 2. Check Application Logs
```bash
docker compose -f docker-compose.production.yml logs app --tail=100
```

**Look for errors:**
- `Could not find the build directory` → Build/copy issue
- `ENOENT` → File not found
- `EACCES` → Permission denied

### 3. Test Internal HTTP
```bash
# Test if app responds internally
docker compose -f docker-compose.production.yml exec app wget -qO- http://localhost:5000
```

**Expected:** HTML content
**If 404:** Static file serving broken

### 4. Check Traefik Routing
```bash
docker compose -f docker-compose.production.yml logs traefik --tail=50
```

**Look for:**
- ✅ Router registered for asset.digile.com
- ✅ Backend responding
- ❌ 404 errors from backend

---

## Detailed Fix Steps

### Fix 1: Verify Dockerfile Build Process

Check your `Dockerfile` has correct build steps:

```bash
cat Dockerfile
```

**Should contain:**
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  ← This creates dist/public

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY --from=build /app/dist ./dist  ← This copies dist/public
```

### Fix 2: Verify Build Script

```bash
cat package.json | grep -A1 '"build"'
```

**Should show:**
```json
"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

### Fix 3: Check Vite Output Directory

```bash
cat vite.config.ts | grep -A2 'build:'
```

**Should show:**
```typescript
build: {
  outDir: path.resolve(import.meta.dirname, "dist/public"),
  emptyOutDir: true,
}
```

### Fix 4: Verify Server Static Path

```bash
cat server/vite.ts | grep -A5 'serveStatic'
```

**Should show:**
```typescript
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  // This becomes dist/public when compiled
```

---

## Manual Build Test

Test the build locally to verify it works:

```bash
# Clean
rm -rf dist/

# Build
npm run build

# Check output
ls -la dist/
ls -la dist/public/

# Should see:
# dist/index.js (backend)
# dist/public/index.html (frontend)
# dist/public/assets/ (frontend assets)
```

---

## Docker Build Debug

If Docker build is failing:

```bash
# Build with full output
docker compose -f docker-compose.production.yml build --no-cache --progress=plain app

# Look for:
# ✅ "RUN npm run build" succeeds
# ✅ "vite build" completes
# ✅ "esbuild server/index.ts" completes
# ❌ Any npm errors
# ❌ "module not found" errors
```

---

## Production Deployment Script

Create this script to deploy safely:

```bash
#!/bin/bash
# File: deploy-production.sh

set -e

echo "🚀 Deploying Asset Management to Production"
echo "============================================"

cd ~/AssetTrack

# Pull latest
echo "📥 Pulling latest changes..."
git pull origin main

# Stop services
echo "🛑 Stopping services..."
docker compose -f docker-compose.production.yml down

# Clean up
echo "🧹 Cleaning up..."
docker system prune -f

# Build with verbose output
echo "🔨 Building application..."
docker compose -f docker-compose.production.yml build --no-cache app

# Verify build
echo "✅ Verifying build..."
BUILD_CHECK=$(docker run --rm $(docker images -q | head -1) ls /app/dist/public/index.html 2>/dev/null || echo "FAILED")

if [ "$BUILD_CHECK" = "FAILED" ]; then
    echo "❌ Build verification failed! dist/public/index.html not found"
    exit 1
fi

echo "✅ Build verified - dist/public/index.html exists"

# Deploy
echo "🚀 Deploying services..."
docker compose -f docker-compose.production.yml up -d

# Wait for startup
echo "⏳ Waiting for services to start..."
sleep 15

# Check health
echo "🔍 Checking service health..."
docker compose -f docker-compose.production.yml ps

# Show logs
echo "📝 Recent application logs:"
docker compose -f docker-compose.production.yml logs app --tail=30

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access: https://asset.digile.com"
echo ""
echo "📊 Monitor logs: docker compose -f docker-compose.production.yml logs -f"
```

**Make it executable:**
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

---

## Common Issues & Solutions

### Issue 1: "Could not find the build directory"

**Cause:** Build output not in expected location

**Fix:**
```bash
# Check vite.config.ts outDir
# Should be: dist/public

# Check server/vite.ts serveStatic
# Should resolve to: dist/public
```

### Issue 2: Build Succeeds but Files Missing in Container

**Cause:** Dockerfile not copying build output

**Fix:**
```dockerfile
# In Dockerfile, ensure this line exists:
COPY --from=build /app/dist ./dist

# Not just:
COPY --from=build /app/dist/public ./dist/public
```

### Issue 3: Permission Denied

**Cause:** Non-root user can't read files

**Fix:**
```dockerfile
# In Dockerfile, after COPY commands:
RUN chown -R nodejs:nodejs /app
USER nodejs
```

### Issue 4: Stale Build Cache

**Cause:** Docker using old build

**Fix:**
```bash
docker compose -f docker-compose.production.yml build --no-cache
```

---

## Verification Checklist

After deployment, verify these:

### ✅ Container Running
```bash
docker compose -f docker-compose.production.yml ps

# Should show:
# asset-app       running (healthy)
# asset-traefik   running
```

### ✅ Files Exist
```bash
docker compose -f docker-compose.production.yml exec app ls -la /app/dist/public/

# Should show index.html and assets/
```

### ✅ Server Responding
```bash
docker compose -f docker-compose.production.yml exec app curl -I http://localhost:5000

# Should return: HTTP/1.1 200 OK
```

### ✅ External Access
```bash
curl -I https://asset.digile.com

# Should return: HTTP/2 200
```

### ✅ Setup Screen Appears
Visit: https://asset.digile.com

**Should show:**
- First-time setup screen (if new database)
- OR login screen (if setup completed)

**Should NOT show:**
- 404 error
- Blank page
- Connection refused

---

## First-Time Setup

Once 404 is fixed, you'll see the setup screen:

1. **Create Admin Account**
   - Full Name: (your name)
   - Email: (your email)
   - Username: admin (or custom)
   - Password: (min 8 chars)

2. **Click "Create Admin Account"**

3. **You'll be logged in automatically**

4. **Setup complete!** ✅

---

## Troubleshooting Tools

### View All Logs
```bash
# Application logs
docker compose -f docker-compose.production.yml logs app -f

# Traefik logs
docker compose -f docker-compose.production.yml logs traefik -f

# All logs
docker compose -f docker-compose.production.yml logs -f
```

### Inspect Container
```bash
# Enter container shell
docker compose -f docker-compose.production.yml exec app sh

# Inside container:
pwd                  # Should be /app
ls -la              # Check files
ls -la dist/        # Check build output
cat dist/public/index.html  # Verify frontend
node dist/index.js  # Test backend (Ctrl+C to exit)
```

### Database Check
```bash
# If using external database, test connection
docker compose -f docker-compose.production.yml exec app sh -c 'node -e "require(\"./dist/index.js\")"'
```

---

## Expected Working State

When everything works correctly:

### File Structure (in container)
```
/app/
├── dist/
│   ├── index.js          (backend server)
│   └── public/           (frontend)
│       ├── index.html
│       └── assets/
│           ├── index-*.js
│           └── index-*.css
├── package.json
├── node_modules/
└── ...
```

### Container Logs
```
12:00:00 PM [express] serving on port 5000
```

### HTTP Responses
```bash
# Internal
curl http://localhost:5000
# Returns: HTML with <!DOCTYPE html>

# External
curl https://asset.digile.com
# Returns: HTML with <!DOCTYPE html>
```

### Browser
- ✅ Page loads
- ✅ Setup screen or login screen appears
- ✅ No console errors
- ✅ HTTPS certificate valid

---

## Get Help

If still stuck, collect this info:

```bash
echo "=== System Info ==="
uname -a
docker --version
docker compose version

echo ""
echo "=== Container Status ==="
docker compose -f docker-compose.production.yml ps

echo ""
echo "=== Build Log (last 50 lines) ==="
docker compose -f docker-compose.production.yml logs app --tail=50

echo ""
echo "=== File Structure ==="
docker compose -f docker-compose.production.yml exec app ls -laR /app/dist/

echo ""
echo "=== Internal HTTP Test ==="
docker compose -f docker-compose.production.yml exec app curl -I http://localhost:5000

echo ""
echo "=== Traefik Status ==="
docker compose -f docker-compose.production.yml logs traefik --tail=20
```

---

## Summary

**Quick Fix:**
1. Pull latest: `git pull origin main`
2. Clean: `docker compose -f docker-compose.production.yml down -v`
3. Rebuild: `docker compose -f docker-compose.production.yml build --no-cache`
4. Deploy: `docker compose -f docker-compose.production.yml up -d`
5. Verify: `curl https://asset.digile.com`

**Common Cause:**
- Build didn't create `dist/public/`
- Dockerfile didn't copy files
- Server serving from wrong path

**Solution:**
- Ensure `npm run build` creates `dist/public/index.html`
- Dockerfile copies `/app/dist` to `/app/dist`
- Server serves from `dist/public` (resolved via `import.meta.dirname`)

**First-Time Setup:**
- Once 404 is fixed, setup screen appears automatically
- Create admin account (setup routes exist in `server/auth.ts`)
- Login and start using the system

---

**Run the Quick Fix commands and the application should work!** 🚀
