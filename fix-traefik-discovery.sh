#!/bin/bash
# Fix Traefik router discovery

set -e

echo "🔧 Fixing Traefik Router Discovery"
echo "=================================="
echo ""

cd ~/AssetTrack || exit 1

# Stop both Traefik and app
echo "🛑 Stopping Traefik and app..."
docker compose -f docker-compose.production.yml stop traefik app

# Start app first (so it's ready when Traefik starts)
echo "🚀 Starting app..."
docker compose -f docker-compose.production.yml start app

# Wait for app to be ready
echo "⏳ Waiting for app to be ready (10s)..."
sleep 10

# Now start Traefik (it will discover the app)
echo "🚀 Starting Traefik (will discover app)..."
docker compose -f docker-compose.production.yml start traefik

# Wait for Traefik to discover and register
echo "⏳ Waiting for Traefik to register routes (15s)..."
sleep 15

echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "🔍 Checking if router is registered:"
docker compose -f docker-compose.production.yml logs traefik 2>&1 | grep -i "creating router\|router.*assetapp" || echo "⚠️ No router registration logs yet"

echo ""
echo "📝 Recent Traefik Logs:"
docker compose -f docker-compose.production.yml logs traefik --tail=15

echo ""
echo "🌐 Test connection:"
curl -k -I https://asset.digile.com 2>&1 | head -5

echo ""
echo "=================================="
echo "✅ Restart Complete!"
echo ""
echo "If still 404, run: docker compose -f docker-compose.production.yml restart traefik"
echo ""
