# 🔒 Fix SSL Certificate Issue

You're seeing "Your connection is not private" because the SSL certificate is invalid. Here's how to fix it.

## ⚠️ Current Problem

**Error:** `NET::ERR_CERT_AUTHORITY_INVALID`
- Traefik IS working (routing traffic correctly)
- SSL certificate generation FAILED or is using test/staging certificate

## 🔍 Step 1: Diagnose the Issue

SSH into your server and run:

```bash
# Check Traefik logs for certificate errors
docker-compose -f docker-compose.ssl.yml logs traefik | grep -i "certificate\|acme\|error" | tail -30

# Check if Let's Encrypt created certificates
ls -la letsencrypt/

# Check certificate details
cat letsencrypt/acme.json | jq '.' 2>/dev/null || cat letsencrypt/acme.json
```

---

## 🎯 Most Common Causes & Fixes

### **Issue 1: DNS Not Pointing to Server** ✅ MOST LIKELY

Let's Encrypt REQUIRES DNS to be properly configured BEFORE it can issue certificates.

**Check DNS:**
```bash
# Check main domain
dig test.digile.com +short
# Should show your SERVER IP (not Cloudflare or other proxy)

# Check www
dig www.test.digile.com +short
# Should show your SERVER IP
```

**If DNS is wrong:**
1. Go to your DNS provider (Cloudflare, GoDaddy, etc.)
2. Set A records:
   - `@` → Your server IP
   - `www` → Your server IP
   - `traefik` → Your server IP (for dashboard)
3. **Disable Cloudflare proxy** (set to DNS only, gray cloud)
4. Wait 5-10 minutes for DNS propagation
5. Run fix below

---

### **Issue 2: Using Staging/Test Certificate**

Check if staging certificate is enabled:

```bash
# Look for this line in docker-compose.ssl.yml
grep "acme-staging" docker-compose.ssl.yml
```

**If found (line 29 is uncommented):**
```bash
# Edit file
nano docker-compose.ssl.yml

# Comment out line 29 (add # at start):
# - "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"

# Save and restart
docker-compose -f docker-compose.ssl.yml restart traefik
```

---

### **Issue 3: Rate Limited by Let's Encrypt**

Let's Encrypt has rate limits (5 certificates per domain per week).

**Check if rate limited:**
```bash
docker-compose -f docker-compose.ssl.yml logs traefik | grep -i "rate limit"
```

**If rate limited:**
```bash
# Use staging server (unlimited) until DNS is fixed
nano docker-compose.ssl.yml

# Uncomment line 29:
- "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"

# Save and restart
docker-compose -f docker-compose.ssl.yml restart traefik

# NOTE: Staging certificates will show security warning (expected)
# Once DNS is confirmed working, switch back to production
```

---

### **Issue 4: Old/Invalid Certificate Cached**

**Clear old certificates and regenerate:**
```bash
# Stop containers
docker-compose -f docker-compose.ssl.yml down

# Backup old certificates (just in case)
cp -r letsencrypt letsencrypt.backup 2>/dev/null || echo "No existing certs"

# Delete old certificates
rm -rf letsencrypt/

# Create fresh directory with correct permissions
mkdir -p letsencrypt
chmod 600 letsencrypt

# Start containers (will regenerate certificates)
docker-compose -f docker-compose.ssl.yml up -d

# Watch certificate generation
docker-compose -f docker-compose.ssl.yml logs -f traefik
```

Look for these SUCCESS messages:
```
✅ "Certificates obtained for test.digile.com"
✅ "Creating certificate for test.digile.com"
```

---

## 🚀 Complete Fix Procedure

**Run this step-by-step:**

```bash
# 1. Verify DNS (CRITICAL!)
echo "=== Checking DNS ==="
dig test.digile.com +short
dig www.test.digile.com +short
echo "These should show your server IP"

# 2. Verify .env configuration
echo -e "\n=== Checking .env ==="
cat .env | grep -E "DOMAIN|LETSENCRYPT_EMAIL"

# 3. Stop containers
echo -e "\n=== Stopping containers ==="
docker-compose -f docker-compose.ssl.yml down

# 4. Remove old certificates
echo -e "\n=== Removing old certificates ==="
rm -rf letsencrypt/
mkdir -p letsencrypt
chmod 600 letsencrypt

# 5. Start containers with fresh certificates
echo -e "\n=== Starting containers ==="
docker-compose -f docker-compose.ssl.yml up -d

# 6. Watch certificate generation (Ctrl+C to exit)
echo -e "\n=== Watching Traefik logs (wait for 'Certificate obtained') ==="
docker-compose -f docker-compose.ssl.yml logs -f traefik
```

---

## ✅ How to Know It's Fixed

### **Success Indicators:**

**In Traefik logs:**
```
✅ "Certificates obtained for test.digile.com"
✅ "Creating certificate from LE account"
```

**In Browser:**
```
✅ No security warning
✅ Padlock icon in address bar
✅ Certificate shows: "Issued by: Let's Encrypt"
```

**Check Certificate:**
```bash
# Check certificate details
openssl s_client -connect test.digile.com:443 -servername test.digile.com < /dev/null 2>/dev/null | openssl x509 -text -noout | grep -i "issuer\|subject"
```

Should show:
```
Issuer: C = US, O = Let's Encrypt, CN = R3
Subject: CN = test.digile.com
```

---

## 🔄 If Still Not Working

### **Temporary HTTP Access (Testing Only)**

If you need immediate access while fixing SSL:

```bash
# Edit docker-compose.ssl.yml
nano docker-compose.ssl.yml

# Find lines 32-33 and COMMENT them out:
# - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
# - "--entrypoints.web.http.redirections.entrypoint.scheme=https"

# Restart
docker-compose -f docker-compose.ssl.yml restart traefik

# Access via HTTP (insecure, testing only)
# http://test.digile.com
```

**⚠️ Important:** This disables HTTPS redirect. Only for debugging!

---

## 📋 Checklist

Before certificates can work:
- [ ] DNS points to your server IP (verify with `dig`)
- [ ] If using Cloudflare: Proxy is DISABLED (gray cloud)
- [ ] `.env` has `DOMAIN=test.digile.com`
- [ ] `.env` has `LETSENCRYPT_EMAIL=your-email@digile.com`
- [ ] Ports 80 and 443 are open in firewall
- [ ] Old certificates removed (`rm -rf letsencrypt/`)
- [ ] Containers restarted (`docker-compose up -d`)
- [ ] Waited 2-3 minutes for certificate generation

---

## 🆘 Still Need Help?

**Get detailed diagnostics:**

```bash
# Full diagnostic report
echo "=== SYSTEM INFO ===" && \
date && \
echo -e "\n=== DNS CHECK ===" && \
dig test.digile.com +short && \
echo -e "\n=== CONTAINER STATUS ===" && \
docker-compose -f docker-compose.ssl.yml ps && \
echo -e "\n=== CERTIFICATES ===" && \
ls -la letsencrypt/ 2>/dev/null || echo "No certificates yet" && \
echo -e "\n=== TRAEFIK SSL LOGS ===" && \
docker-compose -f docker-compose.ssl.yml logs traefik | grep -i "certificate\|acme\|error" | tail -20 && \
echo -e "\n=== .ENV CONFIG ===" && \
cat .env | grep -v PASSWORD | grep -v SECRET
```

Share the output of this command for further help!

---

## 🔐 After SSL Works

Once you see the padlock icon:

1. **Test registration:** https://test.digile.com
2. **Access Traefik dashboard:** https://traefik.test.digile.com
3. **Set up automatic renewals:** Let's Encrypt auto-renews every 60 days (already configured)
4. **Backup certificates:** `cp -r letsencrypt/ /backup/` (optional)

---

## 💡 Quick Summary

**The fix is usually:**
1. Ensure DNS points to server (not Cloudflare proxy)
2. Delete old certs: `rm -rf letsencrypt/`
3. Restart: `docker-compose -f docker-compose.ssl.yml up -d`
4. Wait 2-3 minutes
5. Refresh browser

**Most common mistake:** DNS still points to Cloudflare proxy instead of direct server IP!
