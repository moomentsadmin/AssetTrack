#!/bin/bash
# Check exact current state

echo "🔍 Current Production State"
echo "==========================="
echo ""

cd ~/AssetTrack || exit 1

echo "1️⃣ Container Status:"
docker compose -f docker-compose.production.yml ps
echo ""

echo "2️⃣ Network Details:"
docker network inspect asset-network 2>/dev/null | grep -A20 "Containers" || echo "Network not found"
echo ""

echo "3️⃣ Traefik Router Status:"
docker compose -f docker-compose.production.yml logs traefik 2>&1 | grep -i "router\|service" | tail -20
echo ""

echo "4️⃣ App Container Labels:"
docker inspect asset-app 2>/dev/null | grep -A30 "Labels" || echo "Container not found"
echo ""

echo "5️⃣ Test Internal Connection:"
docker compose -f docker-compose.production.yml exec traefik wget -qO- http://asset-app:5000 2>&1 || echo "Cannot reach app from Traefik"
echo ""

echo "6️⃣ App Logs:"
docker compose -f docker-compose.production.yml logs app --tail=10
echo ""
