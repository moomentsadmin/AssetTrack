#!/bin/bash
# Recreate app container with proper Traefik labels

set -e

echo "🔧 Fixing App Container Labels"
echo "==============================="
echo ""

cd ~/AssetTrack || exit 1

# Stop and remove the old container (without labels)
echo "1️⃣ Removing old app container (without labels)..."
docker compose -f docker-compose.production.yml rm -sf app

# Recreate with labels
echo ""
echo "2️⃣ Recreating app container with Traefik labels..."
docker compose -f docker-compose.production.yml up -d --build --force-recreate app

# Wait for app to start
echo ""
echo "⏳ Waiting for app to start (30s)..."
sleep 30

# Verify labels are now applied
echo ""
echo "3️⃣ Verifying labels are applied:"
docker inspect asset-app --format '{{range $key, $value := .Config.Labels}}{{println $key "=" $value}}{{end}}' 2>/dev/null | grep traefik || echo "❌ Still no labels!"

# Check Traefik router discovery
echo ""
echo "4️⃣ Checking if Traefik discovered the router..."
sleep 5
curl -s http://localhost:8080/api/http/routers | jq -r '.[] | select(.name | contains("assetapp")) | "\(.name): \(.rule)"' 2>/dev/null || echo "⏳ Router not discovered yet..."

# Restart Traefik to force discovery
echo ""
echo "5️⃣ Restarting Traefik to trigger Let's Encrypt..."
docker compose -f docker-compose.production.yml restart traefik

echo ""
echo "⏳ Waiting for Let's Encrypt certificate (60s)..."
sleep 60

# Check certificate status
echo ""
echo "6️⃣ Checking SSL certificate..."
curl -I https://asset.digile.com 2>&1 | head -10

echo ""
echo "==============================="
echo "✅ Fix Complete!"
echo ""
echo "🌐 Visit: https://asset.digile.com"
echo ""
echo "Expected:"
echo "  ✅ Valid Let's Encrypt SSL certificate"
echo "  ✅ No browser warnings"
echo "  ✅ Setup page or login appears"
echo ""
