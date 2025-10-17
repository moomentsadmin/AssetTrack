#!/bin/bash
# Clean up old containers and deploy with fixed network

set -e

echo "🧹 Cleanup and Deploy"
echo "===================="
echo ""

cd ~/AssetTrack || exit 1

# Stop and remove ALL old containers
echo "🛑 Stopping and removing old containers..."
docker stop asset-app asset-traefik asset-db 2>/dev/null || true
docker rm asset-app asset-traefik asset-db 2>/dev/null || true

# Remove old networks
echo "🌐 Removing old networks..."
docker network rm assettrack_asset-network 2>/dev/null || true
docker network rm asset-network 2>/dev/null || true

# Clean up
echo "🧹 Cleaning up..."
docker system prune -f

# Pull latest
echo "📥 Pulling latest changes..."
git pull origin main

# Start with new configuration
echo "🚀 Starting services with fixed network..."
docker compose -f docker-compose.production.yml up -d --build

# Wait for startup
echo "⏳ Waiting for services to start (45s)..."
sleep 45

# Check status
echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "🌐 Network Information:"
docker network ls | grep asset

echo ""
echo "📝 Application Logs:"
docker compose -f docker-compose.production.yml logs app --tail=20

echo ""
echo "📝 Traefik Logs (checking for warnings):"
docker compose -f docker-compose.production.yml logs traefik --tail=15 | grep -i "warn\|error" || echo "✅ No warnings or errors"

echo ""
echo "🔍 Testing application..."
curl -k -I https://asset.digile.com 2>&1 | head -5

echo ""
echo "===================="
echo "✅ Deployment Complete!"
echo ""
echo "Visit: https://asset.digile.com"
echo ""
