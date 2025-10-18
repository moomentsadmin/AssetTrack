# Ubuntu Deployment Guide (PM2 + Nginx + PostgreSQL)

Complete guide for deploying on Ubuntu with PM2 process manager, Nginx reverse proxy, and local PostgreSQL database.

## Prerequisites

- Ubuntu 20.04+ server with root access
- Domain name pointing to server (asset.digile.com)
- Ports 80/443 open in firewall

## Step 1: Install Required Software

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

# Install PM2 globally
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Verify installations
node --version    # Should show v20.x
npm --version
psql --version
nginx -v
pm2 --version
```

## Step 2: Configure PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run these commands:
```

```sql
-- Create database
CREATE DATABASE asset_management;

-- Create user with password
CREATE USER asset_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;

-- Grant schema permissions (PostgreSQL 15+)
\c asset_management
GRANT ALL ON SCHEMA public TO asset_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO asset_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO asset_user;

-- Exit PostgreSQL
\q
```

## Step 3: Clone and Configure Application

```bash
# Navigate to your home directory
cd ~

# Clone repository (if not already cloned)
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack

# Create .env file
nano .env
```

**Add the following to `.env`:**

```env
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://asset_user:YOUR_SECURE_PASSWORD_HERE@localhost:5432/asset_management
PGHOST=localhost
PGPORT=5432
PGDATABASE=asset_management
PGUSER=asset_user
PGPASSWORD=YOUR_SECURE_PASSWORD_HERE

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=PASTE_GENERATED_SECRET_HERE
```

**Generate secure SESSION_SECRET:**
```bash
openssl rand -base64 32
# Copy output and paste into .env file
```

## Step 4: Deploy Application

```bash
# Make deploy script executable
chmod +x deploy-pm2.sh

# Run deployment
./deploy-pm2.sh
```

**The script will:**
1. ✅ Install dependencies
2. ✅ Run database migrations
3. ✅ Build application
4. ✅ Start with PM2

**Verify it's running:**
```bash
pm2 status
# Should show "asset-management" with status "online"

pm2 logs asset-management
# Should show "serving on port 5000"

# Test locally
curl http://localhost:5000/health
# Should return: {"status":"healthy","timestamp":"..."}
```

## Step 5: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp nginx.conf.example /etc/nginx/sites-available/asset-management

# Edit the configuration if needed
sudo nano /etc/nginx/sites-available/asset-management

# Enable the site
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## Step 6: Set Up SSL with Let's Encrypt

```bash
# Run Certbot
sudo certbot --nginx -d asset.digile.com -d www.asset.digile.com

# Follow the prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose to redirect HTTP to HTTPS (option 2)

# Verify auto-renewal
sudo certbot renew --dry-run
```

**Certbot will automatically:**
- Generate SSL certificates
- Update Nginx configuration
- Set up auto-renewal

## Step 7: Set Up PM2 Auto-Start

```bash
# Generate startup script
pm2 startup systemd

# Copy and run the command it outputs (will look like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u YOUR_USER --hp /home/YOUR_USER

# Save current PM2 process list
pm2 save

# Verify
sudo systemctl status pm2-YOUR_USER
```

## Step 8: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 9: Access Your Application

Open browser and navigate to:
```
https://asset.digile.com
```

You should see the Asset Management System login/setup page! 🎉

## Management Commands

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs asset-management

# View logs (live)
pm2 logs asset-management --lines 100

# Restart application
pm2 restart asset-management

# Stop application
pm2 stop asset-management

# Start application
pm2 start asset-management

# Delete from PM2
pm2 delete asset-management
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/asset-management.access.log
sudo tail -f /var/log/nginx/asset-management.error.log
```

### PostgreSQL Commands

```bash
# Connect to database
sudo -u postgres psql -d asset_management

# Backup database
sudo -u postgres pg_dump asset_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
sudo -u postgres psql asset_management < backup_20250118_120000.sql
```

## Updating the Application

```bash
cd ~/AssetTrack

# Pull latest changes
git pull origin main

# Run deployment script
./deploy-pm2.sh

# Check status
pm2 status
pm2 logs asset-management
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs asset-management --err

# Common issues:
# - Database connection failed: Check DATABASE_URL in .env
# - Port already in use: Check if another process is using port 5000
# - Missing dependencies: Run npm ci
```

### 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify app responds locally
curl http://localhost:5000/health

# Common fix: Restart PM2
pm2 restart asset-management
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U asset_user -d asset_management

# If connection fails:
# 1. Check PostgreSQL is running
sudo systemctl status postgresql

# 2. Check pg_hba.conf allows local connections
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Should have this line:
# local   all             all                                     md5

# 3. Restart PostgreSQL
sudo systemctl restart postgresql
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

## Performance Optimization

### Run Multiple Instances (Cluster Mode)

Edit `ecosystem.config.js`:

```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

Then restart:
```bash
pm2 restart ecosystem.config.js
```

### Nginx Caching

Add to Nginx configuration:

```nginx
# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security Best Practices

1. **Change default passwords** immediately
2. **Keep system updated**: `sudo apt update && sudo apt upgrade`
3. **Monitor logs** regularly: `pm2 logs`
4. **Set up log rotation**: PM2 handles this automatically
5. **Enable firewall**: Use UFW to restrict access
6. **Regular backups**: Backup database daily

## Quick Reference

```bash
# Deploy/Update
./deploy-pm2.sh

# View logs
pm2 logs asset-management

# Restart
pm2 restart asset-management

# Status
pm2 status

# Database backup
sudo -u postgres pg_dump asset_management > backup.sql
```

## Support

For issues, check:
- PM2 logs: `pm2 logs asset-management`
- Nginx logs: `/var/log/nginx/asset-management.error.log`
- PostgreSQL logs: `/var/log/postgresql/postgresql-15-main.log`
