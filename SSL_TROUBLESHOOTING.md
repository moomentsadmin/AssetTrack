# 🔍 SSL Deployment Troubleshooting - 404 Error & Certificate Issues

## 🚨 Your Current Issues

Based on your screenshots:
1. ❌ **404 Page Not Found** - Traefik can't find the application
2. ❌ **TRAEFIK DEFAULT CERT** - Let's Encrypt hasn't issued certificates

---

## ✅ Step-by-Step Troubleshooting

Run these commands **on your server** (root@assettest):

### Step 1: Check Container Status

```bash
cd ~/AssetTrackr
docker compose -f docker-compose.ssl.yml ps
```

**Expected Output:**
```
NAME            STATUS      PORTS
asset-traefik   running     0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
asset-db        running     5432/tcp
asset-app       running     (no exposed ports)
```

**If any container is not running:**
```bash
# Restart that specific service
docker compose -f docker-compose.ssl.yml restart <service-name>
```

---

### Step 2: Check Application Logs

```bash
# Check if the app started successfully
docker compose -f docker-compose.ssl.yml logs app --tail 100
```

**Look for:**
- ✅ `Server running on port 5000` or similar
- ❌ Any errors about database connection
- ❌ Any errors about missing environment variables

**Common Issues:**
- App not binding to 0.0.0.0:5000
- Database connection errors
- Missing SESSION_SECRET

---

### Step 3: Check Traefik Logs

```bash
# Check Traefik routing logs
docker compose -f docker-compose.ssl.yml logs traefik --tail 100
```

**Look for:**
- ❌ `no provider found for router` - App not registered
- ❌ Let's Encrypt errors
- ❌ Certificate validation errors

---

### Step 4: Verify .env Configuration

```bash
# Check DOMAIN is set correctly
cat ~/AssetTrackr/.env | grep DOMAIN
```

**Should show:**
```
DOMAIN=test.digile.com
```

**If missing or wrong:**
```bash
# Edit .env file
nano ~/AssetTrackr/.env

# Make sure this line exists:
DOMAIN=test.digile.com
```

---

### Step 5: Check DNS Resolution

```bash
# Check if domain resolves to your server
dig +short test.digile.com

# Should show your server's IP address
```

**If it doesn't resolve or shows wrong IP:**
- Update your DNS A record to point to your server IP
- Wait 5-10 minutes for DNS propagation
- Try again

---

### Step 6: Test App Directly

```bash
# Check if app is responding internally
docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000 || echo "App not responding"
```

**If app not responding:**
```bash
# Restart app container
docker compose -f docker-compose.ssl.yml restart app

# Wait 30 seconds
sleep 30

# Try again
docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000
```

---

### Step 7: Check Firewall

```bash
# Check if ports 80 and 443 are open
sudo ufw status

# If ports not open:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

### Step 8: Inspect Traefik Dashboard

```bash
# Get your Traefik dashboard password from logs
docker compose -f docker-compose.ssl.yml logs traefik | grep "Using basic auth"
```

**Access Dashboard:**
1. Go to: https://traefik.test.digile.com
2. Login with credentials from .env (TRAEFIK_DASHBOARD_AUTH)
3. Check "HTTP Routers" section - should see routes for test.digile.com

---

## 🔧 Common Fixes

### Fix 1: App Container Not Starting

```bash
# Check detailed app logs
docker compose -f docker-compose.ssl.yml logs app

# If database connection errors:
docker compose -f docker-compose.ssl.yml restart db
sleep 10
docker compose -f docker-compose.ssl.yml restart app
```

### Fix 2: Wrong Port Binding

Check if app is binding to correct port:

```bash
# Check app logs for port
docker compose -f docker-compose.ssl.yml logs app | grep -i "port\|listen"
```

Should show: `Server running on port 5000` or similar

### Fix 3: Traefik Can't Find App

```bash
# Recreate everything
docker compose -f docker-compose.ssl.yml down
docker compose -f docker-compose.ssl.yml up -d

# Wait 2 minutes for Let's Encrypt
sleep 120

# Check logs
docker compose -f docker-compose.ssl.yml logs -f
```

### Fix 4: Let's Encrypt Rate Limit

If you've tried too many times, Let's Encrypt may have rate-limited you:

```bash
# Use staging server temporarily
# Edit docker-compose.ssl.yml
nano docker-compose.ssl.yml

# Find this line:
#       - "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"

# Uncomment it (remove the #)

# Restart
docker compose -f docker-compose.ssl.yml down
rm -rf letsencrypt/
docker compose -f docker-compose.ssl.yml up -d
```

---

## 📋 Complete Reset & Redeploy

If nothing works, do a complete reset:

```bash
cd ~/AssetTrackr

# Stop everything
docker compose -f docker-compose.ssl.yml down -v

# Remove containers and images
docker rm -f asset-traefik asset-db asset-app 2>/dev/null || true

# Remove SSL certificates (they'll regenerate)
rm -rf letsencrypt/

# Clean Docker
docker system prune -f

# Rebuild and start
docker compose -f docker-compose.ssl.yml up -d --build

# Watch logs (wait 2 minutes for certificates)
docker compose -f docker-compose.ssl.yml logs -f
```

**Look for in logs:**
- ✅ `Certificates obtained for test.digile.com`
- ✅ `Server running on port 5000`
- ✅ Database connected

---

## 🎯 Quick Diagnostic Script

Save this as `diagnose.sh` and run it:

```bash
#!/bin/bash

echo "=== Container Status ==="
docker compose -f docker-compose.ssl.yml ps
echo ""

echo "=== App Health ==="
docker compose -f docker-compose.ssl.yml exec -T app wget -qO- http://localhost:5000 2>&1 | head -5
echo ""

echo "=== DOMAIN Variable ==="
cat .env | grep "^DOMAIN="
echo ""

echo "=== DNS Resolution ==="
dig +short test.digile.com
echo ""

echo "=== Firewall Status ==="
sudo ufw status | grep -E "80|443"
echo ""

echo "=== Recent App Logs ==="
docker compose -f docker-compose.ssl.yml logs app --tail 10
echo ""

echo "=== Recent Traefik Logs ==="
docker compose -f docker-compose.ssl.yml logs traefik --tail 10
```

Run it:
```bash
chmod +x diagnose.sh
./diagnose.sh
```

---

## 📞 What to Check Next

Based on the diagnostic output, the issue is likely:

1. **App not starting** → Check app logs for errors
2. **App not on port 5000** → Check PORT environment variable
3. **DNS not resolving** → Update DNS A record
4. **Firewall blocking** → Open ports 80 and 443
5. **Traefik misconfigured** → Check docker-compose.ssl.yml labels

---

## ✅ Expected Working State

When everything works:

```bash
# All containers running
$ docker compose -f docker-compose.ssl.yml ps
NAME            STATUS      PORTS
asset-traefik   running     0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
asset-db        running     5432/tcp
asset-app       running     

# App responds internally
$ docker compose -f docker-compose.ssl.yml exec app wget -qO- http://localhost:5000
<!DOCTYPE html>...

# SSL certificate is valid
$ curl -I https://test.digile.com
HTTP/2 200
...

# No 404 errors in Traefik logs
$ docker compose -f docker-compose.ssl.yml logs traefik --tail 50
# Should show successful routing
```

---

## 🆘 Still Not Working?

Share the output of:

```bash
# Run diagnostics
./diagnose.sh > diagnostic_output.txt 2>&1

# View output
cat diagnostic_output.txt
```

This will help identify the exact issue!

---

**🔍 Most Likely Issues:**
1. App container not starting properly
2. App not binding to 0.0.0.0:5000
3. DNS not pointing to your server
4. Firewall blocking ports 80/443
