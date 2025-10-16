# 🧹 Deployment Files Cleanup & Migration Guide

## Overview

The deployment has been simplified into **ONE production-ready Docker Compose file** that handles all scenarios:

✅ **`docker-compose.production.yml`** - Unified production deployment
- Supports local PostgreSQL database
- Supports external managed databases (DigitalOcean, AWS RDS, etc.)
- Includes Traefik with automatic SSL/TLS
- Fixes all SSL certificate issues

## 📁 File Structure

### ✅ **Keep These Files** (Production-Ready)

```
docker-compose.production.yml    # Main production deployment file
.env.production.example           # Environment configuration template
PRODUCTION_DEPLOYMENT.md          # Complete deployment guide
deploy.sh                         # Automated deployment script
Dockerfile                        # Application container build
```

### ❌ **Old Files** (Can be removed or archived)

```
docker-compose.ssl.yml            # Replaced by docker-compose.production.yml
docker-compose.ssl-external-db.yml # Replaced by docker-compose.production.yml
.env.ssl.example                  # Replaced by .env.production.example
.env.external-db.example          # Replaced by .env.production.example
docker-compose.yml                # Development only (keep for local dev)
```

### 📚 **Documentation Files** (Reference)

```
DEPLOYMENT_GUIDE.md               # Original guide (can archive)
DIGITALOCEAN_DATABASE_SETUP.md    # DigitalOcean specific guide (useful reference)
EXTERNAL_DATABASE_SETUP.md        # External DB guide (useful reference)
FIX_DATABASE_USER.md              # Troubleshooting (can archive)
SSL_TROUBLESHOOTING.md            # SSL guide (can archive)
```

## 🚀 Migration to New System

If you're currently using the old Docker Compose files, here's how to migrate:

### Step 1: Stop Current Deployment

```bash
cd ~/AssetTrackr

# Stop old deployment (whichever you're using)
docker compose -f docker-compose.ssl.yml down
# OR
docker compose -f docker-compose.ssl-external-db.yml down
```

### Step 2: Pull Latest Code

```bash
git pull origin main
```

### Step 3: Create New .env

```bash
# Copy new template
cp .env.production.example .env

# Edit configuration
nano .env
```

**For External Database (DigitalOcean, AWS RDS, etc.):**
```env
# Domain
DOMAIN=test.digile.com
LETSENCRYPT_EMAIL=admin@digile.com

# External Database
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# SSL Fix for Managed Databases
NODE_TLS_REJECT_UNAUTHORIZED=0

# Security
SESSION_SECRET=your_secure_random_string
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$your_hash
```

**For Local Database:**
```env
# Domain
DOMAIN=test.digile.com
LETSENCRYPT_EMAIL=admin@digile.com

# Local Database
USE_EXTERNAL_DB=false
PGUSER=asset_user
PGPASSWORD=secure_password
PGDATABASE=asset_management

# Security
SESSION_SECRET=your_secure_random_string
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$your_hash
```

### Step 4: Deploy New System

**Option A: Using Deploy Script (Recommended)**
```bash
./deploy.sh
```

**Option B: Manual Deployment**

For External Database:
```bash
docker compose -f docker-compose.production.yml up -d --build
```

For Local Database:
```bash
docker compose -f docker-compose.production.yml --profile local-db up -d --build
```

### Step 5: Verify Deployment

```bash
# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f app

# Test API
docker compose -f docker-compose.production.yml exec app wget -qO- http://localhost:5000/api/setup/status
```

Visit: https://test.digile.com

## 🔧 Key Improvements

### 1. **Unified Configuration**
- One Docker Compose file for all scenarios
- Automatic mode detection (local vs external DB)
- No need to choose different files

### 2. **SSL Certificate Fix**
- Added `NODE_TLS_REJECT_UNAUTHORIZED=0` to handle managed database SSL
- Fixes "self-signed certificate" errors with DigitalOcean, AWS RDS, etc.
- No more drizzle-kit SSL errors

### 3. **Simplified Deployment**
- One command deployment via `deploy.sh`
- Automatic validation of configuration
- Clear error messages

### 4. **Better Documentation**
- `PRODUCTION_DEPLOYMENT.md` - Complete production guide
- Step-by-step instructions for all database providers
- Troubleshooting section with solutions

## 📋 Cleanup Commands

### Remove Old Files (Optional)

```bash
cd ~/AssetTrackr

# Remove old Docker Compose files
rm -f docker-compose.ssl.yml
rm -f docker-compose.ssl-external-db.yml

# Remove old .env examples
rm -f .env.ssl.example
rm -f .env.external-db.example

# Archive old documentation (optional)
mkdir -p archive
mv FIX_DATABASE_USER.md archive/
mv SSL_TROUBLESHOOTING.md archive/
```

### Keep for Reference

Keep these files for future reference:
- `DIGITALOCEAN_DATABASE_SETUP.md` - Detailed DigitalOcean guide
- `EXTERNAL_DATABASE_SETUP.md` - Other external database providers
- `docker-compose.yml` - For local development

## 🎯 Quick Reference

### New Deployment Commands

```bash
# Deploy (automatic mode detection)
./deploy.sh

# OR manual deployment:

# External database
docker compose -f docker-compose.production.yml up -d --build

# Local database
docker compose -f docker-compose.production.yml --profile local-db up -d --build

# Stop
docker compose -f docker-compose.production.yml down

# Logs
docker compose -f docker-compose.production.yml logs -f app

# Restart
docker compose -f docker-compose.production.yml restart app
```

### Environment Variables

**Required:**
- `DOMAIN` - Your domain name
- `LETSENCRYPT_EMAIL` - Email for SSL certificates
- `SESSION_SECRET` - Secure random string

**For External DB:**
- `USE_EXTERNAL_DB=true`
- `DATABASE_URL` - Full connection string
- `NODE_TLS_REJECT_UNAUTHORIZED=0` - Fix SSL issues

**For Local DB:**
- `USE_EXTERNAL_DB=false` (or omit)
- `PGUSER`, `PGPASSWORD`, `PGDATABASE`

## ✅ Migration Checklist

- [ ] Stop old deployment
- [ ] Pull latest code from GitHub
- [ ] Create new .env from .env.production.example
- [ ] Configure domain and database settings
- [ ] Set `NODE_TLS_REJECT_UNAUTHORIZED=0` for external DB
- [ ] Deploy using `./deploy.sh` or manual command
- [ ] Verify all containers are running
- [ ] Test application at https://yourdomain.com
- [ ] Remove old Docker Compose files (optional)

## 🆘 Need Help?

See `PRODUCTION_DEPLOYMENT.md` for:
- Complete step-by-step deployment guide
- Database provider setup instructions
- Troubleshooting common issues
- Security best practices

---

**The new system is simpler, more reliable, and production-ready! 🚀**
