# 🔧 Fix Database User Error

## 🚨 Problem Identified

```
FATAL: role "asset_user" does not exist
GET /api/setup/status 500
```

The database was initialized with credentials that don't match your `.env` file.

---

## ✅ **Complete Fix** (Run on your server)

### Step 1: Stop All Containers

```bash
cd ~/AssetTrackr
docker compose -f docker-compose.ssl.yml down -v
```

**Note:** `-v` removes volumes to reset the database completely

### Step 2: Check/Create .env File

```bash
# Check if .env exists
ls -la ~/AssetTrackr/.env

# If it doesn't exist or has issues, create it:
cat > ~/AssetTrackr/.env << 'EOF'
# Domain Configuration
DOMAIN=test.digile.com
LETSENCRYPT_EMAIL=admin@digile.com

# Database Configuration
PGUSER=asset_user
PGPASSWORD=SecurePassword123!
PGDATABASE=asset_management

# Application Configuration
SESSION_SECRET=your_secure_random_session_secret_min_32_characters_here

# Traefik Dashboard (optional)
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$kF5Z5z5Z5z5z5Z5z5z5z5OqGqGqGqGqGqGqGqGqGqGqGqGqGqG
EOF

# Verify .env file
cat ~/AssetTrackr/.env
```

### Step 3: Rebuild and Restart

```bash
cd ~/AssetTrackr

# Start fresh with correct credentials
docker compose -f docker-compose.ssl.yml up -d --build

# Wait 30 seconds for database to initialize
sleep 30

# Check logs
docker compose -f docker-compose.ssl.yml logs app --tail 50
```

### Step 4: Verify Database Connection

```bash
# Test database connection with correct user
docker compose -f docker-compose.ssl.yml exec db psql -U asset_user -d asset_management -c "SELECT 1;"

# Should return:
#  ?column? 
# ----------
#         1
```

### Step 5: Test API

```bash
# Test setup status endpoint
docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000/api/setup/status

# Should return:
# {"needsSetup":true}
```

### Step 6: Access the Application

Visit: **https://test.digile.com**

- Should redirect to `/setup` page
- Create your admin account
- Get logged in automatically

---

## 🎯 Alternative: Generate Secure Secrets

If you want to generate proper secure values:

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate database password
openssl rand -base64 24

# Generate Traefik password hash
htpasswd -nB admin
# (Enter password when prompted, then copy the output)
```

Then update your `.env` file with these values.

---

## 📊 Verify Everything Works

After restart, run:

```bash
cd ~/AssetTrackr

echo "=== 1. Container Status ==="
docker compose -f docker-compose.ssl.yml ps
echo ""

echo "=== 2. Database Test ==="
docker compose -f docker-compose.ssl.yml exec db psql -U asset_user -d asset_management -c "SELECT current_database(), current_user;"
echo ""

echo "=== 3. API Test ==="
docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000/api/setup/status
echo ""

echo "=== 4. App Logs ==="
docker compose -f docker-compose.ssl.yml logs app --tail 20
```

**Expected Output:**
- ✅ All containers "Up" and "healthy"
- ✅ Database returns current database and user
- ✅ API returns `{"needsSetup":true}` or `{"needsSetup":false}`
- ✅ App logs show "Server running on port 5000"

---

## 🚀 Quick Complete Reset

If you just want to start fresh:

```bash
cd ~/AssetTrackr

# Complete cleanup
docker compose -f docker-compose.ssl.yml down -v
docker system prune -f

# Create proper .env file
cat > .env << 'EOF'
DOMAIN=test.digile.com
LETSENCRYPT_EMAIL=admin@digile.com
PGUSER=asset_user
PGPASSWORD=SecurePassword123!
PGDATABASE=asset_management
SESSION_SECRET=$(openssl rand -base64 32)
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$kF5Z5z5Z5z5z5Z5z5z5z5OqGqGqGqGqGqGqGqGqGqGqGqGqGqG
EOF

# Start fresh
docker compose -f docker-compose.ssl.yml up -d --build

# Wait and check
sleep 40
docker compose -f docker-compose.ssl.yml logs app --tail 30
```

Then visit: **https://test.digile.com**

---

## ✅ Success Indicators

When everything works:

1. **Container Status:**
   ```
   asset-app       Up (healthy)
   asset-db        Up (healthy)
   asset-traefik   Up
   ```

2. **API Response:**
   ```bash
   $ curl https://test.digile.com/api/setup/status
   {"needsSetup":true}
   ```

3. **Browser:**
   - Redirects to `/setup` page
   - Can create admin account
   - Gets logged in after creation

---

**The key is ensuring `.env` has the correct database credentials that match what docker-compose.ssl.yml expects!**
