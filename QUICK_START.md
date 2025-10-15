# 🚀 Asset Management System - Quick Start Guide

Get up and running in minutes with the Asset Management System.

---

## 🎯 Choose Your Deployment Method

### 1. 🐳 Docker with SSL (Recommended)

**Deploy in 5 minutes with automatic HTTPS:**

```bash
# Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# Run automated setup
chmod +x setup-ssl.sh
./setup-ssl.sh

# Access your app
# https://yourdomain.com
```

**Requirements:**
- Docker & Docker Compose installed
- Domain name pointing to server
- Ports 80 and 443 open

**What you get:**
- ✅ Automatic SSL certificates (Let's Encrypt)
- ✅ PostgreSQL database
- ✅ Traefik reverse proxy
- ✅ Auto-renewal every 60 days

---

### 2. 💻 Local Development

**Quick development setup:**

```bash
# 1. Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# 2. Install dependencies
npm install

# 3. Setup PostgreSQL database
createdb asset_management

# 4. Create .env file
cp .env.example .env
# Edit .env with your database credentials

# 5. Run migrations
npm run db:push

# 6. Start development server
npm run dev

# Access: http://localhost:5000
```

**Requirements:**
- Node.js 20.x
- PostgreSQL 15+
- npm or yarn

---

### 3. ☁️ Cloud Deployment

**Deploy to your favorite cloud platform:**

#### AWS Quick Deploy
```bash
# EC2 + RDS
# See DEPLOYMENT_GUIDE.md → AWS (EC2 + RDS)

# OR Elastic Beanstalk
eb init -p docker asset-management
eb create asset-management-prod
eb deploy
```

#### DigitalOcean Quick Deploy
```bash
# App Platform (managed)
# See DEPLOYMENT_GUIDE.md → DigitalOcean (App Platform)

# OR Droplet with managed database
# See DEPLOYMENT_GUIDE.md → DigitalOcean (Droplet + Database)
```

#### Azure Quick Deploy
```bash
az webapp create \
  --resource-group AssetManagementRG \
  --plan AssetManagementPlan \
  --name asset-management-app \
  --deployment-container-image-name your-username/asset-tracker
```

#### Google Cloud Quick Deploy
```bash
gcloud run deploy asset-management \
  --image gcr.io/YOUR_PROJECT_ID/asset-tracker \
  --platform managed \
  --allow-unauthenticated
```

**See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete cloud deployment instructions.**

---

## 🔐 First-Time Setup

After deployment, access your application:

### 1. Navigate to Your URL
- **Docker SSL:** https://yourdomain.com
- **Local Dev:** http://localhost:5000
- **Cloud:** Your assigned URL

### 2. Create Admin Account

The first-time setup page will automatically appear:

1. **Full Name:** Your name
2. **Email:** Your email address
3. **Username:** Choose username (min. 3 characters)
4. **Password:** Secure password (min. 8 characters)
5. Click **"Create Admin Account"**

You'll be automatically logged in as admin!

### 3. Configure Your System

As admin, you can now:

1. **Add Users** → Administration → User Management
2. **Create Departments** → Departments → Add Department
3. **Add Locations** → Administration → Locations
4. **Configure Branding** → Administration → Branding
5. **Start Adding Assets** → Assets → New Asset

---

## 📋 Essential Configuration

### Environment Variables

**Required `.env` variables:**

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
PGHOST=localhost
PGPORT=5432
PGDATABASE=asset_management
PGUSER=asset_user
PGPASSWORD=your_secure_password

# Security
SESSION_SECRET=your_secure_random_32_char_secret

# Docker SSL only
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com
```

**Generate secure secrets:**
```bash
# SESSION_SECRET
openssl rand -base64 32
```

---

## 🎨 Quick Feature Tour

### Assets Management
1. **Add Asset** → Assets → New Asset
2. **Assign to Employee** → Asset Details → Assign
3. **Print QR Label** → Asset Actions → Print Label
4. **Track Location** → Edit Asset → Select Location

### Employee Management
1. **Add Employee** → Employees → Add Employee
2. **Bulk Import** → Employees → Import CSV
3. **Download Template** → Employees → Download CSV Template

### Department Organization
1. **Create Department** → Departments → Add Department
2. **Assign Assets** → When creating/editing assets
3. **View Statistics** → Department Details

### Custom Fields
1. **Define Fields** → Administration → Custom Fields
2. **Select Asset Type** → Choose type for custom fields
3. **Assets automatically show custom fields**

### System Monitoring
1. **System Health** → Administration → System Health (Admin only)
2. **View Audit Trail** → Audit Trail → All activities
3. **Check Statistics** → Dashboard

---

## 🛠️ Common Tasks

### Import Assets via CSV
```bash
# 1. Download template from Assets page
# 2. Fill in asset data
# 3. Upload via Import Data page
```

### Backup Database
```bash
# Docker
docker-compose -f docker-compose.ssl.yml exec db pg_dump -U asset_user asset_management > backup.sql

# Local
pg_dump asset_management > backup.sql
```

### Update Application
```bash
# Docker SSL
git pull
docker-compose -f docker-compose.ssl.yml build --no-cache
docker-compose -f docker-compose.ssl.yml up -d

# Local Dev
git pull
npm install
npm run db:push
npm run dev
```

---

## 🔧 Troubleshooting

### Can't Access Application

**Docker SSL:**
```bash
# Check containers
docker-compose -f docker-compose.ssl.yml ps

# Check logs
docker-compose -f docker-compose.ssl.yml logs -f

# Verify DNS
dig yourdomain.com +short
```

**Local Dev:**
```bash
# Check if running
curl http://localhost:5000

# Check database
psql asset_management -c "SELECT version();"
```

### SSL Certificate Issues

```bash
# Regenerate certificates
docker-compose -f docker-compose.ssl.yml down
rm -rf letsencrypt/
docker-compose -f docker-compose.ssl.yml up -d

# Watch certificate generation
docker-compose -f docker-compose.ssl.yml logs -f traefik
```

### Database Connection Failed

```bash
# Test connection
psql "postgresql://user:pass@host:5432/dbname"

# Check PostgreSQL running
sudo systemctl status postgresql

# Verify .env settings
cat .env | grep DATABASE_URL
```

---

## 📚 Next Steps

1. **Complete Configuration**
   - Set up email notifications (Settings)
   - Configure company branding (Administration → Branding)
   - Add custom fields for asset types

2. **Import Data**
   - Import employees via CSV
   - Import existing assets
   - Set up departments and locations

3. **Security Hardening**
   - Enable SSL/HTTPS in production
   - Configure strong passwords for all users
   - Set up automated backups
   - Review firewall settings

4. **Learn More**
   - [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment docs
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Advanced deployment options
   - [README.md](README.md) - Full feature documentation

---

## 🆘 Get Help

**Issues?**
1. Check [Troubleshooting](#troubleshooting) section above
2. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
3. Check application logs
4. Open an issue on GitHub

---

**🎉 You're ready to start managing assets! Navigate to your application URL and create your admin account.**
