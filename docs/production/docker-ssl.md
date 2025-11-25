**Docker Compose with SSL/HTTPS (Let's Encrypt)**

This guide covers deploying AssetTrack with automatic SSL certificates using Docker Compose and Traefik reverse proxy.

## Overview

The `docker-compose.ssl.yml` file provides:
- Automatic SSL/TLS certificates via Let's Encrypt
- HTTP to HTTPS redirect
- Traefik reverse proxy handling routing and certificate management
- Security headers (HSTS, frame protection, XSS protection)
- Optional Traefik dashboard with basic auth

## Prerequisites

1. **Domain name** pointing to your server (A record)
   - Example: `assettrack.example.com`
   - Optional: `www.assettrack.example.com` (CNAME or A record)

2. **Ports open** on your firewall:
   - Port 80 (HTTP - for Let's Encrypt validation and redirect)
   - Port 443 (HTTPS)

3. **Valid email** for Let's Encrypt notifications

## Quick Start

### 1. Prepare Environment File

Create `.env` in your project root:

```bash
# Domain Configuration
DOMAIN=assettrack.example.com
LETSENCRYPT_EMAIL=admin@example.com

# Database Configuration
PGUSER=asset_user
PGPASSWORD=your_very_secure_db_password_here
PGDATABASE=asset_management

# Application Secrets
SESSION_SECRET=generate_a_random_string_min_32_chars_for_sessions

# Traefik Dashboard Auth (optional)
# Generate with: htpasswd -nB admin
# Example: admin:$2y$05$... (username:hashed_password)
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$yourhashedpasswordhere

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASS=your_smtp_password
SMTP_FROM_EMAIL=notifications@example.com
SMTP_FROM_NAME=AssetTrack

# Migration Control
ENABLE_AUTO_MIGRATIONS=false
```

**Generate secure passwords:**
```bash
# Session secret (32+ chars)
openssl rand -base64 32

# Traefik dashboard password
htpasswd -nB admin
# Or use online generator: https://hostingcanada.org/htpasswd-generator/
```

### 2. Deploy with SSL

```bash
# Build and start services
docker compose -f docker-compose.ssl.yml up -d

# Check logs
docker compose -f docker-compose.ssl.yml logs -f

# Watch Traefik obtain certificates
docker compose -f docker-compose.ssl.yml logs -f traefik
```

### 3. Verify Deployment

1. **Check certificate acquisition:**
   ```bash
   # Inspect Let's Encrypt certificate storage
   ls -la letsencrypt/
   cat letsencrypt/acme.json
   ```

2. **Test HTTPS:**
   - Visit: `https://assettrack.example.com`
   - Should automatically redirect from HTTP
   - Certificate should be valid and issued by Let's Encrypt

3. **Check SSL rating:**
   - Use: https://www.ssllabs.com/ssltest/
   - Should receive A or A+ rating

### 4. Access Traefik Dashboard (Optional)

If you configured `TRAEFIK_DASHBOARD_AUTH`:
- URL: `https://traefik.assettrack.example.com`
- Login with username/password from htpasswd

## File Structure

After deployment:
```
project/
├── docker-compose.ssl.yml
├── .env
├── letsencrypt/
│   └── acme.json          # Let's Encrypt certificates (auto-generated)
├── traefik-logs/          # Access logs (optional)
└── logs/                  # Application logs
```

## Migration Handling

The SSL compose file runs migrations at startup by default. For production:

**Option A: Disable automatic migrations** (recommended)
```bash
# In .env
ENABLE_AUTO_MIGRATIONS=false

# Run migrations manually
docker compose -f docker-compose.ssl.yml run --rm app npx drizzle-kit push:pg
```

**Option B: Use GitHub Actions workflow**
See `.github/workflows/run-migrations.yml` for controlled migration execution.

## Troubleshooting

### Certificate Not Obtained

**Symptoms:** 
- Traefik logs show "unable to generate a certificate"
- 404 or insecure connection warnings

**Solutions:**
1. Verify DNS propagation:
   ```bash
   nslookup assettrack.example.com
   dig assettrack.example.com
   ```

2. Check ports 80/443 are accessible:
   ```bash
   # From external machine
   curl http://your-server-ip
   curl https://your-server-ip -k
   ```

3. Check Traefik logs:
   ```bash
   docker compose -f docker-compose.ssl.yml logs traefik | grep -i acme
   ```

4. Verify email is valid in `.env`:
   ```bash
   grep LETSENCRYPT_EMAIL .env
   ```

5. Test with Let's Encrypt staging (no rate limits):
   Uncomment this line in `docker-compose.ssl.yml`:
   ```yaml
   - "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
   ```

### Rate Limit Exceeded

Let's Encrypt has limits: 50 certificates per domain per week.

**Solutions:**
- Use staging server for testing (see above)
- Wait 7 days for rate limit reset
- Check: https://letsencrypt.org/docs/rate-limits/

### Permission Issues with acme.json

**Symptoms:**
```
unable to get ACME account: permissions 755 for /letsencrypt/acme.json are too open
```

**Solution:**
```bash
chmod 600 letsencrypt/acme.json
```

### HTTP Still Accessible

This is expected - HTTP (port 80) is needed for:
1. Let's Encrypt ACME challenge validation
2. Automatic redirect to HTTPS

All HTTP requests are automatically redirected to HTTPS by Traefik.

## Security Considerations

### Security Headers

The compose file sets these headers automatically:
- `Strict-Transport-Security` (HSTS) - 2 years
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

### Certificate Renewal

Let's Encrypt certificates are valid for 90 days. Traefik automatically:
- Renews certificates 30 days before expiry
- No manual intervention needed
- Logs renewal in Traefik logs

### Firewall Rules

**Minimum required:**
```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

**Block direct database access:**
```bash
# Port 5432 should NOT be exposed publicly
# docker-compose.ssl.yml keeps database internal-only
```

## Using External Database with SSL

If you have a managed database (AWS RDS, Azure Database, etc.):

Use `docker-compose.ssl-external-db.yml` instead:

```bash
# In .env, set DATABASE_URL with SSL
DATABASE_URL=postgres://user:pass@external-db.example.com:5432/assettrack?sslmode=require

# Deploy
docker compose -f docker-compose.ssl-external-db.yml up -d
```

This variant:
- Removes the local `db` service
- Only runs `app` + `traefik`
- App connects to your managed database

## Monitoring and Logs

### View All Logs
```bash
docker compose -f docker-compose.ssl.yml logs -f
```

### View Specific Service
```bash
# Application logs
docker compose -f docker-compose.ssl.yml logs -f app

# Traefik access logs
docker compose -f docker-compose.ssl.yml logs -f traefik

# Database logs
docker compose -f docker-compose.ssl.yml logs -f db
```

### Access Logs Location
```bash
# Traefik access logs (if enabled)
tail -f traefik-logs/access.log

# Application logs
tail -f logs/app.log
```

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart (preserves data)
docker compose -f docker-compose.ssl.yml build --pull app
docker compose -f docker-compose.ssl.yml up -d app

# Verify
docker compose -f docker-compose.ssl.yml ps
```

Certificates and database volumes persist across rebuilds.

## Backup and Restore

### Backup Database
```bash
# Create backup
docker compose -f docker-compose.ssl.yml exec db pg_dump -U asset_user asset_management > backup_$(date +%F).sql

# Or compressed
docker compose -f docker-compose.ssl.yml exec db pg_dump -U asset_user asset_management | gzip > backup_$(date +%F).sql.gz
```

### Restore Database
```bash
# Stop app (keep db running)
docker compose -f docker-compose.ssl.yml stop app

# Restore
cat backup_2025-11-25.sql | docker compose -f docker-compose.ssl.yml exec -T db psql -U asset_user asset_management

# Restart app
docker compose -f docker-compose.ssl.yml start app
```

### Backup Certificates
```bash
# Backup Let's Encrypt certificates
tar -czf letsencrypt-backup.tar.gz letsencrypt/

# Restore (if moving servers)
tar -xzf letsencrypt-backup.tar.gz
chmod 600 letsencrypt/acme.json
```

## Scaling and High Availability

For production at scale:
- Use managed databases (AWS RDS, Azure Database)
- Deploy to Kubernetes or Docker Swarm for multi-replica support
- Use external load balancer instead of Traefik
- Separate certificate management (cert-manager in k8s)

See `docker-compose.production.yml` for multi-replica reference.

## Support

- Traefik docs: https://doc.traefik.io/traefik/
- Let's Encrypt: https://letsencrypt.org/docs/
- Docker Compose: https://docs.docker.com/compose/

For issues, check logs and open a GitHub issue with:
- Traefik logs
- Application logs
- DNS configuration
- `.env` (redact secrets)
