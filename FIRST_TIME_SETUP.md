# 🔐 First-Time Setup Guide

## Quick Access

When the database is empty (fresh installation), the application automatically shows the **First-Time Setup** page.

### Access URLs

#### Local Development
```
http://localhost:5000
```
The app automatically detects that setup is required and redirects to the setup page.

#### Production (with domain)
```
https://yourdomain.com
```
or
```
http://yourdomain.com:5000
```

**The application automatically detects when setup is needed and displays the setup form.**

---

## How It Works

### 1. **Automatic Detection**
When you first access the application:
- The app checks `/api/setup/status`
- If no admin user exists, it shows the setup page
- If setup is complete, it shows the login page

### 2. **Setup Flow**

```
User visits → http://localhost:5000
                    ↓
            Check setup status
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
   Setup Required          Setup Complete
        ↓                       ↓
   Show Setup Form         Show Login Form
```

### 3. **Setup Page Location**
- **Frontend Route:** `/auth`
- **Backend API:** `/api/setup/status` (check) and `/api/setup` (submit)
- **Automatic Redirect:** Yes - visits to any page redirect to setup if needed

---

## First-Time Setup Process

### Step 1: Access the Application

**Local Development:**
```bash
npm run dev
```
Then open: **http://localhost:5000**

**Production:**
```bash
./deploy.sh
```
Then open: **https://yourdomain.com** or **http://server-ip:5000**

### Step 2: Create Admin Account

The setup form requires:

| Field | Requirements | Example |
|-------|-------------|---------|
| **Full Name** | Any name | John Doe |
| **Email** | Valid email address | admin@company.com |
| **Username** | Min 3 characters | admin |
| **Password** | Min 8 characters | AdminPass123! |

### Step 3: Submit Setup

1. Fill in all required fields
2. Click "Create Admin Account"
3. System creates the admin user
4. Automatically logs you in
5. Redirects to dashboard

---

## Access Methods

### Method 1: Direct URL (Automatic)

Simply visit the application URL - it detects setup requirement automatically:

**Local:**
```
http://localhost:5000
```

**Production with Domain:**
```
https://yourdomain.com
```

**Production without Domain (using IP):**
```
http://YOUR_SERVER_IP:5000
```

### Method 2: Auth Route (Manual)

You can also directly visit the auth route:

**Local:**
```
http://localhost:5000/auth
```

**Production:**
```
https://yourdomain.com/auth
```

Both methods work the same - the app detects if setup is required.

---

## Common Scenarios

### Scenario 1: Fresh Installation

```bash
# Deploy application
./deploy.sh

# Visit in browser
http://your-server:5000

# Result: Setup page appears automatically
```

### Scenario 2: Database Reset

If you reset the database:

```bash
# Stop application
docker compose -f docker-compose.production.yml down

# Remove database volume (WARNING: Deletes all data!)
docker volume rm assettrackr_pgdata

# Restart application
docker compose -f docker-compose.production.yml --profile local-db up -d

# Visit in browser - setup page appears again
http://localhost:5000
```

### Scenario 3: External Database (First Use)

```bash
# Configure external database in .env
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://user:pass@host:port/db

# Deploy
./deploy.sh

# Visit - setup page appears
https://yourdomain.com
```

---

## Port Configuration

### Development (Default: 5000)

The application runs on port 5000 by default:

```bash
# Start dev server
npm run dev

# Access at
http://localhost:5000
```

### Production (Port 5000 or 80/443)

**Option 1: Direct Port 5000**
```bash
# Access without SSL
http://your-domain.com:5000
```

**Option 2: Port 80/443 with Traefik (Recommended)**
```bash
# With SSL (Let's Encrypt)
https://your-domain.com

# Without SSL (HTTP)
http://your-domain.com
```

**Docker Compose automatically routes:**
- Port 80 → Application (HTTP)
- Port 443 → Application (HTTPS with SSL)
- Traefik handles the routing

---

## Verification Steps

### 1. Check Application is Running

```bash
# Check Docker containers
docker ps

# Should show:
# - assettrackr-app (running)
# - assettrackr-db (if using local database)
# - traefik (if using SSL)
```

### 2. Check Setup Status API

```bash
# Check if setup is required
curl http://localhost:5000/api/setup/status

# Response (setup required):
{"setupCompleted": false}

# Response (setup complete):
{"setupCompleted": true}
```

### 3. Access Setup Page

**Browser:**
- Visit: `http://localhost:5000`
- Should see: "First-time setup required"
- Form with: Full Name, Email, Username, Password

---

## Troubleshooting

### Problem: Setup Page Doesn't Appear

**Check 1: Application Running**
```bash
docker ps
# Ensure assettrackr-app is running
```

**Check 2: Port Accessible**
```bash
# Test port 5000
curl http://localhost:5000

# Or from another machine
curl http://SERVER_IP:5000
```

**Check 3: Database Connection**
```bash
# Check logs
docker logs assettrackr-app

# Look for database connection errors
```

**Check 4: Setup Status**
```bash
# Check if setup was already completed
curl http://localhost:5000/api/setup/status
```

### Problem: "Setup Already Completed" Error

**Cause:** Admin user already exists in database

**Solution 1: Login Instead**
- Go to: `http://localhost:5000/auth`
- Use existing credentials to login

**Solution 2: Reset Database (WARNING: Deletes all data)**
```bash
# Stop application
docker compose -f docker-compose.production.yml down

# Remove database
docker volume rm assettrackr_pgdata

# Restart
docker compose -f docker-compose.production.yml --profile local-db up -d
```

### Problem: Port 5000 Not Accessible

**Check Firewall:**
```bash
# Ubuntu/Debian
sudo ufw allow 5000

# CentOS/RHEL
sudo firewall-cmd --add-port=5000/tcp --permanent
sudo firewall-cmd --reload
```

**Check Application Binding:**
```bash
# Check what's listening on port 5000
sudo lsof -i :5000
# or
sudo netstat -tulpn | grep 5000
```

### Problem: Blank Page or Connection Refused

**Check Docker Logs:**
```bash
# Application logs
docker logs assettrackr-app

# Database logs (if using local DB)
docker logs assettrackr-db

# Traefik logs (if using SSL)
docker logs traefik
```

**Check Environment Variables:**
```bash
# View container environment
docker exec assettrackr-app env | grep -E "PORT|DATABASE"
```

---

## Security Notes

### 1. **Change Default Admin Credentials**

After first-time setup, immediately:
1. Login with admin account
2. Go to Profile (top right)
3. Change password to a stronger one

### 2. **Setup Can Only Run Once**

- First-time setup is a one-time process
- After completion, setup endpoint is blocked
- Can only be reset by clearing database

### 3. **Production Security**

**Always use HTTPS in production:**
```bash
# Configure in .env
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# Deploy with SSL
./deploy.sh

# Access via HTTPS
https://yourdomain.com
```

---

## Quick Reference

### Development Setup
```bash
# 1. Start application
npm run dev

# 2. Open browser
http://localhost:5000

# 3. Fill setup form
# 4. Click "Create Admin Account"
```

### Production Setup (Local Database)
```bash
# 1. Deploy
docker compose -f docker-compose.production.yml --profile local-db up -d

# 2. Open browser
http://your-server-ip:5000

# 3. Complete setup form
```

### Production Setup (External Database)
```bash
# 1. Configure .env
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://...

# 2. Deploy
./deploy.sh

# 3. Open browser
https://yourdomain.com

# 4. Complete setup form
```

---

## After Setup

Once setup is complete:

1. ✅ **Admin account created** with full system access
2. ✅ **System settings initialized** with defaults
3. ✅ **Ready for use** - start adding assets, users, etc.

### Next Steps:

1. **Login** with your admin credentials
2. **Configure branding** (Settings → Branding)
3. **Add users** (Users → Add User)
4. **Create departments** (Departments → Add Department)
5. **Add employees** (Employees → Add Employee)
6. **Start tracking assets** (Assets → Add Asset)

---

## URL Summary

| Environment | URL | Setup Detection |
|------------|-----|-----------------|
| **Local Dev** | http://localhost:5000 | ✅ Automatic |
| **Production (IP)** | http://SERVER_IP:5000 | ✅ Automatic |
| **Production (Domain)** | https://yourdomain.com | ✅ Automatic |
| **Auth Route (Local)** | http://localhost:5000/auth | ✅ Automatic |
| **Auth Route (Prod)** | https://yourdomain.com/auth | ✅ Automatic |

**All URLs automatically detect if setup is required and show the setup page accordingly.**

---

## Related Documentation

- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Deploy to production
- **[CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)** - Cloud deployment
- **[DOCKER_INSTALLATION_GUIDE.md](DOCKER_INSTALLATION_GUIDE.md)** - Install Docker
- **[README.md](README.md)** - General information

---

**🎉 First-time setup is automatic - just visit the application URL and the setup page will appear!**
