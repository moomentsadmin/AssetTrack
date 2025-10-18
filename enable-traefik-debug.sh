#!/bin/bash
# Enable Traefik debug logging to see why containers aren't discovered

set -e

echo "🔍 Enabling Traefik Debug Logging"
echo "=================================="
echo ""

cd ~/AssetTrack || exit 1

# Stop Traefik
echo "1️⃣ Stopping Traefik..."
docker compose -f docker-compose.production.yml stop traefik

# Update docker-compose to enable DEBUG logging
echo "2️⃣ Updating docker-compose.yml with DEBUG logging..."
cat > /tmp/traefik-debug-command.yml << 'EOF'
      - "--log.level=DEBUG"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=asset-network"
      - "--providers.docker.watch=true"
EOF

# Show current Traefik command
echo ""
echo "3️⃣ Current Traefik configuration:"
grep -A5 "providers.docker" docker-compose.production.yml

echo ""
echo "4️⃣ Starting Traefik with DEBUG logging..."
docker compose -f docker-compose.production.yml up -d traefik

echo ""
echo "⏳ Waiting for Traefik to start (10s)..."
sleep 10

# Watch logs for Docker provider events
echo ""
echo "5️⃣ Docker provider startup logs:"
docker logs asset-traefik 2>&1 | grep -i "docker\|provider\|container" | tail -30

echo ""
echo "6️⃣ Restarting app container to trigger discovery..."
docker compose -f docker-compose.production.yml restart app

echo ""
echo "⏳ Waiting for app to restart (15s)..."
sleep 15

# Check for discovery events
echo ""
echo "7️⃣ Looking for app container discovery in logs:"
docker logs asset-traefik 2>&1 | grep -i "asset-app\|assetapp" | tail -20 || echo "❌ No logs mentioning asset-app"

# Check routers again
echo ""
echo "8️⃣ Current routers:"
curl -s http://localhost:8080/api/http/routers | jq -r '.[] | select(.provider=="docker") | "\(.name): \(.rule)"' 2>/dev/null

echo ""
echo "=================================="
echo ""
echo "🔍 Now check full DEBUG logs:"
echo "   docker logs asset-traefik 2>&1 | less"
echo ""
echo "Look for lines mentioning:"
echo "   - 'asset-app' or 'assetapp'"
echo "   - 'container' events"
echo "   - 'skip' or 'filter' messages"
echo ""
