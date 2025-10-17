# 🚀 Deployment Quick Reference

Fast reference guide for deploying Asset Management System to any platform.

---

## 📋 Choose Your Deployment

| Platform | Time | Cost/Month | Difficulty | Best For |
|----------|------|------------|------------|----------|
| **[DigitalOcean Droplet](#digitalocean-droplet)** | 10 min | $27 | ⭐ Easy | Small-Medium Teams |
| **[AWS EC2 + RDS](#aws-ec2--rds)** | 15 min | $15-40 | ⭐⭐ Medium | Enterprise, Scalable |
| **[Azure App Service](#azure-app-service)** | 15 min | $26-43 | ⭐⭐ Medium | Microsoft Ecosystem |
| **[Google Cloud Run](#google-cloud-run)** | 10 min | $17-37 | ⭐ Easy | Serverless, Auto-scale |
| **[Ubuntu Server](#ubuntu-server)** | 20 min | $5-10 | ⭐⭐⭐ Advanced | Full Control, Budget |

---

## ⚡ DigitalOcean Droplet

**Fastest deployment with managed database**

### Step 1: Create Database (2 min)
1. Go to: https://cloud.digitalocean.com/databases
2. PostgreSQL 15 → Basic $15/month
3. Add your server IP to Trusted Sources
4. Copy connection string

### Step 2: Create Droplet (3 min)
1. Ubuntu 22.04, Basic $12/month, 2GB RAM
2. Same region as database
3. Add SSH key

### Step 3: Deploy (5 min)
```bash
ssh root@droplet-ip
curl -fsSL https://get.docker.com | sh
git clone https://github.com/yourusername/AssetTrack.git
cd AssetTrack
cp .env.production.example .env
nano .env  # Add DATABASE_URL, DOMAIN, etc.
./deploy.sh
```

**✅ Done! Access: https://yourdomain.com**

**Full Guide:** [CLOUD_DEPLOYMENT_GUIDE.md#digitalocean-deployment](CLOUD_DEPLOYMENT_GUIDE.md#digitalocean-deployment)

---

## ⚡ AWS EC2 + RDS

**Enterprise-grade with free tier available**

### Step 1: Create RDS (5 min)
```bash
# Via AWS Console
1. RDS → PostgreSQL 15 → db.t3.micro (free tier)
2. Public access: Yes (temporarily)
3. Note endpoint and credentials
```

### Step 2: Launch EC2 (5 min)
```bash
# Via AWS Console
1. Ubuntu 22.04 → t2.small
2. Security: SSH (22), HTTP (80), HTTPS (443)
3. Allocate Elastic IP
4. Point DNS to Elastic IP
```

### Step 3: Deploy (5 min)
```bash
ssh -i key.pem ubuntu@elastic-ip
curl -fsSL https://get.docker.com | sh
git clone https://github.com/yourusername/AssetTrack.git
cd AssetTrack
cp .env.production.example .env
# Configure with RDS endpoint
./deploy.sh
```

**✅ Done! Access: https://yourdomain.com**

**Full Guide:** [CLOUD_DEPLOYMENT_GUIDE.md#aws-deployment](CLOUD_DEPLOYMENT_GUIDE.md#aws-deployment)

---

## ⚡ Azure App Service

**Seamless integration with Azure ecosystem**

### Quick Deploy (10 min)
```bash
az login
az group create --name AssetManagement --location eastus

# Create PostgreSQL
az postgres flexible-server create \
  --name assettrackr-db \
  --resource-group AssetManagement \
  --admin-user assetadmin \
  --admin-password 'SecurePass123!' \
  --sku-name Standard_B1ms

# Deploy App
az webapp create \
  --resource-group AssetManagement \
  --plan AssetTrackrPlan \
  --name assettrackr \
  --deployment-container-image-name yourusername/assettrackr:latest

# Configure
az webapp config appsettings set \
  --resource-group AssetManagement \
  --name assettrackr \
  --settings DATABASE_URL='...' NODE_TLS_REJECT_UNAUTHORIZED=0
```

**✅ Done! Access: https://assettrackr.azurewebsites.net**

**Full Guide:** [CLOUD_DEPLOYMENT_GUIDE.md#azure-deployment](CLOUD_DEPLOYMENT_GUIDE.md#azure-deployment)

---

## ⚡ Google Cloud Run

**Serverless with automatic scaling**

### Quick Deploy (10 min)
```bash
gcloud config set project YOUR_PROJECT

# Create Cloud SQL
gcloud sql instances create assettrackr-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Build & Deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT/assettrackr

gcloud run deploy assettrackr \
  --image gcr.io/YOUR_PROJECT/assettrackr \
  --add-cloudsql-instances YOUR_PROJECT:us-central1:assettrackr-db \
  --set-env-vars NODE_ENV=production,NODE_TLS_REJECT_UNAUTHORIZED=0 \
  --allow-unauthenticated
```

**✅ Done! Auto-scaled serverless deployment**

**Full Guide:** [CLOUD_DEPLOYMENT_GUIDE.md#google-cloud-deployment](CLOUD_DEPLOYMENT_GUIDE.md#google-cloud-deployment)

---

## ⚡ Ubuntu Server

**Full control, lowest cost**

### Option 1: Docker (Recommended)
```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Clone & Deploy
git clone https://github.com/yourusername/AssetTrack.git
cd AssetTrack
cp .env.production.example .env
nano .env  # Configure

# With local database
docker compose -f docker-compose.production.yml --profile local-db up -d --build

# OR with external database
docker compose -f docker-compose.production.yml up -d --build
```

### Option 2: Traditional (PM2 + Nginx)
```bash
# Install PostgreSQL
sudo apt install postgresql -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Clone & Setup
git clone https://github.com/yourusername/AssetTrack.git
cd AssetTrack
npm install
npm run build
npm run db:push

# Start with PM2
npm install -g pm2
pm2 start npm --name assettrackr -- start

# Setup Nginx + SSL
sudo apt install nginx certbot python3-certbot-nginx -y
# Configure Nginx (see full guide)
sudo certbot --nginx -d yourdomain.com
```

**Full Guide:** [CLOUD_DEPLOYMENT_GUIDE.md#ubuntu-server-deployment](CLOUD_DEPLOYMENT_GUIDE.md#ubuntu-server-deployment)

---

## 🗄️ Database Configuration

### Local PostgreSQL (Containerized)
```env
USE_EXTERNAL_DB=false
PGUSER=asset_user
PGPASSWORD=secure_password
PGDATABASE=asset_management
```

**Deploy:**
```bash
docker compose -f docker-compose.production.yml --profile local-db up -d --build
```

### External Managed Database
```env
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0  # For DigitalOcean, AWS RDS, etc.
```

**Deploy:**
```bash
docker compose -f docker-compose.production.yml up -d --build
```

---

## 🔑 Required Environment Variables

**Minimum .env configuration:**

```env
# Domain (Required)
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# Database (Choose one mode)
# Local:
USE_EXTERNAL_DB=false
PGPASSWORD=your_password

# External:
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://...
NODE_TLS_REJECT_UNAUTHORIZED=0

# Security (Required)
SESSION_SECRET=$(openssl rand -base64 32)

# Optional
TRAEFIK_DASHBOARD_AUTH=admin:$hashed_password
```

---

## 📊 Deployment Modes Comparison

### Local Database
**Pros:**
- ✅ Simple setup
- ✅ No external dependencies
- ✅ Lower cost
- ✅ Fast local queries

**Cons:**
- ❌ Manual backups required
- ❌ Limited scalability
- ❌ Single point of failure

**Best for:** Small teams, development, testing

### Managed Database (Recommended)
**Pros:**
- ✅ Automatic backups
- ✅ High availability
- ✅ Easy scaling
- ✅ Managed updates
- ✅ Professional support

**Cons:**
- ❌ Monthly cost ($15-30)
- ❌ Requires SSL configuration

**Best for:** Production, growing teams, enterprise

---

## 🔒 SSL/TLS Setup

### Automatic (with Docker Compose)
```bash
# Already configured in docker-compose.production.yml
# Just set DOMAIN and LETSENCRYPT_EMAIL in .env
./deploy.sh
# SSL certificate auto-generated via Let's Encrypt
```

### Manual (with Nginx)
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🆘 Quick Troubleshooting

### SSL Certificate Error with Managed Database
```bash
# Add to .env:
NODE_TLS_REJECT_UNAUTHORIZED=0
# Restart:
docker compose -f docker-compose.production.yml restart app
```

### Database Connection Failed
```bash
# Test connectivity:
telnet db-host 5432
# Check whitelist/firewall in database provider
```

### Container Won't Start
```bash
# View logs:
docker compose -f docker-compose.production.yml logs app --tail 100
# Check .env configuration
# Verify DATABASE_URL is correct
```

### Let's Encrypt Rate Limit
```bash
# Use staging server for testing
# Edit docker-compose.production.yml, uncomment:
# - "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
```

---

## 📚 Complete Documentation

| Document | Description |
|----------|-------------|
| **[CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)** | Complete guide for AWS, Azure, GCP, DigitalOcean, Ubuntu |
| **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** | General production deployment guide |
| **[DEPLOYMENT_SOLUTION.md](DEPLOYMENT_SOLUTION.md)** | Quick start and fixes summary |
| **[DIGITALOCEAN_DATABASE_SETUP.md](DIGITALOCEAN_DATABASE_SETUP.md)** | DigitalOcean database configuration |
| **[EXTERNAL_DATABASE_SETUP.md](EXTERNAL_DATABASE_SETUP.md)** | External database setup |

---

## ✅ Pre-Deployment Checklist

- [ ] Domain DNS configured (A records point to server)
- [ ] .env file created and configured
- [ ] DATABASE_URL set correctly
- [ ] SESSION_SECRET generated (openssl rand -base64 32)
- [ ] Firewall allows ports 80 and 443
- [ ] Database IP whitelist configured (if external)
- [ ] SSL email configured (LETSENCRYPT_EMAIL)

---

## 🚀 Deployment Commands

### Start
```bash
# Automated
./deploy.sh

# Manual - Local DB
docker compose -f docker-compose.production.yml --profile local-db up -d --build

# Manual - External DB
docker compose -f docker-compose.production.yml up -d --build
```

### Manage
```bash
# Logs
docker compose -f docker-compose.production.yml logs -f app

# Restart
docker compose -f docker-compose.production.yml restart app

# Stop
docker compose -f docker-compose.production.yml down

# Update
git pull origin main
docker compose -f docker-compose.production.yml up -d --build
```

---

## 💰 Cost Estimates

| Setup | Monthly Cost | Free Tier | Notes |
|-------|--------------|-----------|-------|
| **DigitalOcean** | $27 | ❌ | Droplet ($12) + DB ($15) |
| **AWS** | $15-40 | ✅ 12 months | EC2 + RDS |
| **Azure** | $26-43 | ❌ | App Service + PostgreSQL |
| **Google Cloud** | $17-37 | ✅ $300 credit | Cloud Run + Cloud SQL |
| **Ubuntu VPS** | $5-10 | Varies | Self-hosted |

---

## 🎯 Recommended Setups

### For Startups/Small Teams
**DigitalOcean Droplet + Managed Database**
- Cost: $27/month
- Difficulty: Easy
- Setup time: 10 minutes
- Managed backups included

### For Enterprise/Scalable
**AWS EC2 + RDS**
- Cost: $15-40/month (free tier available)
- Difficulty: Medium
- Auto-scaling available
- Professional support

### For Budget/Learning
**Ubuntu VPS + Self-hosted PostgreSQL**
- Cost: $5-10/month
- Difficulty: Advanced
- Full control
- Manual management

### For Serverless/Auto-scale
**Google Cloud Run + Cloud SQL**
- Cost: Pay per use, ~$17-37/month
- Difficulty: Easy
- Auto-scales to zero
- No server management

---

**🚀 Choose your platform and deploy in minutes!**

**Next Steps:**
1. Choose deployment platform
2. Follow quick guide above
3. Refer to [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md) for details
4. Access your application at https://yourdomain.com
