# Ubuntu Deployment Troubleshooting Guide

## Issue: Docker Container Auto-Restarts

If your AssetTrack Docker container keeps restarting automatically after fresh deployment on Ubuntu, follow this troubleshooting guide.

### Symptoms

- Container starts and stops repeatedly
- `docker-compose logs` shows no errors or very brief output
- Container never stays running long enough to become healthy
- You see messages like: `Restarting container... X times`

### Root Causes & Solutions

#### 1. Missing or Invalid DATABASE_URL

**Most Common Cause** (90% of cases)

The container needs the `DATABASE_URL` environment variable to connect to the database.

**How to Fix:**

1. **Check your `.env` file exists:**
   ```bash
   cat .env
   ```

2. **Verify DATABASE_URL is set:**
   ```bash
   grep DATABASE_URL .env
   ```

3. **If missing, add it:**
   ```bash
   echo "DATABASE_URL=postgresql://username:password@db:5432/assettrack" >> .env
   ```

4. **Restart containers:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

5. **Check logs:**
   ```bash
   docker-compose logs -f app
   ```

**For Different Database Providers:**

- **Docker Compose (local postgres service):**
  ```
  DATABASE_URL=postgresql://postgres:postgres@db:5432/assettrack
  ```

- **AWS RDS:**
  ```
  DATABASE_URL=postgresql://admin:password@assettrack-db.xxxxx.us-east-1.rds.amazonaws.com:5432/assettrack
  ```

- **DigitalOcean Managed Database:**
  ```
  DATABASE_URL=postgresql://doadmin:password@assettrack-db-do-user-xxxxx.db.ondigitalocean.com:25060/assettrack?sslmode=require
  ```

- **Neon (Serverless PostgreSQL):**
  ```
  DATABASE_URL=postgresql://user:password@ep-xxxxx.region.neon.tech/assettrack
  ```

---

#### 2. Missing SESSION_SECRET

**Secondary Cause** (impacts production deployments only)

In production mode (`NODE_ENV=production`), the application requires a `SESSION_SECRET` for session management security.

**How to Fix:**

1. **Generate a secure random string:**
   ```bash
   openssl rand -base64 32
   ```
   Output example: `aBcD1234eFgH5678iJkL9012mNoPqRsT+UvWxYz/01234567`

2. **Add to `.env`:**
   ```bash
   SESSION_SECRET=aBcD1234eFgH5678iJkL9012mNoPqRsT+UvWxYz/01234567
   ```

3. **Restart containers:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

#### 3. Database Connection Issues

**If DATABASE_URL is set but connection still fails:**

1. **Verify database is running and accessible:**
   ```bash
   # For local Docker database
   docker-compose ps
   # Should show db service as "Up"
   
   # Test connection
   docker-compose exec db psql -U postgres -d assettrack -c "SELECT 1;"
   ```

2. **Check database credentials:**
   ```bash
   # Extract credentials from DATABASE_URL
   # Format: postgresql://[user]:[password]@[host]:[port]/[database]
   
   # Test with psql
   psql "postgresql://username:password@localhost:5432/assettrack"
   ```

3. **For remote databases, check firewall rules:**
   ```bash
   # Verify port is open
   telnet database-host 5432
   
   # Or using nc (netcat)
   nc -zv database-host 5432
   ```

4. **Check database exists:**
   ```bash
   docker-compose exec db psql -U postgres -l | grep assettrack
   ```

---

#### 4. Application Startup Timeout

**If the database is running but app still restarts:**

The application health check has a 90-second start period. If the database is very slow, it might exceed this.

**Check logs for specific errors:**

```bash
# View last 100 lines of logs
docker-compose logs --tail=100 app

# Follow logs in real-time
docker-compose logs -f app

# Look for specific error patterns
docker-compose logs app | grep -i error
docker-compose logs app | grep -i failed
docker-compose logs app | grep -i fatal
```

---

#### 5. Insufficient System Resources

**If database is ready but app still won't stay up:**

The container might be running out of memory or CPU.

**Check resource limits:**

```bash
# View container stats
docker stats --no-stream

# Check for out-of-memory errors
docker-compose logs app | grep -i "killed\|memory"
```

**Increase limits in `docker-compose.yml`:**

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

Then restart:
```bash
docker-compose up -d
```

---

### Complete Troubleshooting Checklist

Before each deployment on a fresh Ubuntu server:

- [ ] `.env` file exists and is readable
- [ ] `DATABASE_URL` is set with correct credentials
- [ ] `SESSION_SECRET` is set (for production deployments)
- [ ] Database server is running and accessible
- [ ] Database credentials are correct
- [ ] Firewall allows connection to database port
- [ ] System has sufficient disk space: `df -h`
- [ ] System has sufficient memory: `free -h`
- [ ] Docker daemon is running: `docker ps`
- [ ] Docker Compose version is 2.0+: `docker-compose --version`

### Verify Deployment Success

Once the container is stable:

```bash
# Check container is running
docker-compose ps
# Should show app as "Up"

# Check logs show successful startup
docker-compose logs app | tail -20
# Should see: "serving on port 5000"

# Test health endpoint
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}

# Test application
curl http://localhost:5000
# Should return HTML (React app)
```

---

### Need More Help?

**Enable debug logging:**

1. Add to `.env`:
   ```
   DEBUG=*
   NODE_ENV=development
   ```

2. Restart containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. Check detailed logs:
   ```bash
   docker-compose logs -f app
   ```

4. Once you've identified the issue, change back to production:
   ```
   NODE_ENV=production
   ```

---

### Common Error Messages

#### "DATABASE_URL must be set"
→ Add `DATABASE_URL` to `.env`

#### "Cannot connect to database"
→ Check database credentials and firewall rules

#### "CONNECTION REFUSED"
→ Database service is not running or port is blocked

#### "FATAL: SESSION_SECRET is not set"
→ Generate and add `SESSION_SECRET` to `.env` in production

#### "Container exits immediately"
→ Check logs with `docker-compose logs app`

#### "Killed" in logs
→ System out of memory; increase Docker memory limit

---

### Prevention for Next Deployment

**Create `.env.production` template:**

```bash
cat > .env.example << 'EOF'
# Required: PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:port/database

# Required in production: Random 32-byte string for session encryption
SESSION_SECRET=$(openssl rand -base64 32)

# Application settings
NODE_ENV=production
PORT=5000

# Optional: Database driver (auto-detected by default)
# DATABASE_DRIVER=pg  # or: neon

# Optional: Admin account seeding on first run
# ENABLE_DEFAULT_ADMIN=false
# DEFAULT_ADMIN_USERNAME=admin
# DEFAULT_ADMIN_PASSWORD=your-password
# DEFAULT_ADMIN_EMAIL=admin@example.com
# DEFAULT_ADMIN_FULLNAME=Administrator
EOF
```

Then before each deployment:
```bash
cp .env.example .env
# Edit .env with actual values
vim .env
docker-compose up -d
```
