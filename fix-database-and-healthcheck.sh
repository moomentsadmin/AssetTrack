#!/bin/bash
# Fix DATABASE_URL and healthcheck issues

set -e

echo "🔧 Fixing Database URL and Healthcheck"
echo "======================================="
echo ""

cd ~/AssetTrack || exit 1

# Check current .env DATABASE_URL
echo "1️⃣ Current DATABASE_URL in .env:"
grep "^DATABASE_URL=" .env || echo "⚠️  DATABASE_URL not found in .env"
echo ""

# Show docker-compose DATABASE_URL
echo "2️⃣ Docker Compose DATABASE_URL configuration:"
grep -A2 "DATABASE_URL:" docker-compose.production.yml
echo ""

# The issue is the default in docker-compose points to 'db' container
# but you're using external DigitalOcean database
# The .env file should have the correct DATABASE_URL

echo "3️⃣ Checking if .env DATABASE_URL will override docker-compose default..."
echo ""
echo "If your .env has DATABASE_URL set, it should override the default."
echo "Let's rebuild the container to ensure env vars are picked up correctly."
echo ""

# Recreate container to pick up correct DATABASE_URL
echo "4️⃣ Recreating app container with correct environment..."
docker compose -f docker-compose.production.yml up -d --force-recreate --no-deps app

echo ""
echo "⏳ Waiting 30s for container to start..."
sleep 30

# Check logs for database connection
echo ""
echo "5️⃣ Checking for database connection errors:"
docker logs asset-app --tail 50 2>&1 | grep -i "error\|database\|serving" || echo "No obvious errors"

echo ""
echo "6️⃣ Testing if app is accessible inside container:"
docker exec asset-app sh -c "wget -q -O- http://localhost:5000/ 2>&1" | head -10 || echo "wget failed, trying with nc..."

docker exec asset-app sh -c "echo -e 'GET / HTTP/1.0\r\n\r\n' | nc localhost 5000" 2>&1 | head -10 || echo "nc also failed"

echo ""
echo "======================================="
echo ""
echo "Next steps:"
echo "  1. Verify .env has correct DATABASE_URL for DigitalOcean"
echo "  2. If healthcheck still fails, we'll change it to use nc or curl"
echo ""
