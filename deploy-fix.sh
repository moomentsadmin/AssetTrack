#!/bin/bash
# Quick deployment fix for Traefik routing issue

set -e

echo "🚀 Deploying Traefik Network Fix"
echo "================================="
echo ""

cd ~/AssetTrack || exit 1

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Restart services to apply new labels
echo "🔄 Restarting services with new configuration..."
docker compose -f docker-compose.production.yml up -d --force-recreate

# Wait for startup
echo "⏳ Waiting for services to start (30s)..."
sleep 30

# Check status
echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "📝 Recent Application Logs:"
docker compose -f docker-compose.production.yml logs app --tail=20

echo ""
echo "📝 Recent Traefik Logs:"
docker compose -f docker-compose.production.yml logs traefik --tail=20

echo ""
echo "================================="
echo "✅ Deployment Complete!"
echo ""
echo "🔍 Test the application:"
echo "  curl -k https://asset.digile.com"
echo ""
echo "🌐 Or visit in browser:"
echo "  https://asset.digile.com"
echo ""
echo "📊 Monitor logs:"
echo "  docker compose -f docker-compose.production.yml logs -f"
echo ""
