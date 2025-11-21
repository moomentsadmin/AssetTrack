# Production Deployment Guide

This guide summarizes recommended production deployment options and links to platform-specific instructions. It is intended to be a single entrypoint for operations teams preparing to run AssetTrack in production.

## Overview
- Application: Node.js (Express) + React (Vite) + PostgreSQL
- Supported deployment styles:
  - Native Ubuntu systemd deployment (self-hosted PostgreSQL)
  - Docker Compose with internal DB (single-machine)
  - Docker Compose with external/managed DB (RDS, DigitalOcean DB, Azure DB)
  - Cloud-native deployments (ECS, AKS, App Service, etc.)

## A. Installation on Ubuntu (self-hosted or external DB)
### 1. Prerequisites
- Ubuntu 20.04+ (recommended)
- Node.js 20.x and npm
- Git
- PostgreSQL 12+ (if self-hosted) or managed DB connection string
- Nginx (recommended as reverse proxy)

### 2. Steps (internal DB)
1. Clone repo and checkout `main` branch:
```bash
git clone https://github.com/<org>/AssetTrack.git
cd AssetTrack
git checkout main
```
2. Create `.env` with production values (see `.env.example`):
- `DATABASE_URL=postgresql://asset_user:password@localhost:5432/asset_management`
- `NODE_ENV=production`
- `SESSION_SECRET=<random-32-bytes>`
- `PORT=5000`
3. Install dependencies and build:
```bash
npm ci
npm run build
```
4. Run database migrations (drizzle):
```bash
npx drizzle-kit migrate:latest
```
5. Start app via systemd (create service file) or PM2. Example systemd unit at `/etc/systemd/system/assettrack.service`:
```
[Unit]
Description=AssetTrack App
After=network.target

[Service]
Type=simple
User=assettrack
WorkingDirectory=/opt/assettrack
EnvironmentFile=/opt/assettrack/.env
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
6. Configure Nginx as reverse proxy (SSL termination, redirect HTTP->HTTPS).

### 3. Steps (external cloud DB)
- Use a managed DB connection string for `DATABASE_URL` and ensure network access from the host to the DB.

## B. Docker (internal / external / managed DB)
### 1. Internal DB (single machine)
- Use `docker-compose.yml` included in the repo. Example:
```bash
docker-compose up -d --build
```
- The `db` service uses local volume `postgres_data` by default.

### 2. External / Managed DB
- Do not run `db` service. Instead, set `DATABASE_URL` in `.env` to the managed DB connection string and start app service only:
```bash
# Example .env
DATABASE_URL=postgresql://user:pass@<host>:5432/asset_management
SESSION_SECRET=<secret>
NODE_ENV=production
```
- Start with docker-compose but override `db` service using environment and `depends_on` will be skipped.

## C. Cloud Providers (AWS / DigitalOcean / Azure)
### 1. Database
- AWS: Use RDS (Postgres) and set `DATABASE_URL` accordingly.
- DigitalOcean: Use Managed Databases; set `DATABASE_URL`.
- Azure: Use Azure Database for PostgreSQL.

### 2. App Deployment Options
- AWS: ECS Fargate, EKS, or EC2. Use a load balancer (ALB) and set up autoscaling.
- DigitalOcean: Use App Platform or droplets + Docker Compose.
- Azure: Use App Service (Container) or AKS.

### 3. Security
- Use TLS for all connections. Use security groups/firewalls to restrict DB access.
- Store `SESSION_SECRET` and other secrets in environment variables / secret managers.

## D. Application Deployment Solutions
- Provide Terraform templates or CloudFormation stacks for infra provisioning (optional).
- Provide Kubernetes manifests / Helm chart for cluster deployments (optional).

## Additional Notes
- Use backups for the database (pg_dump, managed snapshots).
- Monitor app and DB health; integrate with logs and alerts.
- Review `PRODUCTION_DEPLOYMENT_QUICK_START.md`, `DEPLOYMENT.md`, and `validate-deployment.sh` for runnable checks.

---

This doc is a starting point. I can expand any section into a step-by-step guide (including sample systemd files, Nginx config, Terraform templates, or Helm charts) on request.
