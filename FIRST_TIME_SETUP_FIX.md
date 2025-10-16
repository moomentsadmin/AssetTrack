# 🔧 First-Time Setup & 404 Error Fix

## 🚨 Current Issue

You're seeing:
- ✅ Login page loads correctly
- ❌ Login fails with "404: 404 page not found"
- ❌ First-time setup page not showing

---

## 📋 Step 1: Check App Logs on Server

Run these commands **on your server** (root@assettest):

```bash
cd ~/AssetTrackr

# Check if app is running and serving on port 5000
docker compose -f docker-compose.ssl.yml logs app --tail 100

# Look for:
# ✅ "Server running on port 5000" or similar
# ✅ "Database connected"
# ❌ Any errors
```

---

## 🔍 Step 2: Test API Directly

```bash
# Test if the API is responding internally
docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000/api/setup/status

# Should return JSON like:
# {"needsSetup":true}  OR  {"needsSetup":false}

# If it returns 404 or error, the app isn't serving correctly
```

---

## 🎯 Step 3: Check First-Time Setup Status

The app has automatic first-time setup. To trigger it:

### Check Setup Status via Browser

1. Go to: **https://test.digile.com/api/setup/status**
   
   **If you see:**
   - `{"needsSetup":true}` → Setup is required
   - `{"needsSetup":false}` → Admin already exists
   - `404` → API not working

2. If `needsSetup: true`, the login page should automatically redirect to setup page

### Force Check Setup Status

```bash
# On server, check database directly
docker compose -f docker-compose.ssl.yml exec db psql -U asset_user -d asset_management -c "SELECT COUNT(*) FROM users;"

# If count is 0, setup is needed
# If count is > 0, admin already exists
```

---

## 🔧 Common Fixes

### Fix 1: App Not Binding to Correct Port

```bash
# Check app logs for port binding
docker compose -f docker-compose.ssl.yml logs app | grep -i "port\|listen\|server"

# Should see: "Server running on port 5000" or similar
```

### Fix 2: Environment Variables Missing

```bash
# Check if .env has all required variables
cat ~/AssetTrackr/.env

# Required variables:
# DATABASE_URL
# SESSION_SECRET
# DOMAIN
# LETSENCRYPT_EMAIL
```

### Fix 3: Database Not Connected

```bash
# Check database logs
docker compose -f docker-compose.ssl.yml logs db --tail 50

# Restart database if needed
docker compose -f docker-compose.ssl.yml restart db
sleep 10
docker compose -f docker-compose.ssl.yml restart app
```

### Fix 4: Complete Restart

```bash
cd ~/AssetTrackr

# Stop everything
docker compose -f docker-compose.ssl.yml down

# Start fresh
docker compose -f docker-compose.ssl.yml up -d

# Wait 30 seconds for database to be ready
sleep 30

# Check logs
docker compose -f docker-compose.ssl.yml logs app --tail 50
```

---

## 📊 Detailed Diagnostics

### Check Everything

```bash
cd ~/AssetTrackr

echo "=== 1. Container Status ==="
docker compose -f docker-compose.ssl.yml ps
echo ""

echo "=== 2. App Logs (Last 50 lines) ==="
docker compose -f docker-compose.ssl.yml logs app --tail 50
echo ""

echo "=== 3. Database Connection Test ==="
docker compose -f docker-compose.ssl.yml exec db psql -U asset_user -d asset_management -c "SELECT 1;"
echo ""

echo "=== 4. API Health Check ==="
docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000/api/setup/status 2>&1
echo ""

echo "=== 5. User Count ==="
docker compose -f docker-compose.ssl.yml exec db psql -U asset_user -d asset_management -c "SELECT COUNT(*) as user_count FROM users;"
```

---

## 🎯 Expected Behavior

### First-Time Setup Flow

1. **Fresh Database (No Users):**
   - Visit: https://test.digile.com
   - Should redirect to: https://test.digile.com/setup
   - Create admin account with custom credentials
   - Get logged in automatically

2. **Admin Already Exists:**
   - Visit: https://test.digile.com
   - Shows login page
   - Login with your admin credentials
   - Access dashboard

### API Endpoints

```bash
# Check setup status
curl https://test.digile.com/api/setup/status
# Returns: {"needsSetup":true} or {"needsSetup":false}

# Create admin (only if needsSetup is true)
curl -X POST https://test.digile.com/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@example.com",
    "username": "admin",
    "password": "YourSecurePassword123!"
  }'

# Login
curl -X POST https://test.digile.com/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!"
  }'
```

---

## 🚨 If Still Getting 404

### Check Traefik Routing

```bash
# View Traefik logs
docker compose -f docker-compose.ssl.yml logs traefik --tail 50

# Look for:
# - Router registration for "assettrackr"
# - Any routing errors
# - 404 responses
```

### Check Network Connectivity

```bash
# Can Traefik reach the app?
docker compose -f docker-compose.ssl.yml exec traefik wget -qO- http://app:5000/api/setup/status

# Can app reach itself?
docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000/api/setup/status
```

### Inspect Docker Labels

```bash
# Check if app container has correct Traefik labels
docker inspect asset-app | grep -A 20 "Labels"

# Should see:
# - traefik.enable=true
# - traefik.http.routers.assettrackr.rule=Host(`test.digile.com`)
# - traefik.http.services.assettrackr.loadbalancer.server.port=5000
```

---

## 🔄 Nuclear Option: Complete Reset

If nothing works, completely reset:

```bash
cd ~/AssetTrackr

# Stop and remove everything
docker compose -f docker-compose.ssl.yml down -v

# Remove images
docker rmi assettrackr-app postgres:15-alpine traefik:v3.0

# Remove SSL certificates
rm -rf letsencrypt/

# Clean Docker
docker system prune -af

# Rebuild from scratch
docker compose -f docker-compose.ssl.yml up -d --build

# Watch logs
docker compose -f docker-compose.ssl.yml logs -f
```

**Wait 2-3 minutes** for:
1. Database to initialize
2. App to run migrations
3. SSL certificates to generate

Then visit: **https://test.digile.com**

---

## 📞 Share These Outputs for Help

If still not working, share:

```bash
# 1. Container status
docker compose -f docker-compose.ssl.yml ps

# 2. App logs
docker compose -f docker-compose.ssl.yml logs app --tail 100

# 3. Setup status test
docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000/api/setup/status

# 4. Database user count
docker compose -f docker-compose.ssl.yml exec db psql -U asset_user -d asset_management -c "SELECT COUNT(*) FROM users;"
```

---

## ✅ Quick Test Commands

```bash
cd ~/AssetTrackr

# Test 1: Is app running?
docker compose -f docker-compose.ssl.yml exec app ps aux | grep node

# Test 2: Is app listening on port 5000?
docker compose -f docker-compose.ssl.yml exec app netstat -tlnp | grep 5000

# Test 3: Can we reach the API?
docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000/api/setup/status

# Test 4: What about from Traefik?
docker compose -f docker-compose.ssl.yml exec traefik wget -qO- http://app:5000/api/setup/status
```

---

**Most likely issue:** App isn't starting properly. Check the app logs first!
