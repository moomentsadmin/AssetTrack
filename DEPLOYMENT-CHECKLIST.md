# Ubuntu Deployment Quick Checklist

## Before You Deploy

```bash
# 1. Prepare environment file
cat > .env << EOF
# REQUIRED: PostgreSQL connection string
DATABASE_URL=postgresql://username:password@host:5432/assettrack

# REQUIRED: Random 32-byte session encryption key
SESSION_SECRET=$(openssl rand -base64 32)

# OPTIONAL: Pre-seed admin account (testing only)
# ENABLE_DEFAULT_ADMIN=false
# DEFAULT_ADMIN_PASSWORD=your-strong-password

# OPTIONAL: Application settings
NODE_ENV=production
PORT=5000
EOF

# 2. Update values in .env file
nano .env
# Set DATABASE_URL to your database connection string
# Keep SESSION_SECRET as is (already generated)
```

## Deploy

```bash
# 1. Start containers
docker-compose down   # Clean up if re-deploying
docker-compose up -d

# 2. Wait for startup (90 seconds)
echo "Waiting for startup..."
sleep 90

# 3. Verify health
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}

# 4. Check container status
docker-compose ps
# Should show: Up X minutes (healthy)

# 5. View logs
docker-compose logs app | tail -20
# Should see: "serving on port 5000"
```

## If Container Restarts

```bash
# 1. Check logs immediately
docker-compose logs -f app

# 2. Verify environment variables
docker-compose exec app env | grep -E "DATABASE_URL|SESSION_SECRET|NODE_ENV"

# 3. Test database connection
docker-compose exec app psql $DATABASE_URL -c "SELECT 1;"

# 4. Check for error messages
docker-compose logs app | grep -iE "error|failed|fatal|exception"
```

## Common Errors & Fixes

| Error in Logs | Solution |
|---|---|
| `DATABASE_URL must be set` | Add `DATABASE_URL` to `.env` file |
| `Cannot connect to database` | Check database credentials and network |
| `SESSION_SECRET is not set` | Add `SESSION_SECRET` to `.env` file |
| `Connection refused` | Ensure database is running and accessible |
| Container keeps restarting | See UBUNTU-DEPLOYMENT-TROUBLESHOOTING.md |

## Verify Success

✅ Container stays running longer than 90 seconds  
✅ `docker-compose ps` shows healthy status  
✅ `/api/health` returns 200 OK  
✅ Access http://localhost:5000 in browser  
✅ Setup page appears on first load  

## Setup Wizard

1. Access http://localhost:5000
2. Fill in admin credentials:
   - Full Name: Your Name
   - Email: admin@example.com
   - Username: admin
   - Password: (min 8 characters)
3. Click "Setup"
4. Login with your credentials
5. Dashboard loads successfully

---

**If you still have issues, read:** `UBUNTU-DEPLOYMENT-TROUBLESHOOTING.md`
