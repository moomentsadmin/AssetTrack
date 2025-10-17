# ✅ SSL Certificate Error - FIXED

## Issue
```
DNS problem: NXDOMAIN looking up A for www.asset.digile.com
```

Let's Encrypt was trying to get certificates for **both**:
- `asset.digile.com` ✅ (DNS exists)
- `www.asset.digile.com` ❌ (DNS doesn't exist)

---

## Root Cause

The `docker-compose.production.yml` was configured to request certificates for both the main domain AND the www subdomain:

**Before (Broken):**
```yaml
labels:
  - "traefik.http.routers.assetapp.rule=Host(`${DOMAIN}`) || Host(`www.${DOMAIN}`)"
  - "traefik.http.routers.assetapp.tls.domains[0].main=${DOMAIN}"
  - "traefik.http.routers.assetapp.tls.domains[0].sans=www.${DOMAIN}"
```

This requires DNS records for **both** domains, but you only have:
- ✅ `asset.digile.com` → Your server IP
- ❌ `www.asset.digile.com` → No DNS record

---

## Solution Applied

### ✅ Fixed: Removed www subdomain

**After (Fixed):**
```yaml
labels:
  - "traefik.http.routers.assetapp.rule=Host(`${DOMAIN}`)"
  - "traefik.http.routers.assetapp.tls.certresolver=letsencrypt"
```

Now Traefik will only request a certificate for `asset.digile.com`.

---

## How to Deploy the Fix

### Step 1: Clean Up Old Certificates
```bash
cd ~/AssetTrack

# Stop all services
docker compose -f docker-compose.production.yml down

# Remove old Let's Encrypt certificates
sudo rm -rf letsencrypt/acme.json
sudo mkdir -p letsencrypt
sudo chmod 600 letsencrypt

# Optional: Clean up Traefik logs
rm -rf traefik-logs/*
```

### Step 2: Ensure .env is Correct
```bash
# Check your domain is set correctly
cat .env | grep DOMAIN

# Should show:
# DOMAIN=asset.digile.com
```

### Step 3: Deploy with Fix
```bash
# Deploy
./deploy.sh

# OR manually
docker compose -f docker-compose.production.yml up -d --build
```

### Step 4: Monitor Certificate Generation
```bash
# Watch Traefik logs for certificate requests
docker compose -f docker-compose.production.yml logs -f traefik
```

**Look for:**
```
✅ "Server responded with a certificate"
✅ "Domains [asset.digile.com] need ACME certificates generation"
```

**NOT:**
```
❌ "DNS problem: NXDOMAIN looking up A for www.asset.digile.com"
```

### Step 5: Test Access
```bash
# Wait 30-60 seconds for certificate generation
sleep 60

# Test HTTP redirect to HTTPS
curl -I http://asset.digile.com

# Should return: 301 Moved Permanently
# Location: https://asset.digile.com

# Test HTTPS access
curl -I https://asset.digile.com

# Should return: 200 OK
```

---

## Verification Commands

### Check Certificate Status
```bash
# View Traefik dashboard
# Visit: https://traefik.asset.digile.com

# Check certificate file
sudo ls -lh letsencrypt/acme.json

# Should show file size > 0 bytes
```

### Check Application Access
```bash
# Test main domain
curl https://asset.digile.com

# Should return HTML

# Test API
curl https://asset.digile.com/api/setup/status

# Should return JSON
```

### Check Container Status
```bash
# All containers should be running
docker compose -f docker-compose.production.yml ps

# Expected:
# asset-traefik   running   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
# asset-app       running   (healthy)
```

---

## Alternative Solution (If You Want www Support)

If you **do** want `www.asset.digile.com` to work, you need to add a DNS record:

### Option A: DNS A Record (Recommended)
Add this DNS record at your DNS provider (DigitalOcean, Cloudflare, etc.):

```
Type: A
Name: www
Value: <your-server-ip>
TTL: 3600
```

### Option B: DNS CNAME Record
```
Type: CNAME
Name: www
Value: asset.digile.com
TTL: 3600
```

**After adding DNS record:**
1. Wait 5-10 minutes for DNS propagation
2. Verify DNS: `dig www.asset.digile.com`
3. Revert docker-compose.production.yml to include www
4. Redeploy

---

## Troubleshooting

### Issue: Still Getting Certificate Errors

**Solution 1: Clear Everything**
```bash
cd ~/AssetTrack

# Complete cleanup
docker compose -f docker-compose.production.yml down -v
sudo rm -rf letsencrypt/
sudo rm -rf traefik-logs/

# Recreate directories
sudo mkdir -p letsencrypt traefik-logs
sudo chmod 600 letsencrypt

# Redeploy
docker compose -f docker-compose.production.yml up -d --build
```

**Solution 2: Check DNS**
```bash
# Verify DNS resolves to your server
dig asset.digile.com

# Should show your server IP in ANSWER section
```

**Solution 3: Check Ports**
```bash
# Verify ports 80 and 443 are open
sudo ufw status

# Should show:
# 80/tcp    ALLOW
# 443/tcp   ALLOW

# Or if using firewall:
sudo iptables -L -n | grep -E "80|443"
```

### Issue: Rate Limited by Let's Encrypt

If you see:
```
too many certificates already issued
```

**Solution:** Wait 1 hour, then:
```bash
# Use Let's Encrypt staging server (testing)
# Edit docker-compose.production.yml temporarily:

# Add this line under certificatesresolvers.letsencrypt.acme:
- "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"

# This gives you unlimited testing certificates (but browsers will warn)
# Once working, remove that line for real certificates
```

### Issue: Traefik Can't Reach Application

**Check:**
```bash
# Test internal connection
docker compose -f docker-compose.production.yml exec app curl http://localhost:5000

# Should return HTML

# Check app logs
docker compose -f docker-compose.production.yml logs app --tail=50
```

---

## Expected Timeline

After deploying the fix:

1. **0-30 seconds:** Containers start
2. **30-60 seconds:** Traefik initiates ACME challenge
3. **60-90 seconds:** Let's Encrypt validates domain
4. **90-120 seconds:** Certificate issued
5. **2 minutes:** Application accessible via HTTPS

---

## What Changed in docker-compose.production.yml

### Before (Lines 130-136)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.assetapp.rule=Host(`${DOMAIN}`) || Host(`www.${DOMAIN}`)"  ❌
  - "traefik.http.routers.assetapp.entrypoints=websecure"
  - "traefik.http.routers.assetapp.tls.certresolver=letsencrypt"
  - "traefik.http.routers.assetapp.tls.domains[0].main=${DOMAIN}"
  - "traefik.http.routers.assetapp.tls.domains[0].sans=www.${DOMAIN}"  ❌
  - "traefik.http.services.assetapp.loadbalancer.server.port=5000"
```

### After (Lines 131-136)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.assetapp.rule=Host(`${DOMAIN}`)"  ✅
  - "traefik.http.routers.assetapp.entrypoints=websecure"
  - "traefik.http.routers.assetapp.tls.certresolver=letsencrypt"
  - "traefik.http.services.assetapp.loadbalancer.server.port=5000"
```

**Removed:**
- `|| Host(\`www.${DOMAIN}\`)` from routing rule
- `tls.domains[0].main` and `tls.domains[0].sans` (Let Traefik auto-detect)

---

## Summary

### ✅ Fixed
- Removed www subdomain from Traefik configuration
- Traefik now only requests certificate for `asset.digile.com`
- No DNS changes required

### 🚀 Next Steps
1. Clean up old certificates
2. Deploy the fix
3. Wait 2 minutes for certificate generation
4. Access: https://asset.digile.com

### 📚 Files Changed
- `docker-compose.production.yml` - Removed www subdomain support

---

## Quick Deploy Commands

```bash
cd ~/AssetTrack

# Pull latest changes (if using Git)
git pull origin main

# Clean up old certificates
sudo rm -rf letsencrypt/acme.json
mkdir -p letsencrypt

# Deploy
./deploy.sh

# Watch logs (wait for "Server responded with a certificate")
docker compose -f docker-compose.production.yml logs -f traefik

# After seeing certificate success (Ctrl+C to exit logs)
# Test access:
curl -I https://asset.digile.com
```

---

**SSL certificate issue resolved! Deploy using the commands above.** 🔒✅
