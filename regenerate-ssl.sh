#!/bin/bash
# Regenerate Let's Encrypt SSL Certificate

set -e

echo "🔒 Regenerating SSL Certificate"
echo "==============================="
echo ""

cd ~/AssetTrack || exit 1

# Check DNS resolution
echo "1️⃣ Verifying DNS resolution..."
RESOLVED_IP=$(dig +short asset.digile.com | head -1)
echo "asset.digile.com resolves to: $RESOLVED_IP"

if [ "$RESOLVED_IP" != "178.128.51.240" ]; then
    echo "⚠️  Warning: DNS not resolving to server IP yet"
    echo "Current: $RESOLVED_IP"
    echo "Expected: 178.128.51.240"
    echo ""
fi

# Remove old/self-signed certificates
echo ""
echo "2️⃣ Removing old certificates..."
sudo rm -f letsencrypt/acme.json
sudo touch letsencrypt/acme.json
sudo chmod 600 letsencrypt/acme.json
echo "✅ Old certificates removed"

# Restart Traefik to trigger new certificate request
echo ""
echo "3️⃣ Restarting Traefik (will request new certificate)..."
docker compose -f docker-compose.production.yml restart traefik

echo ""
echo "4️⃣ Waiting for Let's Encrypt (30 seconds)..."
sleep 30

# Check Traefik logs for certificate status
echo ""
echo "5️⃣ Checking certificate generation logs..."
docker compose -f docker-compose.production.yml logs traefik 2>&1 | grep -i "certificate\|acme\|letsencrypt" | tail -10

echo ""
echo "6️⃣ Testing HTTPS connection..."
curl -I https://asset.digile.com 2>&1 | head -10

echo ""
echo "==============================="
echo "✅ Certificate Regeneration Complete!"
echo ""
echo "🌐 Visit: https://asset.digile.com"
echo ""
echo "Expected:"
echo "  ✅ Valid SSL certificate (not self-signed)"
echo "  ✅ Setup screen or login page appears"
echo "  ✅ No browser security warnings"
echo ""
echo "📝 Monitor certificate generation:"
echo "  docker compose -f docker-compose.production.yml logs -f traefik | grep -i certificate"
echo ""
