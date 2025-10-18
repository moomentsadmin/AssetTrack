#!/bin/bash
# Restart Traefik and app, watch for discovery

set -e

echo "🔄 Restarting with DEBUG Logging"
echo "================================="
echo ""

cd ~/AssetTrack || exit 1

# Restart Traefik with new config
echo "1️⃣ Restarting Traefik (with DEBUG + watch enabled)..."
docker compose -f docker-compose.production.yml up -d traefik

echo "⏳ Waiting 10s for Traefik..."
sleep 10

# Restart app to trigger discovery
echo ""
echo "2️⃣ Restarting app container..."
docker compose -f docker-compose.production.yml restart app

echo "⏳ Waiting 20s for discovery..."
sleep 20

# Check router status
echo ""
echo "3️⃣ Checking routers via API:"
curl -s http://localhost:8080/api/http/routers | jq -r '.[] | select(.provider=="docker") | "  ✓ \(.name): \(.rule)"' 2>/dev/null

# Look for discovery events in logs
echo ""
echo "4️⃣ Docker provider events (last 100 lines):"
docker logs asset-traefik 2>&1 | grep -E "docker|container|assetapp|asset-app|provider.*Configuration" | tail -100

echo ""
echo "================================="
echo ""
echo "If you see 'assetapp@docker' in step 3, router is discovered ✅"
echo "If NOT, check step 4 for error messages or 'skip' logs"
echo ""
echo "Full DEBUG logs:"
echo "  docker logs asset-traefik --tail 200"
echo ""
