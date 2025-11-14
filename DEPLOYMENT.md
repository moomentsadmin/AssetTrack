# Production Deployment Guide

Complete guide for deploying the Asset Management System to production environments.

## Table of Contents

1. [Ubuntu Server Deployment](#ubuntu-server-deployment)
2. [Docker Deployment](#docker-deployment)
3. [AWS Deployment](#aws-deployment)
4. [Digital Ocean Deployment](#digital-ocean-deployment)
5. [Azure Deployment](#azure-deployment)
6. [Database Options](#database-options)
7. [Environment Variables](#environment-variables)
8. [Security Best Practices](#security-best-practices)

---

## Ubuntu Server Deployment

### Prerequisites

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2
```

### Database Setup

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create production database and user
CREATE DATABASE asset_management_prod;
CREATE USER asset_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE asset_management_prod TO asset_user;
\q
```

### Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/AssetTrack.git
cd AssetTrack

# Install all dependencies (needed for build)
npm install

# Create environment file
cp .env.example .env.production
nano .env.production
```

**`.env.production`:**
```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://asset_user:your_secure_password@localhost:5432/asset_management_prod

# Security
SESSION_SECRET=your_secure_session_secret_min_32_chars
```

### Build Application & Database Migrations

**Important**: The `drizzle-kit push` command (`npm run db:push`) is not safe for production as it can cause data loss. Use the following migration workflow instead.

First, add a migration generation script to your `package.json`:
```json
"scripts": {
  "db:generate": "drizzle-kit generate"
}
```

**Migration Workflow:**
1.  **Generate Migration Files**: After making schema changes, generate SQL migration files.
    ```bash
    npm run db:generate
    ```
    This creates a new SQL file in the `drizzle` folder. Review this file to ensure it is correct.

2.  **Apply Migrations Manually**: Connect to your production database and run the SQL from the generated migration file.
    ```bash
    # Example of applying a migration file with psql
    sudo -u postgres psql -d asset_management_prod -f drizzle/0001_migration.sql
    ```

3.  **Build the Application**:
    ```bash
    # Build the application (compiles TypeScript)
    npm run build

    # Optional: Remove dev dependencies to save space
    npm prune --production
    ```

### PM2 Process Management

Create `ecosystem.config.cjs` (note the `.cjs` extension for modern Node versions):

```javascript
module.exports = {
  apps: [{
    name: 'asset-management',
    script: 'npm',
    args: 'start',
    instances: 'max',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M'
  }]
};
```

> **Note**: The `npm start` command runs `node dist/index.js` which is the compiled production code.

Start the application:

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Generate startup script (auto-start on reboot)
pm2 startup systemd
# Run the command it outputs with sudo

# Monitor
pm2 monit

# View logs
pm2 logs asset-management
```

### Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/asset-management
```

```nginx
upstream nodejs_backend {
    least_conn;
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/asset_management_access.log;
    error_log /var/log/nginx/asset_management_error.log;

    # Max upload size
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy to Node.js
    location / {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and SSL:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Install Let's Encrypt SSL
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Firewall Setup

```bash
# Enable firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U asset_user asset_management_prod | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable and add to cron
sudo chmod +x /usr/local/bin/backup-db.sh
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

---

## Docker Deployment

### Quick Start with Docker Compose

The repository includes ready-to-use Docker configuration files:
- `Dockerfile` - Multi-stage build for production
- `docker-compose.yml` - Complete stack with PostgreSQL
- `.env.example` - Environment template

**Steps:**

```bash
# 1. Clone repository
git clone https://github.com/yourusername/AssetTrack.git
cd AssetTrack

# 2. Create environment file
cp .env.example .env

# 3. Edit .env with your settings (required)
nano .env
# Update: DB_PASSWORD, SESSION_SECRET (generate with: openssl rand -base64 32)

# 4. Start with Docker Compose
docker compose up -d

# 5. Check logs
docker compose logs -f app

# 6. Access application
# http://localhost:5000
```

**Managing the Stack:**

```bash
# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f

# Rebuild after code changes
docker compose up -d --build
```

### Production Migration Workflow with Docker

The `drizzle-kit push` command is not safe for production. Use the following workflow to manage database migrations with Docker.

First, add a migration generation script to your `package.json`:
```json
"scripts": {
  "db:generate": "drizzle-kit generate"
}
```

**Workflow:**
1.  **Generate Migration Files**: After making schema changes, generate SQL migration files on your local machine.
    ```bash
    npm run db:generate
    ```
    This creates a new SQL file in the `drizzle` folder. Review this file to ensure it is correct.

2.  **Apply Migrations in Docker**: Copy the migration file to the running container and apply it using `psql`.
    ```bash
    # Copy the migration file to the db container
    docker cp drizzle/0001_migration.sql asset-db:/tmp/migration.sql

    # Execute the migration inside the container
    docker compose exec db psql -U asset_user -d asset_management -f /tmp/migration.sql
    ```

3.  **Build and Deploy**: If the migration is successful, build and deploy the updated application code.
    ```bash
    docker compose up -d --build
    ```

### Option 1: Docker with Internal Database (Manual)

**`docker-compose.yml`:** (already included in repository)

```yaml
# See docker-compose.yml in repository root
```

**`.env` file:**

```env
DB_PASSWORD=your_secure_password
SESSION_SECRET=your_session_secret_min_32_chars
```

Traefik / Let's Encrypt notes (optional)
-------------------------

If you plan to use the provided `docker-compose.ssl.yml` (Traefik + Let's Encrypt), set the following variables in your `.env` or `.env.production` file:

- `DOMAIN` - the primary domain name for the application (e.g. `example.com`). Traefik will request certificates for `DOMAIN` and `www.DOMAIN`.
- `LETSENCRYPT_EMAIL` - email used for Let's Encrypt account registration and recovery.
- `TRAEFIK_DASHBOARD_AUTH` - optional basic auth string for Traefik dashboard (use `htpasswd -nB user` to generate). Example: `admin:$2y$05$...`
- `ENABLE_DEFAULT_ADMIN` - by default the app will NOT seed credentials. Set this to `true` to permit automatic creation of a default admin on first startup (only use for testing).

Notes:
- Traefik needs ports `80` and `443` available on the host for ACME to complete.
- For testing, consider using the ACME staging server (to avoid rate limits) by setting the `--certificatesresolvers...acme.caserver` option in the Traefik service to `https://acme-staging-v02.api.letsencrypt.org/directory`.


### Option 2: Docker with External Database

**`docker-compose.production.yml`:** (Use this for external DB)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: asset-app
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      SESSION_SECRET: ${SESSION_SECRET}
    env_file:
      - .env.production
```

**`.env.production`:**

```env
# External Database (RDS, Digital Ocean, etc.)
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your_session_secret
```

> **Production enforcement:** The server will refuse to start when `NODE_ENV=production` if `SESSION_SECRET` is missing or too short. Automatic creation of a default admin account is disabled by default — enable it only for testing by setting `ENABLE_DEFAULT_ADMIN=true` in your environment (do not enable in public production).

```bash
# Run with external DB
docker compose -f docker-compose.production.yml up -d

# Apply migrations manually against your external database before deploying
```

---

## AWS Deployment

### Option 1: AWS EC2 + RDS PostgreSQL

#### 1. Create RDS Instance

1. Go to AWS RDS Console → Create Database
2. Choose **PostgreSQL** (version 15 or 16)
3. Template: **Production** or **Free Tier** (for testing)
4. Settings:
   - DB Instance Identifier: `asset-management-db`
   - Master username: `postgres`
   - Master password: (secure password)
5. Instance configuration:
   - db.t3.micro (free tier) or larger
6. Storage: 20GB SSD (with auto-scaling if needed)
7. Connectivity:
   - VPC: Default or custom
   - Public access: **No** (recommended for production, access via EC2)
   - Security group: Create new or use existing
8. Database options:
   - Initial database name: `asset_management`

#### 2. Configure Security Group

**RDS Security Group Inbound Rules:**
- Type: PostgreSQL
- Protocol: TCP
- Port: 5432
- Source: Your EC2 instance's security group ID.

#### 3. Launch EC2 Instance

1. Launch EC2 instance (Ubuntu 22.04)
2. Configure security group:
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - HTTPS (443) from anywhere
3. SSH into instance:

```bash
ssh -i keypair.pem ubuntu@<ec2-public-ip>
```

4. Follow [Ubuntu Server Deployment](#ubuntu-server-deployment) steps above.
5. Update `.env.production` with RDS endpoint:

```env
DATABASE_URL=postgresql://postgres:YOUR_RDS_PASSWORD@your-db.region.rds.amazonaws.com:5432/asset_management
```

---

## Digital Ocean Deployment

**(Coming Soon)** This section will provide a step-by-step guide for deploying to a Digital Ocean Droplet with a managed PostgreSQL database. The process is similar to the Ubuntu and AWS RDS guides.

---

## Azure Deployment

**(Coming Soon)** This section will provide instructions for deploying to Azure, utilizing services like Azure App Service and Azure Database for PostgreSQL.

---
