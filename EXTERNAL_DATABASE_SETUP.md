# 🗄️ External Database Configuration

## Overview

This guide shows how to use an external PostgreSQL database instead of the containerized database.

**Benefits:**
- ✅ Managed backups and updates
- ✅ Better performance and scalability
- ✅ Separate data from application containers
- ✅ Easy database management via provider dashboard

**Supported Providers:**
- AWS RDS PostgreSQL
- DigitalOcean Managed Database
- Azure Database for PostgreSQL
- Google Cloud SQL
- Neon (Serverless PostgreSQL)
- Supabase
- Any PostgreSQL 13+ server

---

## 📋 Prerequisites

### 1. Create External PostgreSQL Database

Choose one of these providers and create a PostgreSQL database:

#### **DigitalOcean Managed Database** (Recommended)
1. Go to: https://cloud.digitalocean.com/databases
2. Click "Create Database Cluster"
3. Select: PostgreSQL 15
4. Choose your plan (Basic $15/month is fine for small apps)
5. Select region (same as your server for best performance)
6. Create database

#### **AWS RDS PostgreSQL**
1. Go to AWS RDS Console
2. Create database → PostgreSQL
3. Choose template (Free tier or Production)
4. Set master username and password
5. Enable Public access (or use VPC peering)

#### **Neon (Serverless)**
1. Go to: https://neon.tech
2. Sign up (free tier available)
3. Create new project
4. Get connection string

#### **Supabase**
1. Go to: https://supabase.com
2. Create new project
3. Get database connection details

### 2. Get Database Connection Details

You'll need:
- **Host**: Database server address (e.g., `db-postgresql-nyc1-12345.ondigitalocean.com`)
- **Port**: Usually `5432`
- **Database Name**: e.g., `asset_management`
- **Username**: e.g., `doadmin` or `postgres`
- **Password**: Your database password
- **SSL Mode**: `require` for most managed databases

---

## 🔧 Configuration

### Step 1: Update .env File

Edit your `.env` file to use the external database:

```bash
cd ~/AssetTrackr
nano .env
```

**Replace database section with:**

```env
# ===================================
# EXTERNAL DATABASE CONFIGURATION
# ===================================

# Full connection string (recommended)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# OR individual components:
PGHOST=your-db-host.ondigitalocean.com
PGPORT=5432
PGDATABASE=asset_management
PGUSER=your_username
PGPASSWORD=your_secure_password
PGSSLMODE=require

# ===================================
# DOMAIN & APPLICATION CONFIGURATION
# ===================================
DOMAIN=test.digile.com
LETSENCRYPT_EMAIL=admin@digile.com
SESSION_SECRET=your_secure_random_session_secret_min_32_characters

# Traefik Dashboard
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$kF5Z5z5Z5z5z5Z5z5z5z5OqGqGqGqGqGqGqGqGqGqGqGqGqGqG
```

**Example for DigitalOcean:**
```env
DATABASE_URL=postgresql://doadmin:your_password@db-postgresql-nyc1-12345.ondigitalocean.com:25060/defaultdb?sslmode=require

# OR
PGHOST=db-postgresql-nyc1-12345.ondigitalocean.com
PGPORT=25060
PGDATABASE=defaultdb
PGUSER=doadmin
PGPASSWORD=your_password
PGSSLMODE=require
```

**Example for AWS RDS:**
```env
DATABASE_URL=postgresql://postgres:your_password@mydb.abc123.us-east-1.rds.amazonaws.com:5432/asset_management?sslmode=require

# OR
PGHOST=mydb.abc123.us-east-1.rds.amazonaws.com
PGPORT=5432
PGDATABASE=asset_management
PGUSER=postgres
PGPASSWORD=your_password
PGSSLMODE=require
```

**Example for Neon:**
```env
DATABASE_URL=postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

### Step 2: Create docker-compose.ssl-external-db.yml

Create a new compose file without the database service:

```bash
cd ~/AssetTrackr
nano docker-compose.ssl-external-db.yml
```

**Paste this content:**

```yaml
version: '3.8'

services:
  # Traefik Reverse Proxy with Let's Encrypt
  traefik:
    image: traefik:v3.0
    container_name: asset-traefik
    restart: unless-stopped
    command:
      # API and Dashboard
      - "--api.dashboard=true"
      - "--api.insecure=false"
      
      # Docker Provider
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=asset-network"
      
      # Entrypoints (Ports)
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      
      # Let's Encrypt Certificate Resolver
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=${LETSENCRYPT_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      
      # Global HTTP to HTTPS Redirect
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      
      # Logging
      - "--log.level=INFO"
      - "--accesslog=true"
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
      - "./traefik-logs:/logs"
    
    networks:
      - asset-network
    
    labels:
      # Enable Traefik for itself (Dashboard)
      - "traefik.enable=true"
      
      # Dashboard Router
      - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.dashboard.entrypoints=websecure"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.service=api@internal"
      
      # Dashboard Basic Auth
      - "traefik.http.routers.dashboard.middlewares=dashboard-auth"
      - "traefik.http.middlewares.dashboard-auth.basicauth.users=${TRAEFIK_DASHBOARD_AUTH}"

  # Application Server (Using External Database)
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: asset-app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 5000
      # Use DATABASE_URL from .env (external database)
      DATABASE_URL: ${DATABASE_URL}
      # Or use individual components
      PGHOST: ${PGHOST}
      PGPORT: ${PGPORT}
      PGDATABASE: ${PGDATABASE}
      PGUSER: ${PGUSER}
      PGPASSWORD: ${PGPASSWORD}
      PGSSLMODE: ${PGSSLMODE:-require}
      SESSION_SECRET: ${SESSION_SECRET}
    volumes:
      - ./logs:/app/logs
    networks:
      - asset-network
    command: >
      sh -c "npm run db:push && npm start"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:5000/api/user"]
      interval: 30s
      timeout: 10s
      start_period: 40s
      retries: 3
    
    labels:
      # Enable Traefik
      - "traefik.enable=true"
      
      # Main Application Router
      - "traefik.http.routers.assettrackr.rule=Host(`${DOMAIN}`) || Host(`www.${DOMAIN}`)"
      - "traefik.http.routers.assettrackr.entrypoints=websecure"
      - "traefik.http.routers.assettrackr.tls.certresolver=letsencrypt"
      - "traefik.http.routers.assettrackr.tls.domains[0].main=${DOMAIN}"
      - "traefik.http.routers.assettrackr.tls.domains[0].sans=www.${DOMAIN}"
      
      # Load Balancer
      - "traefik.http.services.assettrackr.loadbalancer.server.port=5000"

networks:
  asset-network:
    driver: bridge

# Note: No volumes needed - using external database
```

Save and exit (Ctrl+X, Y, Enter).

---

### Step 3: Deploy with External Database

```bash
cd ~/AssetTrackr

# Stop old deployment (if running)
docker compose -f docker-compose.ssl.yml down

# Start with external database
docker compose -f docker-compose.ssl-external-db.yml up -d --build

# Watch logs
docker compose -f docker-compose.ssl-external-db.yml logs -f app
```

**Look for:**
- ✅ `Applying schema changes...` (database migration)
- ✅ `Server running on port 5000`
- ✅ No connection errors

---

## ✅ Verify Connection

### Test Database Connection

```bash
# Check app can connect to external database
docker compose -f docker-compose.ssl-external-db.yml logs app | grep -i "database\|connection\|error"

# Should see successful connection, no errors
```

### Test API

```bash
# Test setup status
docker compose -f docker-compose.ssl-external-db.yml exec app wget -qO- http://localhost:5000/api/setup/status

# Should return: {"needsSetup":true} or {"needsSetup":false}
```

### Access Application

Visit: **https://test.digile.com**

Should work normally with external database!

---

## 🔧 Troubleshooting

### Issue: Can't Connect to External Database

**Check 1: Firewall Rules**

Make sure your database allows connections from your server IP:

- **DigitalOcean**: Add server IP to "Trusted Sources"
- **AWS RDS**: Update Security Group inbound rules
- **Azure**: Update firewall rules

**Check 2: SSL Mode**

Try different SSL modes in .env:

```env
# Try without SSL (only if database supports it)
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=disable

# Or require SSL
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
```

**Check 3: Connection String Format**

Make sure your DATABASE_URL is correctly formatted:

```
postgresql://username:password@host:port/database?sslmode=require
```

**Special characters in password?** URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `&` → `%26`

Example:
```env
# Password with @ symbol: Pass@word123
DATABASE_URL=postgresql://user:Pass%40word123@host:port/db?sslmode=require
```

### Issue: Database Migrations Fail

```bash
# Run migrations manually
docker compose -f docker-compose.ssl-external-db.yml exec app npm run db:push

# Check output for errors
```

### Issue: SSL Certificate Errors

```bash
# Try disabling SSL verification temporarily (NOT for production)
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=no-verify

# Or download CA certificate from your provider and mount it
```

---

## 📊 Database Providers Comparison

| Provider | Starting Price | SSL | Backups | Best For |
|----------|---------------|-----|---------|----------|
| **DigitalOcean** | $15/month | ✅ | Daily | Small-medium apps |
| **AWS RDS** | ~$15/month | ✅ | Automated | Enterprise apps |
| **Neon** | Free tier | ✅ | Point-in-time | Serverless apps |
| **Supabase** | Free tier | ✅ | Daily | Full-stack apps |
| **Azure Database** | ~$20/month | ✅ | Automated | Azure ecosystem |
| **Google Cloud SQL** | ~$15/month | ✅ | Automated | GCP ecosystem |

---

## 🔄 Managing Commands

### Start Application
```bash
docker compose -f docker-compose.ssl-external-db.yml up -d
```

### Stop Application
```bash
docker compose -f docker-compose.ssl-external-db.yml down
```

### View Logs
```bash
docker compose -f docker-compose.ssl-external-db.yml logs -f app
```

### Rebuild
```bash
docker compose -f docker-compose.ssl-external-db.yml up -d --build
```

### Run Database Migrations
```bash
docker compose -f docker-compose.ssl-external-db.yml exec app npm run db:push
```

---

## 🎯 Quick Setup Examples

### DigitalOcean Managed Database

1. **Create database** in DigitalOcean control panel
2. **Get connection details** from database dashboard
3. **Update .env:**
   ```env
   DATABASE_URL=postgresql://doadmin:password@db-postgresql-nyc1-12345.ondigitalocean.com:25060/defaultdb?sslmode=require
   DOMAIN=test.digile.com
   LETSENCRYPT_EMAIL=admin@digile.com
   SESSION_SECRET=your_secret_here
   ```
4. **Add your server IP** to Trusted Sources in database settings
5. **Deploy:**
   ```bash
   docker compose -f docker-compose.ssl-external-db.yml up -d --build
   ```

### AWS RDS

1. **Create RDS instance** (PostgreSQL 15)
2. **Enable public access** or configure VPC
3. **Update security group** to allow port 5432 from your server IP
4. **Update .env:**
   ```env
   DATABASE_URL=postgresql://postgres:password@mydb.abc123.us-east-1.rds.amazonaws.com:5432/asset_management?sslmode=require
   ```
5. **Deploy:**
   ```bash
   docker compose -f docker-compose.ssl-external-db.yml up -d --build
   ```

### Neon (Serverless)

1. **Sign up** at neon.tech
2. **Create project** and get connection string
3. **Update .env:**
   ```env
   DATABASE_URL=postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Deploy:**
   ```bash
   docker compose -f docker-compose.ssl-external-db.yml up -d --build
   ```

---

## 🔒 Security Best Practices

1. **Use SSL/TLS**: Always set `?sslmode=require` in DATABASE_URL
2. **IP Whitelisting**: Only allow your server IP to access the database
3. **Strong Passwords**: Use long, random passwords for database user
4. **Rotate Credentials**: Change database passwords periodically
5. **Backups**: Enable automatic backups on your database provider
6. **Monitoring**: Set up alerts for connection issues

---

## 📝 Notes

- **No volume persistence needed** - Data is stored in external database
- **Easier backups** - Managed by database provider
- **Better scalability** - Database can be scaled independently
- **Higher availability** - Managed databases have built-in redundancy
- **Cost** - External databases cost money but provide more features

---

**✅ External database setup complete! Your application data is now managed by a professional database provider.**
