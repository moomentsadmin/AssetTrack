# Quick Start - Ubuntu PM2 Deployment

**For:** Fresh Ubuntu server deployment  
**Method:** PM2 + Nginx + PostgreSQL (Traditional)  
**Domain:** asset.digile.com

---

## ⚡ One-Command Setup

```bash
# Install all required software
curl -fsSL https://raw.githubusercontent.com/moomentsadmin/AssetTrack/main/install-ubuntu.sh | bash
```

---

## 📋 5-Minute Deployment

### 1️⃣ Setup Database (2 min)
```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE asset_management;
CREATE USER asset_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;
\c asset_management
GRANT ALL ON SCHEMA public TO asset_user;
\q
```

### 2️⃣ Clone & Configure (1 min)
```bash
cd ~
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack
cp .env.pm2.example .env
nano .env  # Update: DATABASE_URL, SESSION_SECRET
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

### 3️⃣ Deploy Application (1 min)
```bash
chmod +x deploy-pm2.sh
./deploy-pm2.sh
```

### 4️⃣ Configure Nginx (30 sec)
```bash
sudo cp nginx-http.conf /etc/nginx/sites-available/asset-management
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5️⃣ Setup SSL (30 sec)
```bash
sudo certbot --nginx -d asset.digile.com
```

**Done!** Visit: https://asset.digile.com 🎉

---

## 🔧 Essential Commands

### Check Status
```bash
pm2 status                    # PM2 process status
pm2 logs asset-management     # View application logs
pm2 monit                     # Real-time monitoring
```

### Restart Application
```bash
pm2 restart asset-management  # Restart app
pm2 save                      # Save PM2 state
```

### Update Application
```bash
cd ~/AssetTrack
git pull origin main
./deploy-pm2.sh
```

### Check Nginx
```bash
sudo nginx -t                                # Test config
sudo systemctl reload nginx                  # Reload
sudo tail -f /var/log/nginx/error.log       # View errors
```

### Database Backup
```bash
sudo -u postgres pg_dump asset_management > backup_$(date +%Y%m%d).sql
```

---

## 🐛 Troubleshooting

### App Not Starting
```bash
pm2 logs asset-management --err              # Check error logs
psql -h localhost -U asset_user -d asset_management  # Test DB connection
```

### 502 Bad Gateway
```bash
pm2 status                                   # Is app running?
curl http://localhost:5000/health           # Test locally
pm2 restart asset-management                # Restart app
```

### Database Connection Failed
```bash
sudo systemctl status postgresql            # Check PostgreSQL
sudo -u postgres psql -d asset_management  # Test connection
# Update password in .env if needed
```

---

## 📚 Full Documentation

- **Complete Guide:** `UBUNTU_PM2_SETUP.md`
- **Configuration Files:**
  - `.env.pm2.example` - Environment template
  - `ecosystem.config.js` - PM2 config
  - `nginx-http.conf` - Nginx config
  - `deploy-pm2.sh` - Deployment script

---

## ✅ Pre-Flight Checklist

Before deployment:
- [ ] Ubuntu 20.04+ server with root access
- [ ] Domain pointing to server IP
- [ ] Ports 80/443 open in firewall
- [ ] PostgreSQL database created
- [ ] `.env` file configured
- [ ] SSH access to server

After deployment:
- [ ] PM2 shows "online" status
- [ ] App responds at http://localhost:5000/health
- [ ] Nginx config passes: `sudo nginx -t`
- [ ] SSL certificate active
- [ ] Website accessible at https://asset.digile.com
- [ ] First admin account created
- [ ] PM2 auto-start configured

---

## 🆘 Support

**Logs Location:**
- Application: `pm2 logs asset-management`
- Nginx: `/var/log/nginx/asset-management.error.log`
- PostgreSQL: `sudo journalctl -u postgresql`

**Health Check:**
```bash
pm2 status && \
curl -s http://localhost:5000/health && \
sudo nginx -t && \
sudo systemctl status postgresql --no-pager
```

**If all else fails:**
```bash
# Full restart
pm2 restart asset-management
sudo systemctl restart nginx
sudo systemctl restart postgresql
```
