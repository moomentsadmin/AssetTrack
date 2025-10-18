# Production Deployment Issues & Solutions

This document lists all known issues discovered during production deployment testing and their resolutions. Use this as a reference when creating GitHub issues.

---

## Issue #1: Healthcheck IPv6/IPv4 Mismatch

**Priority:** 🔴 Critical  
**Status:** ✅ Fixed  
**Affects:** Docker deployments on Alpine Linux

### Problem
Container healthcheck always fails even though app is running and responding to requests.

### Root Cause
- Alpine Linux resolves `localhost` to `::1` (IPv6)
- Express binds only to `0.0.0.0` (IPv4)
- Healthcheck tools (`wget`, `nc`) attempt IPv6 connection and fail
- Traefik filters out "unhealthy" containers
- No router created, no SSL certificate requested

### Symptoms
```bash
# Container shows unhealthy
docker ps
# asset-app: Up X minutes (unhealthy)

# But app IS responding
curl http://container-ip:5000
# HTTP/1.1 200 OK ✅

# Healthcheck fails
docker exec asset-app wget -q -O- http://localhost:5000/
# Connection refused ❌
```

### Solution
1. Added `/health` endpoint to server (GET /health returns 200)
2. Changed healthcheck to explicitly use IPv4 address `127.0.0.1`
3. Used Node.js built-in `http` module instead of external tools

**Fixed healthcheck:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "node -e \"require('http').get('http://127.0.0.1:5000/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))\""]
  interval: 30s
  timeout: 10s
  start_period: 90s
  retries: 3
```

### Files Changed
- `docker-compose.production.yml` - Updated healthcheck
- `server/routes.ts` - Added `/health` endpoint

### Prevention
- Always use `127.0.0.1` instead of `localhost` in containers
- Use language-native tools (Node.js `http`) instead of system tools
- Test healthchecks inside Alpine containers specifically

---

## Issue #2: Missing /health Endpoint

**Priority:** 🔴 Critical  
**Status:** ✅ Fixed  
**Affects:** Container healthchecks

### Problem
No dedicated health check endpoint existed. Previous healthcheck used `/api/user` which requires authentication.

### Root Cause
- `/api/user` endpoint returns 401 for unauthenticated requests
- Healthcheck treated 401 as failure
- Container marked unhealthy on every check

### Solution
Added simple `/health` endpoint:

```typescript
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});
```

### Files Changed
- `server/routes.ts` - Added health endpoint

### Prevention
- Always include dedicated health endpoint in web services
- Health endpoints should NOT require authentication
- Return 200 for healthy, 5xx for unhealthy

---

## Issue #3: Database Migrations Block Container Startup

**Priority:** 🟡 Medium  
**Status:** ✅ Fixed  
**Affects:** Slow database connections, first deployments

### Problem
Running `npm run db:push` in docker-compose `command` blocks container startup. If database migration hangs, healthcheck never starts.

### Root Cause
- Migrations run synchronously before app starts
- Long migrations delay healthcheck `start_period`
- Container becomes unhealthy before app even starts

### Solution
1. Moved migrations to `entrypoint.sh` script
2. Entrypoint allows migrations to fail gracefully
3. App starts even if migrations timeout
4. Increased healthcheck `start_period` to 90s

**New entrypoint:**
```bash
#!/bin/sh
echo "Running database migrations..."
if npm run db:push; then
    echo "✅ Migrations completed"
else
    echo "⚠️  Migration failed, continuing..."
fi

exec "$@"  # Start the app
```

### Files Changed
- `docker/entrypoint.sh` - Created entrypoint script
- `Dockerfile` - Added ENTRYPOINT
- `docker-compose.production.yml` - Removed command override

### Prevention
- Never block app startup on external services
- Use entrypoint scripts for pre-start tasks
- Allow graceful degradation

---

## Issue #4: Documentation References External Database Despite Local-Only Deployment

**Priority:** 🟢 Low  
**Status:** ⚠️ Needs Update  
**Affects:** Developer confusion

### Problem
Documentation and docker-compose.yml contain references to external databases (DigitalOcean, AWS RDS) even though production uses local PostgreSQL.

### Root Cause
- Project evolved from external DB to local DB
- Documentation not updated
- Confusing environment variable defaults

### Solution
1. Clean up `docker-compose.production.yml` comments
2. Remove `USE_EXTERNAL_DB` toggle (not used)
3. Update `DATABASE_URL` default to always use local `db` service

### Files To Update
- `docker-compose.production.yml` - Remove external DB references
- `DEPLOYMENT_GUIDE.md` - Focus on local DB setup
- `.env.example` - Simplify to local-only

### Prevention
- Keep documentation aligned with actual deployment method
- Remove unused configuration options
- Single source of truth for setup

---

## Issue #5: Traefik Dashboard Left in Insecure Mode

**Priority:** 🟡 Medium (Security)  
**Status:** ⚠️ Needs Fix  
**Affects:** Production security

### Problem
Traefik API dashboard exposed on port 8080 with `--api.insecure=true` in production.

### Current State
```yaml
command:
  - "--api.dashboard=true"
  - "--api.insecure=true"  # ⚠️ INSECURE!

ports:
  - "8080:8080"  # Exposed to public
```

### Security Risk
- Dashboard accessible without authentication on port 8080
- Exposes container configuration
- Shows environment variables
- Lists all routers and services

### Recommended Fix
**Option 1: Disable in production**
```yaml
command:
  - "--api.dashboard=false"
# Remove port 8080
```

**Option 2: Secure properly**
```yaml
command:
  - "--api.dashboard=true"
  - "--api.insecure=false"  # Secure mode

labels:
  - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)"
  - "traefik.http.routers.dashboard.middlewares=dashboard-auth"
  - "traefik.http.middlewares.dashboard-auth.basicauth.users=${TRAEFIK_DASHBOARD_AUTH}"

# Do NOT expose port 8080
# Access via: https://traefik.yourdomain.com
```

### Files To Update
- `docker-compose.production.yml` - Secure or remove dashboard

### Prevention
- Never use `insecure=true` in production
- Always require authentication for admin panels
- Don't expose internal ports publicly

---

## Issue #6: No Firewall Configuration in Deployment Guide

**Priority:** 🟡 Medium (Security)  
**Status:** ✅ Fixed  
**Affects:** Security posture

### Problem
Deployment guide didn't include firewall setup, leaving unnecessary ports open.

### Solution
Added UFW configuration to Ubuntu deployment guide:

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### Files Changed
- `UBUNTU_DEPLOYMENT.md` - Added firewall section

---

## Issue #7: Healthcheck Defined in Both Dockerfile and Compose

**Priority:** 🟢 Low  
**Status:** ✅ Fixed  
**Affects:** Configuration clarity

### Problem
Healthcheck defined in `Dockerfile` AND `docker-compose.yml` causing confusion about which takes precedence.

### Solution
- Removed healthcheck from `Dockerfile`
- Single source of truth: `docker-compose.production.yml`
- Compose always overrides Dockerfile anyway

### Files Changed
- `Dockerfile` - Removed HEALTHCHECK directive

### Prevention
- Define healthchecks in compose files (easier to modify)
- Or in Dockerfile (if same for all environments)
- Never in both

---

## Summary for GitHub Issues

When creating GitHub issues, use this template:

```markdown
## [Issue Title from Above]

**Priority:** [Critical/High/Medium/Low]  
**Component:** [Docker/Healthcheck/Security/Documentation]

### Problem
[Describe the problem]

### Reproduction
[Steps to reproduce]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Solution
[Reference this document]

### Related Files
[List affected files]
```

---

## Quick Reference: All Fixed Issues

| # | Issue | Priority | Status | Fix Version |
|---|-------|----------|--------|-------------|
| 1 | IPv6/IPv4 healthcheck mismatch | Critical | ✅ Fixed | Current |
| 2 | Missing /health endpoint | Critical | ✅ Fixed | Current |
| 3 | Migrations block startup | Medium | ✅ Fixed | Current |
| 4 | External DB docs confusion | Low | ⚠️ Pending | Next |
| 5 | Traefik dashboard insecure | Medium | ⚠️ Pending | Next |
| 6 | No firewall guide | Medium | ✅ Fixed | Current |
| 7 | Duplicate healthcheck config | Low | ✅ Fixed | Current |

---

## Contributing

If you discover new production issues:

1. Document them in this file
2. Create GitHub issue with reference
3. Test fix in staging environment
4. Update this document with solution
5. Submit pull request

---

## Additional Resources

- [Ubuntu Deployment Guide](./UBUNTU_DEPLOYMENT.md)
- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Docker Compose Production Config](./docker-compose.production.yml)
- [Dockerfile](./Dockerfile)
