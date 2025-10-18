#!/bin/bash
# Check production app container logs

echo "🔍 Checking Production App Container Logs"
echo "=========================================="
echo ""

cd ~/AssetTrack || exit 1

echo "1️⃣ Container status:"
docker ps -a --filter "name=asset-app" --format "{{.Names}}: {{.Status}}"
echo ""

echo "2️⃣ Last 100 lines of app logs:"
docker logs asset-app --tail 100 2>&1
echo ""

echo "3️⃣ Checking if app is listening on port 5000:"
docker exec asset-app netstat -tlnp 2>/dev/null | grep 5000 || echo "❌ Port 5000 not listening"
echo ""

echo "4️⃣ Testing health check manually:"
docker exec asset-app wget -q -O- http://localhost:5000/ 2>&1 | head -20 || echo "❌ Healthcheck endpoint failed"
echo ""

echo "5️⃣ Check environment variables:"
docker exec asset-app env | grep -E "DATABASE_URL|PORT|NODE_ENV" 2>/dev/null
echo ""

echo "=========================================="
