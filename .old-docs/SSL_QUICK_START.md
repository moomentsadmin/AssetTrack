# 🔒 SSL Quick Start - Deploy on Port 443

Get your Asset Management System running with HTTPS in under 5 minutes!

---

## ⚡ Super Quick Start

```bash
# 1. Run automated setup
./setup-ssl.sh

# 2. Access your app
# https://yourdomain.com
```

**That's it!** The script handles everything automatically.

---

## 📋 What You Need (Before Starting)

1. **Domain Name** (e.g., `assetmanager.com`)
2. **DNS Configured** - Point A record to your server IP
3. **Server Access** - SSH access to your server
4. **Firewall Open** - Ports 80 and 443

---

## 🚀 Manual 5-Minute Setup

### Step 1: Configure DNS (2 min)

Add these DNS records at your domain registrar:

| Type | Name    | Value               |
|------|---------|---------------------|
| A    | @       | `your.server.ip`    |
| A    | www     | `your.server.ip`    |
| A    | traefik | `your.server.ip`    |

**Verify:**
```bash
dig yourdomain.com +short
# Should show your server IP
```

### Step 2: Configure Environment (1 min)

```bash
# Copy template
cp .env.ssl.example .env

# Edit with your values
nano .env
```

**Required Changes:**
```bash
DOMAIN=yourdomain.com                          # YOUR domain
LETSENCRYPT_EMAIL=admin@yourdomain.com         # YOUR email
PGPASSWORD=SecurePassword123!                  # Strong password
SESSION_SECRET=$(openssl rand -base64 32)      # Generate this
```

### Step 3: Deploy (2 min)

```bash
# Create directories and set permissions
mkdir -p letsencrypt traefik-logs logs
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json

# Deploy with SSL
docker-compose -f docker-compose.ssl.yml up -d --build

# Watch logs
docker-compose -f docker-compose.ssl.yml logs -f
```

**Done!** Access: `https://yourdomain.com`

---

## 🔐 SSL Certificate Info

**What Happens Automatically:**
1. ✅ Traefik requests SSL certificate from Let's Encrypt
2. ✅ Certificate validated via HTTP challenge (port 80)
3. ✅ Certificate installed automatically
4. ✅ HTTP traffic redirects to HTTPS
5. ✅ Auto-renewal every 60 days

**First Run:** Certificates may take 1-2 minutes to generate.

---

## 🌐 Access Points

| Service          | URL                              | Auth Required |
|------------------|----------------------------------|---------------|
| Main App         | `https://yourdomain.com`         | Yes (login)   |
| WWW              | `https://www.yourdomain.com`     | Yes (login)   |
| Traefik Dashboard| `https://traefik.yourdomain.com` | Yes (basic)   |

---

## 🆘 Troubleshooting

### "Certificate not generating"

**Check DNS:**
```bash
dig yourdomain.com +short
```
Must show your server IP!

**Check Firewall:**
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**Check Logs:**
```bash
docker-compose -f docker-compose.ssl.yml logs traefik | grep -i error
```

### "Domain shows 'Not Secure'"

**Wait 2 minutes** - Certificates generate on first run

**Check Progress:**
```bash
docker-compose -f docker-compose.ssl.yml logs -f traefik
# Look for "certificate obtained"
```

### "Can't access app"

**Verify services running:**
```bash
docker-compose -f docker-compose.ssl.yml ps
# All should show "Up"
```

**Check .env file:**
```bash
cat .env | grep DOMAIN
# Should NOT be "yourdomain.com" (must be your real domain)
```

---

## 🔄 Common Commands

```bash
# View all logs
docker-compose -f docker-compose.ssl.yml logs -f

# Restart services
docker-compose -f docker-compose.ssl.yml restart

# Stop services
docker-compose -f docker-compose.ssl.yml down

# Rebuild and start
docker-compose -f docker-compose.ssl.yml up -d --build

# Check service status
docker-compose -f docker-compose.ssl.yml ps
```

---

## 🧪 Test Before Production

Use **staging certificates** to avoid rate limits:

1. Edit `docker-compose.ssl.yml`, uncomment:
```yaml
- "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
```

2. Deploy:
```bash
docker-compose -f docker-compose.ssl.yml down
rm -rf letsencrypt/*
docker-compose -f docker-compose.ssl.yml up -d
```

3. Test (will show "untrusted" cert - that's expected)

4. Switch to production (remove staging line, redeploy)

---

## 🎯 Architecture

```
Browser (443) → Traefik (SSL) → App (5000) → PostgreSQL
                    ↓
              Let's Encrypt
           (Auto SSL Certs)
```

**Key Features:**
- Automatic SSL certificate generation
- Auto-renewal (every 60 days)
- HTTP → HTTPS redirect
- Security headers (HSTS, XSS protection)
- A+ SSL rating

---

## 📚 Full Documentation

For detailed info, see:
- **`SSL_DEPLOYMENT.md`** - Complete deployment guide
- **`setup-ssl.sh`** - Automated setup script
- **`.env.ssl.example`** - Configuration template
- **`docker-compose.ssl.yml`** - Docker stack with Traefik

---

## ✅ Production Checklist

- [ ] Domain DNS configured
- [ ] Ports 80 and 443 open
- [ ] `.env` file has real values (not defaults)
- [ ] SESSION_SECRET generated
- [ ] Tested with staging certificates
- [ ] Production certificates working
- [ ] HTTPS loads without warnings
- [ ] Application functional

---

## 🔒 Security Headers Included

Your app automatically gets:
- ✅ **HSTS** - Force HTTPS for 2 years
- ✅ **XSS Protection** - Block cross-site scripting
- ✅ **Frame Deny** - Prevent clickjacking
- ✅ **Content Security** - No MIME sniffing
- ✅ **TLS 1.2+** - Modern encryption only

**Test Security:**
```bash
curl -I https://yourdomain.com | grep -i security
```

---

**Your app is now secure with Let's Encrypt SSL on port 443!** 🎉

Need help? Check `SSL_DEPLOYMENT.md` for troubleshooting.
