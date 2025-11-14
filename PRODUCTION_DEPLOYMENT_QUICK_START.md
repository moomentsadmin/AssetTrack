# Production Deployment Quick Start

**Last Updated:** November 14, 2025  
**Application:** AssetTrack v1.0.0

## Prerequisites

- Docker & Docker Compose installed
- PostgreSQL 15+ running (or use managed service like AWS RDS, Azure Database for PostgreSQL)
- Domain name (for Let's Encrypt SSL setup)
- 2GB+ RAM, 2 CPU cores, 10GB disk minimum

## Option 1: Quick Docker Deployment (HTTP, Dev/Test)

```bash
# 1. Clone and navigate
git clone <repo-url> AssetTrack
cd AssetTrack

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your values
nano .env
# Required values:
# - DATABASE_URL=postgresql://asset_user:STRONG_PASSWORD@localhost:5432/asset_management
# - SESSION_SECRET=RANDOM_32_CHAR_STRING (generate: openssl rand -base64 32)

# 4. Start the stack
docker-compose up -d

# 5. Verify health
curl http://localhost:5000/api/health

# 6. Access application
# Browser: http://localhost:5000
# Setup page will appear on first access
```

## Option 2: Docker with Let's Encrypt SSL (Production)

```bash
# 1. Clone and navigate
git clone <repo-url> AssetTrack
cd AssetTrack

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your values
nano .env
# Required values:
# - DOMAIN=yourdomain.com (must have DNS A record pointing to this host)
# - LETSENCRYPT_EMAIL=admin@yourdomain.com
# - PGUSER=asset_user
# - PGPASSWORD=STRONG_DB_PASSWORD
# - SESSION_SECRET=RANDOM_32_CHAR_STRING (generate: openssl rand -base64 32)
# - TRAEFIK_DASHBOARD_AUTH=admin:PASSWORD_HASH (generate: htpasswd -nB admin)

# 4. Ensure ports 80 and 443 are open on your host
# Firewall rules:
# - Allow port 80 from anywhere (HTTP → HTTPS redirect)
# - Allow port 443 from anywhere (HTTPS)
# - Restrict SSH port (22) to your IP

# 5. Start the SSL stack with Traefik
docker-compose -f docker-compose.ssl.yml up -d

# 6. Verify SSL certificate request
docker-compose -f docker-compose.ssl.yml logs traefik | grep -i "acme\|certificate"

# 7. Verify health
curl https://yourdomain.com/api/health

# 8. Access application
# Browser: https://yourdomain.com
# Traefik dashboard: https://traefik.yourdomain.com (use admin credentials)
```

## Option 3: External Database (AWS RDS, DigitalOcean, Azure)

```bash
# 1. Clone and navigate
git clone <repo-url> AssetTrack
cd AssetTrack

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your external database URL
nano .env
# Required values:
# - DATABASE_URL=postgresql://username:password@host:5432/dbname?sslmode=require
# - SESSION_SECRET=RANDOM_32_CHAR_STRING
# - DOMAIN=yourdomain.com
# - LETSENCRYPT_EMAIL=admin@yourdomain.com

# 4. Start with external DB compose file
docker-compose -f docker-compose.ssl-external-db.yml up -d

# 5. Verify connection
docker-compose -f docker-compose.ssl-external-db.yml logs app | grep "serving on port"
```

## Initial Setup

### First Login (Setup Page)

When you first access the application, a setup page will appear asking for:
- **Full Name**: Your name
- **Email**: Your email address
- **Username**: Your login username (min. 3 characters)
- **Password**: Your password (min. 8 characters)

This creates the initial admin account. After setup, the setup page will not appear again.

### Optional: Pre-Seed Admin Account

For testing/CI/CD, you can auto-create a default admin account:

```env
# In .env file, add:
ENABLE_DEFAULT_ADMIN=true
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=STRONG_PASSWORD_HERE
DEFAULT_ADMIN_EMAIL=admin@example.com
```

⚠️ **WARNING**: Only enable this for testing. Do NOT enable in public production.

## Monitoring & Maintenance

### Check Application Status

```bash
# View running containers
docker-compose ps

# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db

# Check health endpoint
curl http://localhost:5000/api/health
```

### Database Backups

```bash
# Create a database backup
docker-compose exec db pg_dump -U asset_user asset_management > backup_$(date +%s).sql

# Restore from backup
docker-compose exec -T db psql -U asset_user asset_management < backup_timestamp.sql
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Verify health
curl http://localhost:5000/api/health
```

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | Yes | `production` | Must be set to `production` |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/db` | Use `?sslmode=require` for remote DB |
| `SESSION_SECRET` | Yes | `randomstring32chars...` | Generate: `openssl rand -base64 32` |
| `PORT` | No | `5000` | Default: 5000 |
| `DOMAIN` | (SSL only) | `example.com` | Required for Let's Encrypt |
| `LETSENCRYPT_EMAIL` | (SSL only) | `admin@example.com` | Required for Let's Encrypt |
| `TRAEFIK_DASHBOARD_AUTH` | (SSL only) | `admin:$2y$05$...` | Generate: `htpasswd -nB admin` |
| `PGUSER` | No | `asset_user` | Default: asset_user |
| `PGPASSWORD` | No | `securepass` | Default: your_secure_password |
| `PGDATABASE` | No | `asset_management` | Default: asset_management |
| `ENABLE_DEFAULT_ADMIN` | No | `false` | Only for testing |

## Troubleshooting

### Container Fails to Start

```bash
# Check logs
docker-compose logs app

# Common issues:
# - SESSION_SECRET not set: "FATAL: SESSION_SECRET is not set"
# - DATABASE_URL invalid: "DATABASE_URL must be set"
# - Database not ready: wait 10-15 seconds and retry
```

### SSL Certificate Not Issued

```bash
# Check Traefik logs
docker-compose -f docker-compose.ssl.yml logs traefik

# Common issues:
# - Ports 80/443 not open: open ports on firewall
# - DNS not pointing to host: check A record
# - Email invalid: use valid email for LETSENCRYPT_EMAIL
# - Rate limited: use ACME staging server in compose file (commented out)
```

### Database Connection Failed

```bash
# Test database connection
docker-compose exec app psql $DATABASE_URL -c "SELECT version();"

# Common issues:
# - Wrong credentials: verify username/password
# - Host unreachable: check network/firewall
# - SSL required: add ?sslmode=require to DATABASE_URL
```

### Health Check Failing

```bash
# Check container is running
docker-compose ps

# Test endpoint manually
curl http://localhost:5000/api/health

# View app logs for errors
docker-compose logs app -f
```

## Security Checklist

- [ ] SESSION_SECRET is a strong, random string (32+ characters)
- [ ] DATABASE_URL uses SSL for remote databases (`?sslmode=require`)
- [ ] Firewall restricts SSH access to your IP only
- [ ] Traefik dashboard is behind basic auth (if exposed)
- [ ] `.env` file is NOT committed to version control
- [ ] Database backups are tested and stored securely
- [ ] HTTPS is enforced (via Traefik redirect)
- [ ] Non-root user is running containers (UID 1001 in Dockerfile)

## Next Steps

1. **Setup monitoring**: Enable Docker health checks, set up log aggregation (ELK, CloudWatch)
2. **Configure backups**: Set up automated database backups to S3 or other storage
3. **Set up email**: Configure email settings in the app for notifications
4. **User management**: Create additional admin/manager accounts as needed
5. **Custom branding**: Update company name, logo, and colors in Settings

## Support & Documentation

- Full deployment guide: `DEPLOYMENT.md`
- Production verification checklist: `PRODUCTION_VERIFICATION.md`
- API documentation: `README.md` (API Endpoints section)
- Database schema: `shared/schema.ts`

---

**Deployment verified:** November 14, 2025  
**Status:** Production Ready ✅
