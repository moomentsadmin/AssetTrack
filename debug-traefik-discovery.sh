#!/bin/bash
# Deep dive into why Traefik isn't discovering the app router

echo "🔍 Deep Traefik Discovery Debug"
echo "================================"
echo ""

cd ~/AssetTrack || exit 1

# Check all routers via API
echo "1️⃣ All routers currently registered:"
curl -s http://localhost:8080/api/http/routers | jq -r '.[] | "\(.name) [\(.provider)]: \(.rule)"' 2>/dev/null
echo ""

# Check all services
echo "2️⃣ All services currently registered:"
curl -s http://localhost:8080/api/http/services | jq -r '.[] | "\(.name) [\(.provider)]"' 2>/dev/null
echo ""

# Check Traefik logs for Docker provider events
echo "3️⃣ Traefik Docker provider logs (last 50 lines):"
docker logs asset-traefik 2>&1 | grep -i "docker\|provider\|assetapp\|asset-app" | tail -50
echo ""

# Check if Traefik can see the container
echo "4️⃣ Containers on asset-network:"
docker network inspect asset-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{println}}{{end}}'
echo ""

# Verify both containers are on the same network
echo "5️⃣ App container networks:"
docker inspect asset-app --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}'
echo ""

echo "6️⃣ Traefik container networks:"
docker inspect asset-traefik --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}'
echo ""

# Check Docker socket permissions
echo "7️⃣ Docker socket access from Traefik:"
docker exec asset-traefik ls -la /var/run/docker.sock 2>/dev/null || echo "❌ Cannot access docker.sock"
echo ""

# Try to list containers from inside Traefik
echo "8️⃣ Containers visible to Traefik (via Docker API):"
docker exec asset-traefik wget -qO- --header "Content-Type: application/json" http://localhost/containers/json?all=true 2>/dev/null | jq -r '.[].Names[]' 2>/dev/null || echo "❌ Cannot query Docker API from Traefik"
echo ""

echo "================================"
echo ""
echo "If step 1 shows assetapp@docker, the router is discovered ✅"
echo "If step 1 does NOT show assetapp@docker, Docker provider is broken ❌"
echo ""
