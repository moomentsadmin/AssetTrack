#!/bin/bash
# Final fix: Deploy with working healthcheck using nc instead of wget

set -e

echo "🚀 Final Fix & Deploy - Using nc for Healthcheck"
echo "================================================="
echo ""

cd ~/AssetTrack || exit 1

# Recreate app container with nc-based healthcheck
echo "1️⃣ Recreating app container with nc healthcheck..."
docker compose -f docker-compose.production.yml up -d --force-recreate --no-deps app

# Monitor health status
echo ""
echo "⏳ Monitoring health status (checking every 10s for 2 minutes)..."
for i in {1..12}; do
    sleep 10
    STATUS=$(docker inspect asset-app --format '{{.State.Health.Status}}' 2>/dev/null || echo "no-health")
    echo "  [$i/12] Health: $STATUS"
    
    if [ "$STATUS" = "healthy" ]; then
        echo "  ✅ Container is HEALTHY!"
        break
    fi
done

# Final health check
echo ""
echo "2️⃣ Final container status:"
docker ps --filter "name=asset-app" --format "{{.Names}}: {{.Status}}"

# Check if app is responding
echo ""
echo "3️⃣ Testing app response:"
APP_IP=$(docker inspect asset-app --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
curl -I "http://$APP_IP:5000" 2>&1 | head -5 || echo "⚠️  App not responding yet"

# Wait a bit more if needed
HEALTH=$(docker inspect asset-app --format '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
if [ "$HEALTH" != "healthy" ]; then
    echo ""
    echo "⏳ Container not healthy yet, waiting 30 more seconds..."
    sleep 30
    docker ps --filter "name=asset-app" --format "{{.Names}}: {{.Status}}"
fi

# Check Traefik router discovery
echo ""
echo "4️⃣ Checking Traefik router discovery..."
sleep 5

ROUTERS=$(curl -s http://localhost:8080/api/http/routers | jq -r '.[] | select(.provider=="docker") | "\(.name): \(.rule)"' 2>/dev/null)

echo "Current Docker routers:"
echo "$ROUTERS"

if echo "$ROUTERS" | grep -q "assetapp"; then
    echo ""
    echo "✅ SUCCESS! assetapp router discovered!"
else
    echo ""
    echo "⏳ Router not discovered yet. Checking logs..."
    docker logs asset-traefik 2>&1 | grep -i "assetapp\|asset-app\|unhealthy" | tail -10
fi

# Restart Traefik to trigger Let's Encrypt
echo ""
echo "5️⃣ Restarting Traefik to request Let's Encrypt certificate..."
docker compose -f docker-compose.production.yml restart traefik

echo "⏳ Waiting 60s for certificate generation..."
sleep 60

# Test SSL
echo ""
echo "6️⃣ Testing SSL certificate..."
SSL_TEST=$(curl -I https://asset.digile.com 2>&1 | head -1)
echo "$SSL_TEST"

if echo "$SSL_TEST" | grep -q "HTTP/2 200\|HTTP/1.1 200\|HTTP/2 301\|HTTP/1.1 301"; then
    echo "✅ HTTPS is working!"
elif echo "$SSL_TEST" | grep -q "self-signed"; then
    echo "⚠️  Still using self-signed certificate. Checking acme.json..."
    
    if [ -f letsencrypt/acme.json ]; then
        CERT_COUNT=$(jq '.letsencrypt.Certificates | length' letsencrypt/acme.json 2>/dev/null || echo "0")
        echo "Certificates in acme.json: $CERT_COUNT"
        
        if [ "$CERT_COUNT" -gt "0" ]; then
            echo "Certificate domains:"
            jq -r '.letsencrypt.Certificates[].domain.main' letsencrypt/acme.json 2>/dev/null
        fi
    fi
    
    echo ""
    echo "Checking Traefik ACME logs:"
    docker logs asset-traefik 2>&1 | grep -i "certificate\|acme\|letsencrypt" | tail -20
else
    echo "⚠️  Unexpected response: $SSL_TEST"
fi

echo ""
echo "================================================="
echo "🎯 Deployment Status Summary:"
echo ""
docker ps --filter "name=asset-app" --format "  App: {{.Status}}"
curl -s http://localhost:8080/api/http/routers | jq -r '.[] | select(.name | contains("assetapp")) | "  Router: \(.name) - \(.rule)"' 2>/dev/null || echo "  Router: Not discovered"
echo ""
echo "🌐 Visit: https://asset.digile.com"
echo ""
echo "If still issues, check:"
echo "  - App logs: docker logs asset-app --tail 50"
echo "  - Traefik logs: docker logs asset-traefik --tail 50"
echo "  - Healthcheck: docker inspect asset-app --format '{{json .State.Health}}' | jq"
echo ""
