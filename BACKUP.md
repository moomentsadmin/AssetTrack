# Backup and Restore Guide

This guide covers backing up and restoring the PostgreSQL database and app data for AssetTrack in both Docker and non-Docker setups.

## What to Back Up

- Database: PostgreSQL (all tables; critical for users, assets, history)
- App data: `./logs/` (optional operational logs)
- Config: `.env` (secrets, DB connection)
- Docker volumes (if using internal DB): `postgres_data`

---

## Docker: Internal PostgreSQL (local container)

### One-off Backup (Host)

```bash
# Compressed SQL dump to ./backups (create dir first)
mkdir -p backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec asset-db pg_dump -U ${PGUSER:-asset_user} ${PGDATABASE:-asset_management} \
  | gzip > backups/db_${TIMESTAMP}.sql.gz
```

### Verify Backup

```bash
gzip -t backups/db_${TIMESTAMP}.sql.gz && echo "OK"
```

### Restore

```bash
# Stop app to avoid writes during restore
docker compose -f docker-compose.ssl.yml stop app

# Drop + recreate DB (CAUTION: destructive)
docker exec -it asset-db psql -U ${PGUSER:-asset_user} -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${PGDATABASE:-asset_management}';"
docker exec -it asset-db psql -U ${PGUSER:-asset_user} -c "DROP DATABASE IF EXISTS ${PGDATABASE:-asset_management};"
docker exec -it asset-db psql -U ${PGUSER:-asset_user} -c "CREATE DATABASE ${PGDATABASE:-asset_management};"

# Restore from dump
gunzip -c backups/db_YYYYMMDD_HHMMSS.sql.gz | docker exec -i asset-db psql -U ${PGUSER:-asset_user} -d ${PGDATABASE:-asset_management}

# Run migrations (if needed)
docker compose -f docker-compose.ssl.yml exec app npm run db:push

# Restart app
docker compose -f docker-compose.ssl.yml start app
```

### Volume-Level Backup (Cold)

```bash
# Stop services first for a consistent snapshot
docker compose -f docker-compose.ssl.yml down

# Archive the Postgres data volume tarball
# (This uses a helper container to mount the volume)
docker run --rm \
  -v assettrack_postgres_data:/from \
  -v $(pwd)/backups:/to \
  alpine sh -c "cd /from && tar -czf /to/pgdata_$(date +%Y%m%d_%H%M%S).tar.gz ."

# Bring services back up
docker compose -f docker-compose.ssl.yml up -d
```

Restore from volume tarball (cold):

```bash
# Stop and remove containers and volume (CAUTION)
docker compose -f docker-compose.ssl.yml down -v

# Recreate empty volume
docker volume create assettrack_postgres_data

# Restore files into the volume
docker run --rm \
  -v assettrack_postgres_data:/to \
  -v $(pwd)/backups:/from \
  alpine sh -c "cd /to && tar -xzf /from/pgdata_YYYYMMDD_HHMMSS.tar.gz"

# Start stack
docker compose -f docker-compose.ssl.yml up -d
```

### Scheduled Backups (Cron)

```bash
# /usr/local/bin/assettrack-backup.sh
#!/bin/sh
set -e
BACKUP_DIR="/var/backups/assettrack"
mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d_%H%M%S)
docker exec asset-db pg_dump -U ${PGUSER:-asset_user} ${PGDATABASE:-asset_management} | gzip > "$BACKUP_DIR/db_${TS}.sql.gz"
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/assettrack-backup.sh
sudo crontab -e
# Daily at 2:00 AM
0 2 * * * /usr/local/bin/assettrack-backup.sh
```

---

## Docker: External/Managed PostgreSQL

Use the provider’s snapshot/backup features when possible (RDS, DO Managed DB, Azure). For on-demand logical backups from the app host:

```bash
# Using DATABASE_URL (exported)
# Example: export DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
PGURL="$DATABASE_URL"
mkdir -p backups
TS=$(date +%Y%m%d_%H%M%S)
pg_dump "$PGURL" | gzip > backups/db_${TS}.sql.gz
```

Restore:

```bash
gunzip -c backups/db_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"
```

---

## Non-Docker (Ubuntu VM with local Postgres)

Backup:

```bash
sudo -u postgres pg_dump asset_management_prod | gzip > /var/backups/postgresql/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

Restore:

```bash
gunzip -c /var/backups/postgresql/backup_YYYYMMDD_HHMMSS.sql.gz | psql -U asset_user -d asset_management_prod
```

Schedule (cron):

```bash
sudo nano /usr/local/bin/backup-db.sh
# (use the script from DEPLOYMENT.md Ubuntu section)
```

---

## App Logs and Config Backup

- Logs directory (if mounted): `./logs/`
  - Archive periodically: `tar -czf logs_$(date +%Y%m%d).tar.gz logs/`
- Config: keep a secure copy of `.env` and any deployment notes
- Docker: consider backing up `docker-compose.*.yml` and reverse proxy configs

---

## Test Your Backups

Periodically perform a test restore into a staging environment:
- Create a fresh DB
- Restore the latest dump
- Run `npm run db:push`
- Smoke-test login and core flows

---

## Windows (PowerShell) Quick Commands

Backup (Docker internal DB):

```powershell
New-Item -ItemType Directory -Force -Path .\backups | Out-Null
$ts = Get-Date -Format yyyyMMdd_HHmmss
docker exec asset-db pg_dump -U $env:PGUSER $env:PGDATABASE | gzip > ("backups/db_" + $ts + ".sql.gz")
```

Restore:

```powershell
$path = "backups/db_YYYYMMDD_HHMMSS.sql.gz"
7z e -so $path | docker exec -i asset-db psql -U $env:PGUSER -d $env:PGDATABASE
```

Note: Install 7zip CLI (`choco install 7zip`) or use WSL for gzip.
