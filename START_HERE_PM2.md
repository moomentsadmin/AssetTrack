# 🚀 START HERE - Ubuntu PM2 Deployment

**Welcome!** This guide will help you deploy the Asset Management System on Ubuntu using PM2 + Nginx + PostgreSQL.

---

## 📍 You Are Here

This is a **traditional server deployment** (not Docker).

**Your setup:**
- Server: Ubuntu 20.04+
- Domain: asset.digile.com
- IP: 178.128.51.240
- Method: PM2 + Nginx + Local PostgreSQL

---

## 🎯 Choose Your Path

### Path 1: Quick Deployment (Experienced Users)
**Time:** 5 minutes  
**Guide:** `QUICKSTART_PM2.md`

**For:** You know Linux and just want the commands

### Path 2: Step-by-Step Guide (Recommended)
**Time:** 15 minutes  
**Guide:** `UBUNTU_PM2_SETUP.md`

**For:** First-time deployment or you want detailed explanations

### Path 3: Understand the Files
**Guide:** `PM2_DEPLOYMENT_FILES.md`

**For:** You want to understand what each file does

---

## ⚡ Super Quick Start

**Already have Node.js, PostgreSQL, Nginx, and PM2 installed?**

```bash
# 1. Setup database
sudo -u postgres psql
CREATE DATABASE asset_management;
CREATE USER asset_user WITH PASSWORD 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;
\c asset_management
GRANT ALL ON SCHEMA public TO asset_user;
\q

# 2. Configure app
cd ~/AssetTrack
cp .env.pm2.example .env
nano .env  # Edit DATABASE_URL and SESSION_SECRET

# 3. Deploy
./deploy-pm2.sh

# 4. Configure Nginx
sudo cp nginx-http.conf /etc/nginx/sites-available/asset-management
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Setup SSL
sudo certbot --nginx -d asset.digile.com

# Done!
```

---

## 📁 Important Files

| File | Purpose | Use When |
|------|---------|----------|
| `UBUNTU_PM2_SETUP.md` | Complete guide | First deployment |
| `QUICKSTART_PM2.md` | Quick reference | Fast deployment |
| `install-ubuntu.sh` | Install software | Fresh server |
| `.env.pm2.example` | Config template | Setup config |
| `deploy-pm2.sh` | Deploy app | Deploy/update |
| `nginx-http.conf` | Nginx config | Setup proxy |

---

## 🛠️ Installation Flowchart

```
Fresh Ubuntu Server
        ↓
1. Run: install-ubuntu.sh
   (Installs Node.js, PostgreSQL, Nginx, PM2, Certbot)
        ↓
2. Setup Database
   (CREATE DATABASE, CREATE USER)
        ↓
3. Clone Repository
   (git clone AssetTrack)
        ↓
4. Configure .env
   (cp .env.pm2.example .env)
        ↓
5. Deploy: deploy-pm2.sh
   (Installs deps, runs migrations, builds, starts PM2)
        ↓
6. Configure Nginx
   (Copy nginx-http.conf, enable site)
        ↓
7. Setup SSL
   (certbot --nginx)
        ↓
🎉 DONE! Visit https://asset.digile.com
```

---

## ✅ Pre-Flight Check

Before you start, ensure you have:

- [ ] Ubuntu 20.04+ server with root/sudo access
- [ ] Domain name (asset.digile.com) pointing to server IP
- [ ] Firewall allows ports 80 and 443
- [ ] SSH access to the server

---

## 🆘 Common Issues

### "Command not found"
→ Run `install-ubuntu.sh` to install all software

### "Database connection failed"
→ Check DATABASE_URL in `.env` matches your PostgreSQL setup

### "502 Bad Gateway"
→ Check if PM2 is running: `pm2 status`

### "SSL certificate failed"
→ Ensure domain points to your server IP: `dig +short asset.digile.com`

---

## 📞 Need Help?

1. **Check application logs:** `pm2 logs asset-management`
2. **Check Nginx logs:** `sudo tail -f /var/log/nginx/error.log`
3. **Test database:** `psql -h localhost -U asset_user -d asset_management`
4. **Verify app works locally:** `curl http://localhost:5000/health`

---

## 🎓 Learning Path

**Never deployed before?**
1. Read: `UBUNTU_PM2_SETUP.md` (detailed guide)
2. Run: Each command step-by-step
3. Verify: Each step before moving to next

**Deployed before?**
1. Read: `QUICKSTART_PM2.md` (quick commands)
2. Run: All commands in sequence
3. Done!

**Updating existing deployment?**
```bash
cd ~/AssetTrack
git pull origin main
./deploy-pm2.sh
```

---

## 🚦 Getting Started NOW

### For Fresh Server:
```bash
# Step 1: Install software
curl -fsSL https://raw.githubusercontent.com/moomentsadmin/AssetTrack/main/install-ubuntu.sh | bash

# Step 2: Follow UBUNTU_PM2_SETUP.md for remaining steps
```

### For Existing Server:
```bash
# Go to QUICKSTART_PM2.md and follow the 5-minute guide
```

---

## 📚 Documentation Index

- **START_HERE_PM2.md** ← You are here
- **QUICKSTART_PM2.md** - 5-minute deployment
- **UBUNTU_PM2_SETUP.md** - Complete step-by-step guide
- **PM2_DEPLOYMENT_FILES.md** - Explains all files

**Pick one and get started!** 🚀
