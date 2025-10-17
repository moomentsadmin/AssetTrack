# Docker Quick Start Guide

## 🚀 Deploy in 5 Minutes

### Prerequisites
- Docker installed ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)

### Step-by-Step Deployment

```bash
# 1. Clone the repository
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack

# 2. Create environment configuration
cp .env.example .env

# 3. Edit environment variables (REQUIRED)
nano .env  # or use your preferred editor
```

**Update these values in `.env`:**
```env
# Database password (change this!)
PGPASSWORD=your_secure_password_here

# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your_secure_random_session_secret_min_32_characters
```

```bash
# 4. Start the application
docker compose up -d

# 5. Wait for services to be ready (about 30 seconds)
docker compose logs -f app

# Watch for: "serving on port 5000"
# Press Ctrl+C to exit logs

# 6. Access the application
# Open browser: http://localhost:5000
```

### First-Time Setup

1. Navigate to `http://localhost:5000`
2. You'll see the **First-Time Setup** page
3. Create your admin account:
   - **Full Name**: Your name
   - **Email**: Your email
   - **Username**: admin (or your choice)
   - **Password**: Secure password (min 8 characters)
4. Click **"Create Admin Account"**
5. You're automatically logged in!

### Managing Your Deployment

```bash
# View logs
docker compose logs -f app      # Application logs
docker compose logs -f db       # Database logs

# Stop services
docker compose down

# Start services
docker compose up -d

# Restart services
docker compose restart

# Rebuild after code changes
docker compose up -d --build

# Remove all data (careful!)
docker compose down -v
```

### Accessing the Database

```bash
# Connect to PostgreSQL
docker compose exec db psql -U asset_user -d asset_management

# Backup database
docker compose exec db pg_dump -U asset_user asset_management > backup.sql

# Restore database
docker compose exec -T db psql -U asset_user asset_management < backup.sql
```

### Troubleshooting

**Port 5000 already in use?**
```bash
# Edit docker compose.yml and change port mapping:
ports:
  - "8080:5000"  # Access on http://localhost:8080
```

**Database connection errors?**
```bash
# Check database is healthy
docker compose ps

# Restart database
docker compose restart db

# Check database logs
docker compose logs db
```

**Application won't start?**
```bash
# Check logs for errors
docker compose logs app

# Rebuild the image
docker compose up -d --build

# Reset everything (removes data!)
docker compose down -v
docker compose up -d
```

### Production Deployment

For production, update these settings:

**`.env` for production:**
```env
NODE_ENV=production
PORT=5000

# Use strong passwords
PGPASSWORD=very_strong_password_here
SESSION_SECRET=generate_with_openssl_rand_base64_32

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

**Add to `docker compose.yml`:**
```yaml
services:
  app:
    restart: always  # Auto-restart on failure
```

### Next Steps

1. **Configure Branding**
   - Go to Administration → Branding
   - Set company name, logo, website

2. **Add Locations**
   - Go to Administration → Locations
   - Add your office locations

3. **Create Departments**
   - Go to Departments
   - Add your organizational departments

4. **Add Users**
   - Go to Administration → User Management
   - Create admin/manager/employee accounts

5. **Import Assets**
   - Go to Assets → Add Asset (manual)
   - Or use Administration → Import Data (CSV bulk import)

### Support

- **Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides
- **GitHub Issues**: Report bugs or request features
- **README**: See [README.md](README.md) for full feature list

---

**🎉 Your Asset Management System is now running!**

Access it at: **http://localhost:5000**
