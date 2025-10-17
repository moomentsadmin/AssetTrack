#!/bin/bash
# Debug Traefik routing issue

echo "🔍 Traefik Routing Debug"
echo "========================"
echo ""

cd ~/AssetTrack || exit 1

echo "1️⃣ Environment Variables:"
echo "DOMAIN from .env:"
grep "^DOMAIN=" .env 2>/dev/null || echo "❌ DOMAIN not found in .env"
echo ""

echo "2️⃣ Check if Traefik can see the app labels:"
docker inspect asset-app | jq '.[0].Config.Labels' 2>/dev/null || docker inspect asset-app | grep -A20 "Labels"
echo ""

echo "3️⃣ Traefik discovered routers:"
docker compose -f docker-compose.production.yml exec traefik wget -qO- http://localhost:8080/api/http/routers 2>/dev/null | jq '.[].rule' 2>/dev/null || echo "Cannot access Traefik API"
echo ""

echo "4️⃣ Check if containers are on same network:"
echo "Traefik networks:"
docker inspect asset-traefik | grep -A10 "Networks" | grep "Name"
echo ""
echo "App networks:"
docker inspect asset-app | grep -A10 "Networks" | grep "Name"
echo ""

echo "5️⃣ Can Traefik reach app directly?"
docker compose -f docker-compose.production.yml exec traefik ping -c 2 asset-app 2>&1 || echo "Cannot ping app"
echo ""

echo "6️⃣ Recent Traefik logs (last 20 lines):"
docker compose -f docker-compose.production.yml logs traefik --tail=20
echo ""
