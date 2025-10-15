# 🔐 SSL Configuration with .env File

## How Domain Configuration Works for Let's Encrypt SSL

The Asset Management System uses environment variables from the `.env` file for **automatic SSL certificate generation** with Let's Encrypt.

---

## ✅ Required Environment Variables

### .env File Configuration

```env
# ===================================
# DOMAIN CONFIGURATION (REQUIRED!)
# ===================================
# IMPORTANT: These values are fetched by Traefik for SSL certificate generation
#
# Your domain name (without https://)
DOMAIN=yourdomain.com

# Let's Encrypt email for certificate notifications
LETSENCRYPT_EMAIL=admin@yourdomain.com
```

---

## 🔄 How It Works

### Step 1: Traefik Reads .env File

When you start the containers:
```bash
docker-compose -f docker-compose.ssl.yml up -d
```

Traefik **automatically fetches** these variables from `.env`:
- `${DOMAIN}` - Your domain name
- `${LETSENCRYPT_EMAIL}` - Your email for notifications

### Step 2: SSL Certificate Generation

Traefik uses these values to:

1. **Configure Let's Encrypt ACME client:**
   ```yaml
   certificatesresolvers.letsencrypt.acme.email=${LETSENCRYPT_EMAIL}
   ```

2. **Set up routing with SSL:**
   ```yaml
   # Main application (generates certificate for ${DOMAIN})
   traefik.http.routers.asset-app.rule=Host(`${DOMAIN}`) || Host(`www.${DOMAIN}`)
   traefik.http.routers.asset-app.tls.certresolver=letsencrypt
   
   # Dashboard (generates certificate for traefik.${DOMAIN})
   traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)
   traefik.http.routers.dashboard.tls.certresolver=letsencrypt
   ```

3. **Request certificates from Let's Encrypt:**
   - Validates domain ownership via TLS challenge
   - Generates certificates
   - Stores in `./letsencrypt/acme.json`

### Step 3: Automatic Renewal

Traefik automatically renews certificates every 60 days using:
- `${LETSENCRYPT_EMAIL}` for account verification
- `${DOMAIN}` for certificate renewal requests

---

## 📋 Example Configuration

### If DOMAIN=example.com

**SSL Certificates Generated For:**
- ✅ `example.com` - Main application
- ✅ `www.example.com` - WWW subdomain
- ✅ `traefik.example.com` - Traefik dashboard

**Access URLs:**
- Main app: `https://example.com`
- Dashboard: `https://traefik.example.com`

---

## 🔍 Verification

### Check DOMAIN is Set

```bash
# Verify DOMAIN variable
cat .env | grep DOMAIN
# Output: DOMAIN=example.com

# Verify LETSENCRYPT_EMAIL variable
cat .env | grep LETSENCRYPT_EMAIL
# Output: LETSENCRYPT_EMAIL=admin@example.com
```

### Check Traefik Uses DOMAIN

```bash
# Inspect container labels
docker inspect asset-app | grep -i "traefik.http.routers"

# Output should show:
# "traefik.http.routers.asset-app.rule": "Host(`example.com`) || Host(`www.example.com`)"
```

### Watch Certificate Generation

```bash
docker-compose -f docker-compose.ssl.yml logs -f traefik

# Wait for these messages:
# ✅ "Certificates obtained for example.com"
# ✅ "Certificates obtained for www.example.com"
# ✅ "Certificates obtained for traefik.example.com"
```

---

## ⚠️ Common Issues

### Issue 1: DOMAIN Variable Not Set

**Problem:** SSL certificates not generated, 404 errors

**Cause:** Missing or empty `DOMAIN` in `.env` file

**Solution:**
```bash
# Add DOMAIN to .env
echo "DOMAIN=yourdomain.com" >> .env
echo "LETSENCRYPT_EMAIL=admin@yourdomain.com" >> .env

# Restart containers
docker-compose -f docker-compose.ssl.yml down
docker-compose -f docker-compose.ssl.yml up -d
```

### Issue 2: DNS Not Configured

**Problem:** Certificate generation fails with validation error

**Cause:** DNS doesn't point to server

**Solution:**
```bash
# Check DNS
dig yourdomain.com +short
# Should show your server IP

# If wrong, update DNS A records at your domain registrar
```

### Issue 3: Old Certificates

**Problem:** "Your connection is not private" error

**Cause:** Old/invalid certificates cached

**Solution:**
```bash
# Remove old certificates
docker-compose -f docker-compose.ssl.yml down
rm -rf letsencrypt/
docker-compose -f docker-compose.ssl.yml up -d
```

---

## 📝 Best Practices

### 1. Always Set DOMAIN Before Starting

```bash
# Create .env from template
cp .env.ssl.example .env

# Edit .env and set DOMAIN
nano .env

# Then start containers
docker-compose -f docker-compose.ssl.yml up -d
```

### 2. Use Real Email for LETSENCRYPT_EMAIL

```env
# Good - Real email for notifications
LETSENCRYPT_EMAIL=admin@yourdomain.com

# Bad - Fake email won't receive expiry warnings
LETSENCRYPT_EMAIL=fake@example.com
```

### 3. Configure DNS First

```bash
# BEFORE starting containers:
# 1. Point DNS to server
# 2. Wait for propagation (5-10 minutes)
# 3. Verify DNS: dig yourdomain.com +short
# 4. Then start containers
```

### 4. Disable Cloudflare Proxy

If using Cloudflare:
- Set DNS records to "DNS only" (gray cloud)
- NOT "Proxied" (orange cloud)
- Let's Encrypt needs direct server access

---

## 🎯 Summary

**Environment Variables Used:**
- `DOMAIN` - Fetched from `.env` for SSL certificate domain
- `LETSENCRYPT_EMAIL` - Fetched from `.env` for Let's Encrypt account

**Where They're Used:**
- `docker-compose.ssl.yml` - Traefik configuration
- Let's Encrypt - Certificate generation and renewal
- Routing rules - HTTPS traffic routing

**What Gets Generated:**
- SSL certificates for `${DOMAIN}`
- SSL certificates for `www.${DOMAIN}`
- SSL certificates for `traefik.${DOMAIN}`

**Auto-Renewal:**
- Happens every 60 days
- Uses `${LETSENCRYPT_EMAIL}` for verification
- No manual intervention needed

---

## 📚 Related Documentation

- **Main Deployment Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **Environment Template:** [.env.ssl.example](.env.ssl.example)
- **Docker Compose:** [docker-compose.ssl.yml](docker-compose.ssl.yml)

---

**🔒 Your DOMAIN variable is critical for SSL. Always ensure it's properly set in .env before deployment!**
