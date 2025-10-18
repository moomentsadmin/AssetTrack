# PM2 Deployment Files - Complete Package

This document lists all files created for traditional Ubuntu deployment with PM2 + Nginx + PostgreSQL.

---

## 📁 Main Deployment Files

### 1. **UBUNTU_PM2_SETUP.md**
**Purpose:** Complete step-by-step deployment guide  
**Use:** Full documentation with detailed explanations  
**For:** First-time deployment or troubleshooting

**Contains:**
- Software installation instructions
- PostgreSQL setup
- Application configuration
- Nginx configuration
- SSL setup with Certbot
- Firewall configuration
- Troubleshooting guides

---

### 2. **QUICKSTART_PM2.md**
**Purpose:** Quick reference card  
**Use:** Fast deployment for experienced users  
**For:** Quick deployments or updates

**Contains:**
- 5-minute deployment steps
- Essential commands
- Quick troubleshooting
- Pre-flight checklist

---

## 🛠️ Configuration Files

### 3. **.env.pm2.example**
**Purpose:** Environment variable template for PM2 deployment  
**Location:** Copy to `.env` before deployment

**Contains:**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
SESSION_SECRET=...
```

**Usage:**
```bash
cp .env.pm2.example .env
nano .env  # Edit values
```

---

### 4. **ecosystem.config.js**
**Purpose:** PM2 process manager configuration  
**Auto-loaded:** Yes, by deploy-pm2.sh

**Configures:**
- Process name: `asset-management`
- Instances: 1 (can be increased)
- Memory limit: 1GB
- Log locations
- Auto-restart settings

---

### 5. **nginx-http.conf**
**Purpose:** Nginx reverse proxy configuration (HTTP only)  
**Use:** Before SSL is set up

**Installation:**
```bash
sudo cp nginx-http.conf /etc/nginx/sites-available/asset-management
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Note:** Certbot will automatically update this to add SSL

---

## 🚀 Automation Scripts

### 6. **install-ubuntu.sh**
**Purpose:** Automated software installation  
**Installs:**
- Node.js 20 LTS
- PostgreSQL
- Nginx
- PM2
- Certbot

**Usage:**
```bash
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

**Or one-liner:**
```bash
curl -fsSL https://raw.githubusercontent.com/moomentsadmin/AssetTrack/main/install-ubuntu.sh | bash
```

---

### 7. **deploy-pm2.sh**
**Purpose:** Automated application deployment  
**Runs:**
1. Install dependencies (`npm ci`)
2. Database migrations (`npm run db:push`)
3. Build application (`npm run build`)
4. Start/restart with PM2

**Usage:**
```bash
chmod +x deploy-pm2.sh
./deploy-pm2.sh
```

**Use for:**
- Initial deployment
- Application updates
- After code changes

---

## 📋 Deployment Flow

### Fresh Server Setup

```
1. install-ubuntu.sh
   ↓ Installs software
   
2. Configure PostgreSQL
   ↓ Create database & user
   
3. Clone repository
   ↓ git clone
   
4. Configure .env
   ↓ cp .env.pm2.example .env
   
5. deploy-pm2.sh
   ↓ Deploy application
   
6. Configure Nginx
   ↓ Copy nginx-http.conf
   
7. Setup SSL
   ↓ certbot --nginx
   
8. Done! 🎉
```

### Application Updates

```
1. Pull latest code
   ↓ git pull origin main
   
2. Deploy
   ↓ ./deploy-pm2.sh
   
3. Done! ✅
```

---

## 🔍 File Dependencies

```
UBUNTU_PM2_SETUP.md
├── References: All files below
├── Complete guide with all steps
└── Use for: First-time deployment

QUICKSTART_PM2.md
├── References: All files below  
├── Condensed quick reference
└── Use for: Fast deployment

.env.pm2.example
├── Template for: .env
└── Required by: Application

ecosystem.config.js
├── Used by: PM2
└── Loaded by: deploy-pm2.sh

nginx-http.conf
├── Used by: Nginx
└── Modified by: Certbot (adds SSL)

install-ubuntu.sh
├── Installs: All required software
└── Run first: On fresh Ubuntu server

deploy-pm2.sh
├── Uses: .env, ecosystem.config.js
├── Builds: Application
└── Starts: PM2 process
```

---

## 📚 Documentation Hierarchy

**Level 1: Quick Start**
- `QUICKSTART_PM2.md` - 5-minute deployment

**Level 2: Complete Guide**
- `UBUNTU_PM2_SETUP.md` - Full detailed guide

**Level 3: Reference**
- `PM2_DEPLOYMENT_FILES.md` - This file (explains all files)

---

## ✅ Deployment Checklist

### Prerequisites
- [ ] Fresh Ubuntu 20.04+ server
- [ ] Root or sudo access
- [ ] Domain pointing to server IP
- [ ] Ports 80/443 open

### Installation
- [ ] Run `install-ubuntu.sh`
- [ ] Verify: `node -v`, `psql --version`, `nginx -v`, `pm2 -v`

### Database Setup
- [ ] Create database: `asset_management`
- [ ] Create user: `asset_user`
- [ ] Grant permissions
- [ ] Test connection

### Application Setup
- [ ] Clone repository
- [ ] Create `.env` from `.env.pm2.example`
- [ ] Update DATABASE_URL
- [ ] Generate and set SESSION_SECRET
- [ ] Run `deploy-pm2.sh`

### Nginx Setup
- [ ] Copy `nginx-http.conf` to sites-available
- [ ] Create symlink to sites-enabled
- [ ] Test: `sudo nginx -t`
- [ ] Reload Nginx

### SSL Setup
- [ ] Run Certbot
- [ ] Verify certificate
- [ ] Test HTTPS

### Verification
- [ ] PM2 status shows "online"
- [ ] `curl http://localhost:5000/health` returns 200
- [ ] Website accessible via HTTPS
- [ ] Create first admin account
- [ ] Configure PM2 auto-start: `pm2 startup`

---

## 🆘 Quick Help

**Files not working?**
```bash
# Ensure files are executable
chmod +x install-ubuntu.sh deploy-pm2.sh

# Verify files exist
ls -la *.sh *.conf *.md
```

**Which guide to use?**
- **First time?** → `UBUNTU_PM2_SETUP.md`
- **Quick deployment?** → `QUICKSTART_PM2.md`
- **Updating app?** → Run `deploy-pm2.sh`
- **Understanding files?** → This file

**Something broken?**
- Check PM2 logs: `pm2 logs asset-management`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check database: `psql -h localhost -U asset_user -d asset_management`

---

## 📞 Support

All files work together as a complete deployment package.

**Start with:** `QUICKSTART_PM2.md` or `UBUNTU_PM2_SETUP.md`

**For issues:** Check logs and troubleshooting sections in the guides.
