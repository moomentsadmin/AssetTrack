# 🔧 404 Error Troubleshooting Guide

## Issue
Deployment succeeded, Docker build completed with `npm ci --production=false`, but application returns **404 Page Not Found** at test.digile.com.

---

## Quick Diagnosis Commands

Run these on your production server:

### 1. Check Container Status
```bash
cd ~/AssetTrack
docker compose -f docker-compose.production.yml ps
```

**Expected output:**
- Container should show "Up" status
- Port 5000 should be mapped

---

### 2. Check Application Logs
```bash
docker compose -f docker-compose.production.yml logs app --tail=50
```

**Look for:**
- ✅ "serving on port 5000" message
- ❌ Any error messages
- ❌ Build errors or missing files

---

### 3. Check if Build Files Exist
```bash
docker compose -f docker-compose.production.yml exec app ls -la dist/public
```

**Expected output:**
- Should show index.html, assets/, etc.
- If empty or missing → build failed

---

### 4. Test Internal Connection
```bash
docker compose -f docker-compose.production.yml exec app curl http://localhost:5000
```

**Expected:**
- Should return HTML content
- If 404 here → app routing issue

---

## Common Causes & Fixes

### ❌ Cause 1: Build Files Not Created
**Symptoms:** dist/public folder is empty or missing

**Fix:**
```bash
# Rebuild with verbose logging
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml build --no-cache app
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml logs app -f
```

---

### ❌ Cause 2: Wrong Working Directory
**Symptoms:** Server runs but can't find files

**Check Dockerfile:**
```dockerfile
# Ensure these lines exist in correct order:
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build
```

---

### ❌ Cause 3: Vite Build Output Not Configured
**Symptoms:** Build succeeds but dist folder in wrong location

**Check vite.config.ts:**
```typescript
export default defineConfig({
  build: {
    outDir: 'dist/public',  // ← Must match server expectations
    emptyOutDir: true
  }
})
```

---

### ❌ Cause 4: Express Static Path Wrong
**Symptoms:** Server runs but doesn't serve static files

**Check server/index.ts or server/vite.ts:**
```typescript
// Production mode should serve from dist/public
app.use(express.static(path.join(__dirname, '../dist/public')))
```

---

### ❌ Cause 5: Traefik Routing Issue
**Symptoms:** Traefik shows healthy but app returns 404

**Fix:**
```bash
# Check Traefik logs
docker compose -f docker-compose.production.yml logs traefik --tail=50

# Restart Traefik
docker compose -f docker-compose.production.yml restart traefik
```

---

## Complete Diagnostic Script

Save and run this on your server:

```bash
#!/bin/bash
# diagnose-404.sh

echo "=== Asset Management 404 Diagnostics ==="
echo ""

echo "1. Container Status:"
docker compose -f docker-compose.production.yml ps
echo ""

echo "2. Application Logs (last 30 lines):"
docker compose -f docker-compose.production.yml logs app --tail=30
echo ""

echo "3. Build Output Check:"
docker compose -f docker-compose.production.yml exec app ls -la dist/public || echo "dist/public not found!"
echo ""

echo "4. Internal Health Check:"
docker compose -f docker-compose.production.yml exec app curl -s http://localhost:5000 | head -c 200
echo ""

echo "5. Traefik Status:"
docker compose -f docker-compose.production.yml logs traefik --tail=20
echo ""

echo "=== Diagnostics Complete ==="
```

**Run it:**
```bash
chmod +x diagnose-404.sh
./diagnose-404.sh
```

---

## Step-by-Step Fix

### Step 1: Verify Build Process
```bash
cd ~/AssetTrack

# Check if build script exists
docker compose -f docker-compose.production.yml exec app cat package.json | grep '"build"'

# Should show: "build": "vite build"
```

### Step 2: Manual Build Test
```bash
# Enter container
docker compose -f docker-compose.production.yml exec app bash

# Inside container:
pwd                          # Should be /app
ls -la                       # Check files exist
npm run build                # Try building manually
ls -la dist/public          # Check build output
exit
```

### Step 3: Check Environment Variables
```bash
docker compose -f docker-compose.production.yml exec app env | grep NODE_ENV

# Should show: NODE_ENV=production
```

### Step 4: Restart Everything
```bash
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml logs app -f
```

---

## If Still 404 After Above Steps

### Nuclear Option: Complete Rebuild
```bash
cd ~/AssetTrack

# Pull latest code
git pull origin main

# Remove everything
docker compose -f docker-compose.production.yml down -v
docker system prune -a -f

# Rebuild from scratch
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

# Watch logs
docker compose -f docker-compose.production.yml logs -f
```

---

## Check These Files

### 1. Dockerfile
```bash
cat Dockerfile
```

**Should contain:**
```dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production=false

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Start server
CMD ["npm", "start"]
```

### 2. package.json start script
```bash
cat package.json | grep -A2 '"scripts"'
```

**Should show:**
```json
"start": "NODE_ENV=production node dist/index.js"
```

### 3. Server configuration
```bash
cat server/index.ts | grep -A5 "static"
```

**Should serve static files from dist/public**

---

## Expected Working State

When everything works:

1. **Build Output:**
   ```
   dist/
   ├── index.js          (backend)
   └── public/           (frontend)
       ├── index.html
       ├── assets/
       └── ...
   ```

2. **Container Logs:**
   ```
   [express] serving on port 5000
   ```

3. **Test Commands:**
   ```bash
   # Internal test (inside container)
   curl http://localhost:5000
   # Should return HTML

   # External test
   curl https://test.digile.com
   # Should return HTML
   ```

---

## Get Help

If still stuck, share these outputs:

```bash
# Run this and share the output
echo "=== Configuration ==="
cat .env | grep -v "PASSWORD\|SECRET\|KEY"
echo ""

echo "=== Docker Status ==="
docker compose -f docker-compose.production.yml ps
echo ""

echo "=== App Logs ==="
docker compose -f docker-compose.production.yml logs app --tail=50
echo ""

echo "=== Build Check ==="
docker compose -f docker-compose.production.yml exec app ls -laR dist/
```

---

## Quick Fix Commands

Copy and run these in sequence:

```bash
cd ~/AssetTrack
docker compose -f docker-compose.production.yml logs app --tail=50
docker compose -f docker-compose.production.yml exec app ls -la dist/public
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml logs app -f
```

Press Ctrl+C when you see "serving on port 5000", then test: https://test.digile.com

---

**Start with the Quick Diagnosis Commands at the top!** 🚀
