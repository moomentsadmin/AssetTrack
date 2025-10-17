#!/bin/bash
# Verify app container labels are correctly applied

echo "🔍 Verifying App Container Labels"
echo "=================================="
echo ""

cd ~/AssetTrack || exit 1

# Check if app container is running
echo "1️⃣ App container status:"
docker ps --filter "name=asset-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Check all Traefik-related labels on app container
echo "2️⃣ All Traefik labels on app container:"
docker inspect asset-app --format '{{range $key, $value := .Config.Labels}}{{if or (eq $key "traefik.enable") (hasPrefix "traefik" $key)}}{{$key}}={{$value}}{{println}}{{end}}{{end}}' 2>/dev/null || echo "❌ Container not found or not running"
echo ""

# Check DOMAIN env var in .env file
echo "3️⃣ DOMAIN in .env file:"
grep "^DOMAIN=" .env 2>/dev/null || echo "⚠️  DOMAIN not found in .env"
echo ""

# Check app container environment
echo "4️⃣ App container PORT:"
docker inspect asset-app --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "PORT=" || echo "❌ PORT not set"
echo ""

# Try to access app directly
echo "5️⃣ Testing direct access to app container:"
APP_IP=$(docker inspect asset-app --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
echo "App IP: $APP_IP"
if [ -n "$APP_IP" ]; then
    curl -I "http://$APP_IP:5000" 2>&1 | head -5 || echo "❌ Cannot reach app"
else
    echo "❌ Could not get app IP"
fi
echo ""

echo "=================================="
echo ""
echo "Expected labels:"
echo "  traefik.enable=true"
echo "  traefik.http.routers.assetapp.rule=Host(\`asset.digile.com\`)"
echo "  traefik.http.routers.assetapp.entrypoints=websecure"
echo "  traefik.http.routers.assetapp.tls.certresolver=letsencrypt"
echo "  traefik.http.services.assetapp.loadbalancer.server.port=5000"
echo ""
