#!/bin/bash
# Check Traefik API for router status

set -e

echo "🔍 Checking Traefik API for Routers"
echo "===================================="
echo ""

cd ~/AssetTrack || exit 1

# Restart Traefik with API enabled
echo "1️⃣ Restarting Traefik with API enabled..."
docker compose -f docker-compose.production.yml up -d traefik

# Wait for Traefik to start
echo "⏳ Waiting for Traefik API (15s)..."
sleep 15

# Check routers via API
echo ""
echo "2️⃣ Checking registered routers:"
curl -s http://localhost:8080/api/http/routers | jq -r '.[] | "\(.name): \(.rule)"' 2>/dev/null || echo "❌ Could not access Traefik API"

echo ""
echo "3️⃣ Checking registered services:"
curl -s http://localhost:8080/api/http/services | jq -r '.[] | "\(.name): \(.serverStatus)"' 2>/dev/null || echo "❌ Could not access Traefik API"

echo ""
echo "4️⃣ Full router details:"
curl -s http://localhost:8080/api/http/routers | jq '.' 2>/dev/null || echo "❌ Could not parse router data"

echo ""
echo "===================================="
echo ""
echo "If no routers found, the Docker provider is not discovering containers"
echo ""
