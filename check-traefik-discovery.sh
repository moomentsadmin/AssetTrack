#!/bin/bash
# Check why Traefik is not discovering the app

echo "🔍 Traefik Discovery Diagnostic"
echo "================================"
echo ""

cd ~/AssetTrack || exit 1

echo "1️⃣ Check Traefik Docker provider events:"
docker compose -f docker-compose.production.yml logs traefik 2>&1 | grep -i "provider.*docker\|container\|service.*created\|router.*created" | tail -20
echo ""

echo "2️⃣ Check if app container is visible to Docker:"
docker ps --filter "name=asset-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "3️⃣ Check app container labels:"
docker inspect asset-app --format '{{range $key, $value := .Config.Labels}}{{if eq $key "traefik.enable"}}traefik.enable={{$value}}{{end}}{{end}}'
echo ""
docker inspect asset-app --format '{{range $key, $value := .Config.Labels}}{{if eq $key "traefik.http.routers.assetapp.rule"}}traefik.http.routers.assetapp.rule={{$value}}{{end}}{{end}}'
echo ""

echo "4️⃣ Check if Traefik can access Docker API:"
docker compose -f docker-compose.production.yml exec traefik ls -la /var/run/docker.sock
echo ""

echo "5️⃣ Test Traefik API for routers (if available):"
curl -s http://localhost:8080/api/http/routers 2>/dev/null | jq -r '.[].rule // "No routers found"' || echo "Traefik API not accessible"
echo ""

echo "6️⃣ Check full Traefik startup logs:"
docker compose -f docker-compose.production.yml logs traefik 2>&1 | grep -A5 "Starting provider \*docker"
echo ""

echo "7️⃣ Verify network connectivity:"
docker network inspect asset-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{println}}{{end}}'
echo ""
