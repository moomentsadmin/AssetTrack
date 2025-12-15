# AssetTrack Deployment Instructions

Complete step-by-step guide to deploy AssetTrack on your production server.

## Prerequisites

Ensure your server has:
- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- Git
- At least 2GB RAM and 10GB disk space
- Port 5000 accessible (or configure Traefik for reverse proxy)

### Install Docker & Docker Compose (Ubuntu/Debian)

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker compose version

# Add current user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker
```

---

## Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack

# Checkout the latest main branch
git pull origin main
```

---

## Step 2: Configure Environment Variables

Create a `.env` file in the project root with production settings:

```bash
cat > .env << 'EOF'
# Database Configuration
PGUSER=asset_user
PGPASSWORD=your_secure_password_here_min_32_chars
PGDATABASE=asset_management

# Application Configuration
NODE_ENV=production
PORT=5000

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your_secure_random_session_secret_min_32_characters_here

# Domain Configuration (optional, for session cookies)
DOMAIN=yourdomain.com

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Company Branding (optional)
COMPANY_NAME="Your Company Name"
COMPANY_WEBSITE="https://yourcompany.com"
EOF
```

### Generate Secure Secrets

```bash
# Generate a strong session secret
openssl rand -base64 32

# Generate a strong database password
openssl rand -base64 32
```

**Important**: Replace all placeholder values with your actual production values.

---

## Step 3: Build Docker Images

```bash
# Navigate to project directory
cd /path/to/AssetTrack

# Build the application image
docker compose build --no-cache

# Verify build succeeded
docker images | grep assettrack
```

---

## Step 4: Initialize & Start Containers

```bash
# Start all services (database + app)
docker compose up -d

# Wait for services to start (typically 15-20 seconds)
sleep 20

# Check if containers are running
docker compose ps

# Monitor startup logs
docker compose logs app -f
# Press Ctrl+C to exit logs when you see "serving on port 5000"
```

### Expected Output in Logs

You should see:
```
asset-app  | Waiting for database...
asset-app  | Running database migrations (non-interactive)...
asset-app  | ✓ Pulling schema from database...
asset-app  | ✓ Pushing schema to database...
asset-app  | 9:11:10 AM [express] serving on port 5000
```

---

## Step 5: Verify Deployment

### Health Check

```bash
# Test the health endpoint
curl -s http://localhost:5000/health | jq .
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-15T09:14:48.172Z"
}
```

### Check Container Status

```bash
# View all containers
docker compose ps

# Check logs for any errors
docker compose logs --all

# Check database connectivity
docker compose exec app npx drizzle-kit introspect
```

---

## Step 6: Access the Application

### Direct Access (Development)
- **URL**: `http://your-server-ip:5000`
- **Default Admin**: Username: `admin`, Password: `admin` (change immediately!)

### Production Setup with Traefik (Recommended)

If you want HTTPS and a domain, use Traefik reverse proxy:

1. **Update docker-compose.yml** to add Traefik service:

```yaml
services:
  traefik:
    image: traefik:v2.10
    container_name: asset-traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik.yml:/traefik.yml
      - ./acme.json:/acme.json
    networks:
      - asset-network

  app:
    # ... existing config ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=5000"
```

2. **Create traefik.yml** for Let's Encrypt certificates.

3. **Restart services**:
```bash
docker compose up -d
```

---

## Step 7: Create Initial Admin User

After first deployment, change the default admin password:

```bash
# Access the app at http://your-server-ip:5000
# Login with: admin / admin
# Go to Settings → User Management
# Edit admin user and set a new strong password
```

Or use the API:

```bash
curl -X PATCH http://localhost:5000/api/users/admin-user-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"password": "NewSecurePassword123!"}'
```

---

## Step 8: Database Backup

### Daily Backup Script

Create `/root/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/assettrack"
mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T db pg_dump -U asset_user asset_management | \
  gzip > "$BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S).sql.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

### Enable Automated Backups

```bash
# Make script executable
chmod +x /root/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-db.sh") | crontab -
```

### Manual Backup

```bash
docker compose exec -T db pg_dump -U asset_user asset_management | gzip > asset_backup_$(date +%Y%m%d).sql.gz
```

### Restore from Backup

```bash
# Extract backup
gunzip -c asset_backup_20251215.sql.gz > backup.sql

# Restore to database
docker compose exec -T db psql -U asset_user asset_management < backup.sql
```

---

## Step 9: Monitoring & Logs

### View Real-time Logs

```bash
# App logs
docker compose logs app -f

# Database logs
docker compose logs db -f

# All services
docker compose logs -f
```

### Log Persistence

Logs are stored in `./logs/` directory (mapped in docker-compose.yml):

```bash
# View disk usage
du -sh logs/

# Archive old logs
tar -czf logs_archive_$(date +%Y%m%d).tar.gz logs/
rm -rf logs/*
```

---

## Step 10: Updates & Maintenance

### Pull Latest Changes

```bash
# Fetch latest code
git pull origin main

# Rebuild images
docker compose build --no-cache

# Restart services
docker compose down
docker compose up -d

# Verify deployment
docker compose logs app -f
```

### Database Migrations

Migrations run automatically on startup. To check migration status:

```bash
docker compose exec app npx drizzle-kit introspect
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs app

# Verify environment variables
docker compose exec app env | grep -i pg

# Restart services
docker compose restart
```

### Database Connection Failed

```bash
# Check database is running
docker compose ps db

# Test database connection
docker compose exec app npx drizzle-kit introspect

# Check database logs
docker compose logs db
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Or change port in docker-compose.yml and .env
# Then rebuild: docker compose up -d
```

### 404 Error on Root URL

Ensure static files are built:

```bash
# Rebuild the app
docker compose build --no-cache

# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Chrome) or Cmd+Shift+R (Mac)
```

---

## Production Checklist

- [ ] Clone repository on server
- [ ] Configure `.env` with production values
- [ ] Generate secure secrets (passwords, session key)
- [ ] Build Docker images
- [ ] Start containers and verify health
- [ ] Change default admin password
- [ ] Set up daily database backups
- [ ] Configure domain/SSL (Traefik or similar)
- [ ] Enable monitoring/alerting
- [ ] Document backup/restore procedures
- [ ] Plan update strategy

---

## Performance Tuning

### Increase Resources

Edit `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
  db:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Database Connection Pooling

Edit `.env`:

```bash
DB_POOL_SIZE=20
DB_IDLE_TIMEOUT=30000
```

---

## Support & Documentation

- **GitHub**: https://github.com/moomentsadmin/AssetTrack
- **Issues**: Report bugs via GitHub Issues
- **Documentation**: See README.md and design_guidelines.md

---

## Quick Deploy Command

```bash
# One-liner for experienced users
git clone https://github.com/moomentsadmin/AssetTrack.git && cd AssetTrack && \
cp .env.example .env && \
# Edit .env with your values
docker compose build && docker compose up -d && \
docker compose logs app -f
```
