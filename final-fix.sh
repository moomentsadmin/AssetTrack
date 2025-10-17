#!/bin/bash
# Final fix for Traefik network routing

set -e

echo "🚀 Final Network Fix Deployment"
echo "================================"
echo ""

cd ~/AssetTrack || exit 1

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Stop everything completely
echo "🛑 Stopping all services..."
docker compose -f docker-compose.production.yml down

# Remove old networks with wrong names
echo "🧹 Cleaning up old networks..."
docker network rm assettrack_asset-network 2>/dev/null || true

# Start services with new fixed network name
echo "🚀 Starting services with fixed network configuration..."
docker compose -f docker-compose.production.yml up -d

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
echo "📝 Traefik Logs (checking for network warnings):"
docker compose -f docker-compose.production.yml logs traefik --tail=15

echo ""
echo "📝 Application Logs:"
docker compose -f docker-compose.production.yml logs app --tail=15

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo ""
echo "🔍 Test the application:"
echo "  curl -k https://asset.digile.com"
echo ""
echo "Expected: HTML content (setup page)"
echo "NOT expected: 404 page not found"
echo ""
