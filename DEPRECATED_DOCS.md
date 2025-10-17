# ⚠️ Deprecated Documentation Files

## Current vs. Deprecated Files

### ✅ **Use These (Current)**

**Primary Deployment:**
- `README.md` - Main project documentation
- `PRODUCTION_DEPLOYMENT.md` - Official deployment guide
- `deploy.sh` - Production deployment script
- `docker-compose.production.yml` - Current production configuration

**Database Setup:**
- `DIGITALOCEAN_DATABASE_SETUP.md` - External database setup
- `EXTERNAL_DATABASE_SETUP.md` - Generic external DB guide

**Security:**
- `SECURITY_CLEANUP_COMPLETE.md` - Security status summary
- `URGENT_SECURITY_ACTIONS.md` - Critical security actions
- `SECURITY_BREACH_RESPONSE.md` - Incident response guide

---

### ❌ **Deprecated (Old)**

**These files reference outdated `docker-compose.ssl.yml` instead of `docker-compose.production.yml`:**

1. `SSL_ENV_CONFIG.md` ❌
2. `QUICK_START.md` ❌
3. `DEPLOYMENT_GUIDE.md` ❌
4. `404_TROUBLESHOOTING.md` ❌ (partially outdated)
5. `DEPLOYMENT_SOLUTION.md` ❌
6. `DEPLOYMENT_CLEANUP.md` ❌
7. `FIX_DATABASE_USER.md` ❌
8. `FIRST_TIME_SETUP_FIX.md` ❌
9. `V2_UPDATE_COMPLETE.md` ❌
10. `DOCUMENTATION_SUMMARY.md` ❌

**Other deprecated files:**
- `GIT_COMMIT_GUIDE.md` - Repository already renamed
- `FINAL_SUMMARY.md` - Outdated summary

---

## Why Were They Deprecated?

### Original Structure (Old)
```
docker-compose.ssl.yml          ❌ Old file
docker-compose.ssl-external-db.yml  ❌ Old file
```

### Current Structure (New)
```
docker-compose.production.yml   ✅ Single production file
deploy.sh                      ✅ Smart deployment script
```

**Key Changes:**
1. **Unified deployment** - One file instead of two
2. **Auto-detection** - Script detects external vs. local database
3. **Simpler workflow** - Just run `./deploy.sh`

---

## Migration Guide

### If You See Commands Like This (Old):
```bash
# ❌ OLD - Don't use
docker compose -f docker-compose.ssl.yml up -d
docker compose -f docker-compose.ssl-external-db.yml up -d
```

### Use This Instead (Current):
```bash
# ✅ CURRENT - Use this
./deploy.sh
# OR
docker compose -f docker-compose.production.yml up -d
```

---

## Common Errors & Fixes

### Error: "unknown docker command: compose compose.ssl.yml"

**Cause:** Following deprecated docs with incorrect syntax or wrong filenames

**Fix:**
```bash
# Use the current deployment method
cd ~/AssetTrack
./deploy.sh
```

### Error: "docker-compose.ssl.yml: no such file"

**Cause:** File was replaced in v2 update

**Fix:**
```bash
# Use the new file
docker compose -f docker-compose.production.yml up -d
```

---

## What Should I Use?

### For Deployment
**Use:** `PRODUCTION_DEPLOYMENT.md` + `deploy.sh`

### For Troubleshooting
**Use:** `README.md` troubleshooting section

### For Database Setup
**Use:** 
- `DIGITALOCEAN_DATABASE_SETUP.md` (DigitalOcean)
- `EXTERNAL_DATABASE_SETUP.md` (Other providers)

---

## File Cleanup

### Safe to Delete (After Verification)
Once you confirm everything works with the current files:

```bash
# Backup first
mkdir -p ~/docs_backup
mv SSL_ENV_CONFIG.md ~/docs_backup/
mv DEPLOYMENT_GUIDE.md ~/docs_backup/
mv QUICK_START.md ~/docs_backup/
mv FIX_DATABASE_USER.md ~/docs_backup/
mv FIRST_TIME_SETUP_FIX.md ~/docs_backup/
mv V2_UPDATE_COMPLETE.md ~/docs_backup/
mv DEPLOYMENT_SOLUTION.md ~/docs_backup/
mv DEPLOYMENT_CLEANUP.md ~/docs_backup/
mv GIT_COMMIT_GUIDE.md ~/docs_backup/
mv FINAL_SUMMARY.md ~/docs_backup/
mv DOCUMENTATION_SUMMARY.md ~/docs_backup/
```

### Keep These
```
README.md ✅
PRODUCTION_DEPLOYMENT.md ✅
DIGITALOCEAN_DATABASE_SETUP.md ✅
EXTERNAL_DATABASE_SETUP.md ✅
SECURITY_*.md ✅
URGENT_SECURITY_ACTIONS.md ✅
replit.md ✅
```

---

## Quick Reference

### Current Deployment Commands
```bash
# Standard deployment
./deploy.sh

# Manual deployment
docker compose -f docker-compose.production.yml up -d

# View logs
docker compose -f docker-compose.production.yml logs -f

# Stop services
docker compose -f docker-compose.production.yml down

# Rebuild
docker compose -f docker-compose.production.yml up -d --build
```

### Configuration Files
```
.env                              ✅ Environment variables
docker-compose.production.yml     ✅ Production compose file
deploy.sh                        ✅ Deployment script
Dockerfile                       ✅ Container definition
```

---

## Summary

**✅ Current (Use These):**
- `deploy.sh` - Automated deployment
- `docker-compose.production.yml` - Production config
- `PRODUCTION_DEPLOYMENT.md` - Deployment guide
- Security docs (`SECURITY_*.md`)

**❌ Deprecated (Don't Use):**
- Any file referencing `docker-compose.ssl.yml`
- Old quickstart/deployment guides
- V1 migration documents

**🎯 Golden Rule:**
When in doubt, use `./deploy.sh` - it handles everything!

---

Last updated: After v2 consolidation (docker-compose.production.yml)
