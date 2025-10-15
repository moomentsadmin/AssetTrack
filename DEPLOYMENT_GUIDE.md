# 🚀 Asset Management System - Complete Deployment Guide

Comprehensive deployment guide for the Asset Management System across all major platforms.

---

## 📋 Table of Contents

1. [Quick Start (Docker with SSL)](#quick-start-docker-with-ssl)
2. [Docker Deployments](#docker-deployments)
   - [Docker with Let's Encrypt SSL](#docker-with-lets-encrypt-ssl)
   - [Docker with External Database](#docker-with-external-database)
   - [Docker Compose (Development)](#docker-compose-development)
3. [Cloud Platform Deployments](#cloud-platform-deployments)
   - [AWS (EC2 + RDS)](#aws-ec2--rds)
   - [AWS (Elastic Beanstalk)](#aws-elastic-beanstalk)
   - [Azure (App Service)](#azure-app-service)
   - [Google Cloud Platform (GCP)](#google-cloud-platform)
   - [DigitalOcean (App Platform)](#digitalocean-app-platform)
   - [DigitalOcean (Droplet + Database)](#digitalocean-droplet--database)
   - [Heroku](#heroku)
4. [Traditional Server Deployment](#traditional-server-deployment)
   - [Ubuntu + Nginx + PM2](#ubuntu--nginx--pm2)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Security & Best Practices](#security--best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start (Docker with SSL)

**Deploy in 5 minutes with automatic SSL certificates:**

### Prerequisites
- Ubuntu/Debian server with Docker installed
- Domain name pointing to your server
- Ports 80 and 443 open

### Deployment Steps

```bash
# 1. Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# 2. Run automated setup
chmod +x setup-ssl.sh
./setup-ssl.sh

# 3. Access your app
# https://yourdomain.com
```

That's it! The setup script handles:
- ✅ Environment configuration
- ✅ SSL certificate generation (Let's Encrypt)
- ✅ Database setup
- ✅ Container orchestration
- ✅ Automatic certificate renewal

---

## 🐳 Docker Deployments

### Docker with Let's Encrypt SSL

**Production-ready deployment with automatic SSL certificates on port 443.**

#### Prerequisites
- Docker & Docker Compose installed
- Domain name with DNS configured
- Ports 80 and 443 open in firewall

#### Step 1: Configure Environment

```bash
# Copy environment template
cp .env.ssl.example .env

# Edit configuration
nano .env
```

**Required `.env` configuration:**
```env
# Domain Configuration
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# Database
PGUSER=asset_user
PGPASSWORD=your_secure_password_here
PGDATABASE=asset_management

# Application
SESSION_SECRET=your_secure_random_32_char_secret

# Traefik Dashboard (optional)
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$...
```

**Generate secure SESSION_SECRET:**
```bash
openssl rand -base64 32
```

**Generate Traefik password:**
```bash
# Install htpasswd
sudo apt install apache2-utils

# Generate password hash
htpasswd -nB admin
# Output: admin:$2y$05$xyz...
# Copy to .env and escape $ with $$
```

#### Step 2: Configure DNS

**Add these DNS A records at your domain registrar:**

| Type | Name    | Value              | TTL  |
|------|---------|--------------------|------|
| A    | @       | YOUR_SERVER_IP     | 3600 |
| A    | www     | YOUR_SERVER_IP     | 3600 |
| A    | traefik | YOUR_SERVER_IP     | 3600 |

**Verify DNS:**
```bash
dig yourdomain.com +short
# Should show your server IP
```

⚠️ **Important:** If using Cloudflare, disable the proxy (set to DNS only - gray cloud icon). Let's Encrypt needs direct access to your server.

#### Step 3: Deploy

```bash
# Start containers
docker-compose -f docker-compose.ssl.yml up -d

# Watch certificate generation (Ctrl+C to exit)
docker-compose -f docker-compose.ssl.yml logs -f traefik
```

**Wait for:**
```
✅ "Certificates obtained for yourdomain.com"
```

#### Step 4: Access Application

- **Main App:** https://yourdomain.com
- **Traefik Dashboard:** https://traefik.yourdomain.com (with authentication)

#### Step 5: First-Time Setup

1. Navigate to https://yourdomain.com
2. Complete first-time admin account creation
3. Start managing assets!

#### Management Commands

```bash
# View logs
docker-compose -f docker-compose.ssl.yml logs -f

# Restart containers
docker-compose -f docker-compose.ssl.yml restart

# Stop containers
docker-compose -f docker-compose.ssl.yml down

# Update application
git pull
docker-compose -f docker-compose.ssl.yml build --no-cache
docker-compose -f docker-compose.ssl.yml up -d
```

---

### Docker with External Database

**Use managed database services (AWS RDS, Azure Database, etc.)**

#### Configuration

Edit `docker-compose.ssl.yml` and **remove the `db` service**, then update `.env`:

```env
# External Database Configuration
DATABASE_URL=postgresql://user:password@external-db-host.com:5432/asset_db
PGHOST=external-db-host.com
PGPORT=5432
PGDATABASE=asset_db
PGUSER=your_db_user
PGPASSWORD=your_db_password

# Application
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com
SESSION_SECRET=your_secure_secret
```

#### Deploy

```bash
# Start containers (without database)
docker-compose -f docker-compose.ssl.yml up -d

# Migrations run automatically on startup
```

---

### Docker Compose (Development)

**Quick local development setup (no SSL):**

```bash
# Copy environment
cp .env.example .env

# Edit .env with development settings
nano .env

# Start services
docker-compose up -d

# Access app
http://localhost:5000
```

---

## ☁️ Cloud Platform Deployments

### AWS (EC2 + RDS)

**Deploy on AWS with managed database.**

#### Step 1: Create RDS PostgreSQL Database

1. **AWS Console** → **RDS** → **Create database**
2. Configuration:
   - Engine: PostgreSQL 15
   - Template: Production
   - DB instance: db.t3.micro (or larger)
   - Database name: `asset_management`
   - Master username: `asset_admin`
   - Master password: [secure password]
   - Public access: No
   - VPC security group: Create new
3. Note the endpoint: `xxx.rds.amazonaws.com`

#### Step 2: Launch EC2 Instance

1. **AWS Console** → **EC2** → **Launch Instance**
2. Configuration:
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.small (or larger)
   - Key pair: Create new or use existing
   - Security group:
     - Port 22 (SSH) - Your IP only
     - Port 80 (HTTP) - 0.0.0.0/0
     - Port 443 (HTTPS) - 0.0.0.0/0
3. Launch and note the public IP

#### Step 3: Configure RDS Security Group

1. **RDS Security Group** → **Inbound Rules**
2. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: EC2 security group ID

#### Step 4: Deploy Application

SSH into EC2 instance:

```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@ec2-public-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# Configure environment
cp .env.ssl.example .env
nano .env
```

**`.env` configuration:**
```env
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# RDS Database
DATABASE_URL=postgresql://asset_admin:password@your-rds-endpoint.rds.amazonaws.com:5432/asset_management
PGHOST=your-rds-endpoint.rds.amazonaws.com
PGPORT=5432
PGDATABASE=asset_management
PGUSER=asset_admin
PGPASSWORD=your_rds_password

SESSION_SECRET=$(openssl rand -base64 32)
```

**Remove internal database from `docker-compose.ssl.yml`:**
```bash
# Edit docker-compose.ssl.yml
nano docker-compose.ssl.yml

# Remove the entire 'db:' service section
# Remove 'db' from networks in asset-app
```

**Deploy:**
```bash
# Start containers
docker-compose -f docker-compose.ssl.yml up -d

# Check logs
docker-compose -f docker-compose.ssl.yml logs -f
```

#### Step 5: Configure DNS

Point your domain to the EC2 public IP:
- **A record:** `@` → EC2 public IP
- **A record:** `www` → EC2 public IP

---

### AWS (Elastic Beanstalk)

**Managed deployment on AWS.**

#### Step 1: Prepare Application

Create `Dockerrun.aws.json`:

```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "your-dockerhub-username/asset-tracker",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": 5000
    }
  ],
  "Environment": [
    {
      "Name": "NODE_ENV",
      "Value": "production"
    }
  ]
}
```

#### Step 2: Build and Push Docker Image

```bash
# Build image
docker build -t your-username/asset-tracker .

# Push to Docker Hub
docker login
docker push your-username/asset-tracker
```

#### Step 3: Create Elastic Beanstalk Application

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker asset-management

# Create environment
eb create asset-management-prod

# Deploy
eb deploy
```

#### Step 4: Configure Environment Variables

```bash
eb setenv \
  DATABASE_URL=postgresql://... \
  SESSION_SECRET=your-secret \
  NODE_ENV=production
```

#### Step 5: Access Application

```bash
eb open
```

---

### Azure (App Service)

**Deploy on Microsoft Azure.**

#### Step 1: Create Azure Database for PostgreSQL

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create resource group
az group create --name AssetManagementRG --location eastus

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group AssetManagementRG \
  --name asset-db-server \
  --location eastus \
  --admin-user assetadmin \
  --admin-password YourSecurePassword123! \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15

# Create database
az postgres flexible-server db create \
  --resource-group AssetManagementRG \
  --server-name asset-db-server \
  --database-name asset_management
```

#### Step 2: Create App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name AssetManagementPlan \
  --resource-group AssetManagementRG \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group AssetManagementRG \
  --plan AssetManagementPlan \
  --name asset-management-app \
  --deployment-container-image-name your-username/asset-tracker:latest
```

#### Step 3: Configure Environment Variables

```bash
az webapp config appsettings set \
  --resource-group AssetManagementRG \
  --name asset-management-app \
  --settings \
    DATABASE_URL="postgresql://assetadmin:YourSecurePassword123!@asset-db-server.postgres.database.azure.com:5432/asset_management" \
    SESSION_SECRET="your_secure_secret" \
    NODE_ENV="production"
```

#### Step 4: Enable Continuous Deployment

```bash
az webapp deployment container config \
  --resource-group AssetManagementRG \
  --name asset-management-app \
  --enable-cd true
```

#### Step 5: Access Application

```bash
az webapp browse --resource-group AssetManagementRG --name asset-management-app
```

---

### Google Cloud Platform

**Deploy on Google Cloud.**

#### Step 1: Create Cloud SQL PostgreSQL Instance

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Initialize
gcloud init

# Create Cloud SQL instance
gcloud sql instances create asset-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create asset_management --instance=asset-db

# Create user
gcloud sql users create assetuser \
  --instance=asset-db \
  --password=YourSecurePassword123!
```

#### Step 2: Build Container Image

```bash
# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/asset-tracker
```

#### Step 3: Deploy to Cloud Run

```bash
# Deploy container
gcloud run deploy asset-management \
  --image gcr.io/YOUR_PROJECT_ID/asset-tracker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:asset-db \
  --set-env-vars DATABASE_URL="postgresql://assetuser:YourSecurePassword123!@/asset_management?host=/cloudsql/YOUR_PROJECT_ID:us-central1:asset-db" \
  --set-env-vars SESSION_SECRET="your_secure_secret" \
  --set-env-vars NODE_ENV="production"
```

#### Step 4: Configure Custom Domain (Optional)

```bash
gcloud run domain-mappings create \
  --service asset-management \
  --domain yourdomain.com \
  --region us-central1
```

---

### DigitalOcean (App Platform)

**Managed deployment on DigitalOcean.**

#### Step 1: Create Database

1. **DigitalOcean Console** → **Databases** → **Create**
2. Configuration:
   - Engine: PostgreSQL 15
   - Plan: Basic ($15/mo)
   - Datacenter: Choose closest to users
   - Database name: `asset_management`
3. Note the connection string

#### Step 2: Create App

1. **Apps** → **Create App**
2. Source: GitHub repository
3. Configuration:
   - Name: `asset-management`
   - Branch: `main`
   - Build command: (auto-detected)
   - Run command: `npm start`
   - HTTP port: `5000`

#### Step 3: Configure Environment Variables

**App Settings** → **Environment Variables:**

```env
DATABASE_URL=${db.DATABASE_URL}
SESSION_SECRET=your_secure_secret
NODE_ENV=production
```

#### Step 4: Attach Database

**App Settings** → **Add Resource** → Select your database

#### Step 5: Deploy

Click **Deploy** and wait for build to complete.

---

### DigitalOcean (Droplet + Database)

**Full control with Droplet and Managed Database.**

#### Step 1: Create Managed PostgreSQL Database

1. **Databases** → **Create Database**
2. PostgreSQL 15, Basic plan
3. Note connection details

#### Step 2: Create Droplet

1. **Droplets** → **Create**
2. Configuration:
   - OS: Ubuntu 22.04
   - Plan: Basic $12/mo (2GB RAM)
   - Datacenter: Same as database
   - Add SSH key
3. Create and note IP address

#### Step 3: Configure Firewall

**Networking** → **Firewalls** → **Create Firewall:**
- **Inbound Rules:**
  - SSH (22) - Your IP
  - HTTP (80) - All
  - HTTPS (443) - All
- **Apply to:** Your droplet

#### Step 4: Deploy Application

SSH into droplet:

```bash
ssh root@droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# Configure environment
cp .env.ssl.example .env
nano .env
```

**`.env` configuration:**
```env
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# DigitalOcean Managed Database
DATABASE_URL=your_digitalocean_database_url
PGHOST=db-postgresql-nyc3-12345-do-user-123456-0.b.db.ondigitalocean.com
PGPORT=25060
PGDATABASE=asset_management
PGUSER=doadmin
PGPASSWORD=your_database_password

SESSION_SECRET=$(openssl rand -base64 32)
```

**Remove internal database:**
```bash
# Edit docker-compose.ssl.yml and remove 'db' service
nano docker-compose.ssl.yml
```

**Deploy:**
```bash
docker-compose -f docker-compose.ssl.yml up -d
```

---

### Heroku

**Quick deployment on Heroku.**

#### Step 1: Prepare Application

Create `Procfile`:
```
web: npm start
```

Create `heroku.yml`:
```yaml
build:
  docker:
    web: Dockerfile
run:
  web: npm start
```

#### Step 2: Create Heroku App

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create asset-management-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini
```

#### Step 3: Configure Environment

```bash
heroku config:set \
  NODE_ENV=production \
  SESSION_SECRET=$(openssl rand -base64 32)
```

#### Step 4: Deploy

```bash
# Set stack to container
heroku stack:set container

# Deploy
git push heroku main
```

#### Step 5: Run Migrations

```bash
heroku run npm run db:push
```

#### Step 6: Access Application

```bash
heroku open
```

---

## 🖥️ Traditional Server Deployment

### Ubuntu + Nginx + PM2

**Deploy on bare metal or VPS without Docker.**

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2
```

#### Step 2: Database Setup

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE asset_management;
CREATE USER asset_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;
\q
```

#### Step 3: Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# Install dependencies
npm ci

# Create environment file
nano .env
```

**`.env` configuration:**
```env
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://asset_user:your_secure_password@localhost:5432/asset_management
PGHOST=localhost
PGPORT=5432
PGDATABASE=asset_management
PGUSER=asset_user
PGPASSWORD=your_secure_password

SESSION_SECRET=your_secure_session_secret_min_32_chars
```

#### Step 4: Build Application

```bash
# Run migrations
npm run db:push

# Build application
npm run build

# Test production build
npm start
```

#### Step 5: PM2 Process Manager

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'asset-management',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '500M'
  }]
};
```

**Start with PM2:**
```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd
# Run the command it outputs

# Verify
pm2 status
pm2 logs
```

#### Step 6: Nginx Reverse Proxy

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/asset-management
```

**Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: SSL with Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

#### Step 8: Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
```

#### Management Commands

```bash
# PM2 commands
pm2 restart asset-management
pm2 stop asset-management
pm2 logs asset-management
pm2 monit

# Nginx commands
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t

# Update application
cd AssetTrackr
git pull
npm ci
npm run build
pm2 restart asset-management
```

---

## ⚙️ Environment Configuration

### Required Environment Variables

```env
# Application
NODE_ENV=production
PORT=5000

# Domain (for Docker SSL deployment)
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
PGHOST=localhost
PGPORT=5432
PGDATABASE=asset_management
PGUSER=asset_user
PGPASSWORD=your_secure_password

# Security
SESSION_SECRET=your_secure_random_32_character_secret

# Traefik Dashboard (Docker SSL only)
TRAEFIK_DASHBOARD_AUTH=admin:hashed_password
```

### Generate Secure Secrets

```bash
# Generate SESSION_SECRET (32+ characters)
openssl rand -base64 32

# Generate password hash for Traefik
htpasswd -nB admin
# Copy output and escape $ with $$ in .env
```

---

## 💾 Database Setup

### PostgreSQL Installation

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Docker:**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=asset_management \
  -p 5432:5432 \
  postgres:15-alpine
```

### Database Creation

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE asset_management;
CREATE USER asset_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;

# Grant schema privileges (PostgreSQL 15+)
\c asset_management
GRANT ALL ON SCHEMA public TO asset_user;
\q
```

### Connection String Format

```
postgresql://username:password@hostname:5432/database_name
```

**Examples:**
- Local: `postgresql://asset_user:password@localhost:5432/asset_management`
- AWS RDS: `postgresql://admin:pass@xxx.rds.amazonaws.com:5432/asset_management`
- DigitalOcean: `postgresql://doadmin:pass@db-postgresql-nyc3-12345.db.ondigitalocean.com:25060/asset_management`

### Managed Database Services

**AWS RDS:**
- Engine: PostgreSQL 15
- Instance: db.t3.micro (free tier) or larger
- Storage: 20GB SSD
- Backup retention: 7 days

**Azure Database for PostgreSQL:**
- Version: 15
- Tier: Burstable (B1ms) or General Purpose
- Storage: 32GB
- Backup: Geo-redundant

**DigitalOcean Managed Database:**
- Version: PostgreSQL 15
- Plan: Basic $15/mo or Production $60/mo
- Automatic backups: Daily
- Connection pooling: Available

**Google Cloud SQL:**
- Version: PostgreSQL 15
- Tier: db-f1-micro or db-g1-small
- Storage: 10GB SSD
- Automated backups: Enabled

---

## 🔒 Security & Best Practices

### Security Checklist

- [ ] **Strong Passwords:** Use 32+ character random strings for all secrets
- [ ] **Environment Variables:** Never commit `.env` to version control
- [ ] **SSL/TLS:** Always use HTTPS in production
- [ ] **Firewall:** Restrict database access to application servers only
- [ ] **Regular Updates:** Keep dependencies and OS packages updated
- [ ] **Database Backups:** Automated daily backups with retention
- [ ] **Access Logs:** Monitor and review access logs regularly
- [ ] **Rate Limiting:** Implement rate limiting for API endpoints
- [ ] **CORS:** Configure CORS for production domains only
- [ ] **Security Headers:** Enable HSTS, CSP, X-Frame-Options

### SSL/TLS Configuration

**Docker (Traefik):**
- Automatic Let's Encrypt certificates
- TLS 1.2+ only
- Auto-renewal every 60 days
- A+ SSL Labs rating

**Nginx + Certbot:**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (runs twice daily)
sudo systemctl status certbot.timer
```

### Database Security

**PostgreSQL Hardening:**
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Restrict connections
listen_addresses = 'localhost'  # or specific IP

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Use md5 or scram-sha-256 authentication
host    all    all    127.0.0.1/32    scram-sha-256

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**Managed Databases:**
- Enable SSL/TLS connections
- Use VPC peering or private endpoints
- Implement IP allowlisting
- Enable encryption at rest
- Configure automated backups

### Application Security

**Environment Variables:**
```bash
# Never commit secrets
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Use different secrets per environment
.env.development
.env.staging
.env.production
```

**Session Security:**
```env
# Use secure session configuration
SESSION_SECRET=very_long_random_string_min_32_chars
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=strict
```

### Backup Strategy

**Automated Backups:**
```bash
# Create backup script
nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
mkdir -p $BACKUP_DIR

pg_dump -U asset_user asset_management | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

```bash
# Make executable
chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /usr/local/bin/backup-db.sh
```

**Docker Backups:**
```bash
# Backup database container
docker-compose -f docker-compose.ssl.yml exec db pg_dump -U asset_user asset_management > backup.sql

# Restore
cat backup.sql | docker-compose -f docker-compose.ssl.yml exec -T db psql -U asset_user asset_management
```

---

## 🔧 Troubleshooting

### Common Issues

#### SSL Certificate Errors

**Problem:** "Your connection is not private" or `NET::ERR_CERT_AUTHORITY_INVALID`

**Solution:**
```bash
# Check DNS points to server
dig yourdomain.com +short

# Remove old certificates
docker-compose -f docker-compose.ssl.yml down
rm -rf letsencrypt/
docker-compose -f docker-compose.ssl.yml up -d

# Watch certificate generation
docker-compose -f docker-compose.ssl.yml logs -f traefik
```

#### Database Connection Failed

**Problem:** `ECONNREFUSED` or `Connection timeout`

**Solution:**
```bash
# Test database connection
psql "postgresql://user:pass@host:5432/dbname"

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check firewall allows connections
sudo ufw status

# Verify .env DATABASE_URL is correct
cat .env | grep DATABASE_URL
```

#### Application Won't Start

**Problem:** Container keeps restarting or app crashes

**Solution:**
```bash
# Check logs
docker-compose -f docker-compose.ssl.yml logs asset-app

# Common issues:
# - Missing environment variables
# - Database not accessible
# - Port already in use
# - Build failed

# Rebuild from scratch
docker-compose -f docker-compose.ssl.yml down
docker-compose -f docker-compose.ssl.yml build --no-cache
docker-compose -f docker-compose.ssl.yml up -d
```

#### 404 Page Not Found (Traefik)

**Problem:** Traefik shows 404 error

**Solution:**
```bash
# Verify DOMAIN is set in .env
cat .env | grep DOMAIN

# Check Traefik routing labels
docker inspect asset-app | grep -i "traefik.http.routers"

# Should show: Host(`yourdomain.com`)

# Restart Traefik
docker-compose -f docker-compose.ssl.yml restart traefik
```

#### PM2 Application Crashes

**Problem:** Application crashes or restarts frequently

**Solution:**
```bash
# Check logs
pm2 logs asset-management

# Monitor resources
pm2 monit

# Increase memory limit
pm2 delete asset-management
pm2 start ecosystem.config.js --max-memory-restart 1G

# Check for errors
pm2 describe asset-management
```

### Health Checks

**Docker:**
```bash
# Check all services
docker-compose -f docker-compose.ssl.yml ps

# Check specific service
docker-compose -f docker-compose.ssl.yml logs asset-app

# Exec into container
docker-compose -f docker-compose.ssl.yml exec asset-app sh
```

**Application:**
```bash
# Test application endpoint
curl http://localhost:5000

# Test with SSL
curl https://yourdomain.com

# Check database connectivity
docker-compose -f docker-compose.ssl.yml exec db psql -U asset_user -d asset_management -c "SELECT version();"
```

**Nginx:**
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Optimization

**Database:**
```sql
-- Create indexes for better performance
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX idx_audit_created ON audit_trail(created_at);
```

**Application:**
```bash
# Enable PM2 cluster mode for load balancing
pm2 start ecosystem.config.js -i max

# Monitor performance
pm2 monit
```

**Nginx Caching:**
```nginx
# Add to nginx config
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 📊 Monitoring & Maintenance

### Log Management

**Docker Logs:**
```bash
# View logs
docker-compose -f docker-compose.ssl.yml logs -f

# Limit log size (add to docker-compose.ssl.yml)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**PM2 Logs:**
```bash
# View logs
pm2 logs

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Monitoring Tools

**PM2 Plus (Optional):**
```bash
pm2 link <secret> <public>
```

**Uptime Monitoring:**
- UptimeRobot (free)
- Pingdom
- StatusCake

**Error Tracking:**
- Sentry
- LogRocket
- Bugsnag

### Maintenance Tasks

**Weekly:**
- Check disk space: `df -h`
- Review error logs
- Monitor application performance
- Check SSL certificate expiry

**Monthly:**
- Update dependencies: `npm update`
- Security audit: `npm audit`
- Database maintenance: `VACUUM ANALYZE`
- Review backup integrity

**Quarterly:**
- OS security updates
- Review and update firewall rules
- Database performance tuning
- Load testing

---

## 🚀 Scaling Considerations

### Horizontal Scaling

**Load Balancer + Multiple Instances:**
```yaml
# docker-compose.scale.yml
services:
  app:
    deploy:
      replicas: 3
    
  load-balancer:
    image: nginx
    depends_on:
      - app
```

### Database Scaling

**Read Replicas:**
- AWS RDS: Enable read replicas
- Azure: Geo-replication
- PostgreSQL: Streaming replication

**Connection Pooling:**
- PgBouncer
- pgpool-II
- Application-level pooling

### CDN Integration

**Static Assets:**
- CloudFront (AWS)
- Azure CDN
- Cloudflare

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Let's Encrypt](https://letsencrypt.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Nginx Documentation](https://nginx.org/en/docs)
- [PM2 Documentation](https://pm2.keymetrics.io)

---

## 🆘 Support

For deployment assistance:
1. Check this guide's troubleshooting section
2. Review application logs
3. Consult cloud provider documentation
4. Open an issue on GitHub

---

**🎉 Congratulations! Your Asset Management System is now deployed and ready for production use!**
