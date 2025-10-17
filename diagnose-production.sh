#!/bin/bash
# Production 404 Diagnostic Script
# Run this on your production server to identify the issue

echo "🔍 Production 404 Diagnostic Report"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: docker-compose.production.yml not found"
    echo "Please cd to ~/AssetTrack first"
    exit 1
fi

echo "1️⃣ Container Status"
echo "-------------------"
docker compose -f docker-compose.production.yml ps
echo ""

echo "2️⃣ Check if frontend files exist in container"
echo "----------------------------------------------"
docker compose -f docker-compose.production.yml exec app ls -la /app/dist/public/ 2>/dev/null || echo "❌ Cannot access /app/dist/public/"
echo ""

echo "3️⃣ Check server files"
echo "---------------------"
docker compose -f docker-compose.production.yml exec app ls -la /app/dist/ 2>/dev/null || echo "❌ Cannot access /app/dist/"
echo ""

echo "4️⃣ Test internal HTTP (port 5000)"
echo "---------------------------------"
docker compose -f docker-compose.production.yml exec app wget -qO- http://localhost:5000 2>&1 | head -20
echo ""

echo "5️⃣ Application logs (last 30 lines)"
echo "-----------------------------------"
docker compose -f docker-compose.production.yml logs app --tail=30
echo ""

echo "6️⃣ Traefik logs (last 20 lines)"
echo "--------------------------------"
docker compose -f docker-compose.production.yml logs traefik --tail=20
echo ""

echo "7️⃣ Test external access"
echo "-----------------------"
curl -I https://asset.digile.com 2>&1 | head -10
echo ""

echo "8️⃣ Environment check"
echo "--------------------"
echo "Domain from .env:"
grep "DOMAIN=" .env 2>/dev/null || echo "No DOMAIN in .env"
echo ""

echo "9️⃣ Check Node process in container"
echo "-----------------------------------"
docker compose -f docker-compose.production.yml exec app ps aux 2>/dev/null || echo "Cannot check process"
echo ""

echo "🔟 Check if server is listening on port 5000"
echo "--------------------------------------------"
docker compose -f docker-compose.production.yml exec app netstat -tuln | grep 5000 2>/dev/null || echo "Port 5000 not listening"
echo ""

echo "===================================="
echo "Diagnostic Complete"
echo ""
echo "📊 Summary of checks:"
echo "  1. Container status - Are containers running?"
echo "  2. Frontend files - Does /app/dist/public/index.html exist?"
echo "  3. Server files - Does /app/dist/index.js exist?"
echo "  4. Internal HTTP - Does app respond on port 5000?"
echo "  5. App logs - Any errors in application?"
echo "  6. Traefik logs - Any routing errors?"
echo "  7. External access - Can we reach from outside?"
echo "  8. Environment - Is domain configured correctly?"
echo "  9. Process check - Is Node running?"
echo "  10. Port check - Is server listening?"
echo ""
echo "Look for ❌ errors above to identify the issue"
