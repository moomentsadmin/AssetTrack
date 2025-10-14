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
git clone <your-repo-url>
cd asset-management

# Install dependencies
npm ci --production

# Create environment file
nano .env.production
```

**`.env.production`:**
```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://asset_user:your_secure_password@localhost:5432/asset_management_prod
PGHOST=localhost
PGPORT=5432
PGDATABASE=asset_management_prod
PGUSER=asset_user
PGPASSWORD=your_secure_password

# Security
SESSION_SECRET=your_secure_session_secret_min_32_chars
```

### Run Database Migrations

```bash
npm run db:push
```

### PM2 Process Management

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'asset-management',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 'max',
    exec_mode: 'cluster',
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
    server localhost:5000;
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

### Option 1: Docker with Internal Database

**`Dockerfile`:**

```dockerfile
# Multi-stage build
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Build
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run db:push || true

# Production
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

CMD ["npm", "run", "dev"]
```

**`docker-compose.yml` (with internal database):**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: asset-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: asset_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: asset_management
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U asset_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: asset-app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://asset_user:${DB_PASSWORD}@db:5432/asset_management
      PGHOST: db
      PGPORT: 5432
      PGUSER: asset_user
      PGPASSWORD: ${DB_PASSWORD}
      PGDATABASE: asset_management
      SESSION_SECRET: ${SESSION_SECRET}
    env_file:
      - .env

volumes:
  pgdata:
    driver: local
```

**`.env` file:**

```env
DB_PASSWORD=your_secure_password
SESSION_SECRET=your_session_secret_min_32_chars
```

**Commands:**

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Option 2: Docker with External Database

**`docker-compose.external-db.yml`:**

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
      PGHOST: ${PGHOST}
      PGPORT: ${PGPORT}
      PGUSER: ${PGUSER}
      PGPASSWORD: ${PGPASSWORD}
      PGDATABASE: ${PGDATABASE}
      SESSION_SECRET: ${SESSION_SECRET}
    env_file:
      - .env.production
```

**`.env.production`:**

```env
# External Database (RDS, Digital Ocean, etc.)
DATABASE_URL=postgresql://user:password@host:5432/database
PGHOST=your-db-host.region.provider.com
PGPORT=5432
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=your_database
SESSION_SECRET=your_session_secret
```

```bash
# Run with external DB
docker-compose -f docker-compose.external-db.yml up -d
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
   - Public access: **Yes** (if connecting from outside VPC)
   - Security group: Create new or use existing
8. Database options:
   - Initial database name: `asset_management`

#### 2. Configure Security Group

**RDS Security Group Inbound Rules:**
- Type: PostgreSQL
- Protocol: TCP
- Port: 5432
- Source: EC2 security group ID (or 0.0.0.0/0 for testing - not recommended for production)

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

4. Follow [Ubuntu Server Deployment](#ubuntu-server-deployment) steps above
5. Update `.env.production` with RDS endpoint:

```env
DATABASE_URL=postgresql://postgres:password@your-db.region.rds.amazonaws.com:5432/asset_management
PGHOST=your-db.region.rds.amazonaws.com
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=asset_management
```

### Option 2: AWS Elastic Beanstalk + RDS

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js asset-management

# Create environment with RDS
eb create production-env --database.engine postgres --database.username asset_user
```

Elastic Beanstalk auto-injects RDS variables. Update your database connection:

```javascript
// server/db.ts
const pool = new Pool({
  host: process.env.RDS_HOSTNAME || process.env.PGHOST,
  port: process.env.RDS_PORT || process.env.PGPORT,
  user: process.env.RDS_USERNAME || process.env.PGUSER,
  password: process.env.RDS_PASSWORD || process.env.PGPASSWORD,
  database: process.env.RDS_DB_NAME || process.env.PGDATABASE,
});
```

### Option 3: AWS Lambda (Serverless) + RDS

Use AWS Lambda with RDS Proxy for connection pooling.

---

## Digital Ocean Deployment

### Option 1: App Platform + Managed Database

#### 1. Create Managed Database

1. Go to DigitalOcean Console → Databases → Create
2. Choose **PostgreSQL** (version 16 or 17)
3. Select datacenter region
4. Choose plan (starts at $15/month)
5. Name: `asset-management-db`

#### 2. Deploy App Platform

1. Go to Apps → Create App
2. Select GitHub repository
3. DigitalOcean auto-detects Node.js
4. Click **Add Database** → Select your managed database
5. Environment variables (auto-injected):
   - `DATABASE_URL`
   - App Platform handles SSL automatically

**App Spec (`app.yaml`):**

```yaml
name: asset-management
region: nyc
services:
  - name: web
    git:
      repo_clone_url: https://github.com/yourusername/asset-management.git
      branch: main
    build_command: npm run db:push
    run_command: npm run dev
    envs:
      - key: NODE_ENV
        value: production
        scope: RUN_AND_BUILD_TIME
      - key: SESSION_SECRET
        value: your_session_secret
        scope: RUN_TIME
    http_port: 5000
    instance_count: 1
    instance_size_slug: basic-xs
databases:
  - name: asset-db
    engine: PG
    version: "16"
    production: true
    cluster_name: asset-management-db
```

Deploy:

```bash
# Using doctl CLI
doctl apps create --spec app.yaml
```

### Option 2: Droplet + Managed Database

1. Create Droplet (Ubuntu 22.04)
2. Create Managed Database (PostgreSQL)
3. Follow [Ubuntu Server Deployment](#ubuntu-server-deployment)
4. Use Managed Database connection string in `.env.production`

---

## Azure Deployment

### Option 1: Azure App Service + Azure Database for PostgreSQL

#### 1. Create Azure Database for PostgreSQL

```bash
# Using Azure CLI
az postgres flexible-server create \
  --resource-group myResourceGroup \
  --name asset-management-db \
  --location eastus \
  --admin-user asset_admin \
  --admin-password <secure_password> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32

# Create database
az postgres flexible-server db create \
  --resource-group myResourceGroup \
  --server-name asset-management-db \
  --database-name asset_management
```

#### 2. Deploy to App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name asset-management-plan \
  --resource-group myResourceGroup \
  --is-linux \
  --sku B1

# Create Web App
az webapp create \
  --resource-group myResourceGroup \
  --plan asset-management-plan \
  --name asset-management-app \
  --runtime "NODE:20-lts"

# Configure environment variables
az webapp config appsettings set \
  --resource-group myResourceGroup \
  --name asset-management-app \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="postgresql://asset_admin:<password>@asset-management-db.postgres.database.azure.com:5432/asset_management?sslmode=require"

# Deploy from GitHub
az webapp deployment source config \
  --name asset-management-app \
  --resource-group myResourceGroup \
  --repo-url https://github.com/yourusername/asset-management \
  --branch main \
  --manual-integration
```

### Option 2: Azure Container Instances + Azure PostgreSQL

Use Docker deployment option with Azure PostgreSQL connection string.

---

## Database Options

### Managed Database Services

| Provider | Service | Minimum Cost | Features |
|----------|---------|--------------|----------|
| **AWS** | RDS PostgreSQL | ~$12/month (db.t3.micro) | Auto backups, Multi-AZ, Read replicas |
| **Digital Ocean** | Managed PostgreSQL | $15/month | Auto backups, Standby nodes, SSL |
| **Azure** | Azure Database for PostgreSQL | ~$20/month (Burstable B1ms) | Auto backups, HA, Geo-replication |
| **Heroku** | Heroku Postgres | $5/month (Mini) | Auto backups, Rollback, Dataclips |
| **Railway** | PostgreSQL | $5/month (500MB) | Auto backups, CLI access |

### Self-Managed PostgreSQL

**Pros:**
- Full control
- Lower cost (just server cost)

**Cons:**
- Manual backups
- Manual scaling
- Manual security updates

**Use managed databases for production to ensure:**
- Automated backups
- High availability
- Security patches
- Easy scaling

---

## Environment Variables

### Required Variables

```env
# Application
NODE_ENV=production
PORT=5000

# Database (choose one format)
# Option 1: Connection string
DATABASE_URL=postgresql://user:password@host:5432/database

# Option 2: Separate variables
PGHOST=your-db-host
PGPORT=5432
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=your_database

# Security
SESSION_SECRET=min_32_character_random_string
```

### Optional Variables

```env
# Email (if using email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Generating Secure Secrets

```bash
# Generate random string for SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files to git
- ✅ Use different secrets for dev/staging/production
- ✅ Rotate secrets periodically
- ✅ Use secret management services (AWS Secrets Manager, Azure Key Vault)

### 2. Database Security
- ✅ Use strong passwords (min 16 characters)
- ✅ Enable SSL/TLS for database connections
- ✅ Restrict database access by IP (security groups)
- ✅ Regular backups with encryption
- ✅ Use least-privilege database users

### 3. Application Security
- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Use Helmet.js for security headers (already included)
- ✅ Enable rate limiting
- ✅ Use HTTPS only (Let's Encrypt for free SSL)
- ✅ Implement CSRF protection
- ✅ Sanitize user inputs

### 4. Server Security
- ✅ Enable firewall (UFW on Ubuntu)
- ✅ Disable root SSH login
- ✅ Use SSH keys instead of passwords
- ✅ Keep system packages updated
- ✅ Monitor logs for suspicious activity

---

## Health Checks & Monitoring

### Application Health Endpoint

Already implemented in the app:

```
GET /api/user - Returns 401 if not authenticated (can be used for health check)
```

### Monitoring Tools

**Free Options:**
- **PM2 Plus**: Process monitoring (free tier available)
- **UptimeRobot**: Uptime monitoring (free for 50 monitors)
- **AWS CloudWatch**: Included with AWS services
- **Azure Monitor**: Included with Azure services

**Example PM2 Monitoring:**

```bash
# Enable PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database created and accessible
- [ ] SSL certificates obtained (for custom domains)
- [ ] Backup strategy in place
- [ ] Security groups/firewall configured
- [ ] Domain DNS configured (if applicable)

### Deployment
- [ ] Application deployed and running
- [ ] Database migrations executed
- [ ] Health check endpoint responding
- [ ] SSL/HTTPS working
- [ ] Logs accessible and rotating

### Post-Deployment
- [ ] Monitor application for errors
- [ ] Verify email notifications (if configured)
- [ ] Test user login and core features
- [ ] Set up automated backups
- [ ] Configure monitoring/alerting
- [ ] Document deployment process

---

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h <host> -U <user> -d <database> -p 5432

# Check if PostgreSQL is running
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Application Issues

```bash
# PM2 logs
pm2 logs asset-management

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check if app is running
pm2 status

# Restart app
pm2 restart asset-management
```

### Docker Issues

```bash
# View container logs
docker-compose logs -f

# Check container status
docker-compose ps

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

---

## Scaling Considerations

### Horizontal Scaling
- Use PM2 cluster mode (already configured)
- Load balancer (Nginx, AWS ALB, Azure Load Balancer)
- Database read replicas for read-heavy workloads

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Upgrade database tier
- Increase database connection pool size

### Database Optimization
- Add indexes on frequently queried columns
- Implement caching (Redis/Valkey)
- Use database connection pooling (already implemented)

---

## Support & Resources

- **Application Docs**: See `replit.md` for feature documentation
- **Issue Tracker**: Create issues on GitHub
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **PM2 Docs**: https://pm2.keymetrics.io/docs/
- **Nginx Docs**: https://nginx.org/en/docs/
- **AWS Docs**: https://docs.aws.amazon.com/
- **Digital Ocean Docs**: https://docs.digitalocean.com/
- **Azure Docs**: https://docs.microsoft.com/azure/

---

**Last Updated**: October 2025
