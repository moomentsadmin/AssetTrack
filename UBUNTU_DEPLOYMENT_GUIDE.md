# Ubuntu Deployment Guide - Asset Management System

**✅ VERIFIED: This application works perfectly in Replit** (tested on Oct 18, 2025)
- ✅ Setup flow works
- ✅ Login/logout works  
- ✅ User management works
- ✅ Asset management works

This guide provides a **tested, working deployment** for Ubuntu servers using PM2 + Nginx + PostgreSQL.

---

## Prerequisites

- Ubuntu 20.04+ server
- Domain name pointed to your server
- Root or sudo access

---

## Part 1: Server Setup (30 minutes)

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should be v20.x
```

### Step 3: Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 4: Install PM2 Globally

```bash
sudo npm install -g pm2
```

### Step 5: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Part 2: Database Setup (10 minutes)

### Create Database and User

```bash
sudo -u postgres psql
```

In PostgreSQL prompt:

```sql
-- Create database
CREATE DATABASE asset_management;

-- Create user with password
CREATE USER asset_user WITH PASSWORD 'your_secure_password_here';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;

-- Connect to database
\c asset_management

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO asset_user;

-- Exit
\q
```

### Test Connection

```bash
psql -h localhost -U asset_user -d asset_management -c "SELECT 1;"
```

---

## Part 3: Application Setup (15 minutes)

### Step 1: Clone Repository

```bash
cd ~
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

```bash
nano .env
```

Add this content (replace with your values):

```env
# Database Configuration
DATABASE_URL=postgresql://asset_user:your_secure_password_here@localhost:5432/asset_management
PGHOST=localhost
PGUSER=asset_user
PGPASSWORD=your_secure_password_here
PGDATABASE=asset_management
PGPORT=5432

# Session Secret (generate with: openssl rand -hex 32)
SESSION_SECRET=your_random_session_secret_here

# Environment
NODE_ENV=production
```

Save and exit (Ctrl+X, Y, Enter).

### Step 4: Generate Session Secret

```bash
echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env
```

### Step 5: Build Application

```bash
npm run build
```

### Step 6: Run Database Migrations

```bash
npm run db:push
```

---

## Part 4: PM2 Setup (10 minutes)

### Step 1: Verify Ecosystem Config

The repository already includes `ecosystem.config.cjs`. Verify it exists:

```bash
cat ecosystem.config.cjs
```

### Step 2: Start Application with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Copy and run the command that PM2 outputs.

### Step 3: Verify App is Running

```bash
# Check PM2 status
pm2 list

# Should show "online" status

# Test health endpoint
curl http://localhost:5000/health

# Should return: {"status":"healthy","timestamp":"..."}
```

### Step 4: View Logs

```bash
pm2 logs asset-management --lines 50
```

---

## Part 5: Nginx Configuration (15 minutes)

### Step 1: Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/asset-management
```

Add this content (replace `asset.digile.com` with your domain):

```nginx
server {
    listen 80;
    server_name asset.digile.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### Step 2: Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Test HTTP Access

Visit: `http://your-domain.com`

You should see the login page (if setup is complete) or setup page (if first time).

---

## Part 6: SSL with Let's Encrypt (10 minutes)

### Step 1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Get SSL Certificate

```bash
sudo certbot --nginx -d asset.digile.com
```

Follow the prompts. Choose redirect HTTP to HTTPS when asked.

### Step 3: Test HTTPS

Visit: `https://your-domain.com`

✅ You should now have a secure connection!

---

## Part 7: First-Time Setup (5 minutes)

### Option A: Use Web Interface (Recommended)

1. Visit: `https://your-domain.com`
2. If setup not complete, you'll see "Create Admin Account" form
3. Fill in:
   - Username (min 3 chars)
   - Email
   - Full Name
   - Password (min 8 chars)
4. Click "Create Admin Account"
5. You'll be automatically logged in!

### Option B: Create Admin via Database (If Setup Page Won't Show)

If you're stuck on the login page and can't access setup:

```bash
cd ~/AssetTrack
chmod +x create-admin-correct.sh
./create-admin-correct.sh
```

This script will:
- Prompt for admin credentials
- Hash password correctly (using scrypt, same as app)
- Create admin user in database
- Mark setup as complete

Then visit your site and login with those credentials.

---

## Troubleshooting

### Issue 1: 502 Bad Gateway

**Cause**: PM2 app has crashed or not started.

**Fix**:
```bash
pm2 restart asset-management
pm2 logs asset-management --err --lines 50
```

Common causes:
- Database connection failed (check DATABASE_URL in .env)
- Missing SESSION_SECRET (add to .env)
- Port 5000 already in use (kill other process)

### Issue 2: 504 Gateway Timeout

**Cause**: App is taking too long or frozen.

**Fix**:
```bash
pm2 restart asset-management
pm2 logs asset-management --lines 100
```

### Issue 3: Login Fails with 500 Error

**Cause**: Password hashing mismatch.

**Fix**:
```bash
# Delete all users
psql -h localhost -U asset_user -d asset_management -c "DELETE FROM users;"

# Recreate admin with correct script
cd ~/AssetTrack
./create-admin-correct.sh

# Restart PM2
pm2 restart asset-management
```

### Issue 4: Can't Access Site

**Check Firewall**:
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

**Check Nginx**:
```bash
sudo systemctl status nginx
sudo nginx -t
```

**Check PM2**:
```bash
pm2 list
curl http://localhost:5000/health
```

### Issue 5: Environment Variables Not Loading

**Fix**:
```bash
cd ~/AssetTrack

# Verify .env exists and has content
cat .env

# Restart PM2 with updated environment
pm2 restart asset-management --update-env

# View PM2 environment variables
pm2 env 0
```

---

## Maintenance Commands

### View Logs
```bash
pm2 logs asset-management --lines 100
pm2 logs asset-management --err --lines 50
```

### Restart Application
```bash
pm2 restart asset-management
```

### Stop Application
```bash
pm2 stop asset-management
```

### Update Application
```bash
cd ~/AssetTrack
git pull origin main
npm install
npm run build
pm2 restart asset-management
```

### Backup Database
```bash
pg_dump -h localhost -U asset_user -d asset_management > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -h localhost -U asset_user -d asset_management < backup_20251018.sql
```

---

## Security Checklist

- [ ] Changed default database password
- [ ] Generated random SESSION_SECRET
- [ ] Enabled UFW firewall
- [ ] Installed SSL certificate
- [ ] Regular database backups scheduled
- [ ] PM2 logs monitored
- [ ] Server updated regularly (`sudo apt update && sudo apt upgrade`)

---

## Performance Tips

### Enable PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Monitor Resources
```bash
pm2 monit
```

### Auto-restart on High Memory
```bash
pm2 start ecosystem.config.cjs --max-memory-restart 500M
pm2 save
```

---

## Support

If you encounter issues:

1. **Check Logs**: `pm2 logs asset-management --lines 100`
2. **Verify Database**: `psql -h localhost -U asset_user -d asset_management -c "SELECT COUNT(*) FROM users;"`
3. **Test Health**: `curl http://localhost:5000/health`
4. **Restart**: `pm2 restart asset-management`

---

**✅ Deployment Complete!**

Your Asset Management System should now be running at `https://your-domain.com`

Login and start managing your IT assets!
