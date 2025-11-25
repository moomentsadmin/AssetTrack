# Docker SSL Deployment Guide - Production

Complete guide for deploying AssetTrack with automatic SSL/HTTPS certificates using Docker Compose, Traefik, and Let's Encrypt.

## Prerequisites

### Required
- **Domain name** with DNS pointing to your server
  - Example: `assettrack.yourdomain.com`
  - DNS A record must be configured before deployment
- **Server** with Docker and Docker Compose installed
- **Ports 80 and 443** open on your firewall
- **Valid email address** for Let's Encrypt certificate notifications

### Verify Prerequisites

```bash
# Check Docker
docker --version
docker compose version

# Check DNS (from external location)
nslookup assettrack.yourdomain.com

# Check ports (from external location)
telnet your-server-ip 80
telnet your-server-ip 443
```

## Quick Start

### Step 1: Clone Repository

```bash
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack
```

### Step 2: Create Environment File

Create `.env` file in project root:

```bash
# Domain Configuration (REQUIRED)
DOMAIN=assettrack.yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# Database Credentials
PGUSER=asset_user
PGPASSWORD=ChangeMeToSecurePassword123!
PGDATABASE=asset_management

# Application Secrets
SESSION_SECRET=ChangeThisToRandomString32CharsMinimum!

# SMTP Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=notifications@yourdomain.com
SMTP_FROM_NAME=AssetTrack Notifications

# Traefik Dashboard Authentication (Optional)
# Generate with: htpasswd -nB admin
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$yourhashhere

# Migration Control (Recommended: false for production)
ENABLE_AUTO_MIGRATIONS=false
```

**Generate Secure Passwords:**

```bash
# Session secret (32+ characters)
openssl rand -base64 32

# Database password
openssl rand -base64 24

# Traefik dashboard password
htpasswd -nB admin
# Or use online tool: https://hostingcanada.org/htpasswd-generator/
```

### Step 3: Deploy with SSL

```bash
# Build and start all services
docker compose -f docker-compose.ssl.yml up -d

# Monitor certificate acquisition
docker compose -f docker-compose.ssl.yml logs -f traefik

# Check all services
docker compose -f docker-compose.ssl.yml ps
```

### Step 4: Run Database Migrations

```bash
# Manual migration (recommended for production)
docker compose -f docker-compose.ssl.yml run --rm app npx drizzle-kit push:pg

# Alternative: Enable auto-migrations in .env
# ENABLE_AUTO_MIGRATIONS=true
```

### Step 5: Verify Deployment

1. **Access Application:**
   ```
   https://assettrack.yourdomain.com
   ```

2. **Check SSL Certificate:**
   - Browser should show secure padlock icon
   - Certificate issued by Let's Encrypt
   - Valid for 90 days (auto-renews)

3. **Test SSL Rating:**
   - Visit: https://www.ssllabs.com/ssltest/
   - Enter your domain
   - Should receive A or A+ rating

4. **Verify HTTP Redirect:**
   ```bash
   curl -I http://assettrack.yourdomain.com
   # Should show 301/302 redirect to HTTPS
   ```

## Architecture

The SSL deployment includes:

- **Traefik** - Reverse proxy with automatic SSL
  - Handles Let's Encrypt certificate acquisition
  - Automatic certificate renewal (30 days before expiry)
  - HTTP to HTTPS redirect
  - Security headers (HSTS, XSS protection, frame options)

- **PostgreSQL** - Database (internal network only)
  - Not exposed to public internet
  - Automatic backups via Docker volumes

- **AssetTrack App** - Node.js application
  - Runs behind Traefik
  - Accessible only via HTTPS

## Directory Structure

After deployment:

```
AssetTrack/
├── docker-compose.ssl.yml
├── .env                          # Your environment variables
├── Dockerfile
├── letsencrypt/
│   └── acme.json                 # SSL certificates (auto-generated)
├── traefik-logs/                 # Access logs (optional)
├── logs/                         # Application logs
└── postgres_data/                # Database volume (Docker managed)
```

## Configuration Details

### DNS Configuration

Before deployment, configure DNS A record:

```
Type: A
Name: assettrack (or your subdomain)
Value: YOUR_SERVER_IP
TTL: 3600 (or default)
```

Optional www subdomain:

```
Type: CNAME
Name: www
Value: assettrack.yourdomain.com
TTL: 3600
```

### Firewall Rules

**Ubuntu/Debian (UFW):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
sudo ufw status
```

**CentOS/RHEL (firewalld):**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**AWS Security Group:**
- Inbound Rule: HTTP (80) from 0.0.0.0/0
- Inbound Rule: HTTPS (443) from 0.0.0.0/0

**DigitalOcean Firewall:**
- Inbound: HTTP (80, TCP) from All sources
- Inbound: HTTPS (443, TCP) from All sources

### Security Headers

Automatically configured via Traefik:

```yaml
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

## Troubleshooting

### Certificate Not Generated

**Symptoms:**
- Browser shows "Not Secure"
- Traefik logs show ACME errors
- Connection timeout on HTTPS

**Solutions:**

1. **Verify DNS propagation:**
   ```bash
   # From external machine
   nslookup assettrack.yourdomain.com
   dig assettrack.yourdomain.com
   ```

2. **Check Traefik logs:**
   ```bash
   docker compose -f docker-compose.ssl.yml logs traefik | grep -i acme
   docker compose -f docker-compose.ssl.yml logs traefik | grep -i error
   ```

3. **Verify environment variables:**
   ```bash
   cat .env | grep DOMAIN
   cat .env | grep LETSENCRYPT_EMAIL
   ```

4. **Check ports are accessible:**
   ```bash
   # From external machine
   curl -I http://your-server-ip
   ```

5. **Use Let's Encrypt staging (for testing):**
   
   Edit `docker-compose.ssl.yml`, uncomment:
   ```yaml
   - "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
   ```

### Rate Limit Exceeded

Let's Encrypt limits: 50 certificates per domain per week.

**Solutions:**
- Use staging server for testing (see above)
- Wait 7 days for limit reset
- Check current limits: https://letsencrypt.org/docs/rate-limits/

### Permission Denied on acme.json

**Error:**
```
permissions 755 for /letsencrypt/acme.json are too open
```

**Fix:**
```bash
chmod 600 letsencrypt/acme.json
```

### Database Connection Failed

**Check database status:**
```bash
docker compose -f docker-compose.ssl.yml ps db
docker compose -f docker-compose.ssl.yml logs db
```

**Verify DATABASE_URL:**
```bash
docker compose -f docker-compose.ssl.yml exec app printenv DATABASE_URL
```

### Application Not Starting

**Check logs:**
```bash
docker compose -f docker-compose.ssl.yml logs app
```

**Common issues:**
- Missing environment variables in `.env`
- Database not ready (check healthcheck)
- Port 5000 already in use inside container

## Operations

### View Logs

```bash
# All services
docker compose -f docker-compose.ssl.yml logs -f

# Specific service
docker compose -f docker-compose.ssl.yml logs -f app
docker compose -f docker-compose.ssl.yml logs -f traefik
docker compose -f docker-compose.ssl.yml logs -f db

# Last 100 lines
docker compose -f docker-compose.ssl.yml logs --tail=100 app
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild application (keeps database and certificates)
docker compose -f docker-compose.ssl.yml build --pull app
docker compose -f docker-compose.ssl.yml up -d app

# Verify
docker compose -f docker-compose.ssl.yml ps
```

### Backup Database

```bash
# Create SQL dump
docker compose -f docker-compose.ssl.yml exec db pg_dump -U asset_user asset_management > backup_$(date +%F).sql

# Compressed backup
docker compose -f docker-compose.ssl.yml exec db pg_dump -U asset_user asset_management | gzip > backup_$(date +%F).sql.gz
```

### Restore Database

```bash
# Stop application (keep db running)
docker compose -f docker-compose.ssl.yml stop app

# Restore from backup
cat backup_2025-11-25.sql | docker compose -f docker-compose.ssl.yml exec -T db psql -U asset_user asset_management

# Restart application
docker compose -f docker-compose.ssl.yml start app
```

### Backup SSL Certificates

```bash
# Backup certificates (before server migration)
tar -czf letsencrypt-backup-$(date +%F).tar.gz letsencrypt/

# Restore on new server
tar -xzf letsencrypt-backup-2025-11-25.tar.gz
chmod 600 letsencrypt/acme.json
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.ssl.yml restart

# Restart specific service
docker compose -f docker-compose.ssl.yml restart app
docker compose -f docker-compose.ssl.yml restart traefik
```

### Stop and Remove

```bash
# Stop services (keeps data)
docker compose -f docker-compose.ssl.yml down

# Stop and remove volumes (WARNING: deletes database)
docker compose -f docker-compose.ssl.yml down -v
```

## Monitoring

### Check Certificate Expiry

```bash
# View certificate details
echo | openssl s_client -servername assettrack.yourdomain.com -connect assettrack.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Check expiry date
docker compose -f docker-compose.ssl.yml exec traefik cat /letsencrypt/acme.json | jq '.letsencrypt.Certificates[].domain.main'
```

### Monitor Resource Usage

```bash
# All containers
docker stats

# Specific service
docker stats asset-app asset-db asset-traefik
```

### Access Traefik Dashboard (Optional)

If `TRAEFIK_DASHBOARD_AUTH` is configured:

URL: `https://traefik.assettrack.yourdomain.com`

Shows:
- Active routes
- Services status
- Certificate details
- Middleware configuration

## Production Best Practices

### Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Use strong SESSION_SECRET (32+ characters)
- [ ] Enable firewall (only ports 80/443 open)
- [ ] Set `ENABLE_AUTO_MIGRATIONS=false`
- [ ] Configure SMTP for notifications
- [ ] Enable Traefik dashboard auth if using dashboard
- [ ] Regular database backups (daily recommended)
- [ ] Monitor certificate expiry
- [ ] Keep Docker images updated

### Monitoring Setup

```bash
# Set up daily backups (cron)
0 2 * * * cd /path/to/AssetTrack && docker compose -f docker-compose.ssl.yml exec db pg_dump -U asset_user asset_management | gzip > /backups/assettrack_$(date +\%F).sql.gz

# Keep last 30 days of backups
0 3 * * * find /backups -name "assettrack_*.sql.gz" -mtime +30 -delete
```

### Certificate Renewal

Traefik automatically renews certificates 30 days before expiry. No manual intervention needed.

**Verify auto-renewal:**
```bash
docker compose -f docker-compose.ssl.yml logs traefik | grep -i renew
```

## Scaling and High Availability

For production scale deployments:

### External Database

Use managed database (AWS RDS, Azure Database, DigitalOcean Managed DB):

```bash
# Use docker-compose.ssl-external-db.yml
docker compose -f docker-compose.ssl-external-db.yml up -d
```

In `.env`:
```bash
DATABASE_URL=postgres://user:pass@external-db.example.com:5432/assettrack?sslmode=require
```

### Multiple Replicas

For load balancing:
- Deploy to Kubernetes (recommended for >1000 users)
- Use Docker Swarm mode
- Use external load balancer (AWS ALB, Cloudflare)

### Backup Strategy

Production backup recommendations:
- **Daily automated backups** to external storage (S3, Azure Blob)
- **Weekly full backups** retained for 3 months
- **Point-in-time recovery** via PostgreSQL WAL archiving
- **Test restores monthly**

## Support and Resources

- **Traefik Documentation:** https://doc.traefik.io/traefik/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **Docker Compose:** https://docs.docker.com/compose/
- **AssetTrack Repository:** https://github.com/moomentsadmin/AssetTrack

## Troubleshooting Checklist

Before opening an issue, verify:

1. DNS records are correct and propagated
2. Ports 80 and 443 are open on firewall
3. `.env` file has correct DOMAIN and LETSENCRYPT_EMAIL
4. Docker and Docker Compose are installed
5. Server has internet access
6. Domain points to correct server IP
7. Reviewed Traefik logs for ACME errors
8. Tried Let's Encrypt staging server

For support, include:
- Traefik logs: `docker compose -f docker-compose.ssl.yml logs traefik`
- Application logs: `docker compose -f docker-compose.ssl.yml logs app`
- DNS verification: `dig assettrack.yourdomain.com`
- Environment (redact secrets): `cat .env`
