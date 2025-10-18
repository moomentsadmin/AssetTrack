#!/bin/bash
# Fix healthcheck and redeploy to get SSL working

set -e

echo "🔧 Fixing Healthcheck & Deploying"
echo "=================================="
echo ""

cd ~/AssetTrack || exit 1

# Recreate app with new healthcheck
echo "1️⃣ Recreating app container with fixed healthcheck..."
docker compose -f docker-compose.production.yml up -d --force-recreate app

# Wait for app to become healthy
echo ""
echo "⏳ Waiting for app to become healthy (90s)..."
for i in {1..18}; do
    sleep 5
    STATUS=$(docker inspect asset-app --format '{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    echo "  [$i/18] Health status: $STATUS"
    
    if [ "$STATUS" = "healthy" ]; then
        echo "  ✅ App is HEALTHY!"
        break
    fi
done

# Check final health status
echo ""
echo "2️⃣ Final container status:"
docker ps --filter "name=asset-app" --format "{{.Names}}: {{.Status}}"

# Check if Traefik discovered the router
echo ""
echo "3️⃣ Checking Traefik router discovery (waiting 10s)..."
sleep 10

ROUTER=$(curl -s http://localhost:8080/api/http/routers | jq -r '.[] | select(.name | contains("assetapp")) | "\(.name): \(.rule)"' 2>/dev/null)

if [ -n "$ROUTER" ]; then
    echo "  ✅ ROUTER DISCOVERED: $ROUTER"
else
    echo "  ⏳ Router not discovered yet... checking logs"
    docker logs asset-traefik 2>&1 | grep -i "assetapp\|asset-app" | tail -10
fi

# Restart Traefik to trigger Let's Encrypt
echo ""
echo "4️⃣ Restarting Traefik to request Let's Encrypt certificate..."
docker compose -f docker-compose.production.yml restart traefik

echo ""
echo "⏳ Waiting for Let's Encrypt certificate (60s)..."
sleep 60

# Check certificate
echo ""
echo "5️⃣ Testing SSL certificate..."
curl -I https://asset.digile.com 2>&1 | head -10

# Check certificate in acme.json
echo ""
echo "6️⃣ Checking acme.json for certificate..."
if [ -f letsencrypt/acme.json ]; then
    CERT_COUNT=$(jq '.letsencrypt.Certificates | length' letsencrypt/acme.json 2>/dev/null || echo "0")
    echo "  Certificates in acme.json: $CERT_COUNT"
    
    if [ "$CERT_COUNT" -gt "0" ]; then
        echo "  ✅ Let's Encrypt certificate obtained!"
        jq -r '.letsencrypt.Certificates[].domain.main' letsencrypt/acme.json 2>/dev/null
    else
        echo "  ⏳ No certificates yet"
    fi
fi

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Visit: https://asset.digile.com"
echo ""
echo "Expected Results:"
echo "  ✅ App container is HEALTHY"
echo "  ✅ Traefik discovered assetapp@docker router"
echo "  ✅ Let's Encrypt issued valid SSL certificate"
echo "  ✅ Browser shows no security warnings"
echo ""
echo "If still seeing self-signed certificate, wait another minute"
echo "and check Traefik logs:"
echo "  docker logs asset-traefik | grep -i certificate"
echo ""
