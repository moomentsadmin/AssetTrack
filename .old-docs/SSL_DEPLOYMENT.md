# 🔒 SSL/TLS Deployment with Let's Encrypt

Complete guide to deploying Asset Management System with automatic SSL certificates on port 443.

---

## 🚀 Quick Start (Automated)

```bash
# 1. Run the automated setup script
chmod +x setup-ssl.sh
./setup-ssl.sh

# 2. Follow the prompts to configure:
#    - Domain name
#    - Let's Encrypt email
#    - Database passwords
#    - Traefik dashboard auth

# 3. Application will be available at:
#    https://yourdomain.com
```

---

## 📋 Manual Setup (Step by Step)

### Prerequisites

1. **Domain Name**: You need a registered domain (e.g., `yourdomain.com`)
2. **DNS Configured**: Point your domain to your server's IP address
3. **Firewall Open**: Ports 80 and 443 must be accessible
4. **Docker Installed**: Docker and Docker Compose

### Step 1: DNS Configuration

Configure these DNS A records:

| Type | Name    | Value          | Purpose                |
|------|---------|----------------|------------------------|
| A    | @       | YOUR_SERVER_IP | Main application       |
| A    | www     | YOUR_SERVER_IP | WWW subdomain          |
| A    | traefik | YOUR_SERVER_IP | Traefik dashboard      |

**Verify DNS:**
```bash
dig yourdomain.com +short
# Should show your server IP
```

### Step 2: Open Firewall Ports

**UFW (Ubuntu/Debian):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

**firewalld (CentOS/RHEL):**
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

**AWS/Cloud Providers:**
- Add inbound rules for ports 80 and 443 in Security Group

### Step 3: Configure Environment

```bash
# Create .env from template
cp .env.ssl.example .env

# Edit configuration
nano .env
```

**Required Values:**
```bash
# Your domain (REQUIRED!)
DOMAIN=yourdomain.com

# Let's Encrypt email for expiry notifications
LETSENCRYPT_EMAIL=admin@yourdomain.com

# Database credentials
PGUSER=asset_user
PGPASSWORD=your_secure_password_here
PGDATABASE=asset_management

# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your_generated_secret_here
```

**Generate Session Secret:**
```bash
openssl rand -base64 32
```

### Step 4: Dashboard Authentication (Optional)

Secure Traefik dashboard with password:

```bash
# Install htpasswd
sudo apt install apache2-utils

# Generate password
htpasswd -nB admin
# Output: admin:$2y$05$xyz...

# Copy to .env (escape $ with $$)
# Example:
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$xyz...
```

### Step 5: Create Required Directories

```bash
mkdir -p letsencrypt traefik-logs logs
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json
```

### Step 6: Deploy with SSL

```bash
# Build and start with SSL configuration
docker-compose -f docker-compose.ssl.yml up -d --build

# Watch logs
docker-compose -f docker-compose.ssl.yml logs -f

# Check services
docker-compose -f docker-compose.ssl.yml ps
```

### Step 7: Verify SSL Certificates

```bash
# Check Traefik logs for certificate generation
docker-compose -f docker-compose.ssl.yml logs traefik | grep -i "certificate"

# Test HTTPS
curl -I https://yourdomain.com

# Check certificate details
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null
```

---

## 🌐 Access Your Application

### Main Application
- **HTTPS**: `https://yourdomain.com`
- **HTTP**: Automatically redirects to HTTPS

### Traefik Dashboard (if enabled)
- **URL**: `https://traefik.yourdomain.com`
- **Username**: As configured in `.env`
- **Password**: As configured in `.env`

---

## 🔧 Configuration Details

### Architecture

```
Internet (Port 443)
         ↓
    Traefik (SSL Termination)
         ↓
    Asset App (Port 5000 internal)
         ↓
    PostgreSQL (Port 5432 internal)
```

### SSL Certificate Flow

1. **HTTP Challenge**: Traefik listens on port 80 for Let's Encrypt validation
2. **Certificate Generation**: Let's Encrypt validates domain ownership
3. **Storage**: Certificates stored in `./letsencrypt/acme.json`
4. **Auto-Renewal**: Traefik renews certificates automatically (60 days before expiry)
5. **HTTPS**: Traefik serves traffic on port 443 with valid SSL

### Security Features

**Automatically Enabled:**
- ✅ HTTP to HTTPS redirect
- ✅ HSTS (Strict Transport Security)
- ✅ Content Security headers
- ✅ XSS Protection
- ✅ Frame deny (clickjacking protection)
- ✅ TLS 1.2+ only

**Test SSL Security:**
```bash
# SSL Labs test (online)
https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Or use testssl.sh
git clone https://github.com/drwetter/testssl.sh
cd testssl.sh
./testssl.sh yourdomain.com
```

---

## 🧪 Testing SSL Setup

### Test Certificate Generation (Staging)

To avoid Let's Encrypt rate limits during testing:

1. Edit `docker-compose.ssl.yml` and uncomment:
```yaml
- "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
```

2. Deploy:
```bash
docker-compose -f docker-compose.ssl.yml down
rm -rf letsencrypt/*
docker-compose -f docker-compose.ssl.yml up -d
```

3. Verify staging cert:
```bash
curl -I https://yourdomain.com
# Will show "Fake LE Intermediate X1" in certificate
```

4. Switch to production (remove staging server line and redeploy)

### Common Tests

**Test HTTPS:**
```bash
curl -I https://yourdomain.com
```

**Test HTTP Redirect:**
```bash
curl -I http://yourdomain.com
# Should return 301/308 redirect to https://
```

**Verify Headers:**
```bash
curl -I https://yourdomain.com | grep -i "strict-transport-security"
```

---

## 🔄 Certificate Management

### Auto-Renewal

Traefik automatically renews certificates **60 days before expiry**. No manual action needed.

### Force Renewal

```bash
# Delete certificate storage
docker-compose -f docker-compose.ssl.yml down
rm letsencrypt/acme.json
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json

# Restart to regenerate
docker-compose -f docker-compose.ssl.yml up -d
```

### Check Certificate Expiry

```bash
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -dates
```

### View Certificate Details

```bash
# From acme.json (if readable)
cat letsencrypt/acme.json | jq

# Or check via SSL connection
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>/dev/null | openssl x509 -text
```

---

## 📊 Monitoring & Logs

### View All Logs
```bash
docker-compose -f docker-compose.ssl.yml logs -f
```

### Traefik Logs Only
```bash
docker-compose -f docker-compose.ssl.yml logs -f traefik
```

### Application Logs Only
```bash
docker-compose -f docker-compose.ssl.yml logs -f app
```

### Access Logs
Traefik access logs are in `./traefik-logs/`

---

## 🆘 Troubleshooting

### Certificate Not Generating

**Check DNS:**
```bash
dig yourdomain.com +short
# Must return your server IP
```

**Check Firewall:**
```bash
# Test port 80 (required for Let's Encrypt)
curl -I http://yourdomain.com

# Test port 443
curl -I https://yourdomain.com
```

**Check Traefik Logs:**
```bash
docker-compose -f docker-compose.ssl.yml logs traefik | grep -i error
```

### Rate Limit Exceeded

Let's Encrypt has limits:
- **50 certificates per domain per week**
- **5 duplicate certificates per week**

**Solution:**
1. Use staging server for testing (see above)
2. Wait for rate limit reset (7 days)
3. Check current limits: https://crt.sh/?q=yourdomain.com

### Certificate Shows "Untrusted"

**Cause**: Using staging certificates in production

**Solution:**
```bash
# Edit docker-compose.ssl.yml
# Comment out the staging server line:
# - "--certificatesresolvers.letsencrypt.acme.caserver=..."

# Redeploy
docker-compose -f docker-compose.ssl.yml down
rm -rf letsencrypt/*
docker-compose -f docker-compose.ssl.yml up -d
```

### Domain Not Accessible

**Check Services:**
```bash
docker-compose -f docker-compose.ssl.yml ps
# All should show "Up"
```

**Check Traefik Routes:**
```bash
docker-compose -f docker-compose.ssl.yml logs traefik | grep -i "router"
```

**Verify Domain in .env:**
```bash
grep DOMAIN .env
# Should show: DOMAIN=yourdomain.com (not the default)
```

### App Shows "Bad Gateway"

**Cause**: App container not responding

**Solutions:**
```bash
# Check app logs
docker-compose -f docker-compose.ssl.yml logs app

# Restart app
docker-compose -f docker-compose.ssl.yml restart app

# Check health
docker-compose -f docker-compose.ssl.yml exec app curl -I http://localhost:5000
```

---

## 🔄 Switching Back to Port 5000 (No SSL)

If you need to switch back:

```bash
# Stop SSL deployment
docker-compose -f docker-compose.ssl.yml down

# Start original (no SSL)
docker-compose up -d

# Access at http://yourserver:5000
```

---

## 🚀 Production Checklist

Before going live:

- [ ] Domain DNS configured (A records pointing to server)
- [ ] Firewall ports 80 and 443 open
- [ ] `.env` file configured with real values (not defaults)
- [ ] `SESSION_SECRET` generated (not default value)
- [ ] `PGPASSWORD` set to secure password
- [ ] `LETSENCRYPT_EMAIL` set to real email (for expiry alerts)
- [ ] Traefik dashboard password changed (if using dashboard)
- [ ] Tested with staging certificates first
- [ ] Production certificates generated successfully
- [ ] HTTPS working without browser warnings
- [ ] HTTP redirects to HTTPS automatically
- [ ] Database connection working
- [ ] Application accessible and functional

---

## 📚 Additional Resources

### Let's Encrypt
- **Documentation**: https://letsencrypt.org/docs/
- **Rate Limits**: https://letsencrypt.org/docs/rate-limits/
- **Staging Environment**: https://letsencrypt.org/docs/staging-environment/

### Traefik
- **Official Docs**: https://doc.traefik.io/traefik/
- **Let's Encrypt Guide**: https://doc.traefik.io/traefik/https/acme/
- **Docker Provider**: https://doc.traefik.io/traefik/providers/docker/

### SSL Testing
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Certificate Transparency**: https://crt.sh/
- **Security Headers**: https://securityheaders.com/

---

## 💡 Tips & Best Practices

1. **Always test with staging first** - Avoid rate limits
2. **Monitor certificate expiry** - Set up alerts
3. **Keep backups** - Backup `letsencrypt/acme.json`
4. **Use strong passwords** - For dashboard and database
5. **Enable firewall** - Only open necessary ports
6. **Monitor logs** - Check for errors regularly
7. **Update regularly** - Keep Docker images updated

---

**Your Asset Management System is now secured with SSL/TLS on port 443!** 🎉
