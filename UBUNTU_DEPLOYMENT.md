# Ubuntu Production Deployment Guide

Quick guide for deploying with Docker on Ubuntu with local PostgreSQL database.

## Prerequisites

- Ubuntu 20.04+ server
- Domain name pointing to server IP
- Ports 80/443 open

## Step 1: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

## Step 2: Clone and Configure

```bash
# Clone repository
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack

# Create environment file
cat > .env << 'EOF'
# Domain
DOMAIN=asset.example.com
LETSENCRYPT_EMAIL=admin@example.com

# Database (Local)
PGUSER=asset_user
PGPASSWORD=CHANGE_THIS_SECURE_PASSWORD
PGDATABASE=asset_management

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=CHANGE_THIS_RANDOM_STRING

# Traefik Dashboard
TRAEFIK_DASHBOARD_AUTH=admin:$2y$05$...
EOF

# Edit with your values
nano .env
```

## Step 3: Deploy

```bash
# Start all services
docker compose -f docker-compose.production.yml --profile local-db up -d --build

# Watch logs
docker compose -f docker-compose.production.yml logs -f
```

## Step 4: Verify

```bash
# Check container status (all should show "healthy")
docker compose -f docker-compose.production.yml ps

# Check router discovery
curl -s http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("assetapp"))'

# Test HTTPS (after 60 seconds)
curl -I https://asset.example.com
```

## Common Issues

### Container Unhealthy
```bash
# Check logs
docker logs asset-app --tail 100

# Check health
docker inspect asset-app --format '{{json .State.Health}}' | jq
```

### SSL Not Working
```bash
# Verify DNS
dig +short asset.example.com

# Check Traefik logs
docker logs asset-traefik | grep -i certificate

# Restart Traefik
docker compose -f docker-compose.production.yml restart traefik
```

## Management Commands

```bash
# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart
docker compose -f docker-compose.production.yml restart

# Update
git pull
docker compose -f docker-compose.production.yml up -d --build

# Backup database
docker exec asset-db pg_dump -U asset_user asset_management > backup_$(date +%Y%m%d).sql
```

## Access

- App: https://asset.example.com
- Traefik Dashboard: https://traefik.asset.example.com (with auth)
