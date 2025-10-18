#!/bin/bash
# Check why app container is unhealthy

echo "🔍 Checking App Container Health"
echo "================================="
echo ""

cd ~/AssetTrack || exit 1

# Check container health status
echo "1️⃣ Container health status:"
docker ps --filter "name=asset-app" --format "{{.Names}}: {{.Status}}"
echo ""

# Check health check configuration
echo "2️⃣ Health check configuration:"
docker inspect asset-app --format '{{json .State.Health}}' | jq '.' 2>/dev/null || echo "No health data"
echo ""

# Check last 50 app logs
echo "3️⃣ App container logs (last 50 lines):"
docker logs asset-app --tail 50 2>&1
echo ""

# Test the health check endpoint manually
echo "4️⃣ Testing health check endpoint (http://localhost:5000/api/user):"
APP_IP=$(docker inspect asset-app --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "App IP: $APP_IP"
curl -v "http://$APP_IP:5000/api/user" 2>&1 | head -20
echo ""

# Check if app is actually running
echo "5️⃣ Checking if Node process is running inside container:"
docker exec asset-app ps aux | grep node || echo "❌ Node not running"
echo ""

echo "================================="
echo ""
echo "Common causes of unhealthy status:"
echo "  - App not listening on port 5000"
echo "  - /api/user endpoint returning error"
echo "  - Database connection failing"
echo "  - App crashed during startup"
echo ""
