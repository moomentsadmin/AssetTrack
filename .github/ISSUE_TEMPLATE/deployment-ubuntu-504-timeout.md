---
name: Ubuntu Deployment - 504 Gateway Timeout
about: Getting 504 timeouts when deploying to Ubuntu server
title: '[Ubuntu] 504 Gateway Timeout on Login'
labels: deployment, ubuntu, bug
assignees: ''
---

## Problem Description
Getting 504 Gateway Timeout errors when trying to login or use the application on Ubuntu server.

## Environment
- **OS**: Ubuntu (version: ___)
- **Node.js**: (version: ___)
- **PostgreSQL**: (version: ___)
- **PM2**: (version: ___)
- **Nginx**: (version: ___)

## Error Details
```
(Paste your error message here - usually from browser console or PM2 logs)
```

## Common Causes & Solutions

### 1. Database Driver Mismatch
**Symptom**: Error mentions `wss://localhost/v2` or SSL certificate mismatch

**Cause**: Using Neon WebSocket driver (`@neondatabase/serverless`) with local PostgreSQL

**Solution**: The application now auto-detects database type. Ensure:
```bash
# Your DATABASE_URL should NOT include neon.tech or neon.app
# For local PostgreSQL:
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname?sslmode=disable
```

### 2. Database Connection Hanging
**Check PM2 logs**:
```bash
pm2 logs asset-management --err --lines 50
```

Look for SSL/TLS errors like:
```
ERR_TLS_CERT_ALTNAME_INVALID
Host: localhost. is not in the cert's altnames
```

**Solution**:
```bash
# Add ?sslmode=disable to DATABASE_URL in your .env file
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname?sslmode=disable

# Restart PM2
pm2 restart asset-management
```

### 3. Database Permissions
**Test connection**:
```bash
psql -h localhost -U asset_user -d asset_management -c "SELECT 1;"
```

**Fix permissions**:
```bash
sudo -u postgres psql
\c asset_management
GRANT ALL ON SCHEMA public TO asset_user;
ALTER DATABASE asset_management OWNER TO asset_user;
\q
```

### 4. Nginx Timeout Settings
Edit `/etc/nginx/sites-available/your-site`:
```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    # Add these timeouts
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

Then restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Debugging Steps
1. **Check if app is running**:
   ```bash
   pm2 list
   curl http://localhost:5000/health
   ```

2. **Test database connection**:
   ```bash
   psql -h localhost -U asset_user -d asset_management -c "SELECT COUNT(*) FROM users;"
   ```

3. **Check PM2 logs for errors**:
   ```bash
   pm2 logs asset-management --lines 100
   ```

4. **Verify DATABASE_URL**:
   ```bash
   cat .env | grep DATABASE_URL
   # Should show: ?sslmode=disable for localhost
   ```

## Additional Information
- Domain: ___
- Using SSL: Yes / No
- Database location: localhost / remote

## Related Documentation
- [Full Deployment Guide](../../DEPLOYMENT.md)
- [Database Configuration](#database-support)
