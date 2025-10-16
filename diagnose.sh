#!/bin/bash

echo "======================================"
echo "Asset Management SSL Diagnostics"
echo "======================================"
echo ""

echo "=== 1. Container Status ==="
docker compose -f docker-compose.ssl.yml ps
echo ""

echo "=== 2. App Health Check ==="
echo "Testing if app responds internally..."
docker compose -f docker-compose.ssl.yml exec -T app wget -qO- http://localhost:5000 2>&1 | head -10 || echo "❌ App not responding"
echo ""

echo "=== 3. Environment Configuration ==="
if [ -f .env ]; then
    echo "DOMAIN=$(cat .env | grep "^DOMAIN=" | cut -d'=' -f2)"
    echo "LETSENCRYPT_EMAIL=$(cat .env | grep "^LETSENCRYPT_EMAIL=" | cut -d'=' -f2)"
else
    echo "❌ .env file not found!"
fi
echo ""

echo "=== 4. DNS Resolution ==="
DOMAIN=$(cat .env 2>/dev/null | grep "^DOMAIN=" | cut -d'=' -f2)
if [ -n "$DOMAIN" ]; then
    RESOLVED_IP=$(dig +short "$DOMAIN" 2>/dev/null | head -1)
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
    
    echo "Domain: $DOMAIN"
    echo "Resolves to: $RESOLVED_IP"
    echo "Server IP: $SERVER_IP"
    
    if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
        echo "✅ DNS correctly points to this server"
    else
        echo "❌ DNS mismatch! Update your A record to point to $SERVER_IP"
    fi
else
    echo "❌ DOMAIN not set in .env"
fi
echo ""

echo "=== 5. Firewall Status ==="
if command -v ufw &> /dev/null; then
    sudo ufw status | grep -E "80|443" || echo "⚠️ Ports 80/443 not explicitly allowed"
else
    echo "ℹ️ UFW not installed"
fi
echo ""

echo "=== 6. Recent App Logs ==="
docker compose -f docker-compose.ssl.yml logs app --tail 20 2>&1
echo ""

echo "=== 7. Recent Traefik Logs ==="
docker compose -f docker-compose.ssl.yml logs traefik --tail 30 2>&1
echo ""

echo "=== 8. Certificate Status ==="
if [ -f letsencrypt/acme.json ]; then
    echo "✅ acme.json exists"
    CERT_COUNT=$(cat letsencrypt/acme.json | grep -o "test.digile.com" | wc -l)
    echo "Certificate entries: $CERT_COUNT"
else
    echo "❌ No acme.json file found - certificates not generated"
fi
echo ""

echo "=== 9. Network Connectivity ==="
echo "Testing if Traefik can reach app..."
docker compose -f docker-compose.ssl.yml exec -T traefik wget -qO- http://app:5000 2>&1 | head -5 || echo "❌ Traefik cannot reach app"
echo ""

echo "======================================"
echo "Diagnostics Complete"
echo "======================================"
echo ""
echo "Common Issues:"
echo "  1. If app not responding → Check app logs above"
echo "  2. If DNS mismatch → Update DNS A record"
echo "  3. If no certificates → Wait 2 minutes or check Traefik logs"
echo "  4. If 404 error → Traefik can't route to app (check labels)"
